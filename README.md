# Preb 法人化シミュレーター

2026年の名古屋市・愛知県を前提に、個人事業主（CASE-A）と法人化後（CASE-B）の世帯・法人の差を比較するシミュレーターです。計算エンジン、入力・計算UI、役員報酬Optimizerを実装済みです。

## 現在の状態

- **Phase 1**: 計算エンジン完成・凍結済み
- **Phase 2A**: UI入力・計算画面実装済み
- **Phase 2B**: 役員報酬Optimizer実装済み

現在の検証結果:

- TypeScript strict/typecheck PASS
- 全207テスト PASS
- Acceptance PASS
- Build PASS
- GOLDEN-01固定期待値不変
- Phase 1凍結領域にPhase 2B差分なし

## Phase 1: 計算エンジン

個人事業主CASE-A、法人化CASE-Bについて、以下を計算します。

- 所得税、復興特別所得税、名古屋市住民税
- 世帯国保、国民年金、個人事業税、個人消費税
- 給与所得、2026年愛知支部社会保険
- 法人税、愛知県法人県民税、名古屋市法人市民税
- 法人事業税、特別法人事業税、法人消費税、法人留保
- CASE-A世帯可処分所得
- CASE-B世帯可処分所得
- 世帯＋法人純資産増加
- 初年度の制度別日付・月数処理
- 税目別・段階別端数処理
- 世帯国保の所得控除帰属
- GOLDEN-01独立検算

Phase 1凍結仕様のSSOTは引き続き `spec/v1.0_FINAL.md` です。

## Phase 2A: UI入力・計算画面

既存の `calculateComparison()` を使ったUI計算を実装しています。

- 社会保険加入開始月を入力可能
- 個人消費税モード: `EXEMPT`、`GENERAL`、`SIMPLIFIED`、`SPECIAL_20_PERCENT`、`MANUAL`
- 法人消費税モード: `EXEMPT`、`GENERAL`、`SIMPLIFIED`
- 条件非該当時の入力項目をdisable
- TypeScriptビルドに対応
- `index.html` から `dist/ui.js` を利用

Phase 2A完了コミット: `82bc4c4065a64f39571844b345ad42ccd548203a`

## Phase 2B: 役員報酬Optimizer

夫・妻それぞれの月額役員報酬を探索します。

- 100,000円〜600,000円
- 基本10,000円刻み
- 既存マスタから動的取得した社会保険標準報酬等級境界の1円前、境界、1円後も候補

主評価は次の値です。

`comparison.totalWealthIncreaseB`

これは **CASE-B世帯可処分所得＋法人税引後留保** です。`corporateAfterTaxProfit`（法人税引後留保）は個人の手取り・世帯手取りではありません。

同値の場合のtie-breakは、次の順です。

1. `totalWealthIncreaseB` が大きい
2. `corporateAfterTaxProfit` が大きい
3. `householdDisposableIncomeB` が大きい
4. 夫婦役員報酬合計が小さい
5. 夫役員報酬が小さい
6. 妻役員報酬が小さい

法人税引後留保が0以上の候補はVALID、マイナスの候補はWARNINGです。VALIDが1件でもあればWARNINGをbestにせず、VALIDが0件の場合だけWARNING最上位をbestにします。

初年度は `socialInsuranceMonths` に含まれる月だけ候補報酬へ置換し、加入前月は元の `monthlyExecutiveSalary` を維持します。全候補結果は保持せず、VALID・WARNINGそれぞれ上位5件と件数だけを保持します。

既存UIには、推奨夫婦役員報酬、CASE-B世帯可処分所得、法人税引後留保、世帯＋法人純資産増加、CASE-Aとの差、VALID/WARNING、Top 5候補を表示するOptimizer機能を追加しています。

Phase 2B完了コミット: `486a1d07f504bc477f8ff86e621e8eb75dadf1ab`

## 実行方法

Node.js 22.18以上が必要です。

```bash
npm ci
npm run typecheck
npm test
node scripts/acceptance.mjs
npm run build
```

`npm run verify` は、typecheck、全テスト、Acceptanceを連続実行します。

## 計算・Optimizerの重要ルール

- `calculateComparison()` が比較計算の唯一の計算経路です。
- Optimizerは既存の `calculateComparison()` を候補ごとに再利用し、別の計算式を持ちません。
- **世帯可処分所得**、**法人税引後留保**、**世帯＋法人純資産増加**を別の指標として扱います。
- 法人税引後留保は法人に残る金額であり、個人の手取り・世帯手取りには含めません。
- 未定義条件は推測せずfail closedとします。
- 初年度は制度ごとの開始日・加入月数を分けて扱います。

## SSOT / 根拠ファイル

- `spec/v1.0_FINAL.md`: Phase 1凍結仕様のSSOT
- `masters/2026.json`: 2026年の定数・マスタ
- `src/rounding.ts`: 税目・段階別端数関数と公式URL
- `tests/golden-01-fixture.json`: GOLDEN-01の完全入力・固定期待値
- `scripts/verify-golden-01-independent.mjs`: 本体非依存の独立検算
- `docs/OFFICIAL_ROUNDING_SOURCES.md`: 端数処理の段階表
- `docs/IMPLEMENTATION_REPORT.md`: 検証結果

## 現在の制約

- 2026年専用
- 名古屋市・愛知県前提
- 未定義条件は推測せずfail closed
- 法人留保は個人手取りではない
- Phase 1凍結仕様は変更しない
- Optimizerは既存 `calculateComparison()` を再利用し、別計算式を持たない
