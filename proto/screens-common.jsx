// screens-common.jsx — EDEN OS 공통 기반 4화면 (프로젝트 비종속)
//   window.Home     = 부서별 홈 (⑪ Role Home & Alert Center, 모델 91)
//   window.Rbac     = 계정·권한 (C-RBAC 매트릭스 시각 편집, 모델 91 / 문제 114)
//   window.Partners = 거래처 마스터 (⑦ Excel Bridge · ⑤ 제강사 단가 이력, 모델 92)
//   window.Fx       = 환율 연동/스냅샷 (C1 신선도 · ⑨ FX 위젯, 모델 93 / 문제 111)
// 공통마스터·인증 계열은 ⑥ 여정 스텝퍼 없이 상단 컨텍스트 배지로 대체한다.
const { useState: useState_sc, useMemo: useMemo_sc } = React;

// ── 공통 유틸 (SC_ 접두 — 전역 충돌 방지) ─────────────────────
const SC_TODAY = "2026-07-18";
const SC_daysBetween = (fromISO, toISO) =>
  Math.round((new Date(toISO) - new Date(fromISO)) / 86400000);
const SC_P = (no) => window.PROJECTS.find((p) => p.projectNo === no);

// role(tweaks) → 부서 컨텍스트 (C-RBAC 헤더)
const SC_ROLE_META = {
  구매: { code: "PURCHASER", deptLabel: "구매", position: "담당",   permission: "CP·발주 CRUD",  team: "구매팀",   accent: "indigo" },
  자금: { code: "FINANCE",   deptLabel: "자금", position: "과장",   permission: "자금·손익 CRUD", team: "자금팀",   accent: "amber"  },
  대표: { code: "CEO",       deptLabel: "경영", position: "대표이사", permission: "전사 열람",     team: "대표이사", accent: "indigo" },
};

// ============================================================
// 화면 1. window.Home — 부서별 역할 홈 (⑪)
// ============================================================
function Home({ tweaks, navigate }) {
  const { fmt, won, man, Card, SectionLabel, Icon, TrustBadge, Masked, yieldHex } = window;
  const canFinance = window.FINANCE_ROLES.includes(tweaks.role);
  const showBadge = tweaks.showTrustBadges;
  const [cheat, setCheat] = useState_sc(false);

  const role = SC_ROLE_META[tweaks.role] ? tweaks.role : "구매";
  const meta = SC_ROLE_META[role];

  // ── PROJECTS 파생 집계 ──────────────────────────────────
  const P = window.PROJECTS;
  const optWait = P.filter((p) => p.status === "QUOTED").length;                       // 최적화 대기 CP(견적→CP)
  const cpPlanned = P.filter((p) => p.status === "CUTTING_PLANNED").length;            // CP 미확정
  const yieldMiss = P.filter((p) => p.yieldRate != null && p.yieldRate < 95).length;   // 수율 미달
  const overWeightKg = P.reduce((a, p) => a + (p.cp ? p.cp.overWeightKg : 0), 0);      // 초과 발주(잉여) 누적 kg
  const weekConfirm = P.filter((p) => p.cp && ["ORDER_CONFIRMED", "IN_PRODUCTION", "SHIPPED"].includes(p.status)).length;
  const arOverdue = P.filter((p) => p.receivable && p.receivable.foreign > 0).length;  // 외화 미수
  const unsettled = P.filter((p) => p.finance && p.status !== "SETTLED").length;       // 미확정 손익
  const fxRiskTotal = window.FX_RADAR.reduce((a, f) => a + f.fxRiskKRW, 0);
  const exposureTotal = window.FX_RADAR.reduce((a, f) => a + f.exposureKRW, 0);

  // ── 오늘 할 일 (부서별) ────────────────────────────────
  const todosByRole = {
    구매: [
      { label: "최적화 대기 CP",       n: optWait,    to: "console" },
      { label: "수율 미달(<95%) CP",   n: yieldMiss,  to: "history", warn: true },
      { label: "제강사 비교 미확정",   n: cpPlanned,  to: "mills" },
      { label: "CP 미확정(확정 대기)", n: cpPlanned,  to: "console" },
    ],
    자금: [
      { label: "미수 경과(45일↑)",     n: arOverdue,  to: "finance", warn: true },
      { label: "환리스크 통화",        n: window.FX_RADAR.length, to: "fx" },
      { label: "미확정 손익",          n: unsettled,  to: "profit" },
      { label: "당월 수금 예정",       n: 3,          to: "finance" },
    ],
    대표: [
      { label: "목표 미달 지표",       n: window.TARGETS.filter((t) => t.status !== "정상").length, to: "dashboard", warn: true },
      { label: "파이프라인 지연",      n: window.PIPELINE.filter((s) => s.alert && s.alert.kind === "warn").length, to: "dashboard" },
      { label: "외화 미수 경과",       n: arOverdue,  to: "finance" },
      { label: "확정 대기 CP",         n: cpPlanned,  to: "console" },
    ],
  };
  const todos = todosByRole[role];

  // ── 역할 KPI 타일 (부서별 4개) ─────────────────────────
  const tilesByRole = {
    구매: [
      { label: "최적화 대기",   value: optWait,   unit: "건", hint: "CP 최적화 요",         color: "indigo", to: "console" },
      { label: "수율 미달",     value: yieldMiss, unit: "건", hint: "95% 미달 주의 ▲",      color: "rose",   to: "history" },
      { label: "초과 발주(잉여)", value: fmt(overWeightKg), unit: "kg", hint: "잉여판 재고 [선택범위]", color: "amber", to: "console", raw: true },
      { label: "금주 확정",     value: weekConfirm, unit: "건", hint: "전주比 ▲2",           color: "indigo", to: "history" },
    ],
    자금: [
      { label: "미수 경과",     value: arOverdue, unit: "건", hint: "45일↑ 회수 요",        color: "amber",  to: "finance" },
      { label: "환리스크",      value: fxRiskTotal, unit: "", hint: "−2% 시 손실 노출",     color: "rose",   to: "fx", money: true, sensitive: true },
      { label: "미확정 손익",   value: unsettled, unit: "건", hint: "정산 전 프로젝트",      color: "indigo", to: "profit" },
      { label: "미수금 총액",   value: exposureTotal, unit: "", hint: "원화환산 exposure",   color: "amber",  to: "finance", money: true, sensitive: true },
    ],
    대표: window.KPIS.map((k) => ({
      label: k.label, value: k.value, unit: k.unit,
      hint: `전월 ${k.delta >= 0 ? "▲" : "▼"} ${Math.abs(k.delta)}%`,
      color: k.accent === "rose" ? "rose" : k.accent === "amber" ? "amber" : "indigo",
      to: "dashboard", raw: true, sensitive: !!k.rbac,
    })),
  };
  const tiles = tilesByRole[role];

  // ── 알림 센터 (PROJECTS 파생, 4종) ─────────────────────
  const y31 = SC_P("EDN-2026-0031"), c29 = SC_P("EDN-2026-0029"),
        d25 = SC_P("EDN-2026-0025"), a28 = SC_P("EDN-2026-0028");
  const alerts = [
    { dot: "🔴", kind: "수율미달", tone: "rose",  p: y31, msg: `CP 수율 ${y31.yieldRate}%(<95%)`,              age: "2시간 전", to: "console", dept: "구매" },
    { dot: "🟠", kind: "CP미확정", tone: "amber", p: c29, msg: `최적화 완료(${c29.solutionType}) · 확정 대기`, age: "4시간 전", to: "console", dept: "구매" },
    { dot: "🟠", kind: "납기임박", tone: "amber", p: d25, msg: `납기 D-${SC_daysBetween(SC_TODAY, d25.dueDate)} · 생산 진행중`, age: "오늘", to: "history", dept: "생산" },
    { dot: "🔵", kind: "미수경과", tone: "sky",   p: a28, msg: `미수 ${a28.receivable.sym}${fmt(a28.receivable.foreign)} · 32일 경과`, age: "어제", to: "finance", dept: "자금" },
  ];
  const toneMap = {
    rose:  "bg-rose-500/10 text-rose-300 border-rose-500/25",
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/25",
    sky:   "bg-sky-500/10 text-sky-300 border-sky-500/25",
  };
  const tileColorMap = {
    indigo: { v: "text-slate-50", ic: "text-indigo-400", bg: "" },
    rose:   { v: "text-rose-50",  ic: "text-rose-400",  bg: "!bg-rose-950/60 !border-rose-800/50" },
    amber:  { v: "text-amber-50", ic: "text-amber-400", bg: "!bg-amber-950/50 !border-amber-800/50" },
  };

  return (
    <div className="space-y-5">
      {/* 상단 인사 + C-RBAC 컨텍스트 배지 */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <SectionLabel color="indigo">HOME · ⑪ 부서별 역할 홈 · Alert Center</SectionLabel>
          <h1 className="text-3xl font-bold mt-1.5 tracking-tight text-slate-50">{meta.team} 홈</h1>
          <p className="text-sm text-slate-400 mt-1">
            {SC_TODAY}(오늘) · 내 대기 업무와 전사 알림을 한 화면에서 · <span className="text-slate-500">문제 114·115 해소</span>
          </p>
          <div className="flex items-center gap-2 mt-3 text-[11px] font-mono flex-wrap">
            <span className="px-2 py-0.5 rounded border bg-slate-800/70 border-slate-700/60 text-slate-300">부서: {meta.deptLabel}({meta.code})</span>
            <span className="px-2 py-0.5 rounded border bg-slate-800/70 border-slate-700/60 text-slate-300">직급: {meta.position}</span>
            <span className="px-2 py-0.5 rounded border bg-indigo-500/10 border-indigo-500/25 text-indigo-300">권한: {meta.permission}</span>
          </div>
        </div>
        <button onClick={() => setCheat((v) => !v)}
          className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700/60 hover:bg-slate-750 text-xs flex items-center gap-1.5 text-slate-300">
          <Icon name="info" className="w-3.5 h-3.5" />온보딩 치트시트
        </button>
      </div>

      {cheat && (
        <Card className="p-4 !bg-indigo-950/40 !border-indigo-800/40 text-xs text-indigo-100 leading-relaxed">
          <b className="text-indigo-200">이 화면 사용법</b> — 상단 <b>오늘 할 일</b>은 부서(Tweaks·부서) 기준 대기 업무이고,
          <b> 역할 KPI 타일</b>은 클릭하면 해당 업무 화면으로 이동합니다. 하단 <b>알림 센터</b>는 부서와 무관하게 4종(수율미달·CP미확정·납기임박·미수경과)을 수신하되
          타부서 항목은 <span className="font-mono">[부서]</span> 태그로 표기합니다.
        </Card>
      )}

      {/* 오늘 할 일 */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="bell" className="w-4 h-4 text-indigo-400" />
          <h3 className="font-semibold text-base">오늘 할 일 <span className="text-xs text-slate-500 font-normal">(내 대기 업무)</span></h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {todos.map((t) => (
            <button key={t.label} onClick={() => navigate(t.to)}
              className="flex items-center justify-between px-3.5 py-3 rounded-lg bg-slate-800/50 border border-slate-700/60 hover:border-indigo-500/40 hover:bg-slate-800 transition group text-left">
              <span className="text-sm text-slate-300 flex items-center gap-2">
                {t.warn && <span className="text-amber-400">⚠</span>}{t.label}
              </span>
              <span className="flex items-center gap-2">
                <span className={`text-lg font-bold tabular-nums ${t.warn ? "text-amber-300" : "text-slate-100"}`}>{t.n}</span>
                <span className="text-xs text-slate-500">건</span>
                <Icon name="chevronRight" className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400" />
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* 역할 KPI 타일 4개 */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 px-1">역할 KPI 타일 · {meta.deptLabel}</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {tiles.map((t) => {
            const c = tileColorMap[t.color] || tileColorMap.indigo;
            const masked = t.sensitive && !canFinance;
            return (
              <Card key={t.label} className={`p-5 cursor-pointer hover:border-indigo-500/40 transition ${c.bg}`} onClick={() => navigate(t.to)}>
                <div className="flex items-start justify-between">
                  <div className="text-xs text-slate-400">{t.label}</div>
                  <Icon name="chevronRight" className={`w-3.5 h-3.5 ${c.ic}`} />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  {masked ? (
                    <div className="text-xl"><Masked visible={false} need="FINANCE·CEO">x</Masked></div>
                  ) : (
                    <>
                      <div className={`text-3xl font-bold tabular-nums ${c.v}`}>
                        {t.money ? won(t.value) : t.raw ? t.value : fmt(t.value)}
                      </div>
                      {t.unit && <div className="text-sm text-slate-500">{t.unit}</div>}
                    </>
                  )}
                </div>
                <div className="mt-2 text-[11px] text-slate-500">{t.hint}</div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 알림 센터 */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-base flex items-center gap-2"><Icon name="alert" className="w-4 h-4 text-amber-400" />알림 센터</h3>
          <span className="text-[11px] text-slate-500">전사 4종 수신 · 클릭 = 해당 업무 이동 <TrustBadge kind="자동계산" show={showBadge} /></span>
        </div>
        <div className="space-y-2">
          {alerts.map((a, i) => {
            const crossDept = a.dept !== meta.deptLabel;
            return (
              <button key={i} onClick={() => navigate(a.to, { projectNo: a.p.projectNo })}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 transition text-left group">
                <span className="text-sm shrink-0">{a.dot}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0 ${toneMap[a.tone]}`}>{a.kind}</span>
                <span className="font-mono text-xs text-slate-300 shrink-0">{a.p.projectNo}</span>
                <span className="text-sm text-slate-400 truncate flex-1">{a.msg}</span>
                {crossDept && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 border border-slate-600/40 shrink-0">[{a.dept}]</span>}
                <span className="text-[11px] text-slate-500 shrink-0">{a.age}</span>
                <Icon name="chevronRight" className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 shrink-0" />
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// 화면 2. window.Rbac — 계정·권한 관리 (C-RBAC 매트릭스)
// ============================================================
const SC_FEATURES = ["프로젝트·견적", "CP·발주", "생산·MCS", "품질 QMS", "출하", "유통", "자금·손익", "대시보드", "마스터·권한"];
const SC_DEPTS = ["SAL", "PUR", "PRD", "QUL", "SHP", "TRD", "FIN", "CEO", "ADM"];
const SC_MATRIX_INIT = [
  ["C", "R", "R", "R", "R", "-", "R", "R", "R"],
  ["R", "C", "R", "-", "-", "-", "R", "R", "R"],
  ["-", "R", "C", "R", "R", "-", "-", "R", "R"],
  ["-", "-", "R", "C", "-", "-", "-", "R", "R"],
  ["-", "-", "R", "R", "C", "-", "R", "R", "R"],
  ["-", "-", "-", "-", "-", "C", "R", "R", "R"],
  ["R", "-", "-", "-", "-", "R", "C", "R", "R"],
  ["-", "-", "-", "-", "-", "-", "R", "R", "R"],
  ["-", "-", "-", "-", "-", "-", "-", "-", "C"],
];
const SC_NEXT = { C: "R", R: "-", "-": "C" };
const SC_CELL = {
  C: { label: "C", c: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25", title: "CRUD 편집" },
  R: { label: "R", c: "bg-slate-700/40 text-slate-300 border-slate-600/40 hover:bg-slate-700/60", title: "읽기전용" },
  "-": { label: "–", c: "bg-rose-500/10 text-rose-400 border-rose-500/25 hover:bg-rose-500/20", title: "마스킹 · 권한없음" },
};
const SC_ACCOUNTS = [
  { loginId: "kim.pur",  name: "김OO",      dept: "구매", position: "담당",   status: "활성",  last: "2026-07-18 09:12" },
  { loginId: "lee.fin",  name: "이OO",      dept: "자금", position: "과장",   status: "활성",  last: "2026-07-17 18:40" },
  { loginId: "park.sal", name: "박OO",      dept: "영업", position: "담당",   status: "잠김",  last: "2026-07-10 11:02" },
  { loginId: "jung.prd", name: "정OO",      dept: "생산", position: "반장",   status: "활성",  last: "2026-07-18 08:05" },
  { loginId: "choi.shp", name: "최OO",      dept: "출하", position: "담당",   status: "활성",  last: "2026-07-17 14:22" },
  { loginId: "han.qul",  name: "한OO",      dept: "품질", position: "주임",   status: "비활성", last: "2026-06-30 17:10" },
  { loginId: "seo.ceo",  name: "서OO",      dept: "경영", position: "대표이사", status: "활성", last: "2026-07-18 07:40" },
  { loginId: "admin",    name: "관리자 최OO", dept: "관리", position: "관리자", status: "활성",  last: "2026-07-18 09:00" },
];

function Rbac({ tweaks }) {
  const { Card, SectionLabel, Icon } = window;
  const [tab, setTab] = useState_sc("matrix");
  const [matrix, setMatrix] = useState_sc(SC_MATRIX_INIT.map((r) => r.slice()));
  const [statusFilter, setStatusFilter] = useState_sc("전체");

  const cycle = (ri, ci) =>
    setMatrix((m) => m.map((row, r) => (r === ri ? row.map((v, c) => (c === ci ? SC_NEXT[v] : v)) : row)));

  const changed = matrix.reduce((a, row, ri) => a + row.reduce((b, v, ci) => b + (v !== SC_MATRIX_INIT[ri][ci] ? 1 : 0), 0), 0);
  const reset = () => setMatrix(SC_MATRIX_INIT.map((r) => r.slice()));

  const accounts = SC_ACCOUNTS.filter((a) => statusFilter === "전체" || a.status === statusFilter);
  const statusColor = { 활성: "text-emerald-300 bg-emerald-500/10 border-emerald-500/25", 잠김: "text-amber-300 bg-amber-500/10 border-amber-500/25", 비활성: "text-slate-400 bg-slate-700/40 border-slate-600/40" };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <SectionLabel color="rose">RBAC · 계정 · 권한 관리 (91)</SectionLabel>
          <h1 className="text-3xl font-bold mt-1.5 tracking-tight text-slate-50">계정 · 권한 관리</h1>
          <p className="text-sm text-slate-400 mt-1">부서×기능 3-tier 권한 매트릭스 시각 편집 · <span className="text-slate-500">문제 114(접근 통제) 해소</span></p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">ADMIN 전용 · 감사 로그 기록</span>
      </div>

      {/* 탭 */}
      <div className="flex items-center gap-1 text-sm p-0.5 rounded-lg bg-slate-800/70 border border-slate-700/60 w-fit">
        {[["matrix", "권한 매트릭스"], ["accounts", "계정 목록"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-3.5 py-1.5 rounded-md ${tab === k ? "bg-indigo-500/25 text-indigo-200" : "text-slate-400 hover:text-slate-200"}`}>{l}</button>
        ))}
      </div>

      {tab === "matrix" ? (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="font-semibold text-base">RBAC 권한 매트릭스 <span className="text-xs text-slate-500 font-normal">(부서 {SC_DEPTS.length} · 기능 {SC_FEATURES.length})</span></h3>
              <div className="text-xs text-slate-500 mt-0.5">셀 클릭 → <span className="text-emerald-300">C</span> ▸ <span className="text-slate-300">R</span> ▸ <span className="text-rose-400">–</span> 순환 · 민감(자금·손익)은 미권한 시 ●●●● 마스킹</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">변경분 <span className={`font-mono tabular-nums ${changed ? "text-amber-300" : "text-slate-400"}`}>{changed}</span>셀 · 검토자 관리자 최OO(자동)</span>
              <button onClick={reset} disabled={!changed} className={`px-2.5 py-1.5 rounded-md text-xs border ${changed ? "bg-slate-800 border-slate-700/60 text-slate-300 hover:bg-slate-700" : "bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed"}`}>취소</button>
              <button disabled={!changed} className={`px-3 py-1.5 rounded-md text-xs font-medium ${changed ? "bg-indigo-500 text-white hover:bg-indigo-400" : "bg-slate-800 text-slate-500 cursor-not-allowed"}`}>변경 저장</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-separate" style={{ borderSpacing: "3px" }}>
              <thead>
                <tr>
                  <th className="text-left text-[11px] uppercase tracking-wider text-slate-500 font-medium pr-3 pb-1">기능 \ 부서</th>
                  {SC_DEPTS.map((d) => (
                    <th key={d} className="text-center text-[11px] font-mono text-slate-400 font-medium pb-1 w-11">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SC_FEATURES.map((f, ri) => (
                  <tr key={f}>
                    <td className="pr-3 text-[13px] text-slate-300 whitespace-nowrap">{f}</td>
                    {SC_DEPTS.map((d, ci) => {
                      const v = matrix[ri][ci];
                      const cell = SC_CELL[v];
                      const dirty = v !== SC_MATRIX_INIT[ri][ci];
                      return (
                        <td key={d} className="text-center">
                          <button title={`${d} · ${cell.title}`} onClick={() => cycle(ri, ci)}
                            className={`w-9 h-9 rounded-md border font-mono font-bold text-sm transition relative ${cell.c}`}>
                            {cell.label}
                            {dirty && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-900"></span>}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-emerald-500/15 border border-emerald-500/30 inline-flex items-center justify-center text-emerald-300 font-mono text-[10px]">C</span>CRUD 편집</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-slate-700/40 border border-slate-600/40 inline-flex items-center justify-center text-slate-300 font-mono text-[10px]">R</span>읽기전용</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-rose-500/10 border border-rose-500/25 inline-flex items-center justify-center text-rose-400 font-mono text-[10px]">–</span>마스킹 ●●●● [권한없음]</span>
            <span className="ml-auto text-slate-600">변경 저장 시 audit_logs 기록 (검토자·이전값→이후값)</span>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-700/60 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Icon name="search" className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input placeholder="로그인ID · 성명 검색" className="w-full pl-9 pr-3 py-1.5 rounded-md bg-slate-950/60 border border-slate-700/60 text-sm focus:border-indigo-500 outline-none" />
            </div>
            <div className="flex items-center gap-1 text-xs p-0.5 rounded-md bg-slate-800/70 border border-slate-700/60">
              {["전체", "활성", "잠김", "비활성"].map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded ${statusFilter === s ? "bg-indigo-500/25 text-indigo-200" : "text-slate-400 hover:text-slate-200"}`}>{s}</button>
              ))}
            </div>
            <button className="px-3 py-1.5 rounded-md bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-400 flex items-center gap-1.5">
              <Icon name="plus" className="w-3.5 h-3.5" />계정 추가
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                  <th className="px-5 py-2.5 font-medium">로그인ID</th>
                  <th className="px-3 py-2.5 font-medium">성명</th>
                  <th className="px-3 py-2.5 font-medium">부서</th>
                  <th className="px-3 py-2.5 font-medium">직급</th>
                  <th className="px-3 py-2.5 font-medium">상태</th>
                  <th className="px-3 py-2.5 font-medium">최근접속</th>
                  <th className="px-5 py-2.5 font-medium text-right">액션</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.loginId} className="border-b border-slate-800/70 hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3 font-mono text-xs text-slate-300">{a.loginId}</td>
                    <td className="px-3 py-3 text-slate-200">{a.name}</td>
                    <td className="px-3 py-3 text-slate-400 text-xs">{a.dept}</td>
                    <td className="px-3 py-3 text-slate-400 text-xs">{a.position}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border ${statusColor[a.status]}`}>{a.status}</span>
                    </td>
                    <td className="px-3 py-3 text-slate-500 text-xs font-mono tabular-nums">{a.last}</td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <button onClick={() => setTab("matrix")} className="text-xs text-slate-400 hover:text-indigo-300">권한 편집</button>
                      <span className="text-slate-700 mx-1.5">·</span>
                      <button className="text-xs text-slate-400 hover:text-amber-300">비밀번호 초기화</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// 화면 3. window.Partners — 거래처 마스터 (⑦ Excel Bridge · ⑤ 단가 이력)
// ============================================================
const SC_PARTNERS = [
  { no: "PTN-2026-0007", name: "이든철강(주)",  type: "CUSTOMER",  typeLabel: "고객", country: "국내" },
  { no: "PTN-2026-0003", name: "니혼스틸웍스",  type: "CUSTOMER",  typeLabel: "고객", country: "일본" },
  { no: "PTN-2026-0005", name: "오세아니아스틸", type: "CUSTOMER",  typeLabel: "고객", country: "호주" },
  { no: "PTN-2026-0009", name: "대성구조",      type: "CUSTOMER",  typeLabel: "고객", country: "국내" },
  { no: "PTN-2026-0012", name: "현대제철",      type: "SUPPLIER",  typeLabel: "공급", country: "국내" },
  { no: "PTN-2026-0014", name: "동국제강",      type: "SUPPLIER",  typeLabel: "공급", country: "국내" },
  { no: "PTN-2026-0016", name: "포스코",        type: "SUPPLIER",  typeLabel: "공급", country: "국내" },
  { no: "PTN-2026-0018", name: "Nippon Steel",  type: "SUPPLIER",  typeLabel: "공급", country: "일본" },
  { no: "PTN-2026-0024", name: "대성외주가공",   type: "OUTSOURCE", typeLabel: "외주", country: "국내" },
  { no: "PTN-2026-0026", name: "한빛도장",       type: "OUTSOURCE", typeLabel: "외주", country: "국내" },
];
const SC_PRICE_HISTORY = {
  "현대제철": [
    { spec: "SM355TMC", th: 30, unitPrice: 1100, freight: 45000, baseDate: "2026-07-15" },
    { spec: "SM355TMC", th: 30, unitPrice: 1085, freight: 45000, baseDate: "2026-06-15" },
    { spec: "SM420",    th: 60, unitPrice: 1180, freight: 45000, baseDate: "2026-07-15" },
  ],
  "동국제강": [
    { spec: "SM355TMC", th: 45, unitPrice: 1150, freight: 52000, baseDate: "2026-07-14" },
    { spec: "SM355TMC", th: 45, unitPrice: 1140, freight: 52000, baseDate: "2026-06-14" },
  ],
  "포스코": [
    { spec: "SM355TMC", th: 30, unitPrice: 1120, freight: 40000, baseDate: "2026-07-16" },
    { spec: "SM420",    th: 80, unitPrice: 1210, freight: 40000, baseDate: "2026-07-16" },
  ],
  "Nippon Steel": [
    { spec: "SM355TMC", th: 30, unitPrice: 1160, freight: 120000, baseDate: "2026-07-12" },
  ],
};
const SC_MAPPING = [
  { col: "거래처명",   field: "name",         preview: "현대제철",       status: "ok" },
  { col: "유형",       field: "partner_type", preview: "공급",           status: "ok" },
  { col: "국가",       field: "country",      preview: "일본",           status: "ok" },
  { col: "통화",       field: "(미매핑)",      preview: "(빈칸)",         status: "missing" },
  { col: "사업자번호", field: "(미매핑)",      preview: "123-45-6789O",   status: "error" },
];

function Partners({ tweaks, navigate }) {
  const { fmt, won, Card, SectionLabel, Icon } = window;
  const [type, setType] = useState_sc("CUSTOMER");
  const [uploaded, setUploaded] = useState_sc(false);
  const [errOnly, setErrOnly] = useState_sc(false);
  const [selMill, setSelMill] = useState_sc("현대제철");

  const list = SC_PARTNERS.filter((p) => p.type === type);
  const typeTabs = [["CUSTOMER", "고객"], ["SUPPLIER", "공급/제강사"], ["OUTSOURCE", "외주"]];

  // 매핑 통계
  const okN = 23, errN = 2, totalRows = 25;
  const rows = errOnly ? SC_MAPPING.filter((m) => m.status !== "ok") : SC_MAPPING;

  // ⑤ 단가 추세 (선택 제강사 첫 규격 최근 2건 비교)
  const hist = SC_PRICE_HISTORY[selMill] || [];
  const sameSpec = hist.filter((h) => h.spec === (hist[0] && hist[0].spec));
  const trendPct = sameSpec.length >= 2 ? (((sameSpec[0].unitPrice - sameSpec[1].unitPrice) / sameSpec[1].unitPrice) * 100).toFixed(1) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <SectionLabel color="teal">PARTNERS · 거래처 마스터 (92)</SectionLabel>
          <h1 className="text-3xl font-bold mt-1.5 tracking-tight text-slate-50">거래처 마스터</h1>
          <p className="text-sm text-slate-400 mt-1">고객·공급(제강사)·외주 거래처 · ⑦ 엑셀 브리지 벌크 등록 · <span className="text-slate-500">문제 102·104 정합</span></p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setUploaded((v) => !v)} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700/60 hover:bg-slate-750 text-xs flex items-center gap-1.5 text-slate-300">
            <Icon name="upload" className="w-3.5 h-3.5" />엑셀
          </button>
          <button className="px-3 py-2 rounded-lg bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-400 flex items-center gap-1.5">
            <Icon name="plus" className="w-3.5 h-3.5" />거래처 추가
          </button>
        </div>
      </div>

      {/* 유형 탭 */}
      <div className="flex items-center gap-1 text-sm p-0.5 rounded-lg bg-slate-800/70 border border-slate-700/60 w-fit">
        {typeTabs.map(([k, l]) => (
          <button key={k} onClick={() => { setType(k); setUploaded(false); }}
            className={`px-3.5 py-1.5 rounded-md ${type === k ? "bg-indigo-500/25 text-indigo-200" : "text-slate-400 hover:text-slate-200"}`}>
            {l} <span className="text-[11px] opacity-70">{SC_PARTNERS.filter((p) => p.type === k).length}</span>
          </button>
        ))}
      </div>

      {/* 목록 테이블 */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                <th className="px-5 py-2.5 font-medium">거래처No</th>
                <th className="px-3 py-2.5 font-medium">거래처명</th>
                <th className="px-3 py-2.5 font-medium">유형</th>
                <th className="px-3 py-2.5 font-medium">국가</th>
                {type === "SUPPLIER" && <th className="px-5 py-2.5 font-medium text-right">단가 이력</th>}
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.no}
                  onClick={() => type === "SUPPLIER" && setSelMill(p.name)}
                  className={`border-b border-slate-800/70 transition ${type === "SUPPLIER" ? "cursor-pointer hover:bg-slate-800/40" : ""} ${type === "SUPPLIER" && selMill === p.name ? "bg-indigo-500/10" : ""}`}>
                  <td className="px-5 py-3 font-mono text-xs text-slate-300">{p.no}</td>
                  <td className="px-3 py-3 text-slate-200 font-medium">{p.name}</td>
                  <td className="px-3 py-3">
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-700/40 text-slate-300 border border-slate-600/40">{p.typeLabel}</span>
                  </td>
                  <td className="px-3 py-3 text-slate-400 text-xs">{p.country}</td>
                  {type === "SUPPLIER" && (
                    <td className="px-5 py-3 text-right">
                      <span className="text-xs text-slate-400 hover:text-indigo-300">{selMill === p.name ? "선택됨 ▾" : "이력 →"}</span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ⑦ Excel Bridge */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-base flex items-center gap-2"><Icon name="upload" className="w-4 h-4 text-emerald-400" />⑦ 엑셀 업로드 · 매핑 미리보기</h3>
          <span className="text-[11px] text-slate-500">엑셀 열 → 필드 매핑 · 오기/누락은 빨강 · 정상 행만 임포트</span>
        </div>

        {!uploaded ? (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[240px] flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-950/60 border border-dashed border-slate-700 text-sm text-slate-500">
              <Icon name="file" className="w-4 h-4 text-slate-500" />PARTNERS_2026.xlsx
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">시트
              <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700/60 font-mono">Sheet1 ▾</span>
            </div>
            <button onClick={() => setUploaded(true)} className="px-4 py-2.5 rounded-lg bg-emerald-500/90 text-white text-sm font-medium hover:bg-emerald-500">업로드</button>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                    <th className="px-3 py-2 font-medium">엑셀 열</th>
                    <th className="px-3 py-2 font-medium">→ 매핑 필드</th>
                    <th className="px-3 py-2 font-medium">1행 미리보기</th>
                    <th className="px-3 py-2 font-medium">검증</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((m, i) => {
                    const bad = m.status !== "ok";
                    return (
                      <tr key={i} className={`border-b border-slate-800/70 ${bad ? "bg-rose-500/5" : ""}`}>
                        <td className="px-3 py-2.5 text-slate-300">{m.col}</td>
                        <td className={`px-3 py-2.5 font-mono text-xs ${bad ? "text-rose-400" : "text-slate-400"}`}>{m.field}</td>
                        <td className={`px-3 py-2.5 ${bad ? "text-rose-300" : "text-slate-300"}`}>{m.preview}</td>
                        <td className="px-3 py-2.5">
                          {m.status === "ok" && <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300"><span>☑</span>정상</span>}
                          {m.status === "missing" && <span className="inline-flex items-center gap-1 text-[11px] text-rose-400"><span>⚠</span>누락</span>}
                          {m.status === "error" && <span className="inline-flex items-center gap-1 text-[11px] text-rose-400"><span>⚠</span>오기</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs text-slate-500">
                총 <span className="text-slate-300 tabular-nums">{totalRows}</span>행 · 정상 <span className="text-emerald-300 tabular-nums">{okN}</span> · 오류 <span className="text-rose-400 tabular-nums">{errN}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setErrOnly((v) => !v)} className={`px-2.5 py-1.5 rounded-md text-xs border ${errOnly ? "bg-rose-500/15 border-rose-500/30 text-rose-300" : "bg-slate-800 border-slate-700/60 text-slate-300 hover:bg-slate-700"}`}>오류만 보기</button>
                <button onClick={() => setUploaded(false)} className="px-2.5 py-1.5 rounded-md text-xs bg-slate-800 border border-slate-700/60 text-slate-300 hover:bg-slate-700">취소</button>
                <button className="px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-500/90 text-white hover:bg-emerald-500">임포트 실행 <span className="opacity-80">(정상 {okN}행)</span></button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ⑤ 제강사 단가 이력 (SUPPLIER 선택 시) */}
      {type === "SUPPLIER" && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Icon name="grid" className="w-4 h-4 text-indigo-400" />⑤ 제강사 단가 이력
              <span className="font-mono text-xs text-slate-500 font-normal">{selMill} · {(SC_PARTNERS.find((p) => p.name === selMill) || {}).no}</span>
            </h3>
            {trendPct != null && (
              <span className={`text-xs px-2 py-0.5 rounded border ${+trendPct >= 0 ? "bg-rose-500/10 text-rose-300 border-rose-500/25" : "bg-emerald-500/10 text-emerald-300 border-emerald-500/25"}`}>
                최근 단가 추세 {+trendPct >= 0 ? "▲" : "▼"} {Math.abs(+trendPct)}% (전월比)
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                  <th className="px-3 py-2 font-medium">재질</th>
                  <th className="px-3 py-2 font-medium text-right">두께</th>
                  <th className="px-3 py-2 font-medium text-right">단가(/kg)</th>
                  <th className="px-3 py-2 font-medium text-right">운임</th>
                  <th className="px-3 py-2 font-medium text-right">기준일</th>
                </tr>
              </thead>
              <tbody>
                {hist.map((h, i) => (
                  <tr key={i} className="border-b border-slate-800/70 hover:bg-slate-800/40">
                    <td className="px-3 py-2.5 font-mono text-slate-300">{h.spec}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-400">{h.th}t</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-200">{won(h.unitPrice)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-400">{won(h.freight)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-500 font-mono text-xs">{h.baseDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">⑤ 최근 단가·운임은 제강사 비교(모델 14 · BS1108)의 입력 원천으로 연동됩니다.</span>
            <button onClick={() => navigate("mills")} className="px-3 py-1.5 rounded-md text-xs bg-slate-800 border border-slate-700/60 text-slate-300 hover:bg-slate-700 flex items-center gap-1.5">
              제강사 비교 화면 <Icon name="arrowRight" className="w-3 h-3" />
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// 화면 4. window.Fx — 환율 연동 / 스냅샷 (C1 신선도 · ⑨ FX 위젯)
// ============================================================
function Fx({ tweaks, navigate }) {
  const { fmt, won, Card, SectionLabel, Icon, TrustBadge, Masked } = window;
  const canFinance = window.FINANCE_ROLES.includes(tweaks.role);
  const showBadge = tweaks.showTrustBadges;
  const [synced, setSynced] = useState_sc(false);
  const [lastSync, setLastSync] = useState_sc("2026-07-18 06:00");

  const snap = window.FX_SNAPSHOT;
  // 통화별 스냅샷 행 (AUD는 3일 경과 → 동기화 시 당일로 갱신)
  const fxRows = [
    { currency: "JPY", unit: "(100)", rate: snap.rates.JPY * 100, baseDate: snap.baseDate, delta: "▲" },
    { currency: "USD", unit: "",      rate: snap.rates.USD,       baseDate: snap.baseDate, delta: "▼" },
    { currency: "AUD", unit: "",      rate: snap.rates.AUD,       baseDate: synced ? SC_TODAY : "2026-07-15", delta: "▲" },
  ];

  const doSync = () => { setSynced(true); setLastSync("2026-07-18 16:54"); };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <SectionLabel color="cyan">FX · 환율 연동 / 스냅샷 (93)</SectionLabel>
          <h1 className="text-3xl font-bold mt-1.5 tracking-tight text-slate-50">환율 연동 / 스냅샷</h1>
          <p className="text-sm text-slate-400 mt-1">수출입은행 OpenAPI 매매기준율 스냅샷(704) · <span className="text-slate-500">문제 111(환율 수기 재계산) 해소</span></p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] px-2 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/60 text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>자동 ON
          </span>
          <button onClick={doSync} className="px-3 py-2 rounded-lg bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-400 flex items-center gap-1.5">
            <Icon name="refresh" className="w-3.5 h-3.5" />수동 동기화 <span className="opacity-70">(ADMIN)</span>
          </button>
        </div>
      </div>

      {/* 환율 스냅샷 테이블 (C1 신선도) */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-semibold text-base flex items-center gap-2"><Icon name="fx" className="w-4 h-4 text-cyan-400" />환율 스냅샷 (매매기준율)</h3>
          <span className="text-[11px] text-slate-500 flex items-center gap-1.5">기준일 <span className="font-mono text-slate-300">{snap.baseDate}</span> <TrustBadge kind="시스템" show={showBadge} /></span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                <th className="px-3 py-2 font-medium">통화</th>
                <th className="px-3 py-2 font-medium text-right">매매기준율</th>
                <th className="px-3 py-2 font-medium text-right">기준일</th>
                <th className="px-3 py-2 font-medium">출처</th>
                <th className="px-3 py-2 font-medium">신선도 (C1)</th>
              </tr>
            </thead>
            <tbody>
              {fxRows.map((r) => {
                const elapsed = SC_daysBetween(r.baseDate, SC_TODAY);
                const fresh = elapsed <= 0;
                return (
                  <tr key={r.currency} className="border-b border-slate-800/70 hover:bg-slate-800/40">
                    <td className="px-3 py-3 text-slate-200 font-medium">{r.currency}<span className="text-slate-500 text-xs">{r.unit}</span></td>
                    <td className="px-3 py-3 text-right tabular-nums font-mono text-slate-100">
                      {fmt(+r.rate.toFixed(2))}
                      <span className={`ml-1.5 text-xs ${r.delta === "▲" ? "text-emerald-400" : "text-rose-400"}`}>{r.delta}</span>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-400 font-mono text-xs">{r.baseDate}</td>
                    <td className="px-3 py-3"><TrustBadge kind="시스템" show={showBadge} /></td>
                    <td className="px-3 py-3">
                      {fresh ? (
                        <span className="inline-flex items-center gap-1.5">
                          <TrustBadge kind="확정" show={true} /><span className="text-[11px] text-emerald-300">당일</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <TrustBadge kind="기준값없음" show={true} /><span className="text-[11px] text-amber-300">{elapsed}일 경과 ⚠</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-1">
          <span>최근 동기화 <span className="font-mono text-slate-300 tabular-nums">{lastSync}</span> (수출입은행 OpenAPI · 영업일 1회)</span>
          <span className="flex items-center gap-1 text-slate-600"><Icon name="info" className="w-3 h-3" />통화·기준일로 exchange_rates 매매기준율 스냅샷 조회(704)</span>
        </div>
      </Card>

      {/* ⑨ FX 위젯 — 환리스크 레이더 (CEO·FINANCE 전용) */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-base flex items-center gap-2"><Icon name="globe" className="w-4 h-4 text-cyan-400" />⑨ FX 위젯 — 환리스크 레이더</h3>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">CEO · FINANCE 전용</span>
        </div>
        {canFinance ? (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                    <th className="px-3 py-2 font-medium">통화</th>
                    <th className="px-3 py-2 font-medium text-right">미수(외화)</th>
                    <th className="px-3 py-2 font-medium text-right">원화환산 (exposureKRW)</th>
                    <th className="px-3 py-2 font-medium text-right">−2% 시 손실 (fxRiskKRW)</th>
                  </tr>
                </thead>
                <tbody>
                  {window.FX_RADAR.map((f) => (
                    <tr key={f.currency} className="border-b border-slate-800/70 hover:bg-slate-800/40">
                      <td className="px-3 py-3 text-slate-200 font-medium">{f.currency}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-300">{f.sym}{fmt(f.foreign)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-100">{won(f.exposureKRW)}</td>
                      <td className="px-3 py-3 text-right">
                        <span className={`tabular-nums ${f.fxDeltaPct < 0 ? "text-rose-300" : "text-emerald-300"}`}>▼ {won(f.fxRiskKRW)}</span>
                        {f.currency === "JPY" && <span title="위험" className="ml-1">⚠</span>}
                        {f.stale && <span className="ml-1.5 align-middle"><TrustBadge kind="기준값없음" show={true} /></span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 p-3 rounded-lg bg-rose-950/50 border border-rose-800/40 text-xs text-rose-200">
              서사: 미수 <span className="tabular-nums">¥88,500,000 = {won(798402750)}</span>, 환율 −2% 시 <span className="tabular-nums font-semibold">{won(15968055)}</span> 손실 위험 ⚠
              <span className="text-rose-300/70"> — 손익(20)·미수금(19)·대시보드(41)와 동일 스냅샷(704·BS1104) 참조</span>
            </div>
            <div className="mt-2 flex justify-end">
              <button onClick={() => navigate("dashboard")} className="px-3 py-1.5 rounded-md text-xs bg-slate-800 border border-slate-700/60 text-slate-300 hover:bg-slate-700 flex items-center gap-1.5">
                경영 대시보드 환리스크 <Icon name="arrowRight" className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center">
            <Masked visible={false} need="CEO·FINANCE">x</Masked>
            <div className="text-xs text-slate-500 mt-3">환리스크·원화환산 노출은 CEO·FINANCE 권한만 열람합니다.<br />Tweaks에서 부서를 <span className="text-slate-300">자금/대표</span>로 바꿔보세요.</div>
          </div>
        )}
      </Card>
    </div>
  );
}

Object.assign(window, { Home, Rbac, Partners, Fx });
