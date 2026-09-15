import { CalculationError, calculateComparison, optimize, type ComparisonInput2026, type OptimizationResult } from './index.ts';

type Values = Record<string, string | undefined>;
type PersonKey = string;

const required = (values: Values, name: string): string => {
  const value = values[name]?.trim();
  if (!value) throw new Error(`${name} は必須です`);
  return value;
};
const numberValue = (values: Values, name: string, signed = false): number => {
  const value = Number(required(values, name));
  if (!Number.isSafeInteger(value) || (!signed && value < 0)) throw new Error(`${name} は0以上の整数で入力してください`);
  return value;
};
const booleanValue = (values: Values, name: string): boolean => {
  const value = required(values, name);
  if (value !== 'true' && value !== 'false') throw new Error(`${name} を選択してください`);
  return value === 'true';
};
const consumption = (values: Values, name: string, allowed?: readonly string[]) => {
  const status = required(values, name);
  if (allowed && !allowed.includes(status)) throw new Error(`${name} の消費税ステータスが不正です`);
  if (status === 'EXEMPT') return { status: 'EXEMPT' as const };
  if (status === 'GENERAL') return { status: 'GENERAL' as const, output: numberValue(values, `${name}.output`), deductibleInput: numberValue(values, `${name}.deductibleInput`) };
  if (status === 'SIMPLIFIED') return { status: 'SIMPLIFIED' as const, output: numberValue(values, `${name}.output`), deemedPurchaseBps: numberValue(values, `${name}.deemedPurchaseBps`) };
  if (status === 'SPECIAL_20_PERCENT') return { status: 'SPECIAL_20_PERCENT' as const, output: numberValue(values, `${name}.output`), eligible: booleanValue(values, `${name}.eligible`) };
  if (status === 'MANUAL') return { status: 'MANUAL' as const, amount: numberValue(values, `${name}.amount`, true) };
  throw new Error(`${name} の消費税ステータスが不正です`);
};
const monthly = (values: Values, prefix: string) => Array.from({ length: 12 }, (_, i) => numberValue(values, `${prefix}.${i + 1}`));
const socialInsuranceMonths = (values: Values): number[] => {
  const startMonth = numberValue(values, 'caseB.socialInsuranceStartMonth');
  if (startMonth < 1 || startMonth > 12) throw new Error('caseB.socialInsuranceStartMonth は1〜12で入力してください');
  return Array.from({ length: 13 - startMonth }, (_, i) => startMonth + i);
};
const personA = (values: Values, person: PersonKey) => ({
  sales: numberValue(values, `${person}.sales`), expenses: numberValue(values, `${person}.expenses`),
  blueReturnDeduction: numberValue(values, `${person}.blueReturnDeduction`) as 0 | 550000 | 650000,
  age: numberValue(values, `${person}.age`), businessTaxRateBps: numberValue(values, `${person}.businessTaxRateBps`) as 0 | 300 | 400 | 500,
  otherIncome: numberValue(values, `${person}.otherIncome`, true), otherIncomeDeductions: numberValue(values, `${person}.otherIncomeDeductions`),
  ideco: numberValue(values, `${person}.ideco`), smallBusinessMutualAid: numberValue(values, `${person}.smallBusinessMutualAid`),
  consumptionTax: consumption(values, `${person}.consumptionTax`), nationalPensionMonths: numberValue(values, `${person}.nationalPensionMonths`),
  businessMonths: numberValue(values, `${person}.businessMonths`), previousTotalIncome: numberValue(values, `${person}.previousTotalIncome`),
  residentReference: {
    totalIncome: numberValue(values, `${person}.resident.totalIncome`),
    deductionsExcludingBasic: numberValue(values, `${person}.resident.deductionsExcludingBasic`),
    personalDeductionDifferenceTotal: numberValue(values, `${person}.resident.personalDeductionDifferenceTotal`),
    exemptionStatus: required(values, `${person}.resident.exemptionStatus`) as 'FULL' | 'INCOME_ONLY' | 'NONE',
  },
});
const personB = (values: Values, person: PersonKey) => ({
  age: numberValue(values, `${person}.age`), monthlyExecutiveSalary: monthly(values, `${person}.salary`),
  otherIncome: numberValue(values, `${person}.otherIncome`, true), otherIncomeDeductions: numberValue(values, `${person}.otherIncomeDeductions`),
  ideco: numberValue(values, `${person}.ideco`), smallBusinessMutualAid: numberValue(values, `${person}.smallBusinessMutualAid`),
  residentReference: {
    totalIncome: numberValue(values, `${person}.resident.totalIncome`),
    deductionsExcludingBasic: numberValue(values, `${person}.resident.deductionsExcludingBasic`),
    personalDeductionDifferenceTotal: numberValue(values, `${person}.resident.personalDeductionDifferenceTotal`),
    exemptionStatus: required(values, `${person}.resident.exemptionStatus`) as 'FULL' | 'INCOME_ONLY' | 'NONE',
  },
});

export function parseFormValues(values: Values): ComparisonInput2026 {
  return {
    assessmentYear: 2026, householdNhiPayer: required(values, 'householdNhiPayer') as 'HUSBAND' | 'WIFE',
    caseA: { husband: personA(values, 'husbandA'), wife: personA(values, 'wifeA') },
    caseB: { husband: personB(values, 'husbandB'), wife: personB(values, 'wifeB'), socialInsuranceMonths: socialInsuranceMonths(values) },
    corporation: {
      capital: numberValue(values, 'corporation.capital'), establishmentDate: required(values, 'corporation.establishmentDate'),
      fiscalYearStart: required(values, 'corporation.fiscalYearStart'), fiscalYearEnd: required(values, 'corporation.fiscalYearEnd'),
      businessMonths: numberValue(values, 'corporation.businessMonths'), presenceMonths: numberValue(values, 'corporation.presenceMonths'),
      sales: numberValue(values, 'corporation.sales'), operatingExpenses: numberValue(values, 'corporation.operatingExpenses'),
      additionalExpenses: numberValue(values, 'corporation.additionalExpenses'), accountantCost: numberValue(values, 'corporation.accountantCost'),
      maintenanceCost: numberValue(values, 'corporation.maintenanceCost'), otherFixedCost: numberValue(values, 'corporation.otherFixedCost'),
      invoiceRegistered: booleanValue(values, 'corporation.invoiceRegistered'), taxableBusinessElection: booleanValue(values, 'corporation.taxableBusinessElection'),
      specificNewCorporationFlag: booleanValue(values, 'corporation.specificNewCorporationFlag'), consumptionTax: consumption(values, 'corporation.consumptionTax', ['EXEMPT', 'GENERAL', 'SIMPLIFIED']),
    },
  };
}

export function calculateFromForm(values: Values) {
  try { return { result: calculateComparison(parseFormValues(values)), error: null }; }
  catch (error) { return { result: null, error: error instanceof CalculationError || error instanceof Error ? error.message : '入力を確認してください' }; }
}
export function optimizeFromForm(values: Values) {
  try { return { result: optimize(parseFormValues(values)), error: null }; }
  catch (error) { return { result: null, error: error instanceof CalculationError || error instanceof Error ? error.message : '入力を確認してください' }; }
}

const yen = (value: number) => `${new Intl.NumberFormat('ja-JP').format(value)}円`;
const optimizationCandidate = (candidate: OptimizationResult['best'], index: number) => `<li>${index + 1}. 夫 ${yen(candidate.husbandMonthlySalary)} / 妻 ${yen(candidate.wifeMonthlySalary)}、世帯可処分所得 ${yen(candidate.householdDisposableIncomeB)}、法人留保 ${yen(candidate.corporateAfterTaxProfit)}、総資産増加 ${yen(candidate.totalWealthIncreaseB)}、差額 ${yen(candidate.wealthDifference)}、${candidate.status}${candidate.reason ? `（${candidate.reason}）` : ''}</li>`;
const field = (label: string, name: string, type = 'number', requiredField = true) => `<label>${label}<input name="${name}" type="${type}"${requiredField ? ' required' : ''}></label>`;
const select = (label: string, name: string, options: string[]) => `<label>${label}<select name="${name}" required><option value="">選択してください</option>${options.map(value => `<option value="${value}">${value}</option>`).join('')}</select></label>`;
const consumptionFields = (label: string, name: string, corporate = false) => {
  const options = corporate ? ['EXEMPT', 'GENERAL', 'SIMPLIFIED'] : ['EXEMPT', 'GENERAL', 'SIMPLIFIED', 'SPECIAL_20_PERCENT', 'MANUAL'];
  return `<div class="consumption" data-consumption="${name}">${select(label, name, options)}<div data-statuses="GENERAL SIMPLIFIED SPECIAL_20_PERCENT" hidden>${field('売上に係る消費税額', `${name}.output`, 'number', false)}</div><div data-statuses="GENERAL" hidden>${field('控除対象仕入税額', `${name}.deductibleInput`, 'number', false)}</div><div data-statuses="SIMPLIFIED" hidden>${field('みなし仕入率（bps）', `${name}.deemedPurchaseBps`, 'number', false)}</div>${corporate ? '' : `<div data-statuses="SPECIAL_20_PERCENT" hidden>${select('2割特例の適用可否', `${name}.eligible`, ['true', 'false'])}</div><div data-statuses="MANUAL" hidden>${field('消費税年額（手入力）', `${name}.amount`, 'number', false)}</div>`}</div>`;
};
function personFields(prefix: string, title: string, salary = false) {
  const basics = salary ? `${field('年齢', `${prefix}.age`)}${field('その他所得', `${prefix}.otherIncome`)}${field('その他控除', `${prefix}.otherIncomeDeductions`)}${field('iDeCo（年額）', `${prefix}.ideco`)}${field('小規模企業共済（年額）', `${prefix}.smallBusinessMutualAid`)}` : `${field('年間売上', `${prefix}.sales`)}${field('年間経費', `${prefix}.expenses`)}${field('年齢', `${prefix}.age`)}${select('青色申告特別控除', `${prefix}.blueReturnDeduction`, ['0', '550000', '650000'])}${field('その他所得', `${prefix}.otherIncome`)}${field('その他控除', `${prefix}.otherIncomeDeductions`)}${field('iDeCo（年額）', `${prefix}.ideco`)}${field('小規模企業共済（年額）', `${prefix}.smallBusinessMutualAid`)}`;
  const salaryFields = salary ? `<div class="months">${Array.from({ length: 12 }, (_, i) => field(`${i + 1}月の役員報酬`, `${prefix}.salary.${i + 1}`)).join('')}</div>` : `${field('個人事業税率（bps）', `${prefix}.businessTaxRateBps`)}${field('国民年金対象月数', `${prefix}.nationalPensionMonths`)}${field('事業月数', `${prefix}.businessMonths`)}${field('前年総所得', `${prefix}.previousTotalIncome`)}`;
  const resident = `<div class="grid">${field('住民税基準・総所得', `${prefix}.resident.totalIncome`)}${field('住民税基準・基本控除以外', `${prefix}.resident.deductionsExcludingBasic`)}${field('人的控除差調整額', `${prefix}.resident.personalDeductionDifferenceTotal`)}${select('住民税非課税区分', `${prefix}.resident.exemptionStatus`, ['FULL', 'INCOME_ONLY', 'NONE'])}</div>`;
  return `<fieldset><legend>${title}</legend><div class="grid">${basics}${salaryFields}${salary ? '' : consumptionFields('消費税ステータス', `${prefix}.consumptionTax`)}</div><small>住民税の計算基準もエンジンの必須入力です。</small>${resident}</fieldset>`;
}
function wireConsumption(root: Element) {
  root.querySelectorAll<HTMLElement>('[data-consumption]').forEach(container => {
    const name = container.dataset.consumption!;
    const selector = container.querySelector<HTMLSelectElement>(`select[name="${name}"]`)!;
    const update = () => {
      const status = selector.value;
      container.querySelectorAll<HTMLElement>('[data-statuses]').forEach(group => {
        const active = group.dataset.statuses!.split(' ').includes(status);
        group.hidden = !active;
        group.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select').forEach(control => { control.disabled = !active; });
      });
    };
    selector.addEventListener('change', update);
    update();
  });
}
function render() {
  const root = document.querySelector('#app')!;
  root.innerHTML = `<h1>法人化シミュレーター</h1><p>2026年・名古屋市/愛知県のPhase 1計算エンジンを使います。必須項目をすべて入力してください。</p><form id="form">${select('国民健康保険料の支払者', 'householdNhiPayer', ['HUSBAND', 'WIFE'])}<h2>CASE-A 個人事業</h2>${personFields('husbandA', '夫')}${personFields('wifeA', '妻')}<h2>CASE-B 法人化</h2>${select('社会保険加入開始月（夫婦共通）', 'caseB.socialInsuranceStartMonth', Array.from({ length: 12 }, (_, i) => String(i + 1)))}${personFields('husbandB', '夫の役員入力', true)}${personFields('wifeB', '妻の役員入力', true)}<fieldset><legend>法人入力</legend><div class="grid">${field('法人資本金', 'corporation.capital')}${field('設立日', 'corporation.establishmentDate', 'date')}${field('事業年度開始日', 'corporation.fiscalYearStart', 'date')}${field('事業年度終了日', 'corporation.fiscalYearEnd', 'date')}${field('売上', 'corporation.sales')}${field('営業経費', 'corporation.operatingExpenses')}${field('追加法人経費', 'corporation.additionalExpenses')}${field('税理士費用', 'corporation.accountantCost')}${field('維持費', 'corporation.maintenanceCost')}${field('その他固定費', 'corporation.otherFixedCost')}${field('事業月数', 'corporation.businessMonths')}${field('法人所在月数', 'corporation.presenceMonths')}${select('インボイス登録', 'corporation.invoiceRegistered', ['true', 'false'])}${select('課税事業者選択', 'corporation.taxableBusinessElection', ['true', 'false'])}${select('特定新設法人', 'corporation.specificNewCorporationFlag', ['true', 'false'])}${consumptionFields('法人消費税ステータス', 'corporation.consumptionTax', true)}</div></fieldset><button type="submit">計算する</button><button type="button" id="optimize-button">役員報酬を最適化</button></form><section id="results" class="results" aria-live="polite"></section>`;
  wireConsumption(root);
  root.querySelector<HTMLFormElement>('#form')!.addEventListener('submit', event => {
    event.preventDefault();
    const values: Values = Object.fromEntries(new FormData(event.currentTarget as HTMLFormElement).entries()) as Values;
    const outcome = calculateFromForm(values);
    const results = root.querySelector<HTMLElement>('#results')!;
    if (outcome.error) { results.innerHTML = `<p class="error" role="alert">${outcome.error}</p>`; return; }
    const result = outcome.result!;
    const difference = result.comparison.wealthDifference;
    results.innerHTML = `<h2>計算結果</h2><div class="result-grid"><div class="result-card"><h3>CASE-A</h3><p>世帯可処分所得</p><div class="amount">${yen(result.comparison.householdDisposableIncomeA)}</div></div><div class="result-card"><h3>CASE-B</h3><p>世帯可処分所得</p><div class="amount">${yen(result.comparison.householdDisposableIncomeB)}</div><p>法人留保</p><div class="amount">${yen(result.comparison.corporateAfterTaxProfit)}</div><p>世帯 + 法人の総資産増加</p><div class="amount">${yen(result.comparison.totalWealthIncreaseB)}</div></div><div class="result-card"><h3>比較</h3><p>CASE-B − CASE-A</p><div class="amount ${difference >= 0 ? 'advantage' : 'disadvantage'}">${yen(difference)}</div><p class="${difference >= 0 ? 'advantage' : 'disadvantage'}">${difference >= 0 ? '法人化が有利' : '法人化が不利'}</p></div></div>`;
  });
  root.querySelector<HTMLButtonElement>('#optimize-button')!.addEventListener('click', () => {
    const form = root.querySelector<HTMLFormElement>('#form')!;
    const values: Values = Object.fromEntries(new FormData(form).entries()) as Values;
    const outcome = optimizeFromForm(values);
    const results = root.querySelector<HTMLElement>('#results')!;
    if (outcome.error) { results.innerHTML = `<p class="error" role="alert">${outcome.error}</p>`; return; }
    const optimization = outcome.result!;
    const best = optimization.best;
    results.innerHTML = `<h2>役員報酬最適化結果</h2><div class="result-grid"><div class="result-card"><h3>推奨報酬</h3><p>夫 月額役員報酬</p><div class="amount">${yen(best.husbandMonthlySalary)}</div><p>妻 月額役員報酬</p><div class="amount">${yen(best.wifeMonthlySalary)}</div><p>ステータス</p><div>${best.status}${best.reason ? `（${best.reason}）` : ''}</div></div><div class="result-card"><h3>推奨結果</h3><p>世帯可処分所得</p><div class="amount">${yen(best.householdDisposableIncomeB)}</div><p>法人留保</p><div class="amount">${yen(best.corporateAfterTaxProfit)}</div><p>世帯＋法人総資産増加</p><div class="amount">${yen(best.totalWealthIncreaseB)}</div><p>CASE-Aとの差額</p><div class="amount">${yen(best.wealthDifference)}</div></div></div><h3>上位5候補（評価 ${optimization.evaluatedCount}件）</h3><ol>${optimization.topCandidates.map(optimizationCandidate).join('')}</ol>`;
  });
}
if (typeof document !== 'undefined') render();
