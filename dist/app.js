// src/core.ts
var CalculationError = class extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.name = "CalculationError";
    this.code = code;
  }
};
function block(message) {
  throw new CalculationError("SPEC_BLOCKER", message);
}
function integer(value, name, signed = false) {
  if (!Number.isSafeInteger(value) || !signed && value < 0) throw new CalculationError("INVALID_INPUT", name);
  return value;
}
function months(value) {
  integer(value, "months");
  if (value < 1 || value > 12) throw new CalculationError("INVALID_INPUT", "months must be 1..12");
  return value;
}
function fraction(n, d = 1n) {
  if (d <= 0n) throw new CalculationError("INVALID_INPUT", "denominator");
  let a = n < 0n ? -n : n, b = d;
  while (b) {
    const next = a % b;
    a = b;
    b = next;
  }
  const g = a || 1n;
  return { numerator: n / g, denominator: d / g };
}
function yen(n) {
  integer(n, "yen", true);
  return fraction(BigInt(n));
}
function add(a, b) {
  return fraction(a.numerator * b.denominator + b.numerator * a.denominator, a.denominator * b.denominator);
}
function subtract(a, b) {
  return add(a, fraction(-b.numerator, b.denominator));
}
function scale(a, n, d = 1) {
  integer(n, "multiplier", true);
  integer(d, "divisor");
  return fraction(a.numerator * BigInt(n), a.denominator * BigInt(d));
}
function compare(a, b) {
  const n = a.numerator * b.denominator - b.numerator * a.denominator;
  return n < 0n ? -1 : n > 0n ? 1 : 0;
}
function min(a, b) {
  return compare(a, b) <= 0 ? a : b;
}
function max(a, b) {
  return compare(a, b) >= 0 ? a : b;
}
function sum(values) {
  return values.reduce(add, yen(0));
}
function rate(a, bps) {
  return scale(a, bps, 1e4);
}
function exactInteger(a) {
  if (a.denominator !== 1n) return block("\u7AEF\u6570\u51E6\u7406\u304C\u672A\u78BA\u5B9A\u306E\u91D1\u984D\u3092integer yen\u3078\u5909\u63DB\u3067\u304D\u307E\u305B\u3093");
  const result = Number(a.numerator);
  integer(result, "result", true);
  return result;
}

// masters/2026.json
var __default = {
  incomeTax: {
    metadata: {
      sourceAuthority: "\u30E6\u30FC\u30B6\u30FC\u627F\u8A8D\u6E08\u307FSSOT",
      sourceTitle: "\u6CD5\u4EBA\u5316\u30B7\u30DF\u30E5\u30EC\u30FC\u30BF\u30FC \u8A08\u7B97\u4ED5\u69D8\u66F8 v1.0 FINAL",
      sourceUrl: "../spec/v1.0_FINAL.md",
      effectiveFrom: "2026-01-01",
      effectiveTo: "2026-12-31",
      verifiedAt: "2026-09-14",
      verificationScope: "SSOT\u304B\u3089\u306E\u8EE2\u8A18\u78BA\u8A8D\u3002\u516C\u5F0F\u7A0E\u5236\u306E\u5305\u62EC\u691C\u8A3C\u3067\u306F\u306A\u3044\u3002"
    },
    values: {
      basic: [
        [
          132e4,
          104e4
        ],
        [
          336e4,
          62e4
        ],
        [
          489e4,
          68e4
        ],
        [
          655e4,
          67e4
        ],
        [
          235e5,
          62e4
        ],
        [
          24e6,
          48e4
        ],
        [
          245e5,
          32e4
        ],
        [
          25e6,
          16e4
        ]
      ],
      brackets: [
        [
          195e4,
          500,
          0
        ],
        [
          33e5,
          1e3,
          97500
        ],
        [
          695e4,
          2e3,
          427500
        ],
        [
          9e6,
          2300,
          636e3
        ],
        [
          18e6,
          3300,
          1536e3
        ],
        [
          4e7,
          4e3,
          2796e3
        ]
      ],
      top: [
        4500,
        4796e3
      ],
      reconstructionBps: 210,
      finalUnit: 100,
      taxableUnit: 1e3
    }
  },
  salary: {
    metadata: {
      sourceAuthority: "\u30E6\u30FC\u30B6\u30FC\u627F\u8A8D\u6E08\u307FSSOT",
      sourceTitle: "\u6CD5\u4EBA\u5316\u30B7\u30DF\u30E5\u30EC\u30FC\u30BF\u30FC \u8A08\u7B97\u4ED5\u69D8\u66F8 v1.0 FINAL",
      sourceUrl: "../spec/v1.0_FINAL.md",
      effectiveFrom: "2026-01-01",
      effectiveTo: "2026-12-31",
      verifiedAt: "2026-09-14",
      verificationScope: "SSOT\u304B\u3089\u306E\u8EE2\u8A18\u78BA\u8A8D\u3002\u516C\u5F0F\u7A0E\u5236\u306E\u5305\u62EC\u691C\u8A3C\u3067\u306F\u306A\u3044\u3002"
    },
    values: {
      brackets: [
        [
          22e5,
          0,
          74e4
        ],
        [
          36e5,
          3e3,
          8e4
        ],
        [
          66e5,
          2e3,
          44e4
        ],
        [
          85e5,
          1e3,
          11e5
        ]
      ],
      maximum: 195e4
    }
  },
  adjustment: {
    metadata: {
      sourceAuthority: "\u540D\u53E4\u5C4B\u5E02",
      sourceTitle: "\u8ABF\u6574\u63A7\u9664\uFF0F\u5E02\u6C11\u7A0E\u30FB\u770C\u6C11\u7A0E\u306E\u8A08\u7B97\u4F8B\uFF08\u4EE4\u548C8\u5E74\u5EA6\uFF09",
      sourceUrl: "https://www.city.nagoya.jp/kurashi/zeikin/1037356/1011880/1011883/1011893.html",
      effectiveFrom: "2026-01-01",
      effectiveTo: "2026-12-31",
      verifiedAt: "2026-09-15",
      verificationScope: "200\u4E07\u5186\u4EE5\u4E0B\u516C\u5F0F\u4F8B\u3068250\u4E07\u5186\u72EC\u7ACB\u8A08\u7B97\u3092\u7167\u5408\u3002v1.0\u5F0F\u306F\u5909\u66F4\u306A\u3057\u3002"
    },
    values: {
      threshold: 2e6,
      minimumBase: 5e4,
      basicDifference: 5e4,
      incomeLimit: 25e6,
      municipalBps: 400,
      prefecturalBps: 100
    }
  },
  residentTax: {
    metadata: {
      sourceAuthority: "\u540D\u53E4\u5C4B\u5E02",
      sourceTitle: "\u5E02\u6C11\u7A0E\u30FB\u770C\u6C11\u7A0E\u306E\u8A08\u7B97\u4F8B\uFF08\u4EE4\u548C8\u5E74\u5EA6\uFF09",
      sourceUrl: "https://www.city.nagoya.jp/kurashi/zeikin/1037356/1011880/1011883/1011891.html",
      effectiveFrom: "2026-01-01",
      effectiveTo: "2026-12-31",
      verifiedAt: "2026-09-15",
      verificationScope: "\u7A0E\u7387\u3001\u5747\u7B49\u5272\u3001\u68EE\u6797\u74B0\u5883\u7A0E\u3001\u8AB2\u7A0E\u6240\u5F971,000\u5186\u51E6\u7406\u3001\u5E02\u6C11\u7A0E\u30FB\u770C\u6C11\u7A0E\u5404100\u5186\u51E6\u7406\u3092\u7167\u5408\u3002"
    },
    values: {
      municipalBps: 770,
      prefecturalBps: 200,
      municipalFixed: 2800,
      prefecturalFixed: 1500,
      forest: 1e3
    }
  },
  nhi: {
    metadata: {
      sourceAuthority: "\u540D\u53E4\u5C4B\u5E02",
      sourceTitle: "\u4EE4\u548C8\u5E74\u5EA6\u5206\u306E\u56FD\u6C11\u5065\u5EB7\u4FDD\u967A\u6599\u30FB\u540D\u53E4\u5C4B\u5E02\u56FD\u6C11\u5065\u5EB7\u4FDD\u967A\u6599\u306E\u8A66\u7B97",
      sourceUrl: "https://758kenshin.city.nagoya.jp/",
      effectiveFrom: "2026-04-01",
      effectiveTo: "2027-03-31",
      verifiedAt: "2026-09-15",
      verificationScope: "4\u533A\u5206\u306E\u6599\u7387\u30FB\u5B9A\u984D\u30FB\u4E0A\u9650\u3068\u3001\u5404\u533A\u520610\u5186\u672A\u6E80\u5207\u6368\u3066\u3092\u7167\u5408\u3002"
    },
    values: {
      basic: [
        [
          24e6,
          43e4
        ],
        [
          245e5,
          29e4
        ],
        [
          25e6,
          15e4
        ]
      ],
      medical: {
        fixed: 50591,
        bps: 883,
        cap: 67e4
      },
      support: {
        fixed: 15784,
        bps: 258,
        cap: 26e4
      },
      care: {
        fixed: 16120,
        bps: 234,
        cap: 17e4
      },
      children: {
        fixed: 1771,
        bps: 26,
        adultExtra: 92,
        adultAge: 18,
        cap: 3e4
      },
      careMinAge: 40,
      careMaxAgeExclusive: 65
    }
  },
  nationalPension: {
    metadata: {
      sourceAuthority: "\u30E6\u30FC\u30B6\u30FC\u627F\u8A8D\u6E08\u307FSSOT",
      sourceTitle: "\u6CD5\u4EBA\u5316\u30B7\u30DF\u30E5\u30EC\u30FC\u30BF\u30FC \u8A08\u7B97\u4ED5\u69D8\u66F8 v1.0 FINAL",
      sourceUrl: "../spec/v1.0_FINAL.md",
      effectiveFrom: "2026-04-01",
      effectiveTo: "2027-03-31",
      verifiedAt: "2026-09-14",
      verificationScope: "SSOT\u304B\u3089\u306E\u8EE2\u8A18\u78BA\u8A8D\u3002\u516C\u5F0F\u7A0E\u5236\u306E\u5305\u62EC\u691C\u8A3C\u3067\u306F\u306A\u3044\u3002 \u5E74\u5EA6\u8868\u8A18\u306E\u7D22\u5F15\u3002\u6708\u5225\u9069\u7528\u306E\u4E0D\u8DB3\u306F\u7D71\u5408\u8A08\u7B97\u3067\u30D6\u30ED\u30C3\u30AF\u3002"
    },
    values: {
      monthly: 17920
    }
  },
  individualBusinessTax: {
    metadata: {
      sourceAuthority: "\u30E6\u30FC\u30B6\u30FC\u627F\u8A8D\u6E08\u307FSSOT",
      sourceTitle: "\u6CD5\u4EBA\u5316\u30B7\u30DF\u30E5\u30EC\u30FC\u30BF\u30FC \u8A08\u7B97\u4ED5\u69D8\u66F8 v1.0 FINAL",
      sourceUrl: "../spec/v1.0_FINAL.md",
      effectiveFrom: "2026-01-01",
      effectiveTo: "2026-12-31",
      verifiedAt: "2026-09-14",
      verificationScope: "SSOT\u304B\u3089\u306E\u8EE2\u8A18\u78BA\u8A8D\u3002\u516C\u5F0F\u7A0E\u5236\u306E\u5305\u62EC\u691C\u8A3C\u3067\u306F\u306A\u3044\u3002"
    },
    values: {
      deduction: 29e5,
      allowedBps: [
        0,
        300,
        400,
        500
      ]
    }
  },
  corporationTax: {
    metadata: {
      sourceAuthority: "\u30E6\u30FC\u30B6\u30FC\u627F\u8A8D\u6E08\u307FSSOT",
      sourceTitle: "\u6CD5\u4EBA\u5316\u30B7\u30DF\u30E5\u30EC\u30FC\u30BF\u30FC \u8A08\u7B97\u4ED5\u69D8\u66F8 v1.0 FINAL",
      sourceUrl: "../spec/v1.0_FINAL.md",
      effectiveFrom: "2026-01-01",
      effectiveTo: "2026-12-31",
      verifiedAt: "2026-09-14",
      verificationScope: "SSOT\u304B\u3089\u306E\u8EE2\u8A18\u78BA\u8A8D\u3002\u516C\u5F0F\u7A0E\u5236\u306E\u5305\u62EC\u691C\u8A3C\u3067\u306F\u306A\u3044\u3002"
    },
    values: {
      threshold: 8e6,
      lowerBps: 1500,
      upperBps: 2320
    }
  },
  corporateLocal: {
    metadata: {
      sourceAuthority: "\u30E6\u30FC\u30B6\u30FC\u627F\u8A8D\u6E08\u307FSSOT",
      sourceTitle: "\u6CD5\u4EBA\u5316\u30B7\u30DF\u30E5\u30EC\u30FC\u30BF\u30FC \u8A08\u7B97\u4ED5\u69D8\u66F8 v1.0 FINAL",
      sourceUrl: "../spec/v1.0_FINAL.md",
      effectiveFrom: "2026-01-01",
      effectiveTo: "2026-12-31",
      verifiedAt: "2026-09-14",
      verificationScope: "SSOT\u304B\u3089\u306E\u8EE2\u8A18\u78BA\u8A8D\u3002\u516C\u5F0F\u7A0E\u5236\u306E\u5305\u62EC\u691C\u8A3C\u3067\u306F\u306A\u3044\u3002"
    },
    values: {
      prefecturalBps: 100,
      municipalBps: 600,
      prefecturalFixed: 21e3,
      municipalFixed: 5e4,
      prefecturalTaxLimit: 15e6,
      municipalTaxLimit: 25e6,
      capitalLimit: 1e8
    }
  },
  enterprise: {
    metadata: {
      sourceAuthority: "\u30E6\u30FC\u30B6\u30FC\u627F\u8A8D\u6E08\u307FSSOT",
      sourceTitle: "\u6CD5\u4EBA\u5316\u30B7\u30DF\u30E5\u30EC\u30FC\u30BF\u30FC \u8A08\u7B97\u4ED5\u69D8\u66F8 v1.0 FINAL",
      sourceUrl: "../spec/v1.0_FINAL.md",
      effectiveFrom: "2026-01-01",
      effectiveTo: "2026-12-31",
      verifiedAt: "2026-09-14",
      verificationScope: "SSOT\u304B\u3089\u306E\u8EE2\u8A18\u78BA\u8A8D\u3002\u516C\u5F0F\u7A0E\u5236\u306E\u5305\u62EC\u691C\u8A3C\u3067\u306F\u306A\u3044\u3002"
    },
    values: {
      first: 4e6,
      second: 8e6,
      firstBps: 350,
      secondBps: 530,
      thirdBps: 700,
      incomeLimit: 5e7,
      specialBps: 3700
    }
  },
  consumption: {
    metadata: {
      sourceAuthority: "\u30E6\u30FC\u30B6\u30FC\u627F\u8A8D\u6E08\u307FSSOT",
      sourceTitle: "\u6CD5\u4EBA\u5316\u30B7\u30DF\u30E5\u30EC\u30FC\u30BF\u30FC \u8A08\u7B97\u4ED5\u69D8\u66F8 v1.0 FINAL",
      sourceUrl: "../spec/v1.0_FINAL.md",
      effectiveFrom: "2026-01-01",
      effectiveTo: "2026-12-31",
      verifiedAt: "2026-09-14",
      verificationScope: "SSOT\u304B\u3089\u306E\u8EE2\u8A18\u78BA\u8A8D\u3002\u516C\u5F0F\u7A0E\u5236\u306E\u5305\u62EC\u691C\u8A3C\u3067\u306F\u306A\u3044\u3002"
    },
    values: {
      specialBps: 2e3,
      exemptCapitalExclusive: 1e7
    }
  },
  optimizer: {
    metadata: {
      sourceAuthority: "\u30E6\u30FC\u30B6\u30FC\u627F\u8A8D\u6E08\u307FSSOT",
      sourceTitle: "\u6CD5\u4EBA\u5316\u30B7\u30DF\u30E5\u30EC\u30FC\u30BF\u30FC \u8A08\u7B97\u4ED5\u69D8\u66F8 v1.0 FINAL",
      sourceUrl: "../spec/v1.0_FINAL.md",
      effectiveFrom: "2026-01-01",
      effectiveTo: "2026-12-31",
      verifiedAt: "2026-09-14",
      verificationScope: "SSOT\u304B\u3089\u306E\u8EE2\u8A18\u78BA\u8A8D\u3002\u516C\u5F0F\u7A0E\u5236\u306E\u5305\u62EC\u691C\u8A3C\u3067\u306F\u306A\u3044\u3002"
    },
    values: {
      minimumSalary: 1e5,
      maximumSalary: 6e5,
      step: 1e4
    }
  },
  idecoBefore: {
    metadata: {
      sourceAuthority: "\u30E6\u30FC\u30B6\u30FC\u627F\u8A8D\u6E08\u307FSSOT",
      sourceTitle: "\u6CD5\u4EBA\u5316\u30B7\u30DF\u30E5\u30EC\u30FC\u30BF\u30FC \u8A08\u7B97\u4ED5\u69D8\u66F8 v1.0 FINAL",
      sourceUrl: "../spec/v1.0_FINAL.md",
      effectiveFrom: "2026-01-01",
      effectiveTo: "2026-11-30",
      verifiedAt: "2026-09-14",
      verificationScope: "SSOT\u304B\u3089\u306E\u8EE2\u8A18\u78BA\u8A8D\u3002\u516C\u5F0F\u7A0E\u5236\u306E\u5305\u62EC\u691C\u8A3C\u3067\u306F\u306A\u3044\u3002"
    },
    values: {
      first: 68e3,
      second: 23e3
    }
  },
  idecoAfter: {
    metadata: {
      sourceAuthority: "\u30E6\u30FC\u30B6\u30FC\u627F\u8A8D\u6E08\u307FSSOT",
      sourceTitle: "\u6CD5\u4EBA\u5316\u30B7\u30DF\u30E5\u30EC\u30FC\u30BF\u30FC \u8A08\u7B97\u4ED5\u69D8\u66F8 v1.0 FINAL",
      sourceUrl: "../spec/v1.0_FINAL.md",
      effectiveFrom: "2026-12-01",
      effectiveTo: "2026-12-31",
      verifiedAt: "2026-09-14",
      verificationScope: "SSOT\u304B\u3089\u306E\u8EE2\u8A18\u78BA\u8A8D\u3002\u516C\u5F0F\u7A0E\u5236\u306E\u5305\u62EC\u691C\u8A3C\u3067\u306F\u306A\u3044\u3002"
    },
    values: {
      first: 75e3,
      second: 62e3
    }
  },
  healthInsurance: {
    metadata: {
      sourceAuthority: "\u5168\u56FD\u5065\u5EB7\u4FDD\u967A\u5354\u4F1A \u611B\u77E5\u652F\u90E8",
      sourceTitle: "\u4EE4\u548C8\u5E743\u6708\u5206\uFF084\u6708\u7D0D\u4ED8\u5206\uFF09\u304B\u3089\u306E\u5065\u5EB7\u4FDD\u967A\u30FB\u539A\u751F\u5E74\u91D1\u4FDD\u967A\u306E\u4FDD\u967A\u6599\u984D\u8868\uFF08\u611B\u77E5\u652F\u90E8\uFF09",
      sourceUrl: "https://www.kyoukaikenpo.or.jp/assets/R8_23aichi.pdf",
      effectiveFrom: "2026-03-01",
      effectiveTo: null,
      verifiedAt: "2026-09-14",
      verificationScope: "\u7B49\u7D1A\u30FB\u7387\u30FB\u7AEF\u6570\u51E6\u7406\u306F\u5C02\u7528social-insurance master\u3092\u4F7F\u7528\u3002"
    },
    values: {
      bps: 993
    }
  },
  nursingInsurance: {
    metadata: {
      sourceAuthority: "\u5168\u56FD\u5065\u5EB7\u4FDD\u967A\u5354\u4F1A \u611B\u77E5\u652F\u90E8",
      sourceTitle: "\u4EE4\u548C8\u5E743\u6708\u5206\uFF084\u6708\u7D0D\u4ED8\u5206\uFF09\u304B\u3089\u306E\u5065\u5EB7\u4FDD\u967A\u30FB\u539A\u751F\u5E74\u91D1\u4FDD\u967A\u306E\u4FDD\u967A\u6599\u984D\u8868\uFF08\u611B\u77E5\u652F\u90E8\uFF09",
      sourceUrl: "https://www.kyoukaikenpo.or.jp/assets/R8_23aichi.pdf",
      effectiveFrom: "2026-03-01",
      effectiveTo: null,
      verifiedAt: "2026-09-14",
      verificationScope: "\u7B49\u7D1A\u30FB\u7387\u30FB\u7AEF\u6570\u51E6\u7406\u306F\u5C02\u7528social-insurance master\u3092\u4F7F\u7528\u3002"
    },
    values: {
      bps: 162,
      minAge: 40,
      maxAgeExclusive: 65
    }
  },
  childrenSupport: {
    metadata: {
      sourceAuthority: "\u5168\u56FD\u5065\u5EB7\u4FDD\u967A\u5354\u4F1A \u611B\u77E5\u652F\u90E8",
      sourceTitle: "\u4EE4\u548C8\u5E743\u6708\u5206\uFF084\u6708\u7D0D\u4ED8\u5206\uFF09\u304B\u3089\u306E\u5065\u5EB7\u4FDD\u967A\u30FB\u539A\u751F\u5E74\u91D1\u4FDD\u967A\u306E\u4FDD\u967A\u6599\u984D\u8868\uFF08\u611B\u77E5\u652F\u90E8\uFF09",
      sourceUrl: "https://www.kyoukaikenpo.or.jp/assets/R8_23aichi.pdf",
      effectiveFrom: "2026-04-01",
      effectiveTo: null,
      verifiedAt: "2026-09-14",
      verificationScope: "\u4E00\u822C\u88AB\u4FDD\u967A\u8005\u306F\u4EE4\u548C8\u5E744\u6708\u5206\u304B\u3089\u9069\u7528\u3002"
    },
    values: {
      bps: 23
    }
  },
  employeesPension: {
    metadata: {
      sourceAuthority: "\u5168\u56FD\u5065\u5EB7\u4FDD\u967A\u5354\u4F1A \u611B\u77E5\u652F\u90E8",
      sourceTitle: "\u4EE4\u548C8\u5E743\u6708\u5206\uFF084\u6708\u7D0D\u4ED8\u5206\uFF09\u304B\u3089\u306E\u5065\u5EB7\u4FDD\u967A\u30FB\u539A\u751F\u5E74\u91D1\u4FDD\u967A\u306E\u4FDD\u967A\u6599\u984D\u8868\uFF08\u611B\u77E5\u652F\u90E8\uFF09",
      sourceUrl: "https://www.kyoukaikenpo.or.jp/assets/R8_23aichi.pdf",
      effectiveFrom: "2026-03-01",
      effectiveTo: null,
      verifiedAt: "2026-09-14",
      verificationScope: "\u7B49\u7D1A\u30FB\u7387\u30FB\u7AEF\u6570\u51E6\u7406\u306F\u5C02\u7528social-insurance master\u3092\u4F7F\u7528\u3002"
    },
    values: {
      bps: 1830
    }
  }
};

// src/master.ts
function freezeDeep(value) {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}
var master = freezeDeep(__default);

// src/personal.ts
function businessIncome(sales, expenses, blue) {
  integer(sales, "sales");
  integer(expenses, "expenses");
  if (![0, 55e4, 65e4].includes(blue)) throw new CalculationError("INVALID_INPUT", "blueReturnDeduction");
  const businessIncomeBeforeBlueDeduction = exactInteger(subtract(yen(sales), yen(expenses)));
  const businessIncomeAfterBlueDeduction = Math.max(0, businessIncomeBeforeBlueDeduction - blue);
  return { businessIncomeBeforeBlueDeduction, businessIncomeAfterBlueDeduction };
}
function deductionFromTable(income, rows) {
  integer(income, "income", true);
  for (const row of rows) {
    const [ceiling, deduction] = row;
    if (ceiling === void 0 || deduction === void 0) throw new Error("Invalid master");
    if (income <= ceiling) return deduction;
  }
  return 0;
}
function incomeTaxBasicDeduction(income) {
  return deductionFromTable(income, master.incomeTax.values.basic);
}
function nhiBasicDeduction(previousTotalIncome) {
  return deductionFromTable(previousTotalIncome, master.nhi.values.basic);
}
function baseIncomeTax(taxableIncome) {
  integer(taxableIncome, "taxableIncome");
  if (taxableIncome % master.incomeTax.values.taxableUnit !== 0) throw new CalculationError("INVALID_INPUT", "\u8AB2\u7A0E\u6240\u5F97\u306F\u78BA\u5B9A\u6E08\u307F1000\u5186\u5358\u4F4D\u3067\u5165\u529B");
  let [bps, deduction] = master.incomeTax.values.top;
  for (const row of master.incomeTax.values.brackets) {
    const [exclusive, r, d] = row;
    if (exclusive !== void 0 && taxableIncome < exclusive) {
      bps = r;
      deduction = d;
      break;
    }
  }
  if (bps === void 0 || deduction === void 0) throw new Error("Invalid master");
  return exactInteger(max(yen(0), subtract(rate(yen(taxableIncome), bps), yen(deduction))));
}
function reconstructionTax(base) {
  integer(base, "baseIncomeTax");
  const raw = rate(yen(base), master.incomeTax.values.reconstructionBps);
  const reconstruction = Number(raw.numerator / raw.denominator);
  const incomeTaxAndReconstructionTax = exactInteger(add(yen(base), yen(reconstruction)));
  const unit = master.incomeTax.values.finalUnit;
  const simpleFinalTaxAfter100YenRounding = incomeTaxAndReconstructionTax - incomeTaxAndReconstructionTax % unit;
  return { reconstruction, incomeTaxAndReconstructionTax, simpleFinalTaxAfter100YenRounding };
}
function salaryIncomeRaw(revenue) {
  integer(revenue, "salaryRevenue");
  let deduction = yen(master.salary.values.maximum);
  for (const row of master.salary.values.brackets) {
    const [ceiling, bps, fixed] = row;
    if (ceiling === void 0 || bps === void 0 || fixed === void 0) throw new Error("Invalid master");
    if (revenue <= ceiling) {
      deduction = add(rate(yen(revenue), bps), yen(fixed));
      break;
    }
  }
  return { salaryIncomeDeduction: deduction, salaryIncome: subtract(yen(revenue), deduction) };
}
function adjustmentDeduction(totalTaxableIncome, personalDifference, totalIncome) {
  integer(totalTaxableIncome, "totalTaxableIncome");
  integer(personalDifference, "personalDifference");
  integer(totalIncome, "totalIncome", true);
  const m = master.adjustment.values;
  if (totalIncome > m.incomeLimit) return { base: 0, municipal: yen(0), prefectural: yen(0) };
  const base = totalTaxableIncome <= m.threshold ? Math.min(personalDifference, totalTaxableIncome) : Math.max(m.minimumBase, personalDifference - (totalTaxableIncome - m.threshold));
  return { base, municipal: rate(yen(base), m.municipalBps), prefectural: rate(yen(base), m.prefecturalBps) };
}
function residentIncomeTaxRaw(taxableIncome, municipalAdjustment, prefecturalAdjustment, otherMunicipalCredits, otherPrefecturalCredits) {
  integer(taxableIncome, "taxableIncome");
  integer(otherMunicipalCredits, "credits");
  integer(otherPrefecturalCredits, "credits");
  return { municipal: max(yen(0), subtract(subtract(rate(yen(taxableIncome), master.residentTax.values.municipalBps), municipalAdjustment), yen(otherMunicipalCredits))), prefectural: max(yen(0), subtract(subtract(rate(yen(taxableIncome), master.residentTax.values.prefecturalBps), prefecturalAdjustment), yen(otherPrefecturalCredits))) };
}
function residentBasicDeduction2026(totalIncome) {
  integer(totalIncome, "totalIncome", true);
  if (totalIncome <= 24e6) return 43e4;
  if (totalIncome <= 245e5) return 29e4;
  if (totalIncome <= 25e6) return 15e4;
  return 0;
}
function residentTax2026(input) {
  const { taxableIncome, totalIncome, personalDeductionDifferenceTotal, exemptionStatus } = input;
  integer(taxableIncome, "taxableIncome");
  integer(totalIncome, "totalIncome", true);
  integer(personalDeductionDifferenceTotal, "personalDeductionDifferenceTotal");
  if (taxableIncome % 1e3 !== 0) throw new CalculationError("INVALID_INPUT", "\u4F4F\u6C11\u7A0E\u8AB2\u7A0E\u6240\u5F97\u306F1,000\u5186\u672A\u6E80\u5207\u6368\u3066\u5F8C\u3092\u6307\u5B9A");
  const otherMunicipalCredits = input.otherMunicipalCredits ?? 0, otherPrefecturalCredits = input.otherPrefecturalCredits ?? 0;
  integer(otherMunicipalCredits, "otherMunicipalCredits");
  integer(otherPrefecturalCredits, "otherPrefecturalCredits");
  if (exemptionStatus === "FULL") return { municipalAdjustmentDeduction: 0, prefecturalAdjustmentDeduction: 0, municipalTax: 0, prefecturalTax: 0, forestEnvironmentalTax: 0, total: 0 };
  if (!["INCOME_ONLY", "NONE"].includes(exemptionStatus)) throw new CalculationError("INVALID_INPUT", "residentTaxExemptionStatus");
  const adjustment = adjustmentDeduction(taxableIncome, personalDeductionDifferenceTotal, totalIncome);
  const raw = exemptionStatus === "INCOME_ONLY" ? { municipal: yen(0), prefectural: yen(0) } : residentIncomeTaxRaw(taxableIncome, adjustment.municipal, adjustment.prefectural, otherMunicipalCredits, otherPrefecturalCredits);
  const municipalAdjustmentDeduction = exactInteger(adjustment.municipal), prefecturalAdjustmentDeduction = exactInteger(adjustment.prefectural);
  const municipalBeforeRounding = exactInteger(add(raw.municipal, yen(master.residentTax.values.municipalFixed)));
  const prefecturalBeforeRounding = exactInteger(add(raw.prefectural, yen(master.residentTax.values.prefecturalFixed)));
  const municipalTax = municipalBeforeRounding - municipalBeforeRounding % 100;
  const prefecturalTax = prefecturalBeforeRounding - prefecturalBeforeRounding % 100;
  const forestEnvironmentalTax = master.residentTax.values.forest;
  return { municipalAdjustmentDeduction, prefecturalAdjustmentDeduction, municipalTax, prefecturalTax, forestEnvironmentalTax, total: municipalTax + prefecturalTax + forestEnvironmentalTax };
}

// masters/social-insurance-monthly-remuneration-grades.json
var social_insurance_monthly_remuneration_grades_default = {
  metadata: {
    sourceAuthority: "\u5168\u56FD\u5065\u5EB7\u4FDD\u967A\u5354\u4F1A \u611B\u77E5\u652F\u90E8",
    sourceTitle: "\u4EE4\u548C8\u5E743\u6708\u5206\uFF084\u6708\u7D0D\u4ED8\u5206\uFF09\u304B\u3089\u306E\u5065\u5EB7\u4FDD\u967A\u30FB\u539A\u751F\u5E74\u91D1\u4FDD\u967A\u306E\u4FDD\u967A\u6599\u984D\u8868\uFF08\u611B\u77E5\u652F\u90E8\uFF09",
    sourceUrl: "https://www.kyoukaikenpo.or.jp/assets/R8_23aichi.pdf",
    effectiveFrom: "2026-03-01",
    effectiveTo: null,
    verifiedAt: "2026-09-14",
    transcriptionNote: "\u5831\u916C\u6708\u984D\u306E\u4EE5\u4E0A\u306Flower inclusive\u3001\u672A\u6E80\u306Fupper exclusive\u3002\u5065\u5EB750\u7B49\u7D1A\u3068\u539A\u751F\u5E74\u91D132\u7B49\u7D1A\u3092\u5225\u7BA1\u7406\u3002\u91D1\u984D\u306F1\u5186\u306E100\u5206\u306E1\u5358\u4F4D\u3067\u4FDD\u6301\u3002"
  },
  ratesBps: {
    healthInsurance: 993,
    nursingCareInsurance: 162,
    childrenSupport: 23,
    employeesPension: 1830
  },
  ratePeriods: [
    {
      effectiveFrom: "2025-03-01",
      effectiveTo: "2026-02-28",
      healthInsurance: 1003,
      nursingCareInsurance: 159,
      childrenSupport: 0,
      employeesPension: 1830,
      sourceTitle: "\u4EE4\u548C7\u5E743\u6708\u5206\uFF084\u6708\u7D0D\u4ED8\u5206\uFF09\u304B\u3089\u306E\u5065\u5EB7\u4FDD\u967A\u30FB\u539A\u751F\u5E74\u91D1\u4FDD\u967A\u306E\u4FDD\u967A\u6599\u984D\u8868\uFF08\u611B\u77E5\u652F\u90E8\uFF09",
      sourceUrl: "https://www.kyoukaikenpo.or.jp/assets/23aichi_7.pdf",
      sourceSha256: "ca8741b123b1fd26739d10af48d5ca0e3200bdee220f6838865a4198e2dc1c52"
    },
    {
      effectiveFrom: "2026-03-01",
      effectiveTo: null,
      healthInsurance: 993,
      nursingCareInsurance: 162,
      childrenSupport: 23,
      childrenSupportEffectiveFrom: "2026-04-01",
      employeesPension: 1830,
      sourceTitle: "\u4EE4\u548C8\u5E743\u6708\u5206\uFF084\u6708\u7D0D\u4ED8\u5206\uFF09\u304B\u3089\u306E\u5065\u5EB7\u4FDD\u967A\u30FB\u539A\u751F\u5E74\u91D1\u4FDD\u967A\u306E\u4FDD\u967A\u6599\u984D\u8868\uFF08\u611B\u77E5\u652F\u90E8\uFF09",
      sourceUrl: "https://www.kyoukaikenpo.or.jp/assets/R8_23aichi.pdf"
    }
  ],
  childrenSupportEffectiveFrom: "2026-04-01",
  ageConditions: {
    nursingCareMinimumAge: 40,
    nursingCareMaximumAgeExclusive: 65
  },
  healthInsuranceGrades: [
    {
      grade: 1,
      remunerationLowerInclusive: null,
      remunerationUpperExclusive: 63e3,
      standardMonthlyRemuneration: 58e3,
      healthInsurance: {
        fullPremiumHundredthsYen: 575940,
        officialHalfPremiumHundredthsYen: 287970
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 93960,
        officialHalfPremiumHundredthsYen: 46980
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 669900,
        officialHalfPremiumHundredthsYen: 334950
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 13340,
        officialHalfPremiumHundredthsYen: 6670
      }
    },
    {
      grade: 2,
      remunerationLowerInclusive: 63e3,
      remunerationUpperExclusive: 73e3,
      standardMonthlyRemuneration: 68e3,
      healthInsurance: {
        fullPremiumHundredthsYen: 675240,
        officialHalfPremiumHundredthsYen: 337620
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 110160,
        officialHalfPremiumHundredthsYen: 55080
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 785400,
        officialHalfPremiumHundredthsYen: 392700
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 15640,
        officialHalfPremiumHundredthsYen: 7820
      }
    },
    {
      grade: 3,
      remunerationLowerInclusive: 73e3,
      remunerationUpperExclusive: 83e3,
      standardMonthlyRemuneration: 78e3,
      healthInsurance: {
        fullPremiumHundredthsYen: 774540,
        officialHalfPremiumHundredthsYen: 387270
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 126360,
        officialHalfPremiumHundredthsYen: 63180
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 900900,
        officialHalfPremiumHundredthsYen: 450450
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 17940,
        officialHalfPremiumHundredthsYen: 8970
      }
    },
    {
      grade: 4,
      remunerationLowerInclusive: 83e3,
      remunerationUpperExclusive: 93e3,
      standardMonthlyRemuneration: 88e3,
      healthInsurance: {
        fullPremiumHundredthsYen: 873840,
        officialHalfPremiumHundredthsYen: 436920
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 142560,
        officialHalfPremiumHundredthsYen: 71280
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 1016400,
        officialHalfPremiumHundredthsYen: 508200
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 20240,
        officialHalfPremiumHundredthsYen: 10120
      }
    },
    {
      grade: 5,
      remunerationLowerInclusive: 93e3,
      remunerationUpperExclusive: 101e3,
      standardMonthlyRemuneration: 98e3,
      healthInsurance: {
        fullPremiumHundredthsYen: 973140,
        officialHalfPremiumHundredthsYen: 486570
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 158760,
        officialHalfPremiumHundredthsYen: 79380
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 1131900,
        officialHalfPremiumHundredthsYen: 565950
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 22540,
        officialHalfPremiumHundredthsYen: 11270
      }
    },
    {
      grade: 6,
      remunerationLowerInclusive: 101e3,
      remunerationUpperExclusive: 107e3,
      standardMonthlyRemuneration: 104e3,
      healthInsurance: {
        fullPremiumHundredthsYen: 1032720,
        officialHalfPremiumHundredthsYen: 516360
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 168480,
        officialHalfPremiumHundredthsYen: 84240
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 1201200,
        officialHalfPremiumHundredthsYen: 600600
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 23920,
        officialHalfPremiumHundredthsYen: 11960
      }
    },
    {
      grade: 7,
      remunerationLowerInclusive: 107e3,
      remunerationUpperExclusive: 114e3,
      standardMonthlyRemuneration: 11e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 1092300,
        officialHalfPremiumHundredthsYen: 546150
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 178200,
        officialHalfPremiumHundredthsYen: 89100
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 1270500,
        officialHalfPremiumHundredthsYen: 635250
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 25300,
        officialHalfPremiumHundredthsYen: 12650
      }
    },
    {
      grade: 8,
      remunerationLowerInclusive: 114e3,
      remunerationUpperExclusive: 122e3,
      standardMonthlyRemuneration: 118e3,
      healthInsurance: {
        fullPremiumHundredthsYen: 1171740,
        officialHalfPremiumHundredthsYen: 585870
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 191160,
        officialHalfPremiumHundredthsYen: 95580
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 1362900,
        officialHalfPremiumHundredthsYen: 681450
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 27140,
        officialHalfPremiumHundredthsYen: 13570
      }
    },
    {
      grade: 9,
      remunerationLowerInclusive: 122e3,
      remunerationUpperExclusive: 13e4,
      standardMonthlyRemuneration: 126e3,
      healthInsurance: {
        fullPremiumHundredthsYen: 1251180,
        officialHalfPremiumHundredthsYen: 625590
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 204120,
        officialHalfPremiumHundredthsYen: 102060
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 1455300,
        officialHalfPremiumHundredthsYen: 727650
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 28980,
        officialHalfPremiumHundredthsYen: 14490
      }
    },
    {
      grade: 10,
      remunerationLowerInclusive: 13e4,
      remunerationUpperExclusive: 138e3,
      standardMonthlyRemuneration: 134e3,
      healthInsurance: {
        fullPremiumHundredthsYen: 1330620,
        officialHalfPremiumHundredthsYen: 665310
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 217080,
        officialHalfPremiumHundredthsYen: 108540
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 1547700,
        officialHalfPremiumHundredthsYen: 773850
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 30820,
        officialHalfPremiumHundredthsYen: 15410
      }
    },
    {
      grade: 11,
      remunerationLowerInclusive: 138e3,
      remunerationUpperExclusive: 146e3,
      standardMonthlyRemuneration: 142e3,
      healthInsurance: {
        fullPremiumHundredthsYen: 1410060,
        officialHalfPremiumHundredthsYen: 705030
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 230040,
        officialHalfPremiumHundredthsYen: 115020
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 1640100,
        officialHalfPremiumHundredthsYen: 820050
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 32660,
        officialHalfPremiumHundredthsYen: 16330
      }
    },
    {
      grade: 12,
      remunerationLowerInclusive: 146e3,
      remunerationUpperExclusive: 155e3,
      standardMonthlyRemuneration: 15e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 1489500,
        officialHalfPremiumHundredthsYen: 744750
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 243e3,
        officialHalfPremiumHundredthsYen: 121500
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 1732500,
        officialHalfPremiumHundredthsYen: 866250
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 34500,
        officialHalfPremiumHundredthsYen: 17250
      }
    },
    {
      grade: 13,
      remunerationLowerInclusive: 155e3,
      remunerationUpperExclusive: 165e3,
      standardMonthlyRemuneration: 16e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 1588800,
        officialHalfPremiumHundredthsYen: 794400
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 259200,
        officialHalfPremiumHundredthsYen: 129600
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 1848e3,
        officialHalfPremiumHundredthsYen: 924e3
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 36800,
        officialHalfPremiumHundredthsYen: 18400
      }
    },
    {
      grade: 14,
      remunerationLowerInclusive: 165e3,
      remunerationUpperExclusive: 175e3,
      standardMonthlyRemuneration: 17e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 1688100,
        officialHalfPremiumHundredthsYen: 844050
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 275400,
        officialHalfPremiumHundredthsYen: 137700
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 1963500,
        officialHalfPremiumHundredthsYen: 981750
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 39100,
        officialHalfPremiumHundredthsYen: 19550
      }
    },
    {
      grade: 15,
      remunerationLowerInclusive: 175e3,
      remunerationUpperExclusive: 185e3,
      standardMonthlyRemuneration: 18e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 1787400,
        officialHalfPremiumHundredthsYen: 893700
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 291600,
        officialHalfPremiumHundredthsYen: 145800
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 2079e3,
        officialHalfPremiumHundredthsYen: 1039500
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 41400,
        officialHalfPremiumHundredthsYen: 20700
      }
    },
    {
      grade: 16,
      remunerationLowerInclusive: 185e3,
      remunerationUpperExclusive: 195e3,
      standardMonthlyRemuneration: 19e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 1886700,
        officialHalfPremiumHundredthsYen: 943350
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 307800,
        officialHalfPremiumHundredthsYen: 153900
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 2194500,
        officialHalfPremiumHundredthsYen: 1097250
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 43700,
        officialHalfPremiumHundredthsYen: 21850
      }
    },
    {
      grade: 17,
      remunerationLowerInclusive: 195e3,
      remunerationUpperExclusive: 21e4,
      standardMonthlyRemuneration: 2e5,
      healthInsurance: {
        fullPremiumHundredthsYen: 1986e3,
        officialHalfPremiumHundredthsYen: 993e3
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 324e3,
        officialHalfPremiumHundredthsYen: 162e3
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 231e4,
        officialHalfPremiumHundredthsYen: 1155e3
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 46e3,
        officialHalfPremiumHundredthsYen: 23e3
      }
    },
    {
      grade: 18,
      remunerationLowerInclusive: 21e4,
      remunerationUpperExclusive: 23e4,
      standardMonthlyRemuneration: 22e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 2184600,
        officialHalfPremiumHundredthsYen: 1092300
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 356400,
        officialHalfPremiumHundredthsYen: 178200
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 2541e3,
        officialHalfPremiumHundredthsYen: 1270500
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 50600,
        officialHalfPremiumHundredthsYen: 25300
      }
    },
    {
      grade: 19,
      remunerationLowerInclusive: 23e4,
      remunerationUpperExclusive: 25e4,
      standardMonthlyRemuneration: 24e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 2383200,
        officialHalfPremiumHundredthsYen: 1191600
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 388800,
        officialHalfPremiumHundredthsYen: 194400
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 2772e3,
        officialHalfPremiumHundredthsYen: 1386e3
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 55200,
        officialHalfPremiumHundredthsYen: 27600
      }
    },
    {
      grade: 20,
      remunerationLowerInclusive: 25e4,
      remunerationUpperExclusive: 27e4,
      standardMonthlyRemuneration: 26e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 2581800,
        officialHalfPremiumHundredthsYen: 1290900
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 421200,
        officialHalfPremiumHundredthsYen: 210600
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 3003e3,
        officialHalfPremiumHundredthsYen: 1501500
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 59800,
        officialHalfPremiumHundredthsYen: 29900
      }
    },
    {
      grade: 21,
      remunerationLowerInclusive: 27e4,
      remunerationUpperExclusive: 29e4,
      standardMonthlyRemuneration: 28e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 2780400,
        officialHalfPremiumHundredthsYen: 1390200
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 453600,
        officialHalfPremiumHundredthsYen: 226800
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 3234e3,
        officialHalfPremiumHundredthsYen: 1617e3
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 64400,
        officialHalfPremiumHundredthsYen: 32200
      }
    },
    {
      grade: 22,
      remunerationLowerInclusive: 29e4,
      remunerationUpperExclusive: 31e4,
      standardMonthlyRemuneration: 3e5,
      healthInsurance: {
        fullPremiumHundredthsYen: 2979e3,
        officialHalfPremiumHundredthsYen: 1489500
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 486e3,
        officialHalfPremiumHundredthsYen: 243e3
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 3465e3,
        officialHalfPremiumHundredthsYen: 1732500
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 69e3,
        officialHalfPremiumHundredthsYen: 34500
      }
    },
    {
      grade: 23,
      remunerationLowerInclusive: 31e4,
      remunerationUpperExclusive: 33e4,
      standardMonthlyRemuneration: 32e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 3177600,
        officialHalfPremiumHundredthsYen: 1588800
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 518400,
        officialHalfPremiumHundredthsYen: 259200
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 3696e3,
        officialHalfPremiumHundredthsYen: 1848e3
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 73600,
        officialHalfPremiumHundredthsYen: 36800
      }
    },
    {
      grade: 24,
      remunerationLowerInclusive: 33e4,
      remunerationUpperExclusive: 35e4,
      standardMonthlyRemuneration: 34e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 3376200,
        officialHalfPremiumHundredthsYen: 1688100
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 550800,
        officialHalfPremiumHundredthsYen: 275400
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 3927e3,
        officialHalfPremiumHundredthsYen: 1963500
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 78200,
        officialHalfPremiumHundredthsYen: 39100
      }
    },
    {
      grade: 25,
      remunerationLowerInclusive: 35e4,
      remunerationUpperExclusive: 37e4,
      standardMonthlyRemuneration: 36e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 3574800,
        officialHalfPremiumHundredthsYen: 1787400
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 583200,
        officialHalfPremiumHundredthsYen: 291600
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 4158e3,
        officialHalfPremiumHundredthsYen: 2079e3
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 82800,
        officialHalfPremiumHundredthsYen: 41400
      }
    },
    {
      grade: 26,
      remunerationLowerInclusive: 37e4,
      remunerationUpperExclusive: 395e3,
      standardMonthlyRemuneration: 38e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 3773400,
        officialHalfPremiumHundredthsYen: 1886700
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 615600,
        officialHalfPremiumHundredthsYen: 307800
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 4389e3,
        officialHalfPremiumHundredthsYen: 2194500
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 87400,
        officialHalfPremiumHundredthsYen: 43700
      }
    },
    {
      grade: 27,
      remunerationLowerInclusive: 395e3,
      remunerationUpperExclusive: 425e3,
      standardMonthlyRemuneration: 41e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 4071300,
        officialHalfPremiumHundredthsYen: 2035650
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 664200,
        officialHalfPremiumHundredthsYen: 332100
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 4735500,
        officialHalfPremiumHundredthsYen: 2367750
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 94300,
        officialHalfPremiumHundredthsYen: 47150
      }
    },
    {
      grade: 28,
      remunerationLowerInclusive: 425e3,
      remunerationUpperExclusive: 455e3,
      standardMonthlyRemuneration: 44e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 4369200,
        officialHalfPremiumHundredthsYen: 2184600
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 712800,
        officialHalfPremiumHundredthsYen: 356400
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 5082e3,
        officialHalfPremiumHundredthsYen: 2541e3
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 101200,
        officialHalfPremiumHundredthsYen: 50600
      }
    },
    {
      grade: 29,
      remunerationLowerInclusive: 455e3,
      remunerationUpperExclusive: 485e3,
      standardMonthlyRemuneration: 47e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 4667100,
        officialHalfPremiumHundredthsYen: 2333550
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 761400,
        officialHalfPremiumHundredthsYen: 380700
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 5428500,
        officialHalfPremiumHundredthsYen: 2714250
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 108100,
        officialHalfPremiumHundredthsYen: 54050
      }
    },
    {
      grade: 30,
      remunerationLowerInclusive: 485e3,
      remunerationUpperExclusive: 515e3,
      standardMonthlyRemuneration: 5e5,
      healthInsurance: {
        fullPremiumHundredthsYen: 4965e3,
        officialHalfPremiumHundredthsYen: 2482500
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 81e4,
        officialHalfPremiumHundredthsYen: 405e3
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 5775e3,
        officialHalfPremiumHundredthsYen: 2887500
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 115e3,
        officialHalfPremiumHundredthsYen: 57500
      }
    },
    {
      grade: 31,
      remunerationLowerInclusive: 515e3,
      remunerationUpperExclusive: 545e3,
      standardMonthlyRemuneration: 53e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 5262900,
        officialHalfPremiumHundredthsYen: 2631450
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 858600,
        officialHalfPremiumHundredthsYen: 429300
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 6121500,
        officialHalfPremiumHundredthsYen: 3060750
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 121900,
        officialHalfPremiumHundredthsYen: 60950
      }
    },
    {
      grade: 32,
      remunerationLowerInclusive: 545e3,
      remunerationUpperExclusive: 575e3,
      standardMonthlyRemuneration: 56e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 5560800,
        officialHalfPremiumHundredthsYen: 2780400
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 907200,
        officialHalfPremiumHundredthsYen: 453600
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 6468e3,
        officialHalfPremiumHundredthsYen: 3234e3
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 128800,
        officialHalfPremiumHundredthsYen: 64400
      }
    },
    {
      grade: 33,
      remunerationLowerInclusive: 575e3,
      remunerationUpperExclusive: 605e3,
      standardMonthlyRemuneration: 59e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 5858700,
        officialHalfPremiumHundredthsYen: 2929350
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 955800,
        officialHalfPremiumHundredthsYen: 477900
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 6814500,
        officialHalfPremiumHundredthsYen: 3407250
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 135700,
        officialHalfPremiumHundredthsYen: 67850
      }
    },
    {
      grade: 34,
      remunerationLowerInclusive: 605e3,
      remunerationUpperExclusive: 635e3,
      standardMonthlyRemuneration: 62e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 6156600,
        officialHalfPremiumHundredthsYen: 3078300
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 1004400,
        officialHalfPremiumHundredthsYen: 502200
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 7161e3,
        officialHalfPremiumHundredthsYen: 3580500
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 142600,
        officialHalfPremiumHundredthsYen: 71300
      }
    },
    {
      grade: 35,
      remunerationLowerInclusive: 635e3,
      remunerationUpperExclusive: 665e3,
      standardMonthlyRemuneration: 65e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 6454500,
        officialHalfPremiumHundredthsYen: 3227250
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 1053e3,
        officialHalfPremiumHundredthsYen: 526500
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 7507500,
        officialHalfPremiumHundredthsYen: 3753750
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 149500,
        officialHalfPremiumHundredthsYen: 74750
      }
    },
    {
      grade: 36,
      remunerationLowerInclusive: 665e3,
      remunerationUpperExclusive: 695e3,
      standardMonthlyRemuneration: 68e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 6752400,
        officialHalfPremiumHundredthsYen: 3376200
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 1101600,
        officialHalfPremiumHundredthsYen: 550800
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 7854e3,
        officialHalfPremiumHundredthsYen: 3927e3
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 156400,
        officialHalfPremiumHundredthsYen: 78200
      }
    },
    {
      grade: 37,
      remunerationLowerInclusive: 695e3,
      remunerationUpperExclusive: 73e4,
      standardMonthlyRemuneration: 71e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 7050300,
        officialHalfPremiumHundredthsYen: 3525150
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 1150200,
        officialHalfPremiumHundredthsYen: 575100
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 8200500,
        officialHalfPremiumHundredthsYen: 4100250
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 163300,
        officialHalfPremiumHundredthsYen: 81650
      }
    },
    {
      grade: 38,
      remunerationLowerInclusive: 73e4,
      remunerationUpperExclusive: 77e4,
      standardMonthlyRemuneration: 75e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 7447500,
        officialHalfPremiumHundredthsYen: 3723750
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 1215e3,
        officialHalfPremiumHundredthsYen: 607500
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 8662500,
        officialHalfPremiumHundredthsYen: 4331250
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 172500,
        officialHalfPremiumHundredthsYen: 86250
      }
    },
    {
      grade: 39,
      remunerationLowerInclusive: 77e4,
      remunerationUpperExclusive: 81e4,
      standardMonthlyRemuneration: 79e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 7844700,
        officialHalfPremiumHundredthsYen: 3922350
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 1279800,
        officialHalfPremiumHundredthsYen: 639900
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 9124500,
        officialHalfPremiumHundredthsYen: 4562250
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 181700,
        officialHalfPremiumHundredthsYen: 90850
      }
    },
    {
      grade: 40,
      remunerationLowerInclusive: 81e4,
      remunerationUpperExclusive: 855e3,
      standardMonthlyRemuneration: 83e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 8241900,
        officialHalfPremiumHundredthsYen: 4120950
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 1344600,
        officialHalfPremiumHundredthsYen: 672300
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 9586500,
        officialHalfPremiumHundredthsYen: 4793250
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 190900,
        officialHalfPremiumHundredthsYen: 95450
      }
    },
    {
      grade: 41,
      remunerationLowerInclusive: 855e3,
      remunerationUpperExclusive: 905e3,
      standardMonthlyRemuneration: 88e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 8738400,
        officialHalfPremiumHundredthsYen: 4369200
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 1425600,
        officialHalfPremiumHundredthsYen: 712800
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 10164e3,
        officialHalfPremiumHundredthsYen: 5082e3
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 202400,
        officialHalfPremiumHundredthsYen: 101200
      }
    },
    {
      grade: 42,
      remunerationLowerInclusive: 905e3,
      remunerationUpperExclusive: 955e3,
      standardMonthlyRemuneration: 93e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 9234900,
        officialHalfPremiumHundredthsYen: 4617450
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 1506600,
        officialHalfPremiumHundredthsYen: 753300
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 10741500,
        officialHalfPremiumHundredthsYen: 5370750
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 213900,
        officialHalfPremiumHundredthsYen: 106950
      }
    },
    {
      grade: 43,
      remunerationLowerInclusive: 955e3,
      remunerationUpperExclusive: 1005e3,
      standardMonthlyRemuneration: 98e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 9731400,
        officialHalfPremiumHundredthsYen: 4865700
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 1587600,
        officialHalfPremiumHundredthsYen: 793800
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 11319e3,
        officialHalfPremiumHundredthsYen: 5659500
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 225400,
        officialHalfPremiumHundredthsYen: 112700
      }
    },
    {
      grade: 44,
      remunerationLowerInclusive: 1005e3,
      remunerationUpperExclusive: 1055e3,
      standardMonthlyRemuneration: 103e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 10227900,
        officialHalfPremiumHundredthsYen: 5113950
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 1668600,
        officialHalfPremiumHundredthsYen: 834300
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 11896500,
        officialHalfPremiumHundredthsYen: 5948250
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 236900,
        officialHalfPremiumHundredthsYen: 118450
      }
    },
    {
      grade: 45,
      remunerationLowerInclusive: 1055e3,
      remunerationUpperExclusive: 1115e3,
      standardMonthlyRemuneration: 109e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 10823700,
        officialHalfPremiumHundredthsYen: 5411850
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 1765800,
        officialHalfPremiumHundredthsYen: 882900
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 12589500,
        officialHalfPremiumHundredthsYen: 6294750
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 250700,
        officialHalfPremiumHundredthsYen: 125350
      }
    },
    {
      grade: 46,
      remunerationLowerInclusive: 1115e3,
      remunerationUpperExclusive: 1175e3,
      standardMonthlyRemuneration: 115e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 11419500,
        officialHalfPremiumHundredthsYen: 5709750
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 1863e3,
        officialHalfPremiumHundredthsYen: 931500
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 13282500,
        officialHalfPremiumHundredthsYen: 6641250
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 264500,
        officialHalfPremiumHundredthsYen: 132250
      }
    },
    {
      grade: 47,
      remunerationLowerInclusive: 1175e3,
      remunerationUpperExclusive: 1235e3,
      standardMonthlyRemuneration: 121e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 12015300,
        officialHalfPremiumHundredthsYen: 6007650
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 1960200,
        officialHalfPremiumHundredthsYen: 980100
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 13975500,
        officialHalfPremiumHundredthsYen: 6987750
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 278300,
        officialHalfPremiumHundredthsYen: 139150
      }
    },
    {
      grade: 48,
      remunerationLowerInclusive: 1235e3,
      remunerationUpperExclusive: 1295e3,
      standardMonthlyRemuneration: 127e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 12611100,
        officialHalfPremiumHundredthsYen: 6305550
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 2057400,
        officialHalfPremiumHundredthsYen: 1028700
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 14668500,
        officialHalfPremiumHundredthsYen: 7334250
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 292100,
        officialHalfPremiumHundredthsYen: 146050
      }
    },
    {
      grade: 49,
      remunerationLowerInclusive: 1295e3,
      remunerationUpperExclusive: 1355e3,
      standardMonthlyRemuneration: 133e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 13206900,
        officialHalfPremiumHundredthsYen: 6603450
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 2154600,
        officialHalfPremiumHundredthsYen: 1077300
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 15361500,
        officialHalfPremiumHundredthsYen: 7680750
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 305900,
        officialHalfPremiumHundredthsYen: 152950
      }
    },
    {
      grade: 50,
      remunerationLowerInclusive: 1355e3,
      remunerationUpperExclusive: null,
      standardMonthlyRemuneration: 139e4,
      healthInsurance: {
        fullPremiumHundredthsYen: 13802700,
        officialHalfPremiumHundredthsYen: 6901350
      },
      nursingCareInsurance: {
        fullPremiumHundredthsYen: 2251800,
        officialHalfPremiumHundredthsYen: 1125900
      },
      healthPlusNursingCareOfficial: {
        fullPremiumHundredthsYen: 16054500,
        officialHalfPremiumHundredthsYen: 8027250
      },
      childrenSupport: {
        fullPremiumHundredthsYen: 319700,
        officialHalfPremiumHundredthsYen: 159850
      }
    }
  ],
  employeesPensionGrades: [
    {
      grade: 1,
      remunerationLowerInclusive: null,
      remunerationUpperExclusive: 93e3,
      standardMonthlyRemuneration: 88e3,
      employeesPension: {
        fullPremiumHundredthsYen: 1610400,
        officialHalfPremiumHundredthsYen: 805200
      }
    },
    {
      grade: 2,
      remunerationLowerInclusive: 93e3,
      remunerationUpperExclusive: 101e3,
      standardMonthlyRemuneration: 98e3,
      employeesPension: {
        fullPremiumHundredthsYen: 1793400,
        officialHalfPremiumHundredthsYen: 896700
      }
    },
    {
      grade: 3,
      remunerationLowerInclusive: 101e3,
      remunerationUpperExclusive: 107e3,
      standardMonthlyRemuneration: 104e3,
      employeesPension: {
        fullPremiumHundredthsYen: 1903200,
        officialHalfPremiumHundredthsYen: 951600
      }
    },
    {
      grade: 4,
      remunerationLowerInclusive: 107e3,
      remunerationUpperExclusive: 114e3,
      standardMonthlyRemuneration: 11e4,
      employeesPension: {
        fullPremiumHundredthsYen: 2013e3,
        officialHalfPremiumHundredthsYen: 1006500
      }
    },
    {
      grade: 5,
      remunerationLowerInclusive: 114e3,
      remunerationUpperExclusive: 122e3,
      standardMonthlyRemuneration: 118e3,
      employeesPension: {
        fullPremiumHundredthsYen: 2159400,
        officialHalfPremiumHundredthsYen: 1079700
      }
    },
    {
      grade: 6,
      remunerationLowerInclusive: 122e3,
      remunerationUpperExclusive: 13e4,
      standardMonthlyRemuneration: 126e3,
      employeesPension: {
        fullPremiumHundredthsYen: 2305800,
        officialHalfPremiumHundredthsYen: 1152900
      }
    },
    {
      grade: 7,
      remunerationLowerInclusive: 13e4,
      remunerationUpperExclusive: 138e3,
      standardMonthlyRemuneration: 134e3,
      employeesPension: {
        fullPremiumHundredthsYen: 2452200,
        officialHalfPremiumHundredthsYen: 1226100
      }
    },
    {
      grade: 8,
      remunerationLowerInclusive: 138e3,
      remunerationUpperExclusive: 146e3,
      standardMonthlyRemuneration: 142e3,
      employeesPension: {
        fullPremiumHundredthsYen: 2598600,
        officialHalfPremiumHundredthsYen: 1299300
      }
    },
    {
      grade: 9,
      remunerationLowerInclusive: 146e3,
      remunerationUpperExclusive: 155e3,
      standardMonthlyRemuneration: 15e4,
      employeesPension: {
        fullPremiumHundredthsYen: 2745e3,
        officialHalfPremiumHundredthsYen: 1372500
      }
    },
    {
      grade: 10,
      remunerationLowerInclusive: 155e3,
      remunerationUpperExclusive: 165e3,
      standardMonthlyRemuneration: 16e4,
      employeesPension: {
        fullPremiumHundredthsYen: 2928e3,
        officialHalfPremiumHundredthsYen: 1464e3
      }
    },
    {
      grade: 11,
      remunerationLowerInclusive: 165e3,
      remunerationUpperExclusive: 175e3,
      standardMonthlyRemuneration: 17e4,
      employeesPension: {
        fullPremiumHundredthsYen: 3111e3,
        officialHalfPremiumHundredthsYen: 1555500
      }
    },
    {
      grade: 12,
      remunerationLowerInclusive: 175e3,
      remunerationUpperExclusive: 185e3,
      standardMonthlyRemuneration: 18e4,
      employeesPension: {
        fullPremiumHundredthsYen: 3294e3,
        officialHalfPremiumHundredthsYen: 1647e3
      }
    },
    {
      grade: 13,
      remunerationLowerInclusive: 185e3,
      remunerationUpperExclusive: 195e3,
      standardMonthlyRemuneration: 19e4,
      employeesPension: {
        fullPremiumHundredthsYen: 3477e3,
        officialHalfPremiumHundredthsYen: 1738500
      }
    },
    {
      grade: 14,
      remunerationLowerInclusive: 195e3,
      remunerationUpperExclusive: 21e4,
      standardMonthlyRemuneration: 2e5,
      employeesPension: {
        fullPremiumHundredthsYen: 366e4,
        officialHalfPremiumHundredthsYen: 183e4
      }
    },
    {
      grade: 15,
      remunerationLowerInclusive: 21e4,
      remunerationUpperExclusive: 23e4,
      standardMonthlyRemuneration: 22e4,
      employeesPension: {
        fullPremiumHundredthsYen: 4026e3,
        officialHalfPremiumHundredthsYen: 2013e3
      }
    },
    {
      grade: 16,
      remunerationLowerInclusive: 23e4,
      remunerationUpperExclusive: 25e4,
      standardMonthlyRemuneration: 24e4,
      employeesPension: {
        fullPremiumHundredthsYen: 4392e3,
        officialHalfPremiumHundredthsYen: 2196e3
      }
    },
    {
      grade: 17,
      remunerationLowerInclusive: 25e4,
      remunerationUpperExclusive: 27e4,
      standardMonthlyRemuneration: 26e4,
      employeesPension: {
        fullPremiumHundredthsYen: 4758e3,
        officialHalfPremiumHundredthsYen: 2379e3
      }
    },
    {
      grade: 18,
      remunerationLowerInclusive: 27e4,
      remunerationUpperExclusive: 29e4,
      standardMonthlyRemuneration: 28e4,
      employeesPension: {
        fullPremiumHundredthsYen: 5124e3,
        officialHalfPremiumHundredthsYen: 2562e3
      }
    },
    {
      grade: 19,
      remunerationLowerInclusive: 29e4,
      remunerationUpperExclusive: 31e4,
      standardMonthlyRemuneration: 3e5,
      employeesPension: {
        fullPremiumHundredthsYen: 549e4,
        officialHalfPremiumHundredthsYen: 2745e3
      }
    },
    {
      grade: 20,
      remunerationLowerInclusive: 31e4,
      remunerationUpperExclusive: 33e4,
      standardMonthlyRemuneration: 32e4,
      employeesPension: {
        fullPremiumHundredthsYen: 5856e3,
        officialHalfPremiumHundredthsYen: 2928e3
      }
    },
    {
      grade: 21,
      remunerationLowerInclusive: 33e4,
      remunerationUpperExclusive: 35e4,
      standardMonthlyRemuneration: 34e4,
      employeesPension: {
        fullPremiumHundredthsYen: 6222e3,
        officialHalfPremiumHundredthsYen: 3111e3
      }
    },
    {
      grade: 22,
      remunerationLowerInclusive: 35e4,
      remunerationUpperExclusive: 37e4,
      standardMonthlyRemuneration: 36e4,
      employeesPension: {
        fullPremiumHundredthsYen: 6588e3,
        officialHalfPremiumHundredthsYen: 3294e3
      }
    },
    {
      grade: 23,
      remunerationLowerInclusive: 37e4,
      remunerationUpperExclusive: 395e3,
      standardMonthlyRemuneration: 38e4,
      employeesPension: {
        fullPremiumHundredthsYen: 6954e3,
        officialHalfPremiumHundredthsYen: 3477e3
      }
    },
    {
      grade: 24,
      remunerationLowerInclusive: 395e3,
      remunerationUpperExclusive: 425e3,
      standardMonthlyRemuneration: 41e4,
      employeesPension: {
        fullPremiumHundredthsYen: 7503e3,
        officialHalfPremiumHundredthsYen: 3751500
      }
    },
    {
      grade: 25,
      remunerationLowerInclusive: 425e3,
      remunerationUpperExclusive: 455e3,
      standardMonthlyRemuneration: 44e4,
      employeesPension: {
        fullPremiumHundredthsYen: 8052e3,
        officialHalfPremiumHundredthsYen: 4026e3
      }
    },
    {
      grade: 26,
      remunerationLowerInclusive: 455e3,
      remunerationUpperExclusive: 485e3,
      standardMonthlyRemuneration: 47e4,
      employeesPension: {
        fullPremiumHundredthsYen: 8601e3,
        officialHalfPremiumHundredthsYen: 4300500
      }
    },
    {
      grade: 27,
      remunerationLowerInclusive: 485e3,
      remunerationUpperExclusive: 515e3,
      standardMonthlyRemuneration: 5e5,
      employeesPension: {
        fullPremiumHundredthsYen: 915e4,
        officialHalfPremiumHundredthsYen: 4575e3
      }
    },
    {
      grade: 28,
      remunerationLowerInclusive: 515e3,
      remunerationUpperExclusive: 545e3,
      standardMonthlyRemuneration: 53e4,
      employeesPension: {
        fullPremiumHundredthsYen: 9699e3,
        officialHalfPremiumHundredthsYen: 4849500
      }
    },
    {
      grade: 29,
      remunerationLowerInclusive: 545e3,
      remunerationUpperExclusive: 575e3,
      standardMonthlyRemuneration: 56e4,
      employeesPension: {
        fullPremiumHundredthsYen: 10248e3,
        officialHalfPremiumHundredthsYen: 5124e3
      }
    },
    {
      grade: 30,
      remunerationLowerInclusive: 575e3,
      remunerationUpperExclusive: 605e3,
      standardMonthlyRemuneration: 59e4,
      employeesPension: {
        fullPremiumHundredthsYen: 10797e3,
        officialHalfPremiumHundredthsYen: 5398500
      }
    },
    {
      grade: 31,
      remunerationLowerInclusive: 605e3,
      remunerationUpperExclusive: 635e3,
      standardMonthlyRemuneration: 62e4,
      employeesPension: {
        fullPremiumHundredthsYen: 11346e3,
        officialHalfPremiumHundredthsYen: 5673e3
      }
    },
    {
      grade: 32,
      remunerationLowerInclusive: 635e3,
      remunerationUpperExclusive: null,
      standardMonthlyRemuneration: 65e4,
      employeesPension: {
        fullPremiumHundredthsYen: 11895e3,
        officialHalfPremiumHundredthsYen: 5947500
      }
    }
  ],
  rounding: {
    payrollWithholdingEmployee: "50\u92AD\u4EE5\u4E0B\u5207\u6368\u3066\u300150\u92AD\u8D85\u5207\u4E0A\u3052",
    officeTotal: "\u88AB\u4FDD\u967A\u8005\u500B\u3005\u306E\u4E38\u3081\u524D\u4FDD\u967A\u6599\u3092\u5408\u7B97\u3057\u3001\u5408\u8A08\u306E1\u5186\u672A\u6E80\u5207\u6368\u3066",
    employer: "\u4E8B\u696D\u6240\u7D0D\u4ED8\u7DCF\u984D\uFF0D\u672C\u4EBA\u8CA0\u62C5\u5408\u8A08"
  }
};

// src/contributions.ts
function householdNhiDeductionAllocation(totalPremium, payer) {
  integer(totalPremium, "householdNationalHealthInsurance");
  if (payer === void 0) throw new CalculationError("INVALID_INPUT", "householdNhiPayer is required");
  if (payer === "HUSBAND") return { husband: totalPremium, wife: 0 };
  if (payer === "WIFE") return { husband: 0, wife: totalPremium };
  throw new CalculationError("INVALID_INPUT", "householdNhiPayer");
}
function householdNhiRaw(people) {
  if (people.length !== 2) throw new CalculationError("OUT_OF_MVP_RANGE", "\u592B\u5A662\u540D\u306E\u307F");
  const m = master.nhi.values;
  const members = people.map((p) => {
    integer(p.age, "age");
    integer(p.businessIncomeAfterBlueDeduction, "nhiIncome");
    return { base: Math.max(0, p.businessIncomeAfterBlueDeduction - nhiBasicDeduction(p.previousTotalIncome)), age: p.age };
  });
  const total = exactInteger(sum(members.map((p) => yen(p.base))));
  const care = members.filter((p) => p.age >= m.careMinAge && p.age < m.careMaxAgeExclusive);
  const part = (base, count, terms) => min(yen(terms.cap), add(yen(terms.fixed * count), rate(yen(base), terms.bps)));
  const medical = part(total, members.length, m.medical), support = part(total, members.length, m.support);
  const nursing = part(exactInteger(sum(care.map((p) => yen(p.base)))), care.length, m.care);
  const children = min(yen(m.children.cap), sum([rate(yen(total), m.children.bps), yen(m.children.fixed * members.length), yen(m.children.adultExtra * members.filter((p) => p.age >= m.children.adultAge).length)]));
  return { bases: members.map((p) => p.base), medical, support, nursing, children, total: sum([medical, support, nursing, children]) };
}
function truncatePositiveFractionToTen(value) {
  if (value.numerator < 0n) throw new CalculationError("INVALID_INPUT", "negativeNhiPremium");
  const whole = value.numerator / value.denominator;
  const rounded = whole / 10n * 10n;
  if (rounded > BigInt(Number.MAX_SAFE_INTEGER)) throw new CalculationError("INVALID_INPUT", "nhiPremiumOverflow");
  return Number(rounded);
}
function householdNhi2026(people) {
  const raw = householdNhiRaw(people);
  const medical = truncatePositiveFractionToTen(raw.medical);
  const support = truncatePositiveFractionToTen(raw.support);
  const nursing = truncatePositiveFractionToTen(raw.nursing);
  const children = truncatePositiveFractionToTen(raw.children);
  return { bases: raw.bases, medical, support, nursing, children, total: medical + support + nursing + children };
}
function nationalPension(eligibleMonths) {
  integer(eligibleMonths, "eligibleMonths");
  if (eligibleMonths > 12) throw new CalculationError("INVALID_INPUT", "eligibleMonths");
  return master.nationalPension.values.monthly * eligibleMonths;
}
function findGrade(salary, grades) {
  integer(salary, "monthlyExecutiveSalary");
  const grade = grades.find((g) => (g.remunerationLowerInclusive === null || salary >= g.remunerationLowerInclusive) && (g.remunerationUpperExclusive === null || salary < g.remunerationUpperExclusive));
  if (!grade) throw new CalculationError("INVALID_INPUT", "\u6A19\u6E96\u5831\u916C\u6708\u984D\u7B49\u7D1A\u306A\u3057");
  return grade;
}
function remunerationGrade(salary, system) {
  if (system === "HEALTH") return findGrade(salary, social_insurance_monthly_remuneration_grades_default.healthInsuranceGrades);
  if (system === "PENSION") return findGrade(salary, social_insurance_monthly_remuneration_grades_default.employeesPensionGrades);
  throw new CalculationError("INVALID_INPUT", "socialInsuranceSystem");
}
function standardMonthlyRemuneration(salary, system) {
  return remunerationGrade(salary, system).standardMonthlyRemuneration;
}
function roundEmployeePayrollHundredths(hundredthsYen) {
  integer(hundredthsYen, "hundredthsYen");
  const whole = Math.floor(hundredthsYen / 100), fraction2 = hundredthsYen % 100;
  return whole + (fraction2 > 50 ? 1 : 0);
}
function officeTotalPremiumHundredths(amounts) {
  const total = amounts.reduce((a, n) => a + integer(n, "premiumHundredthsYen"), 0);
  if (!Number.isSafeInteger(total)) throw new CalculationError("INVALID_INPUT", "premium total overflow");
  return Math.floor(total / 100);
}
function exactContribution(standard, bps, applies) {
  if (!applies) return { fullHundredthsYen: 0, employeeYen: 0 };
  const numerator = standard * bps;
  if (!Number.isSafeInteger(numerator) || numerator % 100 !== 0) throw new CalculationError("SPEC_BLOCKER", "\u516C\u5F0F\u7387\u306E\u91D1\u984D\u30921/100\u5186\u3067\u6B63\u78BA\u306B\u8868\u73FE\u3067\u304D\u306A\u3044");
  const fullHundredthsYen = numerator / 100;
  if (fullHundredthsYen % 2 !== 0) throw new CalculationError("SPEC_BLOCKER", "\u672C\u4EBA\u6298\u534A\u984D\u30921/100\u5186\u3067\u6B63\u78BA\u306B\u8868\u73FE\u3067\u304D\u306A\u3044");
  return { fullHundredthsYen, employeeYen: roundEmployeePayrollHundredths(fullHundredthsYen / 2) };
}
function closeSystem(people) {
  const officeYen = officeTotalPremiumHundredths(people.map((p) => p.fullHundredthsYen));
  const employeeYen = people.reduce((a, p) => a + p.employeeYen, 0);
  return { officeYen, employeeYen, employerYen: officeYen - employeeYen };
}
function socialInsuranceRates(year, month) {
  const date = year * 100 + month;
  const period = social_insurance_monthly_remuneration_grades_default.ratePeriods.find((p) => {
    const from = Number(p.effectiveFrom.slice(0, 7).replace("-", ""));
    const to = p.effectiveTo === null ? Infinity : Number(p.effectiveTo.slice(0, 7).replace("-", ""));
    return date >= from && date <= to;
  });
  if (!period) return block("\u6307\u5B9A\u6708\u306B\u9069\u7528\u3055\u308C\u308B\u5354\u4F1A\u3051\u3093\u307D\u611B\u77E5\u652F\u90E8\u516C\u5F0F\u6599\u7387\u306A\u3057");
  return period;
}
function calculateMonthlySocialInsuranceForActivePeople(people, year, month) {
  integer(year, "year");
  months(month);
  if (year !== 2026) throw new CalculationError("OUT_OF_MVP_RANGE", "socialInsuranceYear=2026 only");
  if (people.length < 1 || people.length > 2) throw new CalculationError("OUT_OF_MVP_RANGE", "active insured count must be 1..2");
  const rates = socialInsuranceRates(year, month);
  const childSupportApplies = rates.childrenSupport > 0 && month >= 4;
  const calculatePerson = (person) => {
    integer(person.age, "age");
    const healthStandard = standardMonthlyRemuneration(person.monthlyExecutiveSalary, "HEALTH");
    const pensionStandard = standardMonthlyRemuneration(person.monthlyExecutiveSalary, "PENSION");
    const careApplies = person.age >= social_insurance_monthly_remuneration_grades_default.ageConditions.nursingCareMinimumAge && person.age < social_insurance_monthly_remuneration_grades_default.ageConditions.nursingCareMaximumAgeExclusive;
    return {
      healthStandardMonthlyRemuneration: healthStandard,
      pensionStandardMonthlyRemuneration: pensionStandard,
      healthInsurance: exactContribution(healthStandard, rates.healthInsurance, true),
      nursingCare: exactContribution(healthStandard, rates.nursingCareInsurance, careApplies),
      childrenSupport: exactContribution(healthStandard, rates.childrenSupport, childSupportApplies),
      employeesPension: exactContribution(pensionStandard, rates.employeesPension, true)
    };
  };
  const perPerson = people.map(calculatePerson);
  function aggregate(key) {
    return closeSystem(perPerson.map((person) => person[key]));
  }
  const systems = { healthInsurance: aggregate("healthInsurance"), nursingCare: aggregate("nursingCare"), childrenSupport: aggregate("childrenSupport"), employeesPension: aggregate("employeesPension") };
  return { year, month, perPerson, systems, total: { officeYen: Object.values(systems).reduce((a, x) => a + x.officeYen, 0), employeeYen: Object.values(systems).reduce((a, x) => a + x.employeeYen, 0), employerYen: Object.values(systems).reduce((a, x) => a + x.employerYen, 0) } };
}
function calculateMonthlySocialInsurance(people, year, month) {
  const result = calculateMonthlySocialInsuranceForActivePeople(people, year, month);
  return { ...result, perPerson: result.perPerson };
}

// src/rounding.ts
function truncateToUnit(value, unit, label) {
  integer(value, label, true);
  integer(unit, "unit");
  if (value < 0) throw new CalculationError("INVALID_INPUT", label);
  return Math.trunc(value / unit) * unit;
}
function truncateFractionToUnit(value, unit, label) {
  integer(unit, "unit");
  if (value.numerator < 0n) throw new CalculationError("INVALID_INPUT", label);
  const whole = value.numerator / value.denominator;
  const result = whole / BigInt(unit) * BigInt(unit);
  if (result > BigInt(Number.MAX_SAFE_INTEGER)) throw new CalculationError("INVALID_INPUT", `${label} overflow`);
  return Number(result);
}
var truncateIncomeTaxTaxableBase = (yen3) => truncateToUnit(yen3, 1e3, "incomeTaxTaxableBase");
var truncateIndividualBusinessTaxableBase = (value) => truncateFractionToUnit(value, 1e3, "individualBusinessTaxableBase");
var truncateIndividualBusinessTaxAmount = (value) => truncateFractionToUnit(value, 100, "individualBusinessTaxAmount");
var truncateCorporationTaxableIncome = (yen3) => truncateToUnit(yen3, 1e3, "corporationTaxableIncome");
var truncateCorporationTaxCalculatedAmount = (value) => truncateFractionToUnit(value, 1, "corporationTaxCalculatedAmount");
var truncateCorporationTaxAmount = (value) => truncateFractionToUnit(value, 100, "corporationTaxAmount");
var truncatePrefecturalCorporateTaxBase = (yen3) => truncateToUnit(yen3, 1e3, "prefecturalCorporateTaxBase");
var truncatePrefecturalCorporateIncomeTax = (value) => truncateFractionToUnit(value, 100, "prefecturalCorporateIncomeTax");
var truncatePrefecturalCorporatePerCapitaTax = (value) => truncateFractionToUnit(value, 100, "prefecturalCorporatePerCapitaTax");
var truncateMunicipalCorporateTaxBase = (yen3) => truncateToUnit(yen3, 1e3, "municipalCorporateTaxBase");
var truncateMunicipalCorporateIncomeTax = (value) => truncateFractionToUnit(value, 100, "municipalCorporateIncomeTax");
var truncateMunicipalCorporatePerCapitaTax = (value) => truncateFractionToUnit(value, 100, "municipalCorporatePerCapitaTax");
var truncateCorporateEnterpriseTaxableIncome = (yen3) => truncateToUnit(yen3, 1e3, "corporateEnterpriseTaxableIncome");
var truncateCorporateEnterpriseTaxAmount = (value) => truncateFractionToUnit(value, 100, "corporateEnterpriseTaxAmount");
var truncateSpecialCorporateEnterpriseTaxAmount = (value) => truncateFractionToUnit(value, 100, "specialCorporateEnterpriseTaxAmount");
var truncateConsumptionTaxIntermediate = (value) => truncateFractionToUnit(value, 1, "consumptionTaxIntermediate");
var truncateConsumptionTaxPayable = (value) => truncateFractionToUnit(value, 100, "consumptionTaxPayable");
var TAX_ROUNDING_SOURCES = Object.freeze({
  nationalTax: Object.freeze({ authority: "e-Gov\u6CD5\u4EE4\u691C\u7D22", title: "\u56FD\u7A0E\u901A\u5247\u6CD5 \u7B2C118\u6761\u30FB\u7B2C119\u6761", url: "https://laws.e-gov.go.jp/law/337AC0000000066", rules: "\u8AB2\u7A0E\u6A19\u6E961,000\u5186\u672A\u6E80\u5207\u6368\u3066\u3001\u56FD\u7A0E\u78BA\u5B9A\u91D1\u984D100\u5186\u672A\u6E80\u5207\u6368\u3066" }),
  corporationShortYear: Object.freeze({ authority: "e-Gov\u6CD5\u4EE4\u691C\u7D22", title: "\u6CD5\u4EBA\u7A0E\u6CD5 \u7B2C66\u6761\u7B2C4\u9805\u30FB\u7B2C12\u9805", url: "https://laws.e-gov.go.jp/law/340AC0000000034", rules: "800\u4E07\u5186\xF712\xD7\u6708\u6570\u3002\u6708\u6570\u306E1\u6708\u672A\u6E80\u7AEF\u6570\u306F1\u6708" }),
  localTax: Object.freeze({ authority: "e-Gov\u6CD5\u4EE4\u691C\u7D22", title: "\u5730\u65B9\u7A0E\u6CD5 \u7B2C20\u6761\u306E4\u306E2", url: "https://laws.e-gov.go.jp/law/325AC0000000226", rules: "\u5730\u65B9\u7A0E\u8AB2\u7A0E\u6A19\u6E961,000\u5186\u672A\u6E80\u5207\u6368\u3066\u3001\u78BA\u5B9A\u91D1\u984D100\u5186\u672A\u6E80\u5207\u6368\u3066" }),
  aichiCorporate: Object.freeze({ authority: "\u611B\u77E5\u770C", title: "\u7B2C6\u53F7\u69D8\u5F0F\u8A18\u8F09\u306E\u624B\u5F15\uFF08\u4EE4\u548C7\u5E744\u67081\u65E5\u4EE5\u5F8C\u958B\u59CB\u4E8B\u696D\u5E74\u5EA6\u7528\uFF09", url: "https://www.pref.aichi.jp/uploaded/attachment/628210.pdf", rules: "000\u6B04\u306F1,000\u5186\u300100\u6B04\u306F100\u5186\u672A\u6E80\u5207\u6368\u3066\u3002\u5DEE\u5F15\u4E8B\u696D\u7A0E\u984D\u306F100\u5186\u672A\u6E80\u5207\u6368\u3066\u3002\u6A19\u6E96\u7A0E\u7387\u6CD5\u4EBA\u306E\u78BA\u5B9A\u6240\u5F97\u5272\u984D\u3092\u7279\u5225\u6CD5\u4EBA\u4E8B\u696D\u7A0E\u8AB2\u7A0E\u6A19\u6E96\u3078\u8EE2\u8A18" }),
  aichiPerCapita: Object.freeze({ authority: "\u611B\u77E5\u770C", title: "\u770C\u7A0EQ&A\uFF08\u6CD5\u4EBA\u770C\u6C11\u7A0E\u30FB\u6CD5\u4EBA\u4E8B\u696D\u7A0E\uFF09", url: "https://www.pref.aichi.jp/soshiki/zeimu/0000034242.html", rules: "\u5747\u7B49\u5272\u306E\u6708\u6570\u6309\u5206\u5F8C100\u5186\u672A\u6E80\u5207\u6368\u3066" }),
  consumption: Object.freeze({ authority: "\u56FD\u7A0E\u5E81", title: "\u6D88\u8CBB\u7A0E\u53CA\u3073\u5730\u65B9\u6D88\u8CBB\u7A0E\u7533\u544A\u66F8\uFF08\u4E00\u822C\u7528\uFF09\u306E\u66F8\u304D\u65B9", url: "https://www.nta.go.jp/publication/pamph/shohi/kaisei/yoshiki/pdf/202411_01.pdf", rules: "\u5DEE\u5F15\u7A0E\u984D\u3068\u8B72\u6E21\u5272\u984D\u3092\u5404100\u5186\u672A\u6E80\u5207\u6368\u3066" }),
  individualBusiness: Object.freeze({ authority: "\u5730\u65B9\u7A0E\u6CD5\u30FB\u611B\u77E5\u770C", title: "\u5730\u65B9\u7A0E\u6CD5 \u7B2C20\u6761\u306E4\u306E2\uFF0F\u500B\u4EBA\u4E8B\u696D\u7A0E", url: "https://www.pref.aichi.jp/soshiki/zeimu/0000042391.html", rules: "\u4E8B\u696D\u7A0E\u8AB2\u7A0E\u6A19\u6E961,000\u5186\u672A\u6E80\u3001\u78BA\u5B9A\u7A0E\u984D100\u5186\u672A\u6E80\u5207\u6368\u3066" })
});

// src/corporate.ts
function individualBusinessTax2026(beforeBlue, bps, businessMonths) {
  integer(beforeBlue, "beforeBlue", true);
  months(businessMonths);
  if (!master.individualBusinessTax.values.allowedBps.includes(bps)) throw new CalculationError("INVALID_INPUT", "businessTaxRate");
  const rawBase = max(yen(0), subtract(yen(beforeBlue), scale(yen(master.individualBusinessTax.values.deduction), businessMonths, 12)));
  const taxableBase = truncateIndividualBusinessTaxableBase(rawBase);
  const rawTax = rate(yen(taxableBase), bps);
  return { taxableBase, rawTax, tax: truncateIndividualBusinessTaxAmount(rawTax) };
}
function corporationTaxThreshold(businessMonths = 12) {
  months(businessMonths);
  return scale(yen(master.corporationTax.values.threshold), businessMonths, 12);
}
function corporationTaxRaw(income, businessMonths = 12) {
  integer(income, "income", true);
  const m = master.corporationTax.values;
  const base = yen(Math.max(0, income)), threshold = corporationTaxThreshold(businessMonths);
  return add(rate(min(base, threshold), m.lowerBps), rate(max(yen(0), subtract(base, threshold)), m.upperBps));
}
function corporationTax2026(income, businessMonths = 12) {
  integer(income, "income", true);
  months(businessMonths);
  const taxableIncome = truncateCorporationTaxableIncome(Math.max(0, income));
  const threshold = corporationTaxThreshold(businessMonths);
  const rawTax = corporationTaxRaw(taxableIncome, businessMonths);
  const calculatedTax = truncateCorporationTaxCalculatedAmount(rawTax);
  return { taxableIncome, threshold, rawTax, calculatedTax, tax: truncateCorporationTaxAmount(yen(calculatedTax)) };
}
function corporateEnterpriseTaxRaw(income, businessMonths) {
  integer(income, "income", true);
  months(businessMonths);
  const m = master.enterprise.values;
  if (income > m.incomeLimit) throw new CalculationError("OUT_OF_MVP_RANGE", "\u5E74\u6240\u5F975000\u4E07\u5186\u8D85");
  const threshold1 = scale(yen(m.first), businessMonths, 12), threshold2 = scale(yen(m.second), businessMonths, 12), base = yen(Math.max(0, income));
  const tax = sum([rate(min(base, threshold1), m.firstBps), rate(max(yen(0), subtract(min(base, threshold2), threshold1)), m.secondBps), rate(max(yen(0), subtract(base, threshold2)), m.thirdBps)]);
  return { threshold1, threshold2, baseCorporateEnterpriseTax: tax, specialCorporateEnterpriseTax: rate(tax, m.specialBps) };
}
function corporateEnterpriseTax2026(income, businessMonths) {
  integer(income, "income", true);
  months(businessMonths);
  const taxableIncome = truncateCorporateEnterpriseTaxableIncome(Math.max(0, income));
  const raw = corporateEnterpriseTaxRaw(taxableIncome, businessMonths);
  const baseCorporateEnterpriseTax = truncateCorporateEnterpriseTaxAmount(raw.baseCorporateEnterpriseTax);
  const specialRawTax = rate(yen(baseCorporateEnterpriseTax), master.enterprise.values.specialBps);
  return { ...raw, taxableIncome, baseCorporateEnterpriseTax, specialCorporateEnterpriseTaxBase: baseCorporateEnterpriseTax, specialRawTax, specialCorporateEnterpriseTax: truncateSpecialCorporateEnterpriseTaxAmount(specialRawTax) };
}
function corporateLocalTaxRaw(capital, corporationTaxBase, presenceMonths) {
  integer(capital, "capital");
  months(presenceMonths);
  const m = master.corporateLocal.values;
  if (compare(corporationTaxBase, yen(0)) < 0) throw new CalculationError("INVALID_INPUT", "corporationTaxBase");
  if (capital > m.capitalLimit || compare(corporationTaxBase, yen(m.prefecturalTaxLimit)) > 0 || compare(corporationTaxBase, yen(m.municipalTaxLimit)) > 0) throw new CalculationError("OUT_OF_MVP_RANGE", "\u7B2C28\u30FB29\u6761\u306E\u9069\u7528\u7BC4\u56F2\u5916");
  return { prefecturalIncome: rate(corporationTaxBase, m.prefecturalBps), municipalIncome: rate(corporationTaxBase, m.municipalBps), prefecturalPerCapita: scale(yen(m.prefecturalFixed), presenceMonths, 12), municipalPerCapita: scale(yen(m.municipalFixed), presenceMonths, 12) };
}
function corporateLocalTax2026(capital, corporationTaxAmount, presenceMonths) {
  integer(corporationTaxAmount, "corporationTaxAmount");
  const prefecturalTaxBase = truncatePrefecturalCorporateTaxBase(corporationTaxAmount);
  const municipalTaxBase = truncateMunicipalCorporateTaxBase(corporationTaxAmount);
  const raw = corporateLocalTaxRaw(capital, yen(corporationTaxAmount), presenceMonths);
  const prefecturalIncome = truncatePrefecturalCorporateIncomeTax(rate(yen(prefecturalTaxBase), master.corporateLocal.values.prefecturalBps));
  const municipalIncome = truncateMunicipalCorporateIncomeTax(rate(yen(municipalTaxBase), master.corporateLocal.values.municipalBps));
  const prefecturalPerCapita = truncatePrefecturalCorporatePerCapitaTax(raw.prefecturalPerCapita);
  const municipalPerCapita = truncateMunicipalCorporatePerCapitaTax(raw.municipalPerCapita);
  return { prefecturalTaxBase, municipalTaxBase, prefecturalIncome, municipalIncome, prefecturalPerCapita, municipalPerCapita, prefecturalTotal: prefecturalIncome + prefecturalPerCapita, municipalTotal: municipalIncome + municipalPerCapita, total: prefecturalIncome + municipalIncome + prefecturalPerCapita + municipalPerCapita };
}
function consumptionTaxRaw(input) {
  switch (input.status) {
    case "EXEMPT":
      return yen(0);
    case "GENERAL":
      integer(input.output, "output");
      integer(input.deductibleInput, "deductibleInput");
      return subtract(yen(input.output), yen(input.deductibleInput));
    case "SIMPLIFIED":
      integer(input.output, "output");
      integer(input.deemedPurchaseBps, "deemedPurchaseBps");
      if (input.deemedPurchaseBps > 1e4) throw new CalculationError("INVALID_INPUT", "deemedPurchaseBps");
      return rate(yen(input.output), 1e4 - input.deemedPurchaseBps);
    case "SPECIAL_20_PERCENT":
      if (input.eligible !== true) throw new CalculationError("INVALID_INPUT", "2\u5272\u7279\u4F8B\u306E\u9069\u7528\u8981\u4EF6\u672A\u5145\u8DB3");
      integer(input.output, "output");
      return rate(yen(input.output), master.consumption.values.specialBps);
    case "MANUAL":
      integer(input.amount, "amount", true);
      return yen(input.amount);
    default:
      throw new CalculationError("INVALID_INPUT", "consumptionTaxStatus");
  }
}
function consumptionTax2026(input) {
  const raw = consumptionTaxRaw(input);
  if (compare(raw, yen(0)) <= 0) return { raw, intermediateTax: 0, payable: 0, refund: raw.numerator < 0n ? truncateConsumptionTaxIntermediate({ numerator: -raw.numerator, denominator: raw.denominator }) : 0 };
  const intermediateTax = truncateConsumptionTaxIntermediate(raw);
  return { raw, intermediateTax, payable: truncateConsumptionTaxPayable(yen(intermediateTax)), refund: 0 };
}

// src/comparison.ts
function compareFinalizedAmounts(householdA, husbandB, wifeB, corporateAfterTaxProfit) {
  for (const n of [householdA, husbandB, wifeB, corporateAfterTaxProfit]) integer(n, "finalizedAmount", true);
  const householdB = exactInteger(sum([yen(husbandB), yen(wifeB)]));
  const wealthB = exactInteger(sum([yen(householdB), yen(corporateAfterTaxProfit)]));
  return { householdDisposableIncomeA: householdA, householdDisposableIncomeB: householdB, disposableIncomeDifference: exactInteger(subtract(yen(householdB), yen(householdA))), corporateAfterTaxProfit, totalWealthIncreaseA: householdA, totalWealthIncreaseB: wealthB, wealthDifference: exactInteger(subtract(yen(wealthB), yen(householdA))) };
}
function householdDisposableIncomeCaseA(husbandBeforeNhi, wifeBeforeNhi, householdNationalHealthInsurance) {
  integer(husbandBeforeNhi, "husbandBeforeNhi", true);
  integer(wifeBeforeNhi, "wifeBeforeNhi", true);
  integer(householdNationalHealthInsurance, "householdNationalHealthInsurance");
  return exactInteger(subtract(sum([yen(husbandBeforeNhi), yen(wifeBeforeNhi)]), yen(householdNationalHealthInsurance)));
}
function validateAnnualMonthly(values, label) {
  if (values.length !== 12) throw new CalculationError("INVALID_INPUT", `${label}: 12\u304B\u6708\u5B9F\u984D\u304C\u5FC5\u8981`);
  values.forEach((value) => integer(value, label));
}
function finalizedIncomeTax(totalIncome, deductions) {
  const taxableIncome = truncateIncomeTaxTaxableBase(Math.max(0, totalIncome - deductions));
  const incomeTax = baseIncomeTax(taxableIncome);
  const reconstruction = reconstructionTax(incomeTax);
  return { taxableIncome, incomeTax, reconstructionTax: reconstruction.reconstruction, payable: reconstruction.simpleFinalTaxAfter100YenRounding };
}
function finalizedResidentTax(reference) {
  for (const value of [reference.totalIncome, reference.deductionsExcludingBasic, reference.personalDeductionDifferenceTotal]) integer(value, "residentReference");
  const taxableIncome = truncateIncomeTaxTaxableBase(Math.max(0, reference.totalIncome - residentBasicDeduction2026(reference.totalIncome) - reference.deductionsExcludingBasic));
  if (!["FULL", "INCOME_ONLY", "NONE"].includes(reference.exemptionStatus)) throw new CalculationError("INVALID_INPUT", "residentExemptionStatus");
  return { taxableIncome, ...residentTax2026({ taxableIncome, totalIncome: reference.totalIncome, personalDeductionDifferenceTotal: reference.personalDeductionDifferenceTotal, exemptionStatus: reference.exemptionStatus }) };
}
function annualSocialInsurance(input) {
  validateAnnualMonthly(input.husband.monthlyExecutiveSalary, "husbandMonthlyExecutiveSalary");
  validateAnnualMonthly(input.wife.monthlyExecutiveSalary, "wifeMonthlyExecutiveSalary");
  const monthsSeen = /* @__PURE__ */ new Set();
  const perPerson = [{ healthInsurance: 0, nursingCare: 0, childrenSupport: 0, employeesPension: 0 }, { healthInsurance: 0, nursingCare: 0, childrenSupport: 0, employeesPension: 0 }];
  const employer = { healthInsurance: 0, nursingCare: 0, childrenSupport: 0, employeesPension: 0 };
  for (const month of input.socialInsuranceMonths) {
    integer(month, "socialInsuranceMonth");
    if (month < 1 || month > 12 || monthsSeen.has(month)) throw new CalculationError("INVALID_INPUT", "socialInsuranceMonths");
    monthsSeen.add(month);
    const monthly2 = calculateMonthlySocialInsurance([{ monthlyExecutiveSalary: input.husband.monthlyExecutiveSalary[month - 1], age: input.husband.age }, { monthlyExecutiveSalary: input.wife.monthlyExecutiveSalary[month - 1], age: input.wife.age }], 2026, month);
    for (const key of ["healthInsurance", "nursingCare", "childrenSupport", "employeesPension"]) {
      perPerson[0][key] += monthly2.perPerson[0][key].employeeYen;
      perPerson[1][key] += monthly2.perPerson[1][key].employeeYen;
      employer[key] += monthly2.systems[key].employerYen;
    }
  }
  const personTotal = perPerson.map((person) => Object.values(person).reduce((a, b) => a + b, 0));
  return { perPerson, personTotal, employer, employeeTotal: personTotal[0] + personTotal[1], employerTotal: Object.values(employer).reduce((a, b) => a + b, 0) };
}
function caseAPerson(person, nhiDeduction) {
  integer(person.age, "age");
  integer(person.otherIncome, "otherIncome", true);
  for (const n of [person.otherIncomeDeductions, person.ideco, person.smallBusinessMutualAid, person.previousTotalIncome]) integer(n, "caseAPersonInput");
  const business = businessIncome(person.sales, person.expenses, person.blueReturnDeduction);
  const pension = nationalPension(person.nationalPensionMonths);
  const totalIncome = business.businessIncomeAfterBlueDeduction + person.otherIncome;
  const deductions = incomeTaxBasicDeduction(totalIncome) + person.otherIncomeDeductions + person.ideco + person.smallBusinessMutualAid + pension + nhiDeduction;
  const incomeTax = finalizedIncomeTax(totalIncome, deductions), resident = finalizedResidentTax(person.residentReference), businessTax = individualBusinessTax2026(business.businessIncomeBeforeBlueDeduction, person.businessTaxRateBps, person.businessMonths), consumption2 = consumptionTax2026(person.consumptionTax);
  const beforeNhi = person.sales - person.expenses - incomeTax.payable - resident.total - businessTax.tax - pension - person.ideco - person.smallBusinessMutualAid - consumption2.payable + consumption2.refund;
  return { business, totalIncome, deductions, incomeTax, resident, nationalPension: pension, individualBusinessTax: businessTax, consumptionTax: consumption2, disposableIncomeBeforeNhi: beforeNhi };
}
function caseBPerson(person, annualSalary, employeeSocialInsurance) {
  integer(person.age, "age");
  integer(person.otherIncome, "otherIncome", true);
  for (const n of [person.otherIncomeDeductions, person.ideco, person.smallBusinessMutualAid]) integer(n, "caseBPersonInput");
  const salary = salaryIncomeRaw(annualSalary), salaryIncome = exactInteger(salary.salaryIncome), totalIncome = salaryIncome + person.otherIncome;
  const deductions = incomeTaxBasicDeduction(totalIncome) + person.otherIncomeDeductions + person.ideco + person.smallBusinessMutualAid + employeeSocialInsurance;
  const incomeTax = finalizedIncomeTax(totalIncome, deductions), resident = finalizedResidentTax(person.residentReference);
  return { annualSalary, salaryIncomeDeduction: exactInteger(salary.salaryIncomeDeduction), salaryIncome, totalIncome, deductions, incomeTax, resident, employeeSocialInsurance, disposableIncome: annualSalary - incomeTax.payable - resident.total - employeeSocialInsurance - person.ideco - person.smallBusinessMutualAid };
}
function calculateComparison(input) {
  if (input?.assessmentYear !== 2026) throw new CalculationError("OUT_OF_MVP_RANGE", "assessmentYear=2026 only");
  const aBusiness = { husband: businessIncome(input.caseA.husband.sales, input.caseA.husband.expenses, input.caseA.husband.blueReturnDeduction), wife: businessIncome(input.caseA.wife.sales, input.caseA.wife.expenses, input.caseA.wife.blueReturnDeduction) };
  const nhi = householdNhi2026([{ age: input.caseA.husband.age, businessIncomeAfterBlueDeduction: aBusiness.husband.businessIncomeAfterBlueDeduction, previousTotalIncome: input.caseA.husband.previousTotalIncome }, { age: input.caseA.wife.age, businessIncomeAfterBlueDeduction: aBusiness.wife.businessIncomeAfterBlueDeduction, previousTotalIncome: input.caseA.wife.previousTotalIncome }]);
  const allocation = householdNhiDeductionAllocation(nhi.total, input.householdNhiPayer);
  const caseA = { husband: caseAPerson(input.caseA.husband, allocation.husband), wife: caseAPerson(input.caseA.wife, allocation.wife), householdNationalHealthInsurance: nhi, nhiDeductionAllocation: allocation, householdDisposableIncome: 0 };
  caseA.householdDisposableIncome = householdDisposableIncomeCaseA(caseA.husband.disposableIncomeBeforeNhi, caseA.wife.disposableIncomeBeforeNhi, nhi.total);
  const social = annualSocialInsurance(input.caseB);
  const annualSalary = [input.caseB.husband.monthlyExecutiveSalary.reduce((a, b) => a + b, 0), input.caseB.wife.monthlyExecutiveSalary.reduce((a, b) => a + b, 0)];
  const bH = caseBPerson(input.caseB.husband, annualSalary[0], social.personTotal[0]), bW = caseBPerson(input.caseB.wife, annualSalary[1], social.personTotal[1]);
  const householdDisposableIncomeB = bH.disposableIncome + bW.disposableIncome;
  const c = input.corporation;
  for (const n of [c.capital, c.sales, c.operatingExpenses, c.additionalExpenses, c.accountantCost, c.maintenanceCost, c.otherFixedCost]) integer(n, "corporationInput");
  for (const value of [c.establishmentDate, c.fiscalYearStart, c.fiscalYearEnd]) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) throw new CalculationError("INVALID_INPUT", "corporationDates");
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    if (date.toISOString().slice(0, 10) !== value) throw new CalculationError("INVALID_INPUT", "corporationDates");
  }
  if (c.fiscalYearStart > c.fiscalYearEnd) throw new CalculationError("INVALID_INPUT", "corporationDates");
  for (const flag of [c.invoiceRegistered, c.taxableBusinessElection, c.specificNewCorporationFlag]) if (typeof flag !== "boolean") throw new CalculationError("INVALID_INPUT", "corporationConsumptionFlags");
  const corporateIncomeBeforeTax = c.sales - c.operatingExpenses - c.additionalExpenses - annualSalary[0] - annualSalary[1] - social.employerTotal - c.maintenanceCost - c.accountantCost - c.otherFixedCost;
  const corporationTax = corporationTax2026(corporateIncomeBeforeTax, c.businessMonths), local = corporateLocalTax2026(c.capital, corporationTax.calculatedTax, c.presenceMonths), enterprise = corporateEnterpriseTax2026(corporateIncomeBeforeTax, c.businessMonths), consumption2 = consumptionTax2026(c.consumptionTax);
  const corporateAfterTaxProfit = corporateIncomeBeforeTax - corporationTax.tax - local.total - enterprise.baseCorporateEnterpriseTax - enterprise.specialCorporateEnterpriseTax - consumption2.payable + consumption2.refund;
  return { assessmentYear: 2026, caseA, caseB: { husband: bH, wife: bW, socialInsurance: social, householdDisposableIncome: householdDisposableIncomeB }, corporation: { corporateIncomeBeforeTax, corporationTax, corporateLocalTax: local, corporateEnterpriseTax: enterprise, consumptionTax: consumption2, corporateAfterTaxProfit }, comparison: compareFinalizedAmounts(caseA.householdDisposableIncome, bH.disposableIncome, bW.disposableIncome, corporateAfterTaxProfit) };
}

// src/ui.ts
var required = (values, name) => {
  const value = values[name]?.trim();
  if (!value) throw new Error(`${name} \u306F\u5FC5\u9808\u3067\u3059`);
  return value;
};
var numberValue = (values, name, signed = false) => {
  const value = Number(required(values, name));
  if (!Number.isSafeInteger(value) || !signed && value < 0) throw new Error(`${name} \u306F0\u4EE5\u4E0A\u306E\u6574\u6570\u3067\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044`);
  return value;
};
var booleanValue = (values, name) => {
  const value = required(values, name);
  if (value !== "true" && value !== "false") throw new Error(`${name} \u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044`);
  return value === "true";
};
var consumption = (values, name) => {
  const status = required(values, name);
  if (status === "EXEMPT") return { status: "EXEMPT" };
  if (status === "GENERAL") return { status: "GENERAL", output: numberValue(values, `${name}.output`), deductibleInput: numberValue(values, `${name}.deductibleInput`) };
  if (status === "SIMPLIFIED") return { status: "SIMPLIFIED", output: numberValue(values, `${name}.output`), deemedPurchaseBps: numberValue(values, `${name}.deemedPurchaseBps`) };
  if (status === "SPECIAL_20_PERCENT") return { status: "SPECIAL_20_PERCENT", output: numberValue(values, `${name}.output`), eligible: booleanValue(values, `${name}.eligible`) };
  if (status === "MANUAL") return { status: "MANUAL", amount: numberValue(values, `${name}.amount`, true) };
  throw new Error(`${name} \u306E\u6D88\u8CBB\u7A0E\u30B9\u30C6\u30FC\u30BF\u30B9\u304C\u4E0D\u6B63\u3067\u3059`);
};
var monthly = (values, prefix) => Array.from({ length: 12 }, (_, i) => numberValue(values, `${prefix}.${i + 1}`));
var personA = (values, person) => ({
  sales: numberValue(values, `${person}.sales`),
  expenses: numberValue(values, `${person}.expenses`),
  blueReturnDeduction: numberValue(values, `${person}.blueReturnDeduction`),
  age: numberValue(values, `${person}.age`),
  businessTaxRateBps: numberValue(values, `${person}.businessTaxRateBps`),
  otherIncome: numberValue(values, `${person}.otherIncome`, true),
  otherIncomeDeductions: numberValue(values, `${person}.otherIncomeDeductions`),
  ideco: numberValue(values, `${person}.ideco`),
  smallBusinessMutualAid: numberValue(values, `${person}.smallBusinessMutualAid`),
  consumptionTax: consumption(values, `${person}.consumptionTax`),
  nationalPensionMonths: numberValue(values, `${person}.nationalPensionMonths`),
  businessMonths: numberValue(values, `${person}.businessMonths`),
  previousTotalIncome: numberValue(values, `${person}.previousTotalIncome`),
  residentReference: {
    totalIncome: numberValue(values, `${person}.resident.totalIncome`),
    deductionsExcludingBasic: numberValue(values, `${person}.resident.deductionsExcludingBasic`),
    personalDeductionDifferenceTotal: numberValue(values, `${person}.resident.personalDeductionDifferenceTotal`),
    exemptionStatus: required(values, `${person}.resident.exemptionStatus`)
  }
});
var personB = (values, person) => ({
  age: numberValue(values, `${person}.age`),
  monthlyExecutiveSalary: monthly(values, `${person}.salary`),
  otherIncome: numberValue(values, `${person}.otherIncome`, true),
  otherIncomeDeductions: numberValue(values, `${person}.otherIncomeDeductions`),
  ideco: numberValue(values, `${person}.ideco`),
  smallBusinessMutualAid: numberValue(values, `${person}.smallBusinessMutualAid`),
  residentReference: {
    totalIncome: numberValue(values, `${person}.resident.totalIncome`),
    deductionsExcludingBasic: numberValue(values, `${person}.resident.deductionsExcludingBasic`),
    personalDeductionDifferenceTotal: numberValue(values, `${person}.resident.personalDeductionDifferenceTotal`),
    exemptionStatus: required(values, `${person}.resident.exemptionStatus`)
  }
});
function parseFormValues(values) {
  return {
    assessmentYear: 2026,
    householdNhiPayer: required(values, "householdNhiPayer"),
    caseA: { husband: personA(values, "husbandA"), wife: personA(values, "wifeA") },
    caseB: { husband: personB(values, "husbandB"), wife: personB(values, "wifeB"), socialInsuranceMonths: Array.from({ length: 12 }, (_, i) => i + 1) },
    corporation: {
      capital: numberValue(values, "corporation.capital"),
      establishmentDate: required(values, "corporation.establishmentDate"),
      fiscalYearStart: required(values, "corporation.fiscalYearStart"),
      fiscalYearEnd: required(values, "corporation.fiscalYearEnd"),
      businessMonths: numberValue(values, "corporation.businessMonths"),
      presenceMonths: numberValue(values, "corporation.presenceMonths"),
      sales: numberValue(values, "corporation.sales"),
      operatingExpenses: numberValue(values, "corporation.operatingExpenses"),
      additionalExpenses: numberValue(values, "corporation.additionalExpenses"),
      accountantCost: numberValue(values, "corporation.accountantCost"),
      maintenanceCost: numberValue(values, "corporation.maintenanceCost"),
      otherFixedCost: numberValue(values, "corporation.otherFixedCost"),
      invoiceRegistered: booleanValue(values, "corporation.invoiceRegistered"),
      taxableBusinessElection: booleanValue(values, "corporation.taxableBusinessElection"),
      specificNewCorporationFlag: booleanValue(values, "corporation.specificNewCorporationFlag"),
      consumptionTax: consumption(values, "corporation.consumptionTax")
    }
  };
}
function calculateFromForm(values) {
  try {
    return { result: calculateComparison(parseFormValues(values)), error: null };
  } catch (error) {
    return { result: null, error: error instanceof CalculationError || error instanceof Error ? error.message : "\u5165\u529B\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044" };
  }
}
var yen2 = (value) => `${new Intl.NumberFormat("ja-JP").format(value)}\u5186`;
var field = (label, name, type = "number", requiredField = true) => `<label>${label}<input name="${name}" type="${type}"${requiredField ? " required" : ""}></label>`;
var select = (label, name, options) => `<label>${label}<select name="${name}" required><option value="">\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044</option>${options.map((value) => `<option value="${value}">${value}</option>`).join("")}</select></label>`;
function personFields(prefix, title, salary = false) {
  const basics = salary ? `${field("\u5E74\u9F62", `${prefix}.age`)}${field("\u305D\u306E\u4ED6\u6240\u5F97", `${prefix}.otherIncome`)}${field("\u305D\u306E\u4ED6\u63A7\u9664", `${prefix}.otherIncomeDeductions`)}${field("iDeCo\uFF08\u5E74\u984D\uFF09", `${prefix}.ideco`)}${field("\u5C0F\u898F\u6A21\u4F01\u696D\u5171\u6E08\uFF08\u5E74\u984D\uFF09", `${prefix}.smallBusinessMutualAid`)}` : `${field("\u5E74\u9593\u58F2\u4E0A", `${prefix}.sales`)}${field("\u5E74\u9593\u7D4C\u8CBB", `${prefix}.expenses`)}${field("\u5E74\u9F62", `${prefix}.age`)}${select("\u9752\u8272\u7533\u544A\u7279\u5225\u63A7\u9664", `${prefix}.blueReturnDeduction`, ["0", "550000", "650000"])}${field("\u305D\u306E\u4ED6\u6240\u5F97", `${prefix}.otherIncome`)}${field("\u305D\u306E\u4ED6\u63A7\u9664", `${prefix}.otherIncomeDeductions`)}${field("iDeCo\uFF08\u5E74\u984D\uFF09", `${prefix}.ideco`)}${field("\u5C0F\u898F\u6A21\u4F01\u696D\u5171\u6E08\uFF08\u5E74\u984D\uFF09", `${prefix}.smallBusinessMutualAid`)}`;
  const salaryFields = salary ? `<div class="months">${Array.from({ length: 12 }, (_, i) => field(`${i + 1}\u6708\u306E\u5F79\u54E1\u5831\u916C`, `${prefix}.salary.${i + 1}`)).join("")}</div>` : `${field("\u500B\u4EBA\u4E8B\u696D\u7A0E\u7387\uFF08bps\uFF09", `${prefix}.businessTaxRateBps`)}${field("\u56FD\u6C11\u5E74\u91D1\u5BFE\u8C61\u6708\u6570", `${prefix}.nationalPensionMonths`)}${field("\u4E8B\u696D\u6708\u6570", `${prefix}.businessMonths`)}${field("\u524D\u5E74\u7DCF\u6240\u5F97", `${prefix}.previousTotalIncome`)}`;
  const resident = `<div class="grid">${field("\u4F4F\u6C11\u7A0E\u57FA\u6E96\u30FB\u7DCF\u6240\u5F97", `${prefix}.resident.totalIncome`)}${field("\u4F4F\u6C11\u7A0E\u57FA\u6E96\u30FB\u57FA\u672C\u63A7\u9664\u4EE5\u5916", `${prefix}.resident.deductionsExcludingBasic`)}${field("\u4EBA\u7684\u63A7\u9664\u5DEE\u8ABF\u6574\u984D", `${prefix}.resident.personalDeductionDifferenceTotal`)}${select("\u4F4F\u6C11\u7A0E\u975E\u8AB2\u7A0E\u533A\u5206", `${prefix}.resident.exemptionStatus`, ["FULL", "INCOME_ONLY", "NONE"])}</div>`;
  return `<fieldset><legend>${title}</legend><div class="grid">${basics}${salaryFields}${salary ? "" : select("\u6D88\u8CBB\u7A0E\u30B9\u30C6\u30FC\u30BF\u30B9", `${prefix}.consumptionTax`, ["EXEMPT"])}</div><small>\u4F4F\u6C11\u7A0E\u306E\u8A08\u7B97\u57FA\u6E96\u3082\u30A8\u30F3\u30B8\u30F3\u306E\u5FC5\u9808\u5165\u529B\u3067\u3059\u3002</small>${resident}</fieldset>`;
}
function render() {
  const root = document.querySelector("#app");
  root.innerHTML = `<h1>\u6CD5\u4EBA\u5316\u30B7\u30DF\u30E5\u30EC\u30FC\u30BF\u30FC</h1><p>2026\u5E74\u30FB\u540D\u53E4\u5C4B\u5E02/\u611B\u77E5\u770C\u306EPhase 1\u8A08\u7B97\u30A8\u30F3\u30B8\u30F3\u3092\u4F7F\u3044\u307E\u3059\u3002\u5FC5\u9808\u9805\u76EE\u3092\u3059\u3079\u3066\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002</p><form id="form">${select("\u56FD\u6C11\u5065\u5EB7\u4FDD\u967A\u6599\u306E\u652F\u6255\u8005", "householdNhiPayer", ["HUSBAND", "WIFE"])}<h2>CASE-A \u500B\u4EBA\u4E8B\u696D</h2>${personFields("husbandA", "\u592B")}${personFields("wifeA", "\u59BB")}<h2>CASE-B \u6CD5\u4EBA\u5316</h2>${personFields("husbandB", "\u592B\u306E\u5F79\u54E1\u5165\u529B", true)}${personFields("wifeB", "\u59BB\u306E\u5F79\u54E1\u5165\u529B", true)}<fieldset><legend>\u6CD5\u4EBA\u5165\u529B</legend><div class="grid">${field("\u6CD5\u4EBA\u8CC7\u672C\u91D1", "corporation.capital")}${field("\u8A2D\u7ACB\u65E5", "corporation.establishmentDate", "date")}${field("\u4E8B\u696D\u5E74\u5EA6\u958B\u59CB\u65E5", "corporation.fiscalYearStart", "date")}${field("\u4E8B\u696D\u5E74\u5EA6\u7D42\u4E86\u65E5", "corporation.fiscalYearEnd", "date")}${field("\u58F2\u4E0A", "corporation.sales")}${field("\u55B6\u696D\u7D4C\u8CBB", "corporation.operatingExpenses")}${field("\u8FFD\u52A0\u6CD5\u4EBA\u7D4C\u8CBB", "corporation.additionalExpenses")}${field("\u7A0E\u7406\u58EB\u8CBB\u7528", "corporation.accountantCost")}${field("\u7DAD\u6301\u8CBB", "corporation.maintenanceCost")}${field("\u305D\u306E\u4ED6\u56FA\u5B9A\u8CBB", "corporation.otherFixedCost")}${field("\u4E8B\u696D\u6708\u6570", "corporation.businessMonths")}${field("\u6CD5\u4EBA\u6240\u5728\u6708\u6570", "corporation.presenceMonths")}${select("\u30A4\u30F3\u30DC\u30A4\u30B9\u767B\u9332", "corporation.invoiceRegistered", ["true", "false"])}${select("\u8AB2\u7A0E\u4E8B\u696D\u8005\u9078\u629E", "corporation.taxableBusinessElection", ["true", "false"])}${select("\u7279\u5B9A\u65B0\u8A2D\u6CD5\u4EBA", "corporation.specificNewCorporationFlag", ["true", "false"])}${select("\u6CD5\u4EBA\u6D88\u8CBB\u7A0E\u30B9\u30C6\u30FC\u30BF\u30B9", "corporation.consumptionTax", ["EXEMPT"])}</div></fieldset><button type="submit">\u8A08\u7B97\u3059\u308B</button></form><section id="results" class="results" aria-live="polite"></section>`;
  root.querySelector("#form").addEventListener("submit", (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const outcome = calculateFromForm(values);
    const results = root.querySelector("#results");
    if (outcome.error) {
      results.innerHTML = `<p class="error" role="alert">${outcome.error}</p>`;
      return;
    }
    const result = outcome.result;
    const difference = result.comparison.wealthDifference;
    results.innerHTML = `<h2>\u8A08\u7B97\u7D50\u679C</h2><div class="result-grid"><div class="result-card"><h3>CASE-A</h3><p>\u4E16\u5E2F\u53EF\u51E6\u5206\u6240\u5F97</p><div class="amount">${yen2(result.comparison.householdDisposableIncomeA)}</div></div><div class="result-card"><h3>CASE-B</h3><p>\u4E16\u5E2F\u53EF\u51E6\u5206\u6240\u5F97</p><div class="amount">${yen2(result.comparison.householdDisposableIncomeB)}</div><p>\u6CD5\u4EBA\u7559\u4FDD</p><div class="amount">${yen2(result.comparison.corporateAfterTaxProfit)}</div><p>\u4E16\u5E2F + \u6CD5\u4EBA\u306E\u7DCF\u8CC7\u7523\u5897\u52A0</p><div class="amount">${yen2(result.comparison.totalWealthIncreaseB)}</div></div><div class="result-card"><h3>\u6BD4\u8F03</h3><p>CASE-B \u2212 CASE-A</p><div class="amount ${difference >= 0 ? "advantage" : "disadvantage"}">${yen2(difference)}</div><p class="${difference >= 0 ? "advantage" : "disadvantage"}">${difference >= 0 ? "\u6CD5\u4EBA\u5316\u304C\u6709\u5229" : "\u6CD5\u4EBA\u5316\u304C\u4E0D\u5229"}</p></div></div>`;
  });
}
if (typeof document !== "undefined") render();
export {
  calculateFromForm,
  parseFormValues
};
