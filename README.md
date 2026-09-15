# Preb 法人化シミュレーター — Phase 1計算エンジン

**状態: Phase 1完成候補。計算エンジンとGolden Testのみ。UIはありません。**

唯一のSSOTは`spec/v1.0_FINAL.md`。添付原本をバイト単位で保持し、SHA-256テストで改変を検出します。

## 実行

Node.js 22.18以上。

```sh
npm ci
npm run verify
```

`verify`はTypeScript strict、全テスト、Phase 1受入条件を連続実行します。

## 実装範囲

- 個人: 事業所得、所得税、復興特別所得税、令和8年度名古屋市住民税、世帯国保、国民年金、個人事業税、個人消費税
- 法人: 給与所得、2026年愛知支部社会保険、法人税、愛知県法人県民税、名古屋市法人市民税、法人事業税、特別法人事業税、法人消費税、法人留保
- 比較: CASE-A世帯可処分所得、CASE-B世帯可処分所得、世帯+法人純資産増加
- 初年度: 制度別日付・月数を分離し、入力された12か月実額のみ合算
- 端数: 税目・段階別の専用関数。課税標準、中間額、確定額を分離
- Golden-01: 完全入力fixtureと、`src/`・年度マスタをimportしない独立検算コード

国保の社会保険料控除は`householdNhiPayer`が必須です。夫・妻への按分や自動帰属は行いません。
`calculateComparison`は2026年の完全入力だけを受け付けます。未定義条件は推測せず停止します。

役員報酬の推薦探索`optimize()`は今回のPhase 1対象外であり、`OUT_OF_MVP_RANGE`でfail closedします。

## 根拠

- `masters/2026.json`: SSOT定数と公式検証メタデータ
- `src/rounding.ts`: 税目・段階別端数関数と公式URL
- `tests/golden-01-fixture.json`: 完全入力、固定期待値、各期待値のsource/formula/rounding/verifiedAt
- `scripts/verify-golden-01-independent.mjs`: 本体非依存の独立検算
- `docs/OFFICIAL_ROUNDING_SOURCES.md`: 端数処理の段階表
- `docs/IMPLEMENTATION_REPORT.md`: 最終検証結果

新規ローカルGitリポジトリです。GitHubリモートは設定していません。
