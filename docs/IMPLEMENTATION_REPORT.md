# 実装レポート

最終更新: 2026-09-17

## 現在状態

- Phase 1: COMPLETE / FROZEN
- Phase 2A: COMPLETE
- Phase 2B: COMPLETE / QA PASS
- Phase 2C: SPEC READY / NOT IMPLEMENTED

Phase 1凍結仕様SSOT:
`spec/v1.0_FINAL.md`

## Phase 1主要機能

- 個人事業主CASE-A
- 法人化CASE-B
- 所得税・復興特別所得税・名古屋市住民税
- 世帯国保・国民年金
- 個人事業税・個人消費税
- 給与所得・2026年愛知支部社会保険
- 法人税・法人県民税・法人市民税
- 法人事業税・特別法人事業税・法人消費税
- 法人税引後留保
- 世帯＋法人純資産増加
- 税目別段階別端数処理
- 初年度制度別日付・月数
- 国保所得控除の実支払者帰属
- GOLDEN-01独立検算

## GOLDEN-01固定値

| 項目 | CASE-A | CASE-B |
|---|---:|---:|
| 世帯可処分所得 | 6,483,170円 | 4,775,575円 |
| 法人税引後留保 | — | 1,590,875円 |
| 世帯＋法人純資産増加 | 6,483,170円 | 6,366,450円 |

CASE-BはCASE-Aより116,720円低い。
法人税引後留保は個人手取りではない。

## Phase 2A

完了コミット:
`82bc4c4065a64f39571844b345ad42ccd548203a`

入力UI、比較計算、社会保険開始月、消費税モード、条件入力disable、TypeScript buildを実装。

## Phase 2B

完了コミット:
`486a1d07f504bc477f8ff86e621e8eb75dadf1ab`

役員報酬Optimizer、社会保険等級境界±1円、VALID/WARNING、初年度加入前月維持、Top 5保持、UI結果表示を実装。

README同期:
`8a75f372bcededbe6e64df6476d1d4c70c94188c`

## Phase 2B完了時検証

- Tests: 207
- PASS: 207
- FAIL: 0
- SKIP: 0
- TypeScript strict/typecheck: PASS
- Acceptance: PASS
- Build: PASS
- Golden-01: PASS / 不変
- Phase 1凍結領域差分: 0

## 次工程

Phase 2C — 実用UI完成。

1月法人化前提で、役員報酬・社会保険・法人税等・法人税引後留保・世帯可処分所得・世帯＋法人純資産増加を比較しやすい画面へ仕上げる。

SSOT:
`docs/PHASE_2C_SPEC.md`
