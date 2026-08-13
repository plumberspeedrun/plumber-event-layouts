import {randomBytes} from "node:crypto";
import {
	existsSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";
import type {Response as ExpressResponse, Request} from "express";
import type NodeCG from "nodecg/types";
import type {Configschema} from "../nodecg/generated/configschema.js";
import type {SpotifyPlayback} from "../nodecg/generated/spotifyPlayback.js";
import type {SpotifyStatus} from "../nodecg/generated/spotifyStatus.js";

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_URL = "https://api.spotify.com/v1";

const SCOPE = [
	"user-read-playback-state",
	"user-modify-playback-state",
	"playlist-read-private",
	"user-read-private",
].join(" ");

interface TokenResponse {
	access_token: string;
	refresh_token?: string;
	expires_in: number;
}

interface StoredTokens {
	accessToken: string;
	refreshToken: string;
	expiresAt: number;
}

interface SpotifyTrack {
	id: string;
	name: string;
	uri: string;
	duration_ms: number;
	artists: {name: string}[];
	album: {name: string; images: {url: string}[]};
}

interface CurrentlyPlayingResponse {
	is_playing: boolean;
	progress_ms: number | null;
	device?: {name: string};
	item?: ({type: string} & SpotifyTrack) | null;
}

interface PlaylistResponse {
	items: {
		id: string;
		name: string;
		uri: string;
		images: {url: string}[];
		tracks?: {total: number};
	}[];
}

interface PlaylistTracksResponse {
	items: {track: ({type: string} & SpotifyTrack) | null}[];
	total: number;
}

const EMPTY_PLAYBACK: SpotifyPlayback = {
	isPlaying: false,
	track: null,
	progressMs: 0,
};

export const spotify = (nodecg: NodeCG.ServerAPI<Configschema>) => {
	const config = nodecg.bundleConfig.spotify;
	if (config?.clientId == null || config.clientSecret == null) {
		nodecg.log.info(
			"spotify の設定が見つからないため、Spotify 連携は無効です。",
		);
		return;
	}

	const playbackRep = nodecg.Replicant<SpotifyPlayback>("spotifyPlayback");
	const statusRep = nodecg.Replicant<SpotifyStatus>("spotifyStatus");

	const redirectUri =
		config.redirectUri ??
		`http://127.0.0.1:${nodecg.config.port}/spotify/callback`;
	const pollIntervalMs = config.pollIntervalMs ?? 5000;
	const tokensPath = path.resolve(
		process.cwd(),
		config.tokensPath ?? "./cfg/spotify-tokens.json",
	);

	const updateStatus = (patch: {
		authorized?: boolean;
		user?: SpotifyStatus["user"];
		lastSynced?: string;
		lastError?: string | null;
	}) => {
		const current = statusRep.value ?? {authorized: false};
		const next: SpotifyStatus = {...current};
		if (patch.authorized !== undefined) next.authorized = patch.authorized;
		if (patch.user !== undefined) next.user = patch.user;
		if (patch.lastSynced !== undefined) next.lastSynced = patch.lastSynced;
		if (patch.lastError !== undefined) {
			if (patch.lastError === null) delete next.lastError;
			else next.lastError = patch.lastError;
		}
		statusRep.value = next;
	};

	const readTokens = (): StoredTokens | null => {
		if (!existsSync(tokensPath)) return null;
		try {
			return JSON.parse(readFileSync(tokensPath, "utf-8")) as StoredTokens;
		} catch (err) {
			nodecg.log.warn(
				`Spotify トークンファイルの読み込みに失敗しました: ${err instanceof Error ? err.message : String(err)}`,
			);
			return null;
		}
	};

	const writeTokens = (tokens: StoredTokens) => {
		const dir = path.dirname(tokensPath);
		if (!existsSync(dir)) mkdirSync(dir, {recursive: true});
		writeFileSync(tokensPath, JSON.stringify(tokens, null, 2));
	};

	const deleteTokens = () => {
		if (existsSync(tokensPath)) rmSync(tokensPath);
	};

	const getAccessToken = async (
		forceRefresh = false,
	): Promise<string | null> => {
		const tokens = readTokens();
		if (tokens == null) return null;
		if (!forceRefresh && tokens.expiresAt > Date.now() + 60_000) {
			return tokens.accessToken;
		}

		const res = await fetch(SPOTIFY_TOKEN_URL, {
			method: "POST",
			headers: {"Content-Type": "application/x-www-form-urlencoded"},
			body: new URLSearchParams({
				grant_type: "refresh_token",
				refresh_token: tokens.refreshToken,
				client_id: config.clientId,
				client_secret: config.clientSecret,
			}),
		});
		if (!res.ok) {
			throw new Error(`トークンの更新に失敗しました: ${res.status}`);
		}
		const data = (await res.json()) as TokenResponse;
		const next: StoredTokens = {
			accessToken: data.access_token,
			refreshToken: data.refresh_token ?? tokens.refreshToken,
			expiresAt: Date.now() + data.expires_in * 1000,
		};
		writeTokens(next);
		return next.accessToken;
	};

	const spotifyFetch = async (
		apiPath: string,
		init?: RequestInit,
		retried = false,
	): Promise<Response> => {
		const token = await getAccessToken();
		if (token == null) {
			throw new Error("Spotify に認証されていません。");
		}
		const res = await fetch(`${SPOTIFY_API_URL}${apiPath}`, {
			...init,
			headers: {
				Authorization: `Bearer ${token}`,
				...(init?.headers ?? {}),
			},
		});
		if (res.status === 401 && !retried) {
			const refreshed = await getAccessToken(true).catch(() => null);
			if (refreshed != null) return spotifyFetch(apiPath, init, true);
		}
		return res;
	};

	let polling = false;
	let lastPollError: string | null = null;

	const pollPlayback = async (retried = false) => {
		if (polling) return;
		if (readTokens() == null) return;
		polling = true;
		try {
			const res = await spotifyFetch("/me/player/currently-playing");
			if (res.status === 204) {
				playbackRep.value = {...EMPTY_PLAYBACK};
				return;
			}
			if (res.status === 401) {
				if (!retried) {
					await getAccessToken(true);
					await pollPlayback(true);
					return;
				}
				throw new Error("認証に失敗しました。再認証してください。");
			}
			if (!res.ok) {
				throw new Error(`再生情報の取得に失敗しました: ${res.status}`);
			}

			const data = (await res.json()) as CurrentlyPlayingResponse;
			const item = data.item;
			const track =
				item != null && item.type === "track"
					? {
							id: item.id,
							name: item.name,
							uri: item.uri,
							artists: item.artists.map((a) => a.name),
							albumName: item.album.name,
							albumImageUrl: item.album.images[0]?.url,
							durationMs: item.duration_ms,
						}
					: null;

			playbackRep.value = {
				isPlaying: data.is_playing,
				track,
				progressMs: data.progress_ms ?? 0,
				...(data.device?.name != null && {deviceName: data.device.name}),
				updatedAt: new Date().toISOString(),
			};
			updateStatus({lastError: null, lastSynced: new Date().toISOString()});
			lastPollError = null;
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			if (lastPollError !== message) {
				lastPollError = message;
				updateStatus({lastError: message});
				nodecg.log.error(`Spotify 再生情報の取得に失敗しました: ${message}`);
			}
		} finally {
			polling = false;
		}
	};

	const buildAuthUrl = () => {
		const state = randomBytes(16).toString("hex");
		const params = new URLSearchParams({
			client_id: config.clientId,
			response_type: "code",
			redirect_uri: redirectUri,
			scope: SCOPE,
			state,
		});
		return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
	};

	const exchangeCode = async (code: string): Promise<StoredTokens> => {
		const res = await fetch(SPOTIFY_TOKEN_URL, {
			method: "POST",
			headers: {"Content-Type": "application/x-www-form-urlencoded"},
			body: new URLSearchParams({
				grant_type: "authorization_code",
				code,
				redirect_uri: redirectUri,
				client_id: config.clientId,
				client_secret: config.clientSecret,
			}),
		});
		if (!res.ok) {
			throw new Error(`トークン交換に失敗しました: ${res.status}`);
		}
		const data = (await res.json()) as TokenResponse;
		if (data.refresh_token == null) {
			throw new Error("トークン交換で refresh_token が返りませんでした。");
		}
		return {
			accessToken: data.access_token,
			refreshToken: data.refresh_token,
			expiresAt: Date.now() + data.expires_in * 1000,
		};
	};

	const fetchProfile = async (): Promise<{id: string; displayName: string}> => {
		const res = await spotifyFetch("/me");
		if (!res.ok) {
			throw new Error(`プロフィールの取得に失敗しました: ${res.status}`);
		}
		const data = (await res.json()) as {id: string; display_name?: string};
		return {id: data.id, displayName: data.display_name ?? data.id};
	};

	const router = nodecg.Router();
	router.get(
		"/spotify/callback",
		async (req: Request, res: ExpressResponse) => {
			const {code, error} = req.query;
			if (typeof error === "string") {
				nodecg.log.error(`Spotify 認証が拒否されました: ${error}`);
				res.send(
					"Spotify 認証が拒否されました。ダッシュボードのパネルに戻ってやり直してください。",
				);
				return;
			}
			if (typeof code !== "string") {
				res.status(400).send("認証コードがありません。");
				return;
			}

			try {
				const tokens = await exchangeCode(code);
				writeTokens(tokens);
				const profile = await fetchProfile();
				updateStatus({authorized: true, user: profile, lastError: null});
				nodecg.log.info(`Spotify に接続しました: ${profile.displayName}`);
				void pollPlayback();
				res.redirect(
					`/bundles/${nodecg.bundleName}/dashboard/spotifyView.html`,
				);
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				updateStatus({authorized: false, lastError: message});
				nodecg.log.error(`Spotify 認証に失敗しました: ${message}`);
				res.status(500).send(`Spotify 認証に失敗しました: ${message}`);
			}
		},
	);
	nodecg.mount(router);

	interface PlaylistSummary {
		id: string;
		name: string;
		uri: string;
		trackCount: number;
		imageUrl?: string;
	}

	const getPlaylists = async (): Promise<PlaylistSummary[]> => {
		const res = await spotifyFetch("/me/playlists?limit=50&offset=0");
		if (!res.ok) {
			throw new Error(`プレイリストの取得に失敗しました: ${res.status}`);
		}
		const data = (await res.json()) as PlaylistResponse;
		return data.items.map((p) => ({
			id: p.id,
			name: p.name,
			uri: p.uri,
			trackCount: p.tracks?.total ?? 0,
			...(p.images[0]?.url != null && {imageUrl: p.images[0]?.url}),
		}));
	};

	interface PlaylistTrackItem {
		id: string;
		name: string;
		uri: string;
		durationMs: number;
		artists: string[];
		albumName?: string;
		imageUrl?: string;
	}

	interface PlaylistTracksResult {
		items: PlaylistTrackItem[];
		total: number;
		offset: number;
	}

	const getPlaylistTracks = async (
		playlistId: string,
		offset = 0,
	): Promise<PlaylistTracksResult> => {
		const params = new URLSearchParams({
			limit: "50",
			offset: String(offset),
			fields:
				"items(track(name,id,uri,duration_ms,artists(name),album(name,images(url)),type)),total",
		});
		const res = await spotifyFetch(
			`/playlists/${playlistId}/tracks?${params.toString()}`,
		);
		if (!res.ok) {
			throw new Error(
				`プレイリストの曲一覧の取得に失敗しました: ${res.status}`,
			);
		}
		const data = (await res.json()) as PlaylistTracksResponse;
		return {
			items: data.items.flatMap((entry) => {
				const track = entry.track;
				if (track == null || track.type !== "track") return [];
				return [
					{
						id: track.id,
						name: track.name,
						uri: track.uri,
						durationMs: track.duration_ms,
						artists: track.artists.map((a) => a.name),
						albumName: track.album.name,
						...(track.album.images[0]?.url != null && {
							imageUrl: track.album.images[0]?.url,
						}),
					},
				];
			}),
			total: data.total,
			offset,
		};
	};

	const playbackErrorMessage = (status: number): string => {
		switch (status) {
			case 403:
				return "再生操作には Spotify Premium が必要です。";
			case 404:
				return "再生デバイスがありません。Spotify アプリを起動してください。";
			default:
				return `再生操作に失敗しました: ${status}`;
		}
	};

	const readSpotifyError = async (res: Response): Promise<string> => {
		let detail = "";
		try {
			const data = (await res.json()) as {error?: {message?: string}};
			detail = data.error?.message ?? "";
		} catch {
			// レスポンスボディが JSON でない場合は詳細を出せないため無視する。
		}
		const base = playbackErrorMessage(res.status);
		return detail ? `${base}（${detail}）` : base;
	};

	interface SpotifyDevice {
		id: string;
		name: string;
		isActive: boolean;
		type: string;
	}

	const getDevices = async (): Promise<SpotifyDevice[]> => {
		const res = await spotifyFetch("/me/player/devices");
		if (!res.ok) {
			throw new Error(`デバイス一覧の取得に失敗しました: ${res.status}`);
		}
		const data = (await res.json()) as {
			devices: {id: string; name: string; is_active: boolean; type: string}[];
		};
		return data.devices.map((d) => ({
			id: d.id,
			name: d.name,
			isActive: d.is_active,
			type: d.type,
		}));
	};

	const transferPlayback = async (deviceId: string) => {
		const res = await spotifyFetch("/me/player", {
			method: "PUT",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({device_ids: [deviceId]}),
		});
		if (!res.ok) {
			throw new Error(await readSpotifyError(res));
		}
	};

	const playTrack = async (
		trackUri: string,
		playlistUri?: string,
		deviceId?: string,
	) => {
		// 未アクティブのデバイスでは play が失敗するため、先に転送してアクティブ化する。
		if (deviceId != null) await transferPlayback(deviceId);
		const body: {
			context_uri?: string;
			offset?: {uri: string};
			uris?: string[];
			device_id?: string;
		} = playlistUri
			? {context_uri: playlistUri, offset: {uri: trackUri}}
			: {uris: [trackUri]};
		if (deviceId != null) body.device_id = deviceId;
		const res = await spotifyFetch("/me/player/play", {
			method: "PUT",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify(body),
		});
		if (!res.ok) {
			throw new Error(await readSpotifyError(res));
		}
		void pollPlayback();
	};

	const queueTrack = async (trackUri: string, deviceId?: string) => {
		if (deviceId != null) await transferPlayback(deviceId);
		const res = await spotifyFetch(
			`/me/player/queue?uri=${encodeURIComponent(trackUri)}`,
			{method: "POST"},
		);
		if (!res.ok) {
			throw new Error(await readSpotifyError(res));
		}
	};

	nodecg.listenFor("spotifyAuthorize", (_data, ack) => {
		if (ack && !ack.handled) ack(null, {url: buildAuthUrl()});
	});

	nodecg.listenFor("spotifyDisconnect", (_data, ack) => {
		try {
			deleteTokens();
			updateStatus({authorized: false, user: null, lastError: null});
			playbackRep.value = {...EMPTY_PLAYBACK};
			if (ack && !ack.handled) ack(null);
		} catch (err) {
			if (ack && !ack.handled) ack(err as Error);
		}
	});

	nodecg.listenFor("spotifyGetPlaylists", async (_data, ack) => {
		try {
			const playlists = await getPlaylists();
			if (ack && !ack.handled) ack(null, playlists);
		} catch (err) {
			if (ack && !ack.handled) ack(err as Error);
		}
	});

	nodecg.listenFor("spotifyGetPlaylistTracks", async (data, ack) => {
		try {
			const {playlistId, offset = 0} = (data ?? {}) as {
				playlistId: string;
				offset?: number;
			};
			if (typeof playlistId !== "string" || playlistId === "") {
				throw new Error("playlistId が指定されていません。");
			}
			const result = await getPlaylistTracks(playlistId, offset);
			if (ack && !ack.handled) ack(null, result);
		} catch (err) {
			if (ack && !ack.handled) ack(err as Error);
		}
	});

	nodecg.listenFor("spotifyGetDevices", async (_data, ack) => {
		try {
			const devices = await getDevices();
			if (ack && !ack.handled) ack(null, devices);
		} catch (err) {
			if (ack && !ack.handled) ack(err as Error);
		}
	});

	nodecg.listenFor("spotifyPlayTrack", async (data, ack) => {
		try {
			const {trackUri, playlistUri, deviceId} = (data ?? {}) as {
				trackUri: string;
				playlistUri?: string;
				deviceId?: string;
			};
			if (typeof trackUri !== "string" || trackUri === "") {
				throw new Error("trackUri が指定されていません。");
			}
			await playTrack(trackUri, playlistUri, deviceId);
			if (ack && !ack.handled) ack(null);
		} catch (err) {
			if (ack && !ack.handled) ack(err as Error);
		}
	});

	nodecg.listenFor("spotifyQueueTrack", async (data, ack) => {
		try {
			const {trackUri, deviceId} = (data ?? {}) as {
				trackUri: string;
				deviceId?: string;
			};
			if (typeof trackUri !== "string" || trackUri === "") {
				throw new Error("trackUri が指定されていません。");
			}
			await queueTrack(trackUri, deviceId);
			if (ack && !ack.handled) ack(null);
		} catch (err) {
			if (ack && !ack.handled) ack(err as Error);
		}
	});

	nodecg.listenFor("spotifyRefreshPlayback", (_data, ack) => {
		void pollPlayback();
		if (ack && !ack.handled) ack(null);
	});

	const initialize = async () => {
		setInterval(() => void pollPlayback(), pollIntervalMs);
		if (readTokens() == null) return;
		try {
			const profile = await fetchProfile();
			updateStatus({authorized: true, user: profile, lastError: null});
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			updateStatus({authorized: false, lastError: message});
		}
		void pollPlayback();
	};

	void initialize();
};
