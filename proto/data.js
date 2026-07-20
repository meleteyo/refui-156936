/**
 * EDEN OS (이든철강 통합 운영 시스템) — proto 트랙 도메인 mock 데이터
 * 프로젝트 #156936
 *
 * 근거: models/5_프로토타입모델_*.md · 3_실행계획.md §3(DB)·§4(API)·§5(BS)
 * 규칙: ENUM 대문자(ProjectStatus) · solution_type 도메인값(최적/근사) · 통화 KRW/JPY/USD/AUD
 *       ID 포맷 EDN-2026-#### · CP-2026-#### · PO-2026-#### · PTN-2026-#### · QTN-2026-#### · TS-2026-####
 *       실명·실금액 금지(가상) · 실패+자동대체 1쌍 필수(CP 최적화 시간초과 → 근사해 fallback)
 */

// ============================================================
// 0. ENUM (대문자 영문 — 감사 로그 파싱 안전)
// ============================================================
window.ENUMS = {
  // ProjectStateMachine 7단계 (3_실행계획.md §3.4)
  ProjectStatus: [
    "DRAFT", "QUOTED", "CUTTING_PLANNED", "ORDER_CONFIRMED",
    "IN_PRODUCTION", "SHIPPED", "SETTLED",
  ],
  // CP 해 유형 (cutting_plans.solution_type VARCHAR(8) — 도메인값은 최적/근사)
  SolutionType: ["최적", "근사"],
  // 통화
  Currency: ["KRW", "JPY", "USD", "AUD"],
  // 값 출처(provenance)
  ValueSource: ["시스템", "엑셀", "수기"],
  // 부서 코드 (RBAC)
  Department: ["SALES", "PURCHASER", "PRODUCTION", "QUALITY", "SHIPPING", "TRADING", "FINANCE", "CEO", "ADMIN"],
};

// ProjectStatus → 한글 라벨 + 여정 스텝 인덱스(0~6)
window.PROJECT_STATUS_META = {
  DRAFT:           { label: "생성",     step: 0 },
  QUOTED:          { label: "견적",     step: 1 },
  CUTTING_PLANNED: { label: "절단계획", step: 2 },
  ORDER_CONFIRMED: { label: "수주확정", step: 3 },
  IN_PRODUCTION:   { label: "생산중",   step: 4 },
  SHIPPED:         { label: "출하완료", step: 5 },
  SETTLED:         { label: "정산완료", step: 6 },
};

// 여정 7단계 (⑥ Project Journey Spine)
window.JOURNEY_STEPS = ["생성", "견적", "절단계획", "수주확정", "생산", "출하", "정산"];

// 환율 스냅샷 (704 매매기준율 · 3_실행계획.md §5.5, JPY는 100단위)
window.FX_SNAPSHOT = {
  baseDate: "2026-07-18",
  rates: { JPY: 9.0215, USD: 1342.5, AUD: 890.3 }, // 원/1단위 (JPY=원/¥1)
};

// ============================================================
// 1. 프로젝트 (History 테이블 + Dashboard 파이프라인 원천)
//    ★ 실패+자동대체 1쌍: EDN-2026-0031 = CP-SAT 최적 시도 → 10초 시간초과 → 근사 최선해 fallback
// ============================================================
window.PROJECTS = [
  {
    projectNo: "EDN-2026-0031", name: "BH빔 120톤 수주 (교량 거더)", customer: "니혼스틸웍스",
    country: "일본", currency: "JPY", status: "CUTTING_PLANNED",
    dueDate: "2026-09-30", yieldRate: 92.6, markup: 1.08, solutionType: "근사", fallback: true,
    cp: { cpNo: "CP-2026-0031", plateCount: 18, overWeightKg: 1515, overCostKRW: 1666667, confidence: 91 },
    finance: { revenue: 540000000, rawMaterialCost: 300000000, manufacturingCost: 90000000, overheadCost: 30000000, finalProfit: 120000000, profitRate: 22.2 },
    receivable: { foreign: 60000000, sym: "¥", exposureKRW: 541290000, fxDeltaPct: -2.0, fxRiskKRW: 10825800 },
    audit: [
      { t: "2026-07-18 14:22", who: "구매 김담당", act: "CP 최적화 실행", detail: "objective=스크랩최소 · 모드=최적(CP-SAT) · maxSeconds=10" },
      { t: "2026-07-18 14:22", who: "system",     act: "시간초과 · 자동대체", detail: "CP-SAT 10.0초 초과 → 근사 최선해(FFD) fallback · solution_type=근사" },
      { t: "2026-07-18 14:25", who: "구매 김담당", act: "배열 수동변경",  detail: "모재#12 A→B · 사유: 납기 우선 ⚑" },
      { t: "2026-07-18 14:30", who: "구매 이팀장", act: "CP 확정",        detail: "[잠금] · 수율 92.6% · 발주 입력 개시" },
    ],
  },
  {
    projectNo: "EDN-2026-0030", name: "철골 기둥 세트 (물류창고)", customer: "대성구조",
    country: "국내", currency: "KRW", status: "QUOTED",
    dueDate: "2026-10-15", yieldRate: null, solutionType: null, fallback: false,
    cp: null,
    finance: { revenue: 410000000, rawMaterialCost: 250000000, manufacturingCost: 70000000, overheadCost: 22000000, finalProfit: 68000000, profitRate: 16.6 },
    receivable: null,
    audit: [
      { t: "2026-07-17 10:05", who: "영업 박담당", act: "프로젝트 생성", detail: "[자동채번] EDN-2026-0030 · 국내/KRW" },
      { t: "2026-07-17 11:40", who: "영업 박담당", act: "견적 저장",     detail: "예상총원가 342,000,000 · 예상이익 68,000,000 (BS1101/1102)" },
    ],
  },
  {
    projectNo: "EDN-2026-0029", name: "H형강 트러스 (경기장 지붕)", customer: "오세아니아스틸",
    country: "호주", currency: "AUD", status: "CUTTING_PLANNED",
    dueDate: "2026-11-05", yieldRate: 98.0, markup: 1.02, solutionType: "최적", fallback: false,
    cp: { cpNo: "CP-2026-0029", plateCount: 17, overWeightKg: 379, overCostKRW: 416667, confidence: null },
    finance: { revenue: 620000000, rawMaterialCost: 360000000, manufacturingCost: 108000000, overheadCost: 36000000, finalProfit: 116000000, profitRate: 18.7 },
    receivable: { foreign: 140000, sym: "A$", exposureKRW: 124642000, fxDeltaPct: 0.9, fxRiskKRW: 2492840 },
    audit: [
      { t: "2026-07-16 09:12", who: "구매 김담당", act: "CP 최적화 실행", detail: "모드=최적(CP-SAT) · 완전탐색 수렴 4.2초" },
      { t: "2026-07-16 09:20", who: "구매 이팀장", act: "CP 확정",       detail: "[잠금] · [최적] 수율 98.0% · 소요 17매" },
    ],
  },
  {
    projectNo: "EDN-2026-0028", name: "박스 거더 모듈 (고가도로)", customer: "가야중공업",
    country: "일본", currency: "JPY", status: "ORDER_CONFIRMED",
    dueDate: "2026-08-28", yieldRate: 97.1, markup: 1.03, solutionType: "최적", fallback: false,
    cp: { cpNo: "CP-2026-0028", plateCount: 21, overWeightKg: 691, overCostKRW: 760417, confidence: null },
    finance: { revenue: 780000000, rawMaterialCost: 430000000, manufacturingCost: 140000000, overheadCost: 46000000, finalProfit: 164000000, profitRate: 21.0 },
    receivable: { foreign: 12000000, sym: "¥", exposureKRW: 108258000, fxDeltaPct: -0.8, fxRiskKRW: 2165160 },
    audit: [
      { t: "2026-07-14 15:10", who: "영업 박담당", act: "수주 확정", detail: "발주서 PO-2026-0028 자동생성 · 상태 ORDER_CONFIRMED 전이" },
      { t: "2026-07-14 15:11", who: "system",     act: "발주액 산출", detail: "BS1108 Σ단가×수량+운임 = 27,050,000" },
    ],
  },
  {
    projectNo: "EDN-2026-0027", name: "플레이트 거더 (철도교량)", customer: "한빛스틸",
    country: "국내", currency: "KRW", status: "IN_PRODUCTION",
    dueDate: "2026-08-10", yieldRate: 95.4, markup: 1.048, solutionType: "최적", fallback: false,
    cp: { cpNo: "CP-2026-0027", plateCount: 24, overWeightKg: 1250, overCostKRW: 1375000, confidence: null },
    finance: { revenue: 520000000, rawMaterialCost: 300000000, manufacturingCost: 96000000, overheadCost: 32000000, finalProfit: 92000000, profitRate: 17.7 },
    receivable: null,
    audit: [
      { t: "2026-07-10 08:40", who: "생산 정반장", act: "작업지시 발행", detail: "WO-2026-0027 · 절단→조립→용접" },
    ],
  },
  {
    projectNo: "EDN-2026-0026", name: "강교 세그먼트 (하천 횡단교)", customer: "태평양철강",
    country: "국내", currency: "KRW", status: "SHIPPED",
    dueDate: "2026-07-20", yieldRate: 94.8, markup: 1.055, solutionType: "근사", fallback: false,
    cp: { cpNo: "CP-2026-0026", plateCount: 19, overWeightKg: 1117, overCostKRW: 1229167, confidence: 93 },
    finance: { revenue: 470000000, rawMaterialCost: 280000000, manufacturingCost: 88000000, overheadCost: 28000000, finalProfit: 74000000, profitRate: 15.7 },
    receivable: null,
    audit: [
      { t: "2026-07-15 13:00", who: "출하 최담당", act: "출하 확정", detail: "상태 SHIPPED 전이 · 거래명세서 TS-2026-0026 발행" },
    ],
  },
  {
    projectNo: "EDN-2026-0025", name: "합성형 거더 (IC 램프)", customer: "세방구조",
    country: "일본", currency: "JPY", status: "IN_PRODUCTION",
    dueDate: "2026-07-25", yieldRate: 92.4, markup: 1.082, solutionType: "근사", fallback: false,
    cp: { cpNo: "CP-2026-0025", plateCount: 22, overWeightKg: 1742, overCostKRW: 1916667, confidence: 90 },
    finance: { revenue: 360000000, rawMaterialCost: 224000000, manufacturingCost: 70000000, overheadCost: 22000000, finalProfit: 44000000, profitRate: 12.2 },
    receivable: { foreign: 16500000, sym: "¥", exposureKRW: 148854750, fxDeltaPct: -1.4, fxRiskKRW: 2977095 },
    audit: [
      { t: "2026-07-12 11:20", who: "구매 김담당", act: "CP 확정", detail: "[근사] 수율 92.4% (<95% 주의) · 소요 22매" },
    ],
  },
  {
    projectNo: "EDN-2026-0024", name: "강관 트러스 (전시장 캐노피)", customer: "동북스틸",
    country: "호주", currency: "AUD", status: "SETTLED",
    dueDate: "2026-06-30", yieldRate: 97.9, markup: 1.021, solutionType: "최적", fallback: false,
    cp: { cpNo: "CP-2026-0024", plateCount: 15, overWeightKg: 360, overCostKRW: 395833, confidence: null },
    finance: { revenue: 590000000, rawMaterialCost: 330000000, manufacturingCost: 100000000, overheadCost: 34000000, finalProfit: 126000000, profitRate: 21.4 },
    receivable: { foreign: 0, sym: "A$", exposureKRW: 0, fxDeltaPct: 0, fxRiskKRW: 0 },
    audit: [
      { t: "2026-06-28 16:00", who: "자금 이과장", act: "정산 완료", detail: "미수 0 · 상태 SETTLED · 최종손익 126,000,000 (BS1106)" },
    ],
  },
  {
    projectNo: "EDN-2026-0023", name: "형강 브레이싱 (공장 증축)", customer: "남광메탈",
    country: "국내", currency: "KRW", status: "SETTLED",
    dueDate: "2026-06-20", yieldRate: 93.1, markup: 1.074, solutionType: "근사", fallback: false,
    cp: { cpNo: "CP-2026-0023", plateCount: 20, overWeightKg: 1572, overCostKRW: 1729167, confidence: 92 },
    finance: { revenue: 300000000, rawMaterialCost: 214000000, manufacturingCost: 78000000, overheadCost: 24000000, finalProfit: -16000000, profitRate: -5.3 },
    receivable: null,
    audit: [
      { t: "2026-06-18 10:30", who: "자금 이과장", act: "정산 완료", detail: "최종손익 −16,000,000 (적자) · 원자재비 초과 (BS1106)" },
      { t: "2026-06-18 10:31", who: "system",     act: "편차 경보",  detail: "실제 원자재비 214,000,000 > 예상 190,000,000 (C4)" },
    ],
  },
  {
    projectNo: "EDN-2026-0022", name: "BH빔 세트 (물류센터 램프)", customer: "미래빔",
    country: "일본", currency: "JPY", status: "SHIPPED",
    dueDate: "2026-07-22", yieldRate: 96.6, markup: 1.035, solutionType: "최적", fallback: false,
    cp: { cpNo: "CP-2026-0022", plateCount: 16, overWeightKg: 616, overCostKRW: 677083, confidence: null },
    finance: { revenue: 450000000, rawMaterialCost: 260000000, manufacturingCost: 84000000, overheadCost: 28000000, finalProfit: 78000000, profitRate: 17.3 },
    receivable: { foreign: 0, sym: "¥", exposureKRW: 0, fxDeltaPct: 0, fxRiskKRW: 0 },
    audit: [
      { t: "2026-07-16 14:00", who: "출하 최담당", act: "출하 확정", detail: "상태 SHIPPED · 거래명세서 TS-2026-0022 발행" },
    ],
  },
  {
    projectNo: "EDN-2026-0021", name: "강구조 계단탑 (아파트 단지)", customer: "대륙조선",
    country: "국내", currency: "KRW", status: "QUOTED",
    dueDate: "2026-10-30", yieldRate: null, solutionType: null, fallback: false,
    cp: null,
    finance: { revenue: 280000000, rawMaterialCost: 170000000, manufacturingCost: 52000000, overheadCost: 16000000, finalProfit: 42000000, profitRate: 15.0 },
    receivable: null,
    audit: [
      { t: "2026-07-15 09:00", who: "영업 박담당", act: "견적 저장", detail: "예상총원가 238,000,000 · 예상이익 42,000,000" },
    ],
  },
  {
    projectNo: "EDN-2026-0020", name: "철골 프레임 (데이터센터)", customer: "그린스틸",
    country: "국내", currency: "KRW", status: "DRAFT",
    dueDate: "2026-12-10", yieldRate: null, solutionType: null, fallback: false,
    cp: null,
    finance: null,
    receivable: null,
    audit: [
      { t: "2026-07-18 08:30", who: "영업 박담당", act: "프로젝트 생성", detail: "[자동채번] EDN-2026-0020 · 상태 DRAFT" },
    ],
  },
];

// ============================================================
// 2. Dashboard — 파이프라인 / KPI / 목표·실적 / FX / 편차
// ============================================================

// ⑧ CEO Pipeline Board — 상태별 집계 (건수·금액 백만원). 금액은 mock 집계값.
window.PIPELINE = [
  { key: "QUOTED",          label: "견적",     amountM: 690,  alert: null },
  { key: "CUTTING_PLANNED", label: "절단계획", amountM: 1160, alert: { kind: "warn", text: "지연 1" } },
  { key: "ORDER_CONFIRMED", label: "수주확정", amountM: 780,  alert: null },
  { key: "IN_PRODUCTION",   label: "생산",     amountM: 880,  alert: { kind: "warn", text: "납기 1" } },
  { key: "SHIPPED",         label: "출하",     amountM: 920,  alert: null },
  { key: "SETTLED",         label: "정산",     amountM: 890,  alert: { kind: "info", text: "미수 2" } },
];
window.PIPELINE_FUNNEL = { quoteToOrder: 34.5, orderToShip: 71.2, avgLeadTimeDays: 42 };

// KPI 카드 4개 (수주 / 생산 / 자금 / 손익) — Sparkline + tabular-nums
window.KPIS = [
  { key: "order",  label: "당월 수주액",   value: 3820, unit: "백만", icon: "doc",     color: "#6366f1", trend: [2980, 3120, 3010, 3450, 3610, 3780, 3820], delta: +6.1 },
  { key: "prod",   label: "생산 진행",     value: 12,   unit: "건",   icon: "factory", color: "#14b8a6", trend: [8, 9, 11, 10, 12, 11, 12],                delta: +9.1 },
  { key: "cash",   label: "미수금(원화환산)", value: 923, unit: "백만", icon: "coins",  color: "#f59e0b", trend: [1180, 1090, 1020, 990, 960, 940, 923],     delta: -3.5, accent: "amber" },
  { key: "profit", label: "당월 영업이익률", value: 9.6, unit: "%",   icon: "trend",   color: "#f43f5e", trend: [14.2, 13.1, 12.4, 11.8, 10.9, 10.1, 9.6],  delta: -4.9, accent: "rose", rbac: true },
];

// 목표 대비 실적 (당월·전사, 백만원)
window.TARGETS = [
  { metric: "수주액",     target: 5000, actual: 3820, unit: "백만", trend: "up",   status: "정상" },
  { metric: "매출액",     target: 4200, actual: 3180, unit: "백만", trend: "down", status: "주의" },
  { metric: "영업이익률", target: 15.0, actual: 9.6,  unit: "%",    trend: "down", status: "위험", rbac: true },
];

// ⑨ FX Risk Radar (JPY/USD/AUD) — CEO·FINANCE 전용
window.FX_RADAR = [
  { currency: "JPY", sym: "¥",  foreign: 88500000, exposureKRW: 798402750, fxDeltaPct: -1.8, fxRiskKRW: 15968055, stale: false },
  { currency: "USD", sym: "$",  foreign: 312000,   exposureKRW: 418860000, fxDeltaPct: +0.6, fxRiskKRW: 8377200,  stale: false },
  { currency: "AUD", sym: "A$", foreign: 140000,   exposureKRW: 124642000, fxDeltaPct: +0.9, fxRiskKRW: 2492840,  stale: true },
];

// ★ 매입측 환노출 (수입 후판 등) — 매출측 FX_RADAR와 함께 '순노출' 판단(트리거③)
//    순노출 = 매출 노출 − 매입 노출. 매입만 보면 자연헤지/역노출을 오판한다.
window.FX_PURCHASE = [
  { currency: "JPY", sym: "¥",  foreign: 22000000, exposureKRW: 198473000, note: "일본산 후판 매입" },
  { currency: "USD", sym: "$",  foreign: 65000,    exposureKRW: 87262500,  note: "수입 강재" },
];

// ★ 간접비 배부 모델 — 단일률은 용접집약 BH 손익을 왜곡(트리거③). PoC에서 차등율 확정.
window.OVERHEAD_MODEL = {
  mode: "단일률(임시)", rate: 12.5,
  caveat: "용접집약 BH는 중량 단일 배부 시 과소원가(견적 흑자·실제 적자). 공수/머신아워 기준 차등 배부 필요 — 실제 원가분석표로 확정",
};

// C4 예상 vs 실제 편차 요약 (전사 롤업, 원)
window.VARIANCE = [
  { item: "매출",      expected: 552000000, actual: 528000000, dir: "down", contribPct: 41 },
  { item: "원자재비",  expected: 300000000, actual: 312000000, dir: "up",   contribPct: 62 },
  { item: "최종 손익", expected: 132000000, actual: 108000000, dir: "down", contribPct: null, isProfit: true },
];

// ============================================================
// 3. Console — BH Cutting Plan 4-step 위저드
//   ★ 2026-07-20 고객 실물 엑셀(지상1절_BH·C2-2) 역공학 반영 — 폭 방향 배열(스트리핑) 모델
//   실제 CP = 길이 절단이 아니라 두께·재질별 부재를 폭 방향으로 J열 배열해 광폭 플레이트 발주.
//   단위 = kg(비중 7.85×10⁻⁶) · 단가 원/kg · KPI = 할증률 V(발주중량÷정미중량, ≥1.0)
// ============================================================

const DENSITY = 7.85e-6;              // 강재 비중 환산 (mm³→kg)
const PRICE_PER_KG = 1100;            // 후판 SM355 매입 근사 단가 (원/kg)
const KERF_MM = 3;                    // 폭 슬리팅 커프(절단선당 ~3mm) — 할증 K=에지트림+커프×(J−1)
const MIN_PLATE_WIDTH = 1501;         // 표준/재고 최소 발주폭 — 미만이면 올림 발주(잉여 급증, 실측 C2-2 개별 V 2.51)
const WIDTH_BANDS = [[1801, 2400], [2401, 3000], [3001, 3300]]; // 발주 가능 폭 밴드(실측)
const wKg = (th, w, L, q) => Math.round(th * w * L * q * DENSITY * 10) / 10;  // 중량식 = TH×W×L×Q×7.85e-6
window.DENSITY = DENSITY;
window.PRICE_PER_KG = PRICE_PER_KG;
window.KERF_MM = KERF_MM;
window.MIN_PLATE_WIDTH = MIN_PLATE_WIDTH;
window.WIDTH_BANDS = WIDTH_BANDS;

// Step1 — CP 엑셀 업로드(mock) → BH BEAM 부재 전개(W/FU/FL 3분해) (702)
//   지상1절_BH 실측 30t WEB 패밀리(SM355TMC · 부재폭 700) — 정미 소요중량 27,414.5kg
window.CP_MEMBERS = [
  { mark: "SM-005-W", memberType: "WEB", matl: "SM355TMC", th: 30, width: 700, length: 8710,  qty: 8, source: "엑셀" },
  { mark: "SM-004-W", memberType: "WEB", matl: "SM355TMC", th: 30, width: 700, length: 9100,  qty: 3, source: "엑셀" },
  { mark: "SM-003-W", memberType: "WEB", matl: "SM355TMC", th: 30, width: 700, length: 9390,  qty: 1, source: "엑셀" },
  { mark: "SM-002-W", memberType: "WEB", matl: "SM355TMC", th: 30, width: 700, length: 13400, qty: 1, source: "엑셀" },
  { mark: "SM-001-W", memberType: "WEB", matl: "SM355TMC", th: 30, width: 700, length: 15510, qty: 3, source: "엑셀" },
];
window.CP_MEMBERS.forEach((m) => { m.weightKg = wKg(m.th, m.width, m.length, m.qty); });
window.CP_NET_WEIGHT_KG = Math.round(window.CP_MEMBERS.reduce((a, m) => a + m.weightKg, 0) * 10) / 10; // ≈ 27,414.5

// Step2 — 발주 규격 제약 / 잉여판 (기존 '모재 재고' → '주문 규격 마스터', heat 추적 유지)
//   ★ heat: 발주 플레이트가 heat(로트) 번호를 보유 → 절단 부재·성적서로 전파(인증재 추적성)
window.MOTHER_BARS = [
  { id: "SPEC-30", matl: "SM355TMC", th: 30, edgeTrim: 16, minWidth: 1501, maxWidth: 3300, pricePerKg: 1100, mill: "현대제철", heat: "HT-2504-A17", recommended: true },
  { id: "SPEC-45", matl: "SM355TMC", th: 45, edgeTrim: 20, minWidth: 1501, maxWidth: 3300, pricePerKg: 1180, mill: "동국제강", heat: "HT-2504-B08", recommended: false },
  { id: "REMNANT", matl: "SM355TMC", th: 30, edgeTrim: 0,  minWidth: 0,    maxWidth: 2400, pricePerKg: 0,    mill: "잉여판 재고", heat: "HT-2503-C22", remnant: true, remnantWidth: 1800, remnantLength: 9200 },
];

// Step2 — What-if 배열수 J 슬라이더 → 발주폭·매수·채움 미리보기 (대표 부재 SM-005-W, 폭700·수량8)
//   J↑ → 폭 채움↑ → 할증↓. 단 폭 밴드(≤3300) 초과 시 불가, 폭<1501이면 최소폭 강제(잉여)
window.WHATIF_ARRAY = {
  1: { plateWidth: 1501, forced: true,  plateCount: 8, note: "폭716<1501 → 최소폭 강제 · 대량 잉여" },
  2: { plateWidth: 1501, forced: true,  plateCount: 4, note: "폭1419<1501 → 최소폭 강제" },
  3: { plateWidth: 2122, forced: false, plateCount: 3, note: "폭2122 (밴드 1801~2400)" },
  4: { plateWidth: 2825, forced: false, plateCount: 2, note: "폭2825 (밴드 2401~3000) · 최적" },
};

// Step3/4 — 정책(policyMode)별 최적화 결과. 근사(그리디·수초) vs 최적(CP-SAT 폭배정 완전탐색)
//   layouts[].strips = 폭 방향 배열: {mark, cols(배열수), stripW(부재폭)} · remnantW = 미사용 폭(잉여)
const remnantW = (plateWidth, strips, edge) => {
  const totalCols = strips.reduce((a, s) => a + s.cols, 0);
  const used = strips.reduce((a, s) => a + s.cols * s.stripW, 0) + edge + KERF_MM * (totalCols - 1);
  return Math.max(0, Math.round(plateWidth - used));
};
const buildLayouts = (rows) => rows.map((r) => ({ ...r, remnantW: remnantW(r.width, r.strips, r.edge), heat: "HT-2504-A17" }));

window.CP_SOLUTIONS = {
  // 근사(그리디 폭배정) — 마크별 개별 발주, 좁은 단품이 최소폭 1501에 걸림, 미병합
  "근사": {
    solutionType: "근사",
    netWeightKg: window.CP_NET_WEIGHT_KG,      // 27,414.5
    orderedWeightKg: 31973.9,
    markup: 1.166,                             // 할증률 V = 발주÷정미
    yieldPct: 85.7,                            // 중량 수율 = 1/V
    plateCount: 6,
    overWeightKg: Math.round(31973.9 - window.CP_NET_WEIGHT_KG),         // ≈ 4,559 (초과 발주 중량)
    overCostKRW: Math.round((31973.9 - window.CP_NET_WEIGHT_KG) * PRICE_PER_KG),
    markupSensitivityKRW: Math.round(0.01 * window.CP_NET_WEIGHT_KG * PRICE_PER_KG), // 할증률 1%p ≈ 원
    confidence: 88,                            // 근사해 최적성 갭 기반 (근사만 노출)
    search: "그리디 폭배정 · 2.1초 (병합 미적용)",
    rationale: "마크별 개별 발주 · 좁은 단품 2건(SM-003·002-W) 폭716<1501 → 최소폭 강제 · 병합 미수행",
    layouts: buildLayouts([
      { plate: "SM-005-W", th: 30, width: 2825, length: 8720,  count: 2, edge: 16, strips: [{ mark: "SM-005-W", cols: 4, stripW: 700 }], weight: 11602.6 },
      { plate: "SM-004-W", th: 30, width: 2122, length: 9110,  count: 1, edge: 16, strips: [{ mark: "SM-004-W", cols: 3, stripW: 700 }], weight: 4552.5 },
      { plate: "SM-003-W", th: 30, width: 1501, length: 9400,  count: 1, edge: 16, forcedMin: true, strips: [{ mark: "SM-003-W", cols: 1, stripW: 700 }], weight: 3322.8 },
      { plate: "SM-002-W", th: 30, width: 1501, length: 13410, count: 1, edge: 16, forcedMin: true, strips: [{ mark: "SM-002-W", cols: 1, stripW: 700 }], weight: 4740.2 },
      { plate: "SM-001-W", th: 30, width: 2122, length: 15520, count: 1, edge: 16, strips: [{ mark: "SM-001-W", cols: 3, stripW: 700 }], weight: 7755.8 },
    ]),
  },
  // 최적(CP-SAT 폭배정) — 좁은 단품을 폭으로 병합(실제 지상1절 방식), 최소폭 강제 0건
  "최적": {
    solutionType: "최적",
    netWeightKg: window.CP_NET_WEIGHT_KG,
    orderedWeightKg: 28181.6,
    markup: 1.028,
    yieldPct: 97.3,
    plateCount: 4,
    overWeightKg: Math.round(28181.6 - window.CP_NET_WEIGHT_KG),         // ≈ 767
    overCostKRW: Math.round((28181.6 - window.CP_NET_WEIGHT_KG) * PRICE_PER_KG),
    markupSensitivityKRW: Math.round(0.01 * window.CP_NET_WEIGHT_KG * PRICE_PER_KG),
    confidence: null,                          // 최적해는 신뢰도 % 미표기 (완전탐색)
    search: "CP-SAT 폭배정 완전탐색 · 4.3초 수렴 (최적성 증명)",
    rationale: "4매로 폭 병합(P2=SM-004+003, P3=SM-002+001) · 최소폭 강제 0건 · 근사 대비 −2매",
    layouts: buildLayouts([
      { plate: "P1", th: 30, width: 2825, length: 8720,  count: 2, edge: 16, strips: [{ mark: "SM-005-W", cols: 4, stripW: 700 }], weight: 11602.6 },
      { plate: "P2", th: 30, width: 2825, length: 9400,  count: 1, edge: 16, strips: [{ mark: "SM-004-W", cols: 3, stripW: 700 }, { mark: "SM-003-W", cols: 1, stripW: 700 }], weight: 6253.7 },
      { plate: "P3", th: 30, width: 2825, length: 15520, count: 1, edge: 16, strips: [{ mark: "SM-002-W", cols: 1, stripW: 700 }, { mark: "SM-001-W", cols: 3, stripW: 700 }], weight: 10325.3 },
    ]),
  },
};

// Step3 — 최적화 objective 옵션 (폭 배열 기준)
window.CP_OBJECTIVES = [
  { key: "minMarkup", label: "할증률 최소", desc: "발주중량÷정미중량을 1.0에 최대한 근접" },
  { key: "minPlates", label: "발주 매수 최소", desc: "구매 플레이트 장수를 최소화" },
];

// 확정 게이트(C6) 체크리스트 — 폭 보존식 기준
window.CP_COMMIT_CHECKS = [
  { key: "constraint", label: "제약 위반 없음 (전량배치 · heat 경계 · 폭보존 발주폭=Σ(부재폭×J)+에지+커프×절단선수)", auto: true },
  { key: "solution",   label: "해 유형 확인", auto: true },
  { key: "alternative", label: "대안 검토함 (미채택 사유 기록)", auto: false },
  { key: "confidence", label: "신뢰도 확인 (근사해)", auto: false },
];

// ============================================================
// 4. Templates — 문서 템플릿 라이브 프리뷰 (705 문서 자동발행)
// ============================================================
window.DOC_TEMPLATES = [
  {
    id: "PTN-DOC-QTN", type: "QUOTATION", name: "견적서 (표준)", version: "v2.1", active: true,
    headline: "견적서", docNoFmt: "QTN-2026-####",
    fields: ["프로젝트", "고객사", "품목/규격", "수량", "단가", "예상총원가", "예상이익"],
    footer: "본 견적서는 EDEN OS에서 자동 생성되었습니다. 유효기간 발행일로부터 30일.",
  },
  {
    id: "PTN-DOC-PO", type: "PURCHASE_ORDER", name: "발주서 (제강사)", version: "v2.0", active: true,
    headline: "발주서", docNoFmt: "PO-2026-####",
    fields: ["공급사", "모재규격", "길이", "수량", "단가", "발주액(BS1108)"],
    footer: "발주 조건: 납기 준수 · 검수 후 입고. 문의 구매팀.",
  },
  {
    id: "PTN-DOC-TS", type: "STATEMENT", name: "거래명세서", version: "v1.4", active: true,
    headline: "거래명세서", docNoFmt: "TS-2026-####",
    fields: ["프로젝트", "품목/규격", "수량", "공급가액", "세액", "합계"],
    footer: "수출 영세율 적용 시 세액 0. 본 명세서는 전자문서로 보관됩니다.",
  },
  {
    id: "PTN-DOC-INS", type: "INSPECTION", name: "시험성적서 (국가양식)", version: "v1.0", active: false,
    headline: "시험성적서", docNoFmt: "INS-2026-####",
    fields: ["부재", "시험항목", "규격값", "측정값", "판정(BS1109)"],
    footer: "판정 기준: 기준서 허용범위. 국가별 양식 자동 전환(JSONB).",
  },
];

// ============================================================
// 5. Tweaks 기본값 (EDITMODE 블록 — 호스트가 디스크에 재기록)
// ============================================================
window.TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "brandName": "이든철강",
  "brandColor": "#4f46e5",
  "policyMode": "근사",
  "showTrustBadges": true,
  "role": "구매",
  "density": "regular"
}/*EDITMODE-END*/;

// RBAC: 손익·환리스크 열람 가능 역할
window.FINANCE_ROLES = ["자금", "대표"];
