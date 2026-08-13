import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
	Box,
	Button,
	Collapse,
	MenuItem,
	Select,
	Stack,
	Typography,
} from "@mui/material";
import {useCallback, useEffect, useState} from "react";
import {useSpotifyPlayback, useSpotifyStatus} from "../../hooks";
import {Panel, Row, Section, SectionTitle} from "../components";
import {renderDashboard} from "../index";

interface PlaylistSummary {
	id: string;
	name: string;
	uri: string;
	trackCount: number;
	imageUrl?: string;
}

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

interface SpotifyDevice {
	id: string;
	name: string;
	isActive: boolean;
	type: string;
}

const sendMessage = <T,>(name: string, data?: unknown): Promise<T> =>
	new Promise<T>((resolve, reject) => {
		nodecg.sendMessage<T>(name, data, (err, result) => {
			if (err) reject(err as Error);
			else resolve(result as T);
		});
	});

const SpotifyView = () => {
	const status = useSpotifyStatus();
	const playback = useSpotifyPlayback();

	const [authUrl, setAuthUrl] = useState<string | null>(null);
	const [playlists, setPlaylists] = useState<PlaylistSummary[] | null>(null);
	const [loadingPlaylists, setLoadingPlaylists] = useState(false);
	const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(
		null,
	);
	const [trackCache, setTrackCache] = useState<
		Record<string, PlaylistTracksResult>
	>({});
	const [loadingTracks, setLoadingTracks] = useState(false);
	const [devices, setDevices] = useState<SpotifyDevice[] | null>(null);
	const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
	const [loadingDevices, setLoadingDevices] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);

	const authorized = status?.authorized === true;

	const loadDevices = useCallback(async () => {
		setLoadingDevices(true);
		setActionError(null);
		try {
			const result = await sendMessage<SpotifyDevice[]>("spotifyGetDevices");
			setDevices(result);
			setSelectedDeviceId((prev) => {
				if (prev != null && result.some((d) => d.id === prev)) return prev;
				return result.find((d) => d.isActive)?.id ?? result[0]?.id ?? null;
			});
		} catch (err) {
			setActionError(err instanceof Error ? err.message : String(err));
		} finally {
			setLoadingDevices(false);
		}
	}, []);

	const loadPlaylists = useCallback(async () => {
		setLoadingPlaylists(true);
		setActionError(null);
		try {
			const result = await sendMessage<PlaylistSummary[]>(
				"spotifyGetPlaylists",
			);
			setPlaylists(result);
		} catch (err) {
			setActionError(err instanceof Error ? err.message : String(err));
		} finally {
			setLoadingPlaylists(false);
		}
	}, []);

	const loadTracks = async (playlist: PlaylistSummary, offset = 0) => {
		setLoadingTracks(true);
		setActionError(null);
		try {
			const result = await sendMessage<PlaylistTracksResult>(
				"spotifyGetPlaylistTracks",
				{playlistId: playlist.id, offset},
			);
			setTrackCache((prev) => {
				const nextResult: PlaylistTracksResult = {
					items:
						offset === 0
							? result.items
							: [...(prev[playlist.id]?.items ?? []), ...result.items],
					total: result.total,
					offset,
				};
				return {...prev, [playlist.id]: nextResult};
			});
		} catch (err) {
			setActionError(err instanceof Error ? err.message : String(err));
		} finally {
			setLoadingTracks(false);
		}
	};

	const togglePlaylist = (playlist: PlaylistSummary) => {
		if (expandedPlaylistId === playlist.id) {
			setExpandedPlaylistId(null);
			return;
		}
		setExpandedPlaylistId(playlist.id);
		if (trackCache[playlist.id] == null) {
			void loadTracks(playlist);
		}
	};

	const openAuth = async () => {
		setActionError(null);
		try {
			const result = await sendMessage<{url: string}>("spotifyAuthorize");
			setAuthUrl(result.url);
			window.open(result.url, "_blank");
		} catch (err) {
			setActionError(err instanceof Error ? err.message : String(err));
		}
	};

	const disconnect = async () => {
		setActionError(null);
		try {
			await sendMessage("spotifyDisconnect");
			setPlaylists(null);
			setExpandedPlaylistId(null);
			setTrackCache({});
			setDevices(null);
			setSelectedDeviceId(null);
		} catch (err) {
			setActionError(err instanceof Error ? err.message : String(err));
		}
	};

	const playTrack = async (trackUri: string, playlistUri?: string) => {
		setActionError(null);
		try {
			await sendMessage("spotifyPlayTrack", {
				trackUri,
				playlistUri,
				deviceId: selectedDeviceId ?? undefined,
			});
		} catch (err) {
			setActionError(err instanceof Error ? err.message : String(err));
		}
	};

	const queueTrack = async (trackUri: string) => {
		setActionError(null);
		try {
			await sendMessage("spotifyQueueTrack", {
				trackUri,
				deviceId: selectedDeviceId ?? undefined,
			});
		} catch (err) {
			setActionError(err instanceof Error ? err.message : String(err));
		}
	};

	useEffect(() => {
		if (!authorized || playlists != null || loadingPlaylists) return;
		void loadPlaylists();
	}, [authorized, playlists, loadingPlaylists, loadPlaylists]);

	useEffect(() => {
		if (!authorized || devices != null || loadingDevices) return;
		void loadDevices();
	}, [authorized, devices, loadingDevices, loadDevices]);

	return (
		<Panel height={640}>
			<Row>
				<Stack sx={{flex: 1}}>
					<Typography>
						状態:{" "}
						{authorized ? (
							<Typography
								component='span'
								color='success.main'
							>
								接続済み
							</Typography>
						) : (
							<Typography
								component='span'
								color='error.main'
							>
								未接続
							</Typography>
						)}
					</Typography>
					{status?.lastError && (
						<Typography color='error.main'>
							エラー: {status.lastError}
						</Typography>
					)}
				</Stack>
				{authorized ? (
					<Button
						variant='outlined'
						color='error'
						onClick={() => void disconnect()}
					>
						切断
					</Button>
				) : (
					<Button
						variant='contained'
						onClick={() => void openAuth()}
					>
						Spotify に接続
					</Button>
				)}
			</Row>

			{authUrl && (
				<Typography
					variant='caption'
					color='text.secondary'
				>
					Spotify
					の認証画面を開きました。認証が完了すると自動的にこのパネルへ戻ります。
				</Typography>
			)}

			{actionError && (
				<Row>
					<Typography color='error.main'>エラー: {actionError}</Typography>
				</Row>
			)}

			<Section>
				<SectionTitle>再生デバイス</SectionTitle>
				<Row>
					<Select
						size='small'
						value={selectedDeviceId ?? ""}
						onChange={(e) => setSelectedDeviceId(e.target.value || null)}
						disabled={!authorized || devices == null || devices.length === 0}
						sx={{flex: 1, minWidth: 0}}
					>
						{devices?.map((d) => (
							<MenuItem
								key={d.id}
								value={d.id}
							>
								{d.name}（{d.isActive ? "アクティブ" : d.type}）
							</MenuItem>
						))}
					</Select>
					<Button
						size='small'
						onClick={() => void loadDevices()}
						disabled={!authorized || loadingDevices}
					>
						更新
					</Button>
				</Row>
				{authorized && devices != null && devices.length === 0 && (
					<Typography
						variant='caption'
						color='text.secondary'
					>
						Spotify
						アプリ（デスクトップ・モバイル）を起動するとデバイスが表示されます。
					</Typography>
				)}
			</Section>

			<Section>
				<SectionTitle>再生中</SectionTitle>
				{playback?.track ? (
					<Row>
						{playback.track.albumImageUrl && (
							<Box
								component='img'
								src={playback.track.albumImageUrl}
								sx={{width: 48, height: 48, borderRadius: 1}}
								alt=''
							/>
						)}
						<Stack sx={{flex: 1, minWidth: 0}}>
							<Typography noWrap>{playback.track.name}</Typography>
							<Typography
								variant='caption'
								color='text.secondary'
								noWrap
							>
								{playback.track.artists?.join(", ")}
							</Typography>
						</Stack>
						<Typography variant='caption'>
							{playback.isPlaying ? "再生中" : "一時停止"}
						</Typography>
					</Row>
				) : (
					<Typography color='text.secondary'>再生中の曲はありません</Typography>
				)}
			</Section>

			<Section>
				<Row>
					<SectionTitle>プレイリスト</SectionTitle>
					<Box sx={{flex: 1}} />
					<Button
						size='small'
						onClick={() => void loadPlaylists()}
						disabled={!authorized || loadingPlaylists}
					>
						一覧を取得
					</Button>
				</Row>
				{playlists == null ? (
					<Typography color='text.secondary'>
						{authorized
							? "プレイリストを取得してください。"
							: "先に Spotify に接続してください。"}
					</Typography>
				) : playlists.length === 0 ? (
					<Typography color='text.secondary'>
						プレイリストがありません
					</Typography>
				) : (
					<Stack spacing={0.5}>
						{playlists.map((p) => {
							const expanded = p.id === expandedPlaylistId;
							const cached = trackCache[p.id];
							return (
								<Box key={p.id}>
									<Row
										active={expanded}
										onClick={() => togglePlaylist(p)}
									>
										{p.imageUrl && (
											<Box
												component='img'
												src={p.imageUrl}
												sx={{width: 32, height: 32, borderRadius: 1}}
												alt=''
											/>
										)}
										<Stack sx={{flex: 1, minWidth: 0}}>
											<Typography noWrap>{p.name}</Typography>
											<Typography
												variant='caption'
												color='text.secondary'
											>
												{p.trackCount}曲
											</Typography>
										</Stack>
										<ExpandMoreIcon
											sx={{
												flexShrink: 0,
												color: "text.secondary",
												transform: expanded ? "rotate(180deg)" : undefined,
											}}
										/>
									</Row>
									<Collapse in={expanded}>
										<Stack
											spacing={0.5}
											sx={{pt: 0.5, pl: 1, pr: 1}}
										>
											{loadingTracks && cached == null ? (
												<Typography
													variant='caption'
													color='text.secondary'
												>
													読み込み中...
												</Typography>
											) : cached == null ? (
												<Typography
													variant='caption'
													color='text.secondary'
												>
													曲の取得に失敗しました
												</Typography>
											) : cached.items.length === 0 ? (
												<Typography
													variant='caption'
													color='text.secondary'
												>
													曲がありません
												</Typography>
											) : (
												<>
													{cached.items.map((t) => (
														<Row key={t.id}>
															<Stack sx={{flex: 1, minWidth: 0}}>
																<Typography noWrap>{t.name}</Typography>
																<Typography
																	variant='caption'
																	color='text.secondary'
																	noWrap
																>
																	{t.artists.join(", ")}
																</Typography>
															</Stack>
															<Button
																size='small'
																variant='outlined'
																onClick={() => void playTrack(t.uri, p.uri)}
															>
																再生
															</Button>
															<Button
																size='small'
																onClick={() => void queueTrack(t.uri)}
															>
																キューに追加
															</Button>
														</Row>
													))}
													{cached.total > cached.items.length && (
														<Button
															size='small'
															onClick={() =>
																void loadTracks(p, cached.items.length)
															}
															disabled={loadingTracks}
														>
															さらに読み込む
														</Button>
													)}
												</>
											)}
										</Stack>
									</Collapse>
								</Box>
							);
						})}
					</Stack>
				)}
			</Section>
		</Panel>
	);
};

renderDashboard(<SpotifyView />);
