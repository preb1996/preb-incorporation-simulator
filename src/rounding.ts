import { CalculationError, integer, type Fraction } from './core.ts';

function truncateToUnit(value:number,unit:number,label:string):number {
  integer(value,label,true);integer(unit,'unit');
  if(value<0)throw new CalculationError('INVALID_INPUT',label);
  return Math.trunc(value/unit)*unit;
}

function truncateFractionToUnit(value:Fraction,unit:number,label:string):number {
  integer(unit,'unit');
  if(value.numerator<0n)throw new CalculationError('INVALID_INPUT',label);
  const whole=value.numerator/value.denominator;
  const result=(whole/BigInt(unit))*BigInt(unit);
  if(result>BigInt(Number.MAX_SAFE_INTEGER))throw new CalculationError('INVALID_INPUT',`${label} overflow`);
  return Number(result);
}

/** 所得税の課税標準: 1,000円未満切捨て。 */
export const truncateIncomeTaxTaxableBase=(yen:number)=>truncateToUnit(yen,1000,'incomeTaxTaxableBase');
/** 復興特別所得税: 1円未満切捨て。入力は1/100円単位。 */
export function truncateReconstructionTaxHundredths(hundredthsYen:number):number {
  integer(hundredthsYen,'reconstructionTaxHundredths',true);
  if(hundredthsYen<0)throw new CalculationError('INVALID_INPUT','reconstructionTaxHundredths');
  return Math.trunc(hundredthsYen/100);
}
/** 申告納税額: 100円未満切捨て。 */
export const truncateIncomeTaxReturnAmount=(yen:number)=>truncateToUnit(yen,100,'incomeTaxReturnAmount');
/** 個人住民税: 市民税・県民税を各々100円未満切捨て。 */
export const truncateResidentTaxComponent=(yen:number)=>truncateToUnit(yen,100,'residentTaxComponent');

/** 個人事業税: 課税標準は1,000円未満切捨て、確定税額は100円未満切捨て。 */
export const truncateIndividualBusinessTaxableBase=(value:Fraction)=>truncateFractionToUnit(value,1000,'individualBusinessTaxableBase');
export const truncateIndividualBusinessTaxAmount=(value:Fraction)=>truncateFractionToUnit(value,100,'individualBusinessTaxAmount');

/** 法人税: 課税所得は1,000円未満切捨て、確定税額は100円未満切捨て。 */
export const truncateCorporationTaxableIncome=(yen:number)=>truncateToUnit(yen,1000,'corporationTaxableIncome');
export const truncateCorporationTaxCalculatedAmount=(value:Fraction)=>truncateFractionToUnit(value,1,'corporationTaxCalculatedAmount');
export const truncateCorporationTaxAmount=(value:Fraction)=>truncateFractionToUnit(value,100,'corporationTaxAmount');

/** 法人県民税: 法人税割課税標準1,000円、法人税割・均等割は各100円単位。 */
export const truncatePrefecturalCorporateTaxBase=(yen:number)=>truncateToUnit(yen,1000,'prefecturalCorporateTaxBase');
export const truncatePrefecturalCorporateIncomeTax=(value:Fraction)=>truncateFractionToUnit(value,100,'prefecturalCorporateIncomeTax');
export const truncatePrefecturalCorporatePerCapitaTax=(value:Fraction)=>truncateFractionToUnit(value,100,'prefecturalCorporatePerCapitaTax');

/** 法人市民税: 法人税割課税標準1,000円、法人税割・均等割は各100円単位。 */
export const truncateMunicipalCorporateTaxBase=(yen:number)=>truncateToUnit(yen,1000,'municipalCorporateTaxBase');
export const truncateMunicipalCorporateIncomeTax=(value:Fraction)=>truncateFractionToUnit(value,100,'municipalCorporateIncomeTax');
export const truncateMunicipalCorporatePerCapitaTax=(value:Fraction)=>truncateFractionToUnit(value,100,'municipalCorporatePerCapitaTax');

/** 法人事業税: 所得割課税標準1,000円、差引事業税額100円単位。 */
export const truncateCorporateEnterpriseTaxableIncome=(yen:number)=>truncateToUnit(yen,1000,'corporateEnterpriseTaxableIncome');
export const truncateCorporateEnterpriseTaxAmount=(value:Fraction)=>truncateFractionToUnit(value,100,'corporateEnterpriseTaxAmount');
/** 特別法人事業税: 確定済み基準法人所得割額を課税標準とし、税額を100円単位にする。 */
export const truncateSpecialCorporateEnterpriseTaxAmount=(value:Fraction)=>truncateFractionToUnit(value,100,'specialCorporateEnterpriseTaxAmount');

/** 消費税: 課税標準額は1,000円未満、控除後の差引納付税額は100円未満を切捨てる。 */
export const truncateConsumptionTaxableBase=(yen:number)=>truncateToUnit(yen,1000,'consumptionTaxableBase');
export const truncateConsumptionTaxIntermediate=(value:Fraction)=>truncateFractionToUnit(value,1,'consumptionTaxIntermediate');
export const truncateConsumptionTaxPayable=(value:Fraction)=>truncateFractionToUnit(value,100,'consumptionTaxPayable');

export const TAX_ROUNDING_SOURCES=Object.freeze({
 nationalTax:Object.freeze({authority:'e-Gov法令検索',title:'国税通則法 第118条・第119条',url:'https://laws.e-gov.go.jp/law/337AC0000000066',rules:'課税標準1,000円未満切捨て、国税確定金額100円未満切捨て'}),
 corporationShortYear:Object.freeze({authority:'e-Gov法令検索',title:'法人税法 第66条第4項・第12項',url:'https://laws.e-gov.go.jp/law/340AC0000000034',rules:'800万円÷12×月数。月数の1月未満端数は1月'}),
 localTax:Object.freeze({authority:'e-Gov法令検索',title:'地方税法 第20条の4の2',url:'https://laws.e-gov.go.jp/law/325AC0000000226',rules:'地方税課税標準1,000円未満切捨て、確定金額100円未満切捨て'}),
 aichiCorporate:Object.freeze({authority:'愛知県',title:'第6号様式記載の手引（令和7年4月1日以後開始事業年度用）',url:'https://www.pref.aichi.jp/uploaded/attachment/628210.pdf',rules:'000欄は1,000円、00欄は100円未満切捨て。差引事業税額は100円未満切捨て。標準税率法人の確定所得割額を特別法人事業税課税標準へ転記'}),
 aichiPerCapita:Object.freeze({authority:'愛知県',title:'県税Q&A（法人県民税・法人事業税）',url:'https://www.pref.aichi.jp/soshiki/zeimu/0000034242.html',rules:'均等割の月数按分後100円未満切捨て'}),
 consumption:Object.freeze({authority:'国税庁',title:'消費税及び地方消費税申告書（一般用）の書き方',url:'https://www.nta.go.jp/publication/pamph/shohi/kaisei/yoshiki/pdf/202411_01.pdf',rules:'差引税額と譲渡割額を各100円未満切捨て'}),
 individualBusiness:Object.freeze({authority:'地方税法・愛知県',title:'地方税法 第20条の4の2／個人事業税',url:'https://www.pref.aichi.jp/soshiki/zeimu/0000042391.html',rules:'事業税課税標準1,000円未満、確定税額100円未満切捨て'})
});

export function assertNonnegativeTax(value:number,label:string):number {
  integer(value,label,true);
  if(value<0)throw new CalculationError('INVALID_INPUT',label);
  return value;
}
