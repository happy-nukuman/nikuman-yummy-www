# Open data workspace

`DATA` は、公開データをアプリの Contract に合わせて取り込み、正規化し、検証するための作業領域です。現時点では実データを接続していません。

## Directory roles

- `raw/`: ダウンロードした原本。再配布可能性を確認するまで Git に追加しません。
- `normalized/`: `@nikuman-yummy/shared` の `Shelter` などに変換した成果物。
- `scripts/`: 変換、検証、メタデータ付与を行うスクリプト。

各データソースについて、データ名、提供元、ライセンス、原始 URL、取得日、更新頻度、変換方法を同じ Pull Request で記録してください。個人情報、Token、Secret、または再配布が許可されていないデータは保存しません。

小さく再配布可能なデータのみ、レビュー後に明示的に Git 管理へ追加します。大きなデータや高頻度更新データは将来 R2 などへの移行を検討しますが、本タスクでは Cloudflare リソースを作成しません。

## Validation

正規化した shelter JSON 配列は、リポジトリルートから次のように検証できます。

```bash
npm run data:validate -- DATA/normalized/shelters.json
```

このコマンドは Shared Contract の runtime guard を使用します。
