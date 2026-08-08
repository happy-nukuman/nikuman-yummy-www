# Shelter feature

避難所候補の取得と経路参考表示を担当します。

- `api/get-demo-shelters.ts` — `POST /api/demo/shelters/nearby`（Demo API、`DOCS/DEMO_SHELTER_FRONTEND_GUIDE.md` 参照）を呼び出す。`NEXT_PUBLIC_API_MOCK` が `false` でない場合は `src/lib/api/mock.ts` の新宿区スナップショット mock が応答する。
- `hooks/use-demo-shelters.ts` — 位置取得後にユーザー操作で実行する TanStack Query mutation。
- `components/shelter-candidate-list.tsx` / `shelter-candidate-card.tsx` — 距離昇順の候補カード（開設状況は確認できない旨を常に表示）。
- `components/shelter-route-map.tsx` — 現在地から選択した施設までの Google マップ徒歩経路埋め込みと外部リンク。経路の通行可能性は保証しない。

データは新宿区オープンデータの固定スナップショットであり、リアルタイムの開設状況ではありません。
