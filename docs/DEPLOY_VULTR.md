# Vultr デプロイ手順

イベント期間中（短期運用）に Vultr VPS 上で NodeCG を公開する手順です。
HTTPS 化には `docker-compose.yml` の Caddy（Let's Encrypt 自動証明書取得）を使用します。

## 前提

- Vultr に VPS を作成済みであること
- HTTPS に使うドメインを保有していること
- リポジトリをクローンした状態であること

## 手順

### 1. DNS 設定

保有ドメインの A レコードを Vultr VPS の IP アドレスに向けます。

```
<ドメイン>  A  <Vultr VPS の IP>
```

DNS の反映には数分〜数時間かかることがあります。イベント開始の前日までに設定してください。

### 2. ファイアウォール

Vultr のファイアウォールで以下のポートを開放します。

| ポート | 用途 |
| --- | --- |
| 22 | SSH |
| 80 | HTTP（Let's Encrypt の証明書取得、HTTP→HTTPS リダイレクト用） |
| 443 | HTTPS |

### 3. VPS 上のセットアップ

```bash
# Docker / Compose のインストール
curl -fsSL https://get.docker.com | sh

# リポジトリを取得
git clone git@github.com:plumberspeedrun/plumber-event-layouts.git
cd plumber-event-layouts
```

### 4. 設定

- `cfg/` はリポジトリに含まれないため、`mkdir cfg` して本番用の設定（`plumber-event-layouts.json`、`google-credentials.json`、`spotify-tokens.json`）を配置します
- `caddy/Caddyfile` の `your-event-domain.example.com` を実際のドメインに置き換えます
- Spotify 連携を使う場合、`cfg/plumber-event-layouts.json` の `spotify.redirectUri` を `https://<ドメイン>/spotify/callback` に設定します（未設定時は `http://127.0.0.1:9090/spotify/callback` が使われ、HTTPS 環境では動作しません）。Spotify 側のアプリ設定に登録する Redirect URI も同じ URL にします

### 5. 起動

```bash
docker compose up -d --build
```

### 6. 確認

ブラウザで `https://<ドメイン>` にアクセスし、ダッシュボードが HTTPS で表示されることを確認します。
初回アクセス時は Caddy が Let's Encrypt で証明書を自動取得するため、少し時間がかかることがあります。

グラフィックスは `https://<ドメイン>/bundles/plumber-event-layouts/graphics/<ファイル名>.html` で参照します。

## 運用メモ

- 短期運用（イベント期間のみ）を想定しているため、証明書の更新管理は考慮不要です
- `caddy/Caddyfile` の変更は `docker compose restart caddy` で反映されます
- `cfg/` はボリュームマウントされているため、イメージ再ビルドなしで反映されます
