# 法人化シミュレーター Phase Status

最終更新: 2026-09-17

## Phase 1
**COMPLETE / FROZEN**

2026年・名古屋市/愛知県の比較計算エンジン完成。
凍結仕様SSOTは `spec/v1.0_FINAL.md`。
税計算、社会保険、年度マスタ、Golden-01期待値は後続UIフェーズから変更しない。

## Phase 2A
**COMPLETE**

完了コミット:
`82bc4c4065a64f39571844b345ad42ccd548203a`

- 入力UI
- `calculateComparison()` による比較計算
- 社会保険加入開始月
- 個人/法人の対応消費税モード
- 条件非該当入力のdisable
- TypeScript build

## Phase 2B
**COMPLETE / QA PASS**

完了コミット:
`486a1d07f504bc477f8ff86e621e8eb75dadf1ab`

- 役員報酬100,000〜600,000円
- 10,000円基本刻み
- 社会保険等級境界 -1 / 境界 / +1
- `calculateComparison()` 再利用
- VALID優先、VALID 0件時のみWARNING
- 初年度加入前月の元報酬維持
- VALID/WARNING各Top 5のみ保持
- UI最適化結果表示

表示上は必ず以下を区別する。

- 世帯可処分所得
- 法人税引後留保
- 世帯＋法人純資産増加

法人税引後留保は個人手取りではない。

## Phase 2完了時検証

README同期コミット:
`8a75f372bcededbe6e64df6476d1d4c70c94188c`

- TypeScript strict/typecheck: PASS
- Tests: 207 / 207 PASS
- Acceptance: PASS
- Build: PASS
- Golden-01固定期待値: 不変
- Phase 1凍結領域へのPhase 2B差分: なし

## 現在の制約

- 2026年専用
- 名古屋市・愛知県前提
- 未定義条件はfail closed
- DB / 認証 / クラウド保存なし
- Optimizerは独自税計算式を持たない

## 次フェーズ

**Phase 2C — 実用UI完成**

詳細SSOT:
`docs/PHASE_2C_SPEC.md`
