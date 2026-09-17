import { CalculationError, calculateComparison, optimize } from "./index.js";
export const STORAGE_KEY = 'preb-incorporation-simulator:phase2c';
const required = (values, name) => {
    const value = values[name]?.trim();
    if (!value)
        throw new Error(`${name} は必須です`);
    return value;
};
const numberValue = (values, name, signed = false) => {
    const value = Number(required(values, name));
    if (!Number.isSafeInteger(value) || (!signed && value < 0))
        throw new Error(`${name} は0以上の整数で入力してください`);
    return value;
};
const booleanValue = (values, name) => {
    const value = required(values, name);
    if (value !== 'true' && value !== 'false')
        throw new Error(`${name} を選択してください`);
    return value === 'true';
};
const consumption = (values, name, allowed) => {
    const status = required(values, name);
    if (allowed && !allowed.includes(status))
        throw new Error(`${name} の消費税ステータスが不正です`);
    if (status === 'EXEMPT')
        return { status: 'EXEMPT' };
    if (status === 'GENERAL')
        return { status: 'GENERAL', output: numberValue(values, `${name}.output`), deductibleInput: numberValue(values, `${name}.deductibleInput`) };
    if (status === 'SIMPLIFIED')
        return { status: 'SIMPLIFIED', output: numberValue(values, `${name}.output`), deemedPurchaseBps: numberValue(values, `${name}.deemedPurchaseBps`) };
    if (status === 'SPECIAL_20_PERCENT')
        return { status: 'SPECIAL_20_PERCENT', output: numberValue(values, `${name}.output`), eligible: booleanValue(values, `${name}.eligible`) };
    if (status === 'MANUAL')
        return { status: 'MANUAL', amount: numberValue(values, `${name}.amount`, true) };
    throw new Error(`${name} の消費税ステータスが不正です`);
};
const monthly = (values, prefix) => Array.from({ length: 12 }, (_, i) => numberValue(values, `${prefix}.${i + 1}`));
const socialInsuranceMonths = (values) => {
    const startMonth = numberValue(values, 'caseB.socialInsuranceStartMonth');
    if (startMonth < 1 || startMonth > 12)
        throw new Error('caseB.socialInsuranceStartMonth は1〜12で入力してください');
    return Array.from({ length: 13 - startMonth }, (_, i) => startMonth + i);
};
const personA = (values, person) => ({
    sales: numberValue(values, `${person}.sales`), expenses: numberValue(values, `${person}.expenses`),
    blueReturnDeduction: numberValue(values, `${person}.blueReturnDeduction`),
    age: numberValue(values, `${person}.age`), businessTaxRateBps: numberValue(values, `${person}.businessTaxRateBps`),
    otherIncome: numberValue(values, `${person}.otherIncome`, true), otherIncomeDeductions: numberValue(values, `${person}.otherIncomeDeductions`),
    ideco: numberValue(values, `${person}.ideco`), smallBusinessMutualAid: numberValue(values, `${person}.smallBusinessMutualAid`),
    consumptionTax: consumption(values, `${person}.consumptionTax`), nationalPensionMonths: numberValue(values, `${person}.nationalPensionMonths`),
    businessMonths: numberValue(values, `${person}.businessMonths`), previousTotalIncome: numberValue(values, `${person}.previousTotalIncome`),
    residentReference: {
        totalIncome: numberValue(values, `${person}.resident.totalIncome`),
        deductionsExcludingBasic: numberValue(values, `${person}.resident.deductionsExcludingBasic`),
        personalDeductionDifferenceTotal: numberValue(values, `${person}.resident.personalDeductionDifferenceTotal`),
        exemptionStatus: required(values, `${person}.resident.exemptionStatus`),
    },
});
const personB = (values, person) => ({
    age: numberValue(values, `${person}.age`), monthlyExecutiveSalary: monthly(values, `${person}.salary`),
    otherIncome: numberValue(values, `${person}.otherIncome`, true), otherIncomeDeductions: numberValue(values, `${person}.otherIncomeDeductions`),
    ideco: numberValue(values, `${person}.ideco`), smallBusinessMutualAid: numberValue(values, `${person}.smallBusinessMutualAid`),
    residentReference: {
        totalIncome: numberValue(values, `${person}.resident.totalIncome`),
        deductionsExcludingBasic: numberValue(values, `${person}.resident.deductionsExcludingBasic`),
        personalDeductionDifferenceTotal: numberValue(values, `${person}.resident.personalDeductionDifferenceTotal`),
        exemptionStatus: required(values, `${person}.resident.exemptionStatus`),
    },
});
export function parseFormValues(values) {
    return {
        assessmentYear: 2026, householdNhiPayer: required(values, 'householdNhiPayer'),
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
export function calculateFromForm(values) {
    try {
        return { result: calculateComparison(parseFormValues(values)), error: null };
    }
    catch (error) {
        return { result: null, error: error instanceof CalculationError || error instanceof Error ? error.message : '入力を確認してください' };
    }
}
export function optimizeFromForm(values) {
    try {
        return { result: optimize(parseFormValues(values)), error: null };
    }
    catch (error) {
        return { result: null, error: error instanceof CalculationError || error instanceof Error ? error.message : '入力を確認してください' };
    }
}
export function saveFormValues(values, storage = globalThis.localStorage) {
    try {
        storage.setItem(STORAGE_KEY, JSON.stringify(values));
        return true;
    }
    catch {
        return false;
    }
}
export function loadFormValues(storage = globalThis.localStorage) {
    try {
        const raw = storage.getItem(STORAGE_KEY);
        if (!raw)
            return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
            return null;
        return parsed;
    }
    catch {
        return null;
    }
}
export function clearSavedFormValues(storage = globalThis.localStorage) {
    try {
        storage.removeItem(STORAGE_KEY);
        return true;
    }
    catch {
        return false;
    }
}
export function applyMonthlySalary(values, prefix, salary) {
    return Object.fromEntries([...Object.entries(values), ...Array.from({ length: 12 }, (_, i) => [`${prefix}.salary.${i + 1}`, salary])]);
}
const yen = (value) => `${new Intl.NumberFormat('ja-JP').format(value)}円`;
const statusLabel = (status) => status === 'VALID' ? '問題なし' : '注意';
const reasonLabel = (reason) => reason === 'NEGATIVE_CORPORATE_RETENTION' ? '法人税引後留保がマイナスです。' : '';
const exemptionLabels = { FULL: '全額非課税', INCOME_ONLY: '所得割のみ非課税', NONE: '該当なし' };
const consumptionLabels = { EXEMPT: '免税', GENERAL: '一般課税', SIMPLIFIED: '簡易課税', SPECIAL_20_PERCENT: '2割特例', MANUAL: '手入力' };
const options = (items) => items.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
const field = (label, name, type = 'number', requiredField = true, unit = '') => `<label>${label}${unit ? `<span class="unit">${unit}</span>` : ''}<input name="${name}" type="${type}"${requiredField ? ' required' : ''}></label>`;
const select = (label, name, items) => `<label>${label}<select name="${name}" required><option value="">選択してください</option>${options(items)}</select></label>`;
const monthOptions = Array.from({ length: 12 }, (_, i) => [String(i + 1), `${i + 1}月`]);
const consumptionFields = (label, name, corporate = false) => {
    const statuses = corporate
        ? [['EXEMPT', consumptionLabels.EXEMPT], ['GENERAL', consumptionLabels.GENERAL], ['SIMPLIFIED', consumptionLabels.SIMPLIFIED]]
        : Object.entries(consumptionLabels);
    return `<div class="consumption" data-consumption="${name}">${select(label, name, statuses)}
    <div data-statuses="GENERAL SIMPLIFIED SPECIAL_20_PERCENT" hidden>${field('売上に係る消費税額', `${name}.output`, 'number', false, '円')}</div>
    <div data-statuses="GENERAL" hidden>${field('控除対象仕入税額', `${name}.deductibleInput`, 'number', false, '円')}</div>
    <div data-statuses="SIMPLIFIED" hidden>${field('みなし仕入率', `${name}.deemedPurchaseBps`, 'number', false, 'bps')}</div>
    ${corporate ? '' : `<div data-statuses="SPECIAL_20_PERCENT" hidden>${select('2割特例の適用可否', `${name}.eligible`, [['true', '適用する'], ['false', '適用しない']])}</div><div data-statuses="MANUAL" hidden>${field('消費税年額', `${name}.amount`, 'number', false, '円')}</div>`}
  </div>`;
};
function personFields(prefix, title, salary = false) {
    const basics = salary
        ? `${field('年齢', `${prefix}.age`, 'number', true, '歳')}${field('その他所得', `${prefix}.otherIncome`, 'number', true, '円')}${field('その他控除', `${prefix}.otherIncomeDeductions`, 'number', true, '円')}${field('iDeCo（年額）', `${prefix}.ideco`, 'number', true, '円')}${field('小規模企業共済（年額）', `${prefix}.smallBusinessMutualAid`, 'number', true, '円')}`
        : `${field('年間売上', `${prefix}.sales`, 'number', true, '円')}${field('年間経費', `${prefix}.expenses`, 'number', true, '円')}${field('年齢', `${prefix}.age`, 'number', true, '歳')}${select('青色申告特別控除', `${prefix}.blueReturnDeduction`, [['0', 'なし'], ['550000', '55万円'], ['650000', '65万円']])}${field('その他所得', `${prefix}.otherIncome`, 'number', true, '円')}${field('その他控除', `${prefix}.otherIncomeDeductions`, 'number', true, '円')}${field('iDeCo（年額）', `${prefix}.ideco`, 'number', true, '円')}${field('小規模企業共済（年額）', `${prefix}.smallBusinessMutualAid`, 'number', true, '円')}`;
    const salaryFields = salary
        ? `<div class="salary-helper"><label>全月同額（月額）<span class="unit">円</span><input type="number" min="0" data-salary-template="${prefix}"></label><button type="button" class="secondary" data-apply-salary="${prefix}">12か月へ反映</button></div><div class="months">${Array.from({ length: 12 }, (_, i) => field(`${i + 1}月`, `${prefix}.salary.${i + 1}`, 'number', true, '円')).join('')}</div>`
        : `${field('個人事業税率', `${prefix}.businessTaxRateBps`, 'number', true, 'bps')}${field('国民年金対象月数', `${prefix}.nationalPensionMonths`, 'number', true, '月')}${field('事業月数', `${prefix}.businessMonths`, 'number', true, '月')}${field('前年総所得', `${prefix}.previousTotalIncome`, 'number', true, '円')}`;
    const resident = `<div class="grid resident">${field('住民税基準・総所得', `${prefix}.resident.totalIncome`, 'number', true, '円')}${field('住民税基準・基本控除以外', `${prefix}.resident.deductionsExcludingBasic`, 'number', true, '円')}${field('人的控除差調整額', `${prefix}.resident.personalDeductionDifferenceTotal`, 'number', true, '円')}${select('住民税非課税区分', `${prefix}.resident.exemptionStatus`, Object.entries(exemptionLabels))} </div>`;
    return `<fieldset><legend>${title}</legend><div class="grid">${basics}${salaryFields}${salary ? '' : consumptionFields('消費税区分', `${prefix}.consumptionTax`)}</div><small>住民税の計算基準も必須入力です。</small>${resident}</fieldset>`;
}
function wireConsumption(root) {
    root.querySelectorAll('[data-consumption]').forEach(container => {
        const name = container.dataset.consumption;
        const selector = container.querySelector(`select[name="${name}"]`);
        const update = () => container.querySelectorAll('[data-statuses]').forEach(group => {
            const active = group.dataset.statuses.split(' ').includes(selector.value);
            group.hidden = !active;
            group.querySelectorAll('input, select').forEach(control => { control.disabled = !active; });
        });
        selector.addEventListener('change', update);
        update();
    });
}
function valuesFromForm(form) { return Object.fromEntries(new FormData(form).entries()); }
function setFormValues(form, values) {
    Object.entries(values).forEach(([name, value]) => {
        const control = form.elements.namedItem(name);
        if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement)
            control.value = value ?? '';
    });
    form.querySelectorAll('[data-consumption]').forEach(container => container.querySelector('select')?.dispatchEvent(new Event('change')));
}
function metric(label, value, className = '') { return `<div class="metric"><span>${label}</span><strong class="${className}">${yen(value)}</strong></div>`; }
function taxTotal(result) {
    const c = result.corporation;
    return c.corporationTax.tax + c.corporateLocalTax.total + c.corporateEnterpriseTax.baseCorporateEnterpriseTax + c.corporateEnterpriseTax.specialCorporateEnterpriseTax + c.consumptionTax.payable - c.consumptionTax.refund;
}
function renderComparison(result) {
    const difference = result.comparison.wealthDifference;
    return `<h2>計算結果</h2><div class="result-grid">
    <article class="result-card"><h3>CASE-A 個人事業</h3>${metric('世帯可処分所得', result.comparison.householdDisposableIncomeA)}</article>
    <article class="result-card"><h3>CASE-B 法人化</h3>${metric('世帯可処分所得', result.comparison.householdDisposableIncomeB)}${metric('夫 本人負担社会保険', result.caseB.socialInsurance.personTotal[0])}${metric('妻 本人負担社会保険', result.caseB.socialInsurance.personTotal[1])}${metric('会社負担社会保険', result.caseB.socialInsurance.employerTotal)}</article>
    <article class="result-card"><h3>法人の損益</h3>${metric('税引前法人利益', result.corporation.corporateIncomeBeforeTax)}${metric('法人税等合計', taxTotal(result))}${metric('法人税引後留保', result.comparison.corporateAfterTaxProfit)}<small>法人に残る資産であり、個人の所得ではありません。</small></article>
    <article class="result-card"><h3>純資産比較</h3>${metric('世帯＋法人純資産増加', result.comparison.totalWealthIncreaseB)}${metric('CASE-Aとの差', difference, difference >= 0 ? 'advantage' : 'disadvantage')}</article>
  </div>`;
}
const optimizationCandidate = (candidate, index) => `<li><span class="rank">${index + 1}</span>夫 ${yen(candidate.husbandMonthlySalary)} / 妻 ${yen(candidate.wifeMonthlySalary)}<br><small>世帯可処分所得 ${yen(candidate.householdDisposableIncomeB)}・法人税引後留保 ${yen(candidate.corporateAfterTaxProfit)}・純資産増加 ${yen(candidate.totalWealthIncreaseB)}・CASE-Aとの差 ${yen(candidate.wealthDifference)}・${statusLabel(candidate.status)}${candidate.reason ? `：${reasonLabel(candidate.reason)}` : ''}</small></li>`;
function renderOptimization(optimization) {
    const best = optimization.best;
    return `<h2>Optimizer結果</h2><div class="result-grid"><article class="result-card"><h3>推奨役員報酬</h3>${metric('推奨 夫 月額役員報酬', best.husbandMonthlySalary)}${metric('推奨 妻 月額役員報酬', best.wifeMonthlySalary)}<p class="status ${best.status.toLowerCase()}">${best.status === 'VALID' ? 'VALID（問題なし）' : 'WARNING（注意）'}</p><small>${reasonLabel(best.reason) || '法人税引後留保が0円以上の候補です。'}</small></article><article class="result-card"><h3>推奨ケースの指標</h3>${metric('CASE-B 世帯可処分所得', best.householdDisposableIncomeB)}${metric('法人税引後留保', best.corporateAfterTaxProfit)}${metric('世帯＋法人純資産増加', best.totalWealthIncreaseB)}${metric('CASE-Aとの差', best.wealthDifference, best.wealthDifference >= 0 ? 'advantage' : 'disadvantage')}</article></div><h3>Top 5（評価 ${optimization.evaluatedCount}件）</h3><ol class="top-five">${optimization.topCandidates.map(optimizationCandidate).join('')}</ol>`;
}
function render() {
    const root = document.querySelector('#app');
    root.innerHTML = `<h1>法人化シミュレーター</h1><p class="intro">2026年・名古屋市/愛知県、1月法人化前提。入力はこの端末にのみ保存されます。</p>
  <form id="form">
    <section class="form-section"><h2>基本設定</h2><div class="grid">${select('国民健康保険料の支払者', 'householdNhiPayer', [['HUSBAND', '夫'], ['WIFE', '妻']])}</div></section>
    <section class="form-section"><h2>CASE-A 個人事業</h2>${personFields('husbandA', '夫')}${personFields('wifeA', '妻')}</section>
    <section class="form-section"><h2>CASE-B 法人化</h2><div class="grid">${select('社会保険加入開始月（夫婦共通）', 'caseB.socialInsuranceStartMonth', monthOptions)}</div>${personFields('husbandB', '夫の役員報酬')}${personFields('wifeB', '妻の役員報酬')}</section>
    <section class="form-section"><h2>法人</h2><fieldset><legend>法人入力</legend><div class="grid">${field('法人資本金', 'corporation.capital', 'number', true, '円')}${field('設立日', 'corporation.establishmentDate', 'date')}${field('事業年度開始日', 'corporation.fiscalYearStart', 'date')}${field('事業年度終了日', 'corporation.fiscalYearEnd', 'date')}${field('売上', 'corporation.sales', 'number', true, '円')}${field('営業経費', 'corporation.operatingExpenses', 'number', true, '円')}${field('追加法人経費', 'corporation.additionalExpenses', 'number', true, '円')}${field('税理士費用', 'corporation.accountantCost', 'number', true, '円')}${field('維持費', 'corporation.maintenanceCost', 'number', true, '円')}${field('その他固定費', 'corporation.otherFixedCost', 'number', true, '円')}${field('事業月数', 'corporation.businessMonths', 'number', true, '月')}${field('法人所在月数', 'corporation.presenceMonths', 'number', true, '月')}${select('インボイス登録', 'corporation.invoiceRegistered', [['true', '登録する'], ['false', '登録しない']])}${select('課税事業者選択', 'corporation.taxableBusinessElection', [['true', '選択する'], ['false', '選択しない']])}${select('特定新設法人', 'corporation.specificNewCorporationFlag', [['true', '該当する'], ['false', '該当しない']])}</div></fieldset></section>
    <section class="form-section"><h2>消費税</h2>${consumptionFields('法人消費税区分', 'corporation.consumptionTax', true)}<small>選択した区分に関係しない入力欄は無効になります。</small></section>
    <section class="form-section actions"><h2>計算・最適化</h2><button type="submit">通常計算</button><button type="button" id="optimize-button">役員報酬を最適化</button><button type="button" class="secondary" id="save-button">入力を保存</button><button type="button" class="secondary" id="restore-button">保存から復元</button><button type="button" class="danger" id="reset-button">入力を初期化</button><p id="save-status" class="save-status" aria-live="polite"></p></section>
  </form><section id="results" class="results" aria-live="polite"><h2>結果</h2><p>入力後、「通常計算」または「役員報酬を最適化」を押してください。</p></section>`;
    wireConsumption(root);
    const form = root.querySelector('#form');
    root.querySelectorAll('[data-apply-salary]').forEach(button => button.addEventListener('click', () => {
        const prefix = button.dataset.applySalary;
        const source = root.querySelector(`[data-salary-template="${prefix}"]`);
        if (!source.value) {
            source.focus();
            return;
        }
        const updated = applyMonthlySalary(valuesFromForm(form), prefix, source.value);
        form.querySelectorAll(`input[name^="${prefix}.salary."]`).forEach(input => { input.value = updated[input.name] ?? ''; });
    }));
    const status = root.querySelector('#save-status');
    root.querySelector('#save-button').addEventListener('click', () => { status.textContent = saveFormValues(valuesFromForm(form)) ? '入力を保存しました。' : '保存できませんでしたが、計算は利用できます。'; });
    root.querySelector('#restore-button').addEventListener('click', () => { const values = loadFormValues(); if (values) {
        setFormValues(form, values);
        status.textContent = '保存した入力を復元しました。';
    }
    else
        status.textContent = '保存された入力がありません。'; });
    root.querySelector('#reset-button').addEventListener('click', () => { form.reset(); clearSavedFormValues(); root.querySelectorAll('[data-consumption]').forEach(container => container.querySelector('select')?.dispatchEvent(new Event('change'))); status.textContent = '入力と保存データを初期化しました。'; });
    form.addEventListener('submit', event => { event.preventDefault(); const outcome = calculateFromForm(valuesFromForm(form)); root.querySelector('#results').innerHTML = outcome.error ? `<p class="error" role="alert">${outcome.error}</p>` : renderComparison(outcome.result); });
    root.querySelector('#optimize-button').addEventListener('click', () => { const outcome = optimizeFromForm(valuesFromForm(form)); root.querySelector('#results').innerHTML = outcome.error ? `<p class="error" role="alert">${outcome.error}</p>` : renderOptimization(outcome.result); });
}
if (typeof document !== 'undefined')
    render();
