// screens-production.jsx — 생산상태·MCS(16) / 시험성적서·품질(17) / 불량·클레임(17-1)
// 3 화면 = window.Production · window.Quality · window.Defect
// 모두 여정 ⑤생산(IN_PRODUCTION·주황) 구간. 공통 ⑥ 여정 스텝퍼 헤더 상단 고정.
// 근거: models/5_프로토타입모델_생산및품질.md · 실행계획 §3(work_orders/inspection_reports/defect_records/claims)·§5.6(BS1109·BS1110·ProjectStateMachine)
// 규칙: 솔리드 다크(slate-900/950) · glassmorphism 금지 · accent ≤3색/화면 · mock 가상(WO/INS/DF/CL-2026-####)
const { useState: useStateP, useEffect: useEffectP } = React;

// ── 공통 앵커: 생산중(가급적 일본) 프로젝트 1건 ─────────────────
function pqAnchor(route) {
  const P = window.PROJECTS || [];
  const pn = route && route.payload && route.payload.projectNo;
  if (pn) { const f = P.find((p) => p.projectNo === pn); if (f) return f; }
  return P.find((p) => p.status === "IN_PRODUCTION" && p.country === "일본")
      || P.find((p) => p.status === "IN_PRODUCTION")
      || P[0];
}

// ── mock 시각 스탬프 (2026-07-18 고정 · 시:분 라이브) ───────────
function pqStamp() {
  const d = new Date();
  const z = (n) => String(n).padStart(2, "0");
  return `2026-07-18 ${z(d.getHours())}:${z(d.getMinutes())}`;
}

// ── 불량률 의미색 (yieldColor 반대: 높을수록 나쁨 · BS1110) ──────
//   3%↓ 초록 · 3~7% 주황 · 7%↑ 빨강
function pqDefectHex(r) { return r == null ? "#64748b" : r >= 7 ? "#f43f5e" : r >= 3 ? "#f59e0b" : "#10b981"; }

// ── [가정] 플래그 (착수 워크숍 확정 대기) ──────────────────────
function PQAssume({ q = "Q7" }) {
  return (
    <span className="inline-flex items-center rounded border border-amber-500/30 bg-amber-500/10 text-amber-300 px-1.5 py-0.5 text-[10px] font-medium font-mono">
      [가정: {q}]
    </span>
  );
}

// ── 판정 뱃지 (BS1109 · 합격 emerald / 불합격 rose + ⚠) ─────────
function PQJudge({ pass, size = "sm" }) {
  const { Icon } = window;
  const c = pass ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                 : "bg-rose-500/15 text-rose-300 border-rose-500/30";
  const px = size === "lg" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border ${c} ${px} font-semibold whitespace-nowrap`}>
      <span className={`w-1.5 h-1.5 rounded-full ${pass ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
      {pass ? '합격' : <>불합격 <Icon name="alert" className="w-3 h-3" /></>}
    </span>
  );
}

// ── ⑥ 여정 스텝퍼 공통 헤더 (생산 구간 · 현재=주황) ────────────
function PQJourneyHeader({ project, dept }) {
  const { Card, StatusBadge } = window;
  const steps = window.JOURNEY_STEPS;
  const cur = window.PROJECT_STATUS_META[project.status].step;
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between text-xs mb-2.5 flex-wrap gap-2">
        <div className="flex items-center gap-2 text-slate-300 flex-wrap">
          <span className="font-mono text-slate-400">{project.projectNo}</span>
          <span className="text-slate-600">·</span>
          <span>{project.customer}</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-500">{project.country} / {project.currency}</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-500">부서 {dept} · 권한 CRUD</span>
        </div>
        <StatusBadge status={project.status} />
      </div>
      <div className="flex items-center">
        {steps.map((s, i) => {
          const passed = i < cur, isCur = i === cur, gate = i === 2;
          return (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${passed ? 'bg-emerald-500/25 text-emerald-300' : isCur ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                  {passed ? '✓' : i + 1}
                </div>
                <div className={`text-[10px] mt-1 ${isCur ? 'text-amber-300' : 'text-slate-500'}`}>{s}</div>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 flex items-center justify-center px-1">
                  {gate ? <span className="text-xs" title="CP 확정 시 잠금해제">🔓</span>
                        : <div className={`h-px w-full ${i < cur ? 'bg-emerald-500/40' : 'bg-slate-700'}`}></div>}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </Card>
  );
}

// ============================================================
// 화면 1 · window.Production — 작업지시 · 생산상태 · MCS (모델 16)
//   accent: teal(생산) · amber(진행) · emerald(완료/등록)
// ============================================================
const PQ_WO_META = {
  WO_ISSUED:   { label: "지시", tint: "slate",   dot: "bg-slate-400",   head: "text-slate-300" },
  IN_PROGRESS: { label: "진행", tint: "amber",   dot: "bg-amber-400",   head: "text-amber-300" },
  DONE:        { label: "완료", tint: "emerald", dot: "bg-emerald-400", head: "text-emerald-300" },
};
const PQ_PROCESS_ORDER = ["절단", "조립", "용접", "도장", "검사"];

function pqInitWos() {
  return [
    { woNo: "WO-2026-0051", process: "절단", qty: 300, status: "DONE",        mcs: true,  actual: 300 },
    { woNo: "WO-2026-0052", process: "조립", qty: 300, status: "DONE",        mcs: true,  actual: 300 },
    { woNo: "WO-2026-0053", process: "용접", qty: 300, status: "IN_PROGRESS", mcs: true,  actual: 120 },
    { woNo: "WO-2026-0054", process: "도장", qty: 300, status: "WO_ISSUED",   mcs: false, actual: 0 },
    { woNo: "WO-2026-0055", process: "검사", qty: 300, status: "WO_ISSUED",   mcs: false, actual: 0 },
  ];
}
function pqInitProdAudit() {
  return [
    { t: "2026-07-18 08:30", who: "생산 한작업", act: "MCS 실적 등록",   detail: "WO-2026-0053 용접 · 실적 120/300 EA (mcs_data JSONB)" },
    { t: "2026-07-16 10:20", who: "생산 정반장", act: "상태전이 진행→완료", detail: "WO-2026-0052 조립 · 300/300 EA" },
    { t: "2026-07-14 08:40", who: "생산 정반장", act: "작업지시 발행",    detail: "[자동채번] WO-2026-0051 · 절단 300 EA" },
  ];
}

function Production({ route, navigate, tweaks }) {
  const { fmt, Card, SectionLabel, Icon, TrustBadge } = window;
  const anchor = pqAnchor(route);
  const showTB = tweaks && tweaks.showTrustBadges;

  const [wos, setWos] = useStateP(pqInitWos);
  const [audit, setAudit] = useStateP(pqInitProdAudit);
  const [mcsWo, setMcsWo] = useStateP("WO-2026-0053");
  const [mcsQty, setMcsQty] = useStateP("");
  const [mcsEquip, setMcsEquip] = useStateP("");
  const [mcsWorker, setMcsWorker] = useStateP("");
  const [mcsRemark, setMcsRemark] = useStateP("");
  const [flash, setFlash] = useStateP(null);

  const cols = [["WO_ISSUED"], ["IN_PROGRESS"], ["DONE"]].map((k) => k[0]);

  const advance = (woNo) => {
    let logged = null;
    setWos((prev) => prev.map((w) => {
      if (w.woNo !== woNo) return w;
      if (w.status === "WO_ISSUED") { logged = { from: "지시", to: "진행", w }; return { ...w, status: "IN_PROGRESS" }; }
      if (w.status === "IN_PROGRESS") { logged = { from: "진행", to: "완료", w }; return { ...w, status: "DONE", actual: w.qty }; }
      return w;
    }));
    setTimeout(() => {
      if (!logged) return;
      const done = logged.to === "완료";
      setAudit((a) => [{
        t: pqStamp(), who: "생산 한작업", act: `상태전이 ${logged.from}→${logged.to}`,
        detail: `${logged.w.woNo} ${logged.w.process} · ${done ? `${logged.w.qty}/${logged.w.qty} EA` : "착수"}`,
      }, ...a]);
    }, 0);
  };

  const registerMcs = () => {
    const wo = wos.find((w) => w.woNo === mcsWo);
    if (!wo || !mcsQty) { setFlash("작업지시·실적수량은 필수입니다."); setTimeout(() => setFlash(null), 2200); return; }
    const q = Math.max(0, parseInt(mcsQty, 10) || 0);
    setWos((prev) => prev.map((w) => w.woNo === mcsWo ? { ...w, mcs: true, actual: q } : w));
    setAudit((a) => [{
      t: pqStamp(), who: "생산 한작업", act: "MCS 실적 등록",
      detail: `${wo.woNo} ${wo.process} · 실적 ${fmt(q)}/${wo.qty} EA${mcsEquip ? ` · 설비 ${mcsEquip}` : ""}${mcsRemark ? ` · ${mcsRemark}` : ""}`,
    }, ...a]);
    setMcsQty(""); setMcsEquip(""); setMcsWorker(""); setMcsRemark("");
    setFlash(`✓ ${wo.woNo} MCS 실적 ${fmt(q)} EA 등록됨`); setTimeout(() => setFlash(null), 2600);
  };

  // 타임라인: 등록된 MCS/상태로 공정 진행 렌더 (완료●·진행◉·대기○)
  const timeline = PQ_PROCESS_ORDER.map((proc) => {
    const w = wos.find((x) => x.process === proc);
    const st = w ? w.status : "WO_ISSUED";
    return { proc, st, actual: w ? w.actual : 0, qty: w ? w.qty : 0 };
  });

  return (
    <div className="space-y-5">
      <PQJourneyHeader project={anchor} dept="생산" />

      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <SectionLabel color="teal">PRODUCTION · 작업지시 · 생산상태 · MCS · 모델 16</SectionLabel>
          <h1 className="text-3xl font-bold mt-1.5 tracking-tight text-slate-50">작업지시 · 생산상태</h1>
          <p className="text-sm text-slate-400 mt-1">칸반 상태전이(지시→진행→완료) · MCS 생산실적 등록 · <span className="text-slate-500">문제 107 해소</span></p>
        </div>
        <div className="text-right text-xs">
          <div className="text-slate-500">진행 공정</div>
          <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="font-medium text-slate-200">용접 · WO-2026-0053</span>
          </div>
        </div>
      </div>

      {/* ── 작업지시 칸반 (WorkOrderStatus) ── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm flex items-center gap-2"><Icon name="grid" className="w-4 h-4 text-teal-400" />작업지시 칸반 <span className="text-[11px] font-mono text-slate-500 ml-1">지시 → 진행 → 완료</span></h3>
          <div className="text-[11px] text-slate-500">미허용 전이 = InvalidTransition 차단 (§3.4)</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {cols.map((col) => {
            const meta = PQ_WO_META[col];
            const list = wos.filter((w) => w.status === col);
            return (
              <div key={col} className="rounded-lg bg-slate-950/60 border border-slate-800 p-3">
                <div className="flex items-center justify-between mb-2.5">
                  <div className={`flex items-center gap-1.5 text-xs font-semibold ${meta.head}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`}></span>{meta.label}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{list.length} EA</span>
                </div>
                <div className="space-y-2 min-h-[60px]">
                  {list.map((w) => (
                    <div key={w.woNo} className={`p-2.5 rounded-md bg-slate-900 border ${col === 'IN_PROGRESS' ? 'border-amber-800/50' : col === 'DONE' ? 'border-emerald-800/40' : 'border-slate-700/60'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-slate-200">{w.woNo}</span>
                        {w.mcs && <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-mono">MCS ✓</span>}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-mono">{anchor.projectNo}</div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-slate-300">공정 <span className="text-slate-100 font-medium">{w.process}</span></span>
                        <span className="text-[11px] tabular-nums text-slate-400">{fmt(w.actual)}/{fmt(w.qty)} EA</span>
                      </div>
                      {col === "WO_ISSUED" && (
                        <button onClick={() => advance(w.woNo)} className="w-full mt-2 py-1 rounded text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition flex items-center justify-center gap-1">진행으로 <Icon name="arrowRight" className="w-3 h-3" /></button>
                      )}
                      {col === "IN_PROGRESS" && (
                        <button onClick={() => advance(w.woNo)} className="w-full mt-2 py-1 rounded text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition flex items-center justify-center gap-1">완료로 <Icon name="check" className="w-3 h-3" /></button>
                      )}
                      {col === "DONE" && (
                        <div className="mt-2 text-[10px] text-emerald-300/80 flex items-center gap-1"><Icon name="check" className="w-3 h-3" />공정 완료 · {w.mcs ? "MCS 등록됨" : "MCS 미등록"}</div>
                      )}
                    </div>
                  ))}
                  {list.length === 0 && <div className="text-[11px] text-slate-600 text-center py-3">해당 상태 없음</div>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-12 gap-4">
        {/* ── MCS 데이터 등록 미니 폼 ── */}
        <Card className="col-span-12 lg:col-span-7 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="db" className="w-4 h-4 text-teal-400" />
            <h3 className="font-semibold text-sm">MCS 데이터 등록 <span className="text-[11px] font-mono text-slate-500">(작업지시별 생산실적 · mcs_data)</span></h3>
            <PQAssume q="Q7" />
          </div>
          <p className="text-xs text-slate-500 mb-3">MCS 정의·항목은 착수 워크숍(Q7)에서 확정 — 현재 실적수량·설비·작업자를 가정 항목으로 표시.</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 sm:col-span-1 block">
              <span className="text-[11px] text-slate-400">* 작업지시</span>
              <select value={mcsWo} onChange={(e) => setMcsWo(e.target.value)} className="w-full mt-1 px-2.5 py-1.5 rounded-md bg-slate-950/60 border border-slate-700/60 text-sm text-slate-200 focus:border-teal-500 outline-none">
                {wos.map((w) => <option key={w.woNo} value={w.woNo}>{w.woNo} · {w.process}</option>)}
              </select>
            </label>
            <label className="col-span-2 sm:col-span-1 block">
              <span className="text-[11px] text-slate-400">공정 <span className="text-slate-600">(자동)</span></span>
              <div className="w-full mt-1 px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-sm text-slate-300">{(wos.find((w) => w.woNo === mcsWo) || {}).process || "—"}</div>
            </label>
            <label className="col-span-2 sm:col-span-1 block">
              <span className="text-[11px] text-slate-400">* 실적수량 (EA)</span>
              <input value={mcsQty} onChange={(e) => setMcsQty(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="120" className="w-full mt-1 px-2.5 py-1.5 rounded-md bg-slate-950/60 border border-slate-700/60 text-sm tabular-nums text-slate-200 focus:border-teal-500 outline-none" />
            </label>
            <label className="col-span-2 sm:col-span-1 block">
              <span className="text-[11px] text-slate-400">설비</span>
              <input value={mcsEquip} onChange={(e) => setMcsEquip(e.target.value)} placeholder="용접기 W-03" className="w-full mt-1 px-2.5 py-1.5 rounded-md bg-slate-950/60 border border-slate-700/60 text-sm text-slate-200 focus:border-teal-500 outline-none" />
            </label>
            <label className="col-span-2 sm:col-span-1 block">
              <span className="text-[11px] text-slate-400">작업자</span>
              <input value={mcsWorker} onChange={(e) => setMcsWorker(e.target.value)} placeholder="한작업" className="w-full mt-1 px-2.5 py-1.5 rounded-md bg-slate-950/60 border border-slate-700/60 text-sm text-slate-200 focus:border-teal-500 outline-none" />
            </label>
            <label className="col-span-2 sm:col-span-1 block">
              <span className="text-[11px] text-slate-400">비고</span>
              <input value={mcsRemark} onChange={(e) => setMcsRemark(e.target.value)} placeholder="이면비드 재작업" className="w-full mt-1 px-2.5 py-1.5 rounded-md bg-slate-950/60 border border-slate-700/60 text-sm text-slate-200 focus:border-teal-500 outline-none" />
            </label>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="text-[11px] h-4">{flash && <span className={flash.startsWith("✓") ? "text-emerald-300" : "text-rose-300"}>{flash}</span>}</div>
            <button onClick={registerMcs} className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 text-sm font-semibold flex items-center gap-1.5 shadow-lg shadow-teal-500/20">
              <Icon name="plus" className="w-3.5 h-3.5" />MCS 등록
            </button>
          </div>
          <div className="mt-2 text-[10px] font-mono text-slate-600">POST /api/work-orders/{'{'}id{'}'}/mcs</div>
        </Card>

        {/* ── 생산 미니 타임라인 ── */}
        <Card className="col-span-12 lg:col-span-5 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2"><Icon name="factory" className="w-4 h-4 text-teal-400" />생산 미니 타임라인</h3>
            {showTB && <TrustBadge kind="자동계산" show={showTB} />}
          </div>
          <p className="text-xs text-slate-500 mb-4">mcs_data 집계 · 완료 ● · 진행 ◉ · 대기 ○</p>
          <div className="space-y-0">
            {timeline.map((s, i) => {
              const done = s.st === "DONE", prog = s.st === "IN_PROGRESS";
              return (
                <div key={s.proc} className="flex items-stretch gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${done ? 'bg-emerald-500 text-white' : prog ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-800 border border-slate-700'}`}>
                      {done ? '●' : prog ? '◉' : ''}
                    </div>
                    {i < timeline.length - 1 && <div className={`w-px flex-1 min-h-[24px] ${done ? 'bg-emerald-500/40' : 'bg-slate-700'}`}></div>}
                  </div>
                  <div className="pb-3">
                    <div className={`text-sm font-medium ${done ? 'text-emerald-300' : prog ? 'text-amber-300' : 'text-slate-500'}`}>{s.proc}</div>
                    <div className="text-[11px] text-slate-500 tabular-nums">{done ? `완료 · ${fmt(s.qty)} EA` : prog ? `진행 · ${fmt(s.actual)}/${fmt(s.qty)} EA` : "대기"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ── C5 상태전이 감사추적 (mono) ── */}
      <Card className="p-5">
        <h4 className="text-xs uppercase tracking-wider text-slate-400 mb-3">C5 · 감사추적 <span className="normal-case text-slate-600">(작업지시 상태전이 · audit_logs · 읽기전용)</span></h4>
        <div className="space-y-1.5 text-[11px] font-mono text-slate-500 max-h-52 overflow-y-auto">
          {audit.map((a, i) => (
            <div key={i} className="leading-relaxed">
              <span className="text-slate-400">{a.t}</span> · <span className="text-slate-300">{a.who}</span> · <span className="text-teal-300">{a.act}</span>
              <div className="text-slate-600 pl-1">{a.detail}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// 화면 2 · window.Quality — 시험성적서 · 품질검수 (모델 17)
//   accent: violet(품질) · emerald(합격) · rose(불합격)
//   ⑩ 국가 양식 자동전환: 탭 클릭 → 폼 필드 + test_items(JSONB) morph
// ============================================================
const PQ_FORMS = {
  "국내": {
    tab: "국내 (KS)", std: "KS D 3515 SM490", member: "FLANGE PL-12x300", docNo: "INS-2026-0071",
    fields: [
      { label: "시험기관", value: "한국철강시험원 (가상)" },
      { label: "KS 인증번호", value: "KS-D-3515-11" },
      { label: "성적서 발급일", value: "2026-07-17" },
    ],
    tests: [
      { name: "항복점 YP", spec: "≥ 325 MPa", value: "355", pass: true },
      { name: "인장강도 TS", spec: "490~610 MPa", value: "525", pass: true },
      { name: "연신율 EL", spec: "≥ 21 %", value: "24", pass: true },
      { name: "굽힘시험", spec: "이상 없음", value: "양호", pass: true },
    ],
  },
  "일본": {
    tab: "일본 (JIS)", std: "JIS G 3106 SM490", member: "FLANGE PL-16x400", docNo: "INS-2026-0073",
    fields: [
      { label: "ミルシート No.", value: "MS-JP-2026-0073" },
      { label: "検査員", value: "검사원 QC-J07 (가상)" },
      { label: "JIS 認証", value: "JIS G 3106" },
    ],
    tests: [
      { name: "항복점 YP", spec: "≥ 325 MPa", value: "355", pass: true },
      { name: "인장강도 TS", spec: "490~610 MPa", value: "525", pass: true },
      { name: "연신율 EL", spec: "≥ 21 %", value: "24", pass: true },
      { name: "샤르피충격 0℃", spec: "≥ 27 J", value: "18", pass: false },
    ],
  },
  "호주": {
    tab: "호주 (AS/NZS)", std: "AS/NZS 3678 Gr350", member: "WEB PL-9x600", docNo: "INS-2026-0072",
    fields: [
      { label: "NATA Accred.", value: "NATA-2026-118" },
      { label: "Heat No.", value: "HT-AU-4471" },
      { label: "Test Certificate", value: "AS/NZS 3678" },
    ],
    tests: [
      { name: "Yield Strength", spec: "≥ 340 MPa", value: "362", pass: true },
      { name: "Tensile Strength", spec: "≥ 450 MPa", value: "510", pass: true },
      { name: "Elongation", spec: "≥ 20 %", value: "23", pass: true },
      { name: "Charpy V-notch 0℃", spec: "≥ 27 J", value: "41", pass: true },
    ],
  },
};

function Quality({ route, navigate, tweaks }) {
  const { Card, SectionLabel, Icon, TrustBadge } = window;
  const anchor = pqAnchor(route);
  const showTB = tweaks && tweaks.showTrustBadges;

  const initCountry = PQ_FORMS[anchor.country] ? anchor.country : "일본";
  const [country, setCountry] = useStateP(initCountry);
  const [uploaded, setUploaded] = useStateP(false);
  const form = PQ_FORMS[country];
  const failCount = form.tests.filter((t) => !t.pass).length;
  const overallPass = failCount === 0;

  // 추적성: heat(로트) → 모재 → 절단편 → 부재 → 성적서 · 재료 계보 기반(트리거②)
  //   heat는 MOTHER_BARS(각 모재의 heat_no)에서 전파 → 부재·성적서로 이어지는 실제 데이터 경로
  const trace = Object.values(PQ_FORMS).map((f, i) => ({
    member: f.member, report: f.docNo,
    heat: (window.MOTHER_BARS[i % window.MOTHER_BARS.length] || {}).heat || "HT-2504-A17",
    pass: f.tests.every((t) => t.pass),
    defect: f.tests.every((t) => t.pass) ? null : "DF-2026-0045",
  }));

  return (
    <div className="space-y-5">
      <PQJourneyHeader project={anchor} dept="품질" />

      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <SectionLabel color="violet">QUALITY · 시험성적서 · 품질검수 · 모델 17</SectionLabel>
          <h1 className="text-3xl font-bold mt-1.5 tracking-tight text-slate-50">시험성적서 · 품질검수</h1>
          <p className="text-sm text-slate-400 mt-1">⑩ 국가 양식 자동전환 · 판정 BS1109 · 추적성 그래프 · <span className="text-slate-500">문제 108 해소</span></p>
        </div>
      </div>

      {/* ── 추적성 미니 그래프 (프로젝트→부재→성적서→불량) ── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2"><Icon name="layers" className="w-4 h-4 text-violet-400" />⑩ 품질 추적성 그래프 <span className="text-[11px] font-mono text-slate-500">heat → 모재 → 부재 → 성적서</span></h3>
          <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">성적서 {trace.length}/{trace.length} · heat 추적 활성</span>
        </div>
        <div className="flex items-start gap-3 overflow-x-auto pb-1">
          <div className="shrink-0 px-3 py-2.5 rounded-lg bg-violet-500/10 border border-violet-500/30 self-center">
            <div className="text-[10px] text-violet-300/80 font-mono">프로젝트</div>
            <div className="text-xs font-mono text-slate-200 mt-0.5">{anchor.projectNo}</div>
          </div>
          <div className="shrink-0 self-center text-slate-600"><Icon name="chevronRight" className="w-4 h-4" /></div>
          <div className="space-y-2">
            {trace.map((n) => {
              const active = n.report === form.docNo;
              return (
                <div key={n.report} className="flex items-center gap-2">
                  <div className={`shrink-0 px-2.5 py-1.5 rounded-md border text-xs ${active ? 'bg-slate-800 border-violet-500/40' : 'bg-slate-900 border-slate-700/60'}`}>
                    <span className="font-mono text-slate-300">{n.member}</span>
                    <span className="ml-2 text-[10px] font-mono text-amber-300/80" title="이 부재가 나온 heat(로트) — 밀시트(MTC) 추적 키">heat {n.heat}</span>
                  </div>
                  <Icon name="chevronRight" className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <div className={`shrink-0 px-2.5 py-1.5 rounded-md border flex items-center gap-2 ${active ? 'bg-slate-800 border-violet-500/40' : 'bg-slate-900 border-slate-700/60'}`}>
                    <span className="font-mono text-xs text-slate-400">{n.report}</span>
                    <PQJudge pass={n.pass} />
                  </div>
                  {n.defect && (
                    <>
                      <Icon name="chevronRight" className="w-3.5 h-3.5 text-rose-500/60 shrink-0" />
                      <button onClick={() => navigate && navigate("defect", { projectNo: anchor.projectNo })} className="shrink-0 px-2.5 py-1.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 hover:bg-rose-500/20 transition flex items-center gap-1 font-mono">
                        불량 {n.defect} <Icon name="arrowRight" className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-2 text-[11px] text-slate-500">◀ 역추적: 불량 → 성적서 → 부재 → 프로젝트 · 불합격 성적서는 17-1 불량 등록으로 연계</div>
      </Card>

      {/* ── ⑩ 국가 양식 자동전환 탭 + 폼 morph ── */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="globe" className="w-4 h-4 text-violet-400" />
          <h3 className="font-semibold text-sm">성적서 입력 · 국가 양식 자동전환</h3>
          <span className="text-[11px] font-mono text-slate-500">test_items(JSONB) 스키마 자동교체 · MG1103</span>
        </div>
        {/* 탭 */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-950/60 border border-slate-800 w-fit mb-4">
          {Object.keys(PQ_FORMS).map((k) => {
            const on = country === k;
            return (
              <button key={k} onClick={() => setCountry(k)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${on ? 'bg-violet-500/20 text-violet-100 border border-violet-500/40' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}>
                {PQ_FORMS[k].tab}
              </button>
            );
          })}
        </div>

        {/* 폼 필드 (양식별 morph) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <div className="p-2.5 rounded-md bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-500">부재</div>
            <div className="text-sm font-mono text-slate-200 mt-0.5">{form.member}</div>
          </div>
          <div className="p-2.5 rounded-md bg-slate-900 border border-slate-800">
            <div className="text-[10px] text-slate-500">성적서번호 <span className="text-slate-600">(자동채번)</span></div>
            <div className="text-sm font-mono text-slate-200 mt-0.5">{form.docNo}</div>
          </div>
          {form.fields.map((f) => (
            <div key={f.label} className="p-2.5 rounded-md bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-500">{f.label}</div>
              <div className="text-sm text-slate-200 mt-0.5">{f.value}</div>
            </div>
          ))}
        </div>

        {/* 시험항목 테이블 */}
        <div className="rounded-lg border border-slate-800 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <span className="text-xs font-medium text-slate-300">시험 항목 <span className="text-slate-500 font-mono">(test_items · {form.std})</span></span>
            {showTB && <TrustBadge kind="자동계산" show={showTB} />}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                <th className="px-4 py-2 font-medium">항목</th>
                <th className="px-3 py-2 font-medium">기준값 (기준서)</th>
                <th className="px-3 py-2 font-medium text-right">측정값</th>
                <th className="px-4 py-2 font-medium text-right">항목판정 (BS1109)</th>
              </tr>
            </thead>
            <tbody>
              {form.tests.map((t) => (
                <tr key={t.name} className={`border-b border-slate-800/70 ${!t.pass ? 'bg-rose-950/20' : ''}`}>
                  <td className="px-4 py-2.5 text-slate-200">{t.name}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-400">{t.spec}</td>
                  <td className={`px-3 py-2.5 text-right tabular-nums font-semibold ${t.pass ? 'text-slate-200' : 'text-rose-300'}`}>{t.value}</td>
                  <td className="px-4 py-2.5 text-right"><PQJudge pass={t.pass} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 엑셀 업로드 ⑦ + 종합판정 */}
        <div className="grid grid-cols-12 gap-3 mt-4">
          <div className="col-span-12 md:col-span-6">
            {!uploaded ? (
              <button onClick={() => setUploaded(true)} className="w-full h-full min-h-[80px] py-4 rounded-lg border-2 border-dashed border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800/40 transition text-center">
                <Icon name="upload" className="w-5 h-5 text-slate-500 mx-auto mb-1.5" />
                <div className="text-sm text-slate-300 font-medium">⑦ 성적서 엑셀 업로드</div>
                <div className="text-[11px] text-slate-500 mt-0.5">원본 ↔ 매핑 미리보기 · 파싱오류 빨강</div>
              </button>
            ) : (
              <div className="h-full flex items-center gap-3 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40">
                <div className="w-8 h-10 rounded bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[9px] font-bold text-emerald-300">XLS</div>
                <div className="flex-1">
                  <div className="text-sm font-mono text-slate-200">QC_{form.docNo}.xlsx</div>
                  <div className="text-[11px] text-emerald-300/80">파싱 완료 · 파싱오류 0건 {showTB && <TrustBadge kind="엑셀" show={showTB} />}</div>
                </div>
                <button onClick={() => setUploaded(false)} className="text-xs text-slate-400 hover:text-slate-200">다시</button>
              </div>
            )}
          </div>
          <div className="col-span-12 md:col-span-6">
            <div className={`h-full p-4 rounded-lg border flex items-center justify-between ${overallPass ? 'bg-emerald-950/30 border-emerald-800/40' : 'bg-rose-950/30 border-rose-800/40'}`}>
              <div>
                <div className="text-[11px] text-slate-400">종합 판정 <span className="font-mono text-slate-500">BS1109</span></div>
                <div className="mt-1"><PQJudge pass={overallPass} size="lg" /></div>
                <div className="text-[11px] text-slate-500 mt-1.5">기준서 {form.std}{!overallPass && ` · 불합격 항목 ${failCount}건`}</div>
              </div>
              <button className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-lg ${overallPass ? 'bg-gradient-to-r from-violet-500 to-indigo-500 shadow-violet-500/20' : 'bg-gradient-to-r from-rose-500 to-orange-500 shadow-rose-500/20'}`}>
                <Icon name="doc" className="w-3.5 h-3.5" />성적서 저장
              </button>
            </div>
          </div>
        </div>
        <div className="mt-2 text-[10px] font-mono text-slate-600">POST /api/inspection-reports · judgment 자동산출(항목 1건↑ 불합격 시 종합 불합격)</div>
      </Card>
    </div>
  );
}

// ============================================================
// 화면 3 · window.Defect — 불량 · 클레임 등록 (모델 17-1)
//   accent: rose(불량) · amber(주의) · emerald(해결)
// ============================================================
const PQ_PHOTOS = [
  { member: "FLANGE PL-16x400", loc: "용접부", type: "균열", at: "07-18 14:22", grad: "from-rose-700 via-rose-600 to-orange-500" },
  { member: "WEB PL-9x600", loc: "복부 치수", type: "치수초과", at: "07-18 14:31", grad: "from-amber-600 via-amber-500 to-yellow-500" },
  { member: "FLANGE PL-16x400", loc: "표면 도장", type: "도장박리", at: "07-18 15:05", grad: "from-indigo-600 via-violet-600 to-fuchsia-500" },
];
function pqInitDefectAudit() {
  return [
    { t: "2026-07-18 15:40", who: "품질 서검사", act: "클레임 등록", detail: "CL-2026-0009 · 접수처 세방구조 · 미해결" },
    { t: "2026-07-18 14:25", who: "품질 서검사", act: "불량 등록", detail: "DF-2026-0045 · FLANGE PL-16x400 용접부 균열 3 EA · 사진 2매" },
  ];
}

function Defect({ route, navigate, tweaks }) {
  const { fmt, Card, SectionLabel, Icon } = window;
  const anchor = pqAnchor(route);

  const [inspected, setInspected] = useStateP(250);
  const [defectQty, setDefectQty] = useStateP(18);
  const [resolved, setResolved] = useStateP(false);
  const [audit, setAudit] = useStateP(pqInitDefectAudit);

  const rate = inspected > 0 ? (defectQty / inspected) * 100 : 0;
  const hex = pqDefectHex(rate);
  const fill = Math.min((rate / 15) * 100, 100);
  const level = rate >= 7 ? "위험" : rate >= 3 ? "주의" : "양호";

  const toggleResolved = (val) => {
    setResolved(val);
    setAudit((a) => [{
      t: pqStamp(), who: "품질 서검사", act: "클레임 상태변경",
      detail: `CL-2026-0009 · ${val ? "해결" : "미해결"}로 전이`,
    }, ...a]);
  };

  return (
    <div className="space-y-5">
      <PQJourneyHeader project={anchor} dept="품질" />

      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <SectionLabel color="rose">DEFECT · 불량 · 클레임 등록 · 모델 17-1</SectionLabel>
          <h1 className="text-3xl font-bold mt-1.5 tracking-tight text-slate-50">불량 · 클레임 등록</h1>
          <p className="text-sm text-slate-400 mt-1">⑩ 사진대지 · 불량률 BS1110 · 클레임 연결 · <span className="text-slate-500">문제 109 해소</span></p>
        </div>
      </div>

      {/* ── ⑩ 불량 사진대지 갤러리 ── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2"><Icon name="eye" className="w-4 h-4 text-rose-400" />⑩ 불량 사진대지 <span className="text-[11px] font-mono text-slate-500">photo_refs · 부재/위치/캡처시각 자동태그</span></h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PQ_PHOTOS.map((p, i) => (
            <div key={i} className="rounded-lg overflow-hidden bg-slate-950 border border-slate-800">
              <div className={`h-24 bg-gradient-to-br ${p.grad} relative`}>
                <span className="absolute top-1.5 left-1.5 text-[9px] font-mono text-white/90 bg-black/30 px-1.5 py-0.5 rounded">{p.type}</span>
                <span className="absolute bottom-1.5 right-1.5 text-[9px] font-mono text-white/80 bg-black/30 px-1.5 py-0.5 rounded">{p.at}</span>
              </div>
              <div className="p-2">
                <div className="text-[11px] font-mono text-slate-300 truncate">{p.member}</div>
                <div className="text-[10px] text-slate-500">위치 {p.loc}</div>
              </div>
            </div>
          ))}
          <button className="rounded-lg border-2 border-dashed border-slate-700 hover:border-rose-500/50 hover:bg-slate-800/40 transition flex flex-col items-center justify-center min-h-[128px] text-center">
            <Icon name="plus" className="w-6 h-6 text-slate-500 mb-1" />
            <div className="text-xs text-slate-300 font-medium">+ 촬영</div>
            <div className="text-[10px] text-slate-500 mt-0.5">현장 고대비 모드</div>
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-12 gap-4">
        {/* ── 불량 등록 폼 + 불량률 게이지 ── */}
        <Card className="col-span-12 lg:col-span-7 p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Icon name="alert" className="w-4 h-4 text-rose-400" />불량 등록 <span className="text-[11px] font-mono text-slate-500">defect_records</span></h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-2.5 rounded-md bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-500">부재</div>
              <div className="text-sm font-mono text-slate-200 mt-0.5">FLANGE PL-16x400</div>
            </div>
            <div className="p-2.5 rounded-md bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-500">불량유형</div>
              <div className="text-sm text-slate-200 mt-0.5">균열 (용접부)</div>
            </div>
            <label className="block">
              <span className="text-[11px] text-slate-400">* 검사수량 (EA)</span>
              <input value={inspected} onChange={(e) => setInspected(Math.max(0, parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0))} inputMode="numeric" className="w-full mt-1 px-2.5 py-1.5 rounded-md bg-slate-950/60 border border-slate-700/60 text-sm tabular-nums text-slate-200 focus:border-rose-500 outline-none" />
            </label>
            <label className="block">
              <span className="text-[11px] text-slate-400">* 불량수량 (EA)</span>
              <input value={defectQty} onChange={(e) => setDefectQty(Math.max(0, parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0))} inputMode="numeric" className="w-full mt-1 px-2.5 py-1.5 rounded-md bg-slate-950/60 border border-slate-700/60 text-sm tabular-nums text-slate-200 focus:border-rose-500 outline-none" />
            </label>
          </div>

          {/* 불량률 게이지 (BS1110 · yieldColor 반대) */}
          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">불량률 <span className="font-mono text-slate-500">BS1110 = 불량 {fmt(defectQty)} / 검사 {fmt(inspected)}</span></span>
              <span className="text-2xl font-bold tabular-nums" style={{ color: hex }}>{rate.toFixed(1)}<span className="text-base">%</span></span>
            </div>
            <div className="relative h-3 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${fill}%`, background: hex }}></div>
              <div className="absolute top-0 bottom-0" style={{ left: `${(3 / 15) * 100}%`, width: 1, background: "rgba(148,163,184,.5)" }}></div>
              <div className="absolute top-0 bottom-0" style={{ left: `${(7 / 15) * 100}%`, width: 1, background: "rgba(148,163,184,.5)" }}></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-600 font-mono mt-1">
              <span className="text-emerald-500/70">0 · 3%↓ 초록</span>
              <span className="text-amber-500/70">3~7% 주황</span>
              <span className="text-rose-500/70">7%↑ 빨강</span>
            </div>
            <div className="mt-2 text-[11px]" style={{ color: hex }}>현재 임계 판정: <span className="font-semibold">{level}</span></div>
          </div>
          <div className="flex justify-end mt-3">
            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-rose-500 to-orange-500 text-sm font-semibold flex items-center gap-1.5 shadow-lg shadow-rose-500/20"><Icon name="plus" className="w-3.5 h-3.5" />불량 등록</button>
          </div>
          <div className="mt-2 text-[10px] font-mono text-slate-600">POST /api/defects</div>
        </Card>

        {/* ── 클레임 연결 그래프 + 알림 ── */}
        <Card className="col-span-12 lg:col-span-5 p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Icon name="fx" className="w-4 h-4 text-rose-400" />클레임 연결 <span className="text-[11px] font-mono text-slate-500">불량 → 클레임 → 해결</span></h3>
          {/* 체인 그래프 */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 px-2.5 py-2 rounded-md bg-rose-500/10 border border-rose-500/30 text-center">
              <div className="text-[9px] text-rose-300/80 font-mono">불량</div>
              <div className="text-[11px] font-mono text-slate-200 mt-0.5">DF-2026-0045</div>
            </div>
            <Icon name="chevronRight" className="w-4 h-4 text-slate-600 shrink-0" />
            <div className="flex-1 px-2.5 py-2 rounded-md bg-amber-500/10 border border-amber-500/30 text-center">
              <div className="text-[9px] text-amber-300/80 font-mono">클레임</div>
              <div className="text-[11px] font-mono text-slate-200 mt-0.5">CL-2026-0009</div>
            </div>
            <Icon name="chevronRight" className="w-4 h-4 text-slate-600 shrink-0" />
            <div className={`flex-1 px-2.5 py-2 rounded-md border text-center ${resolved ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800 border-slate-700/60'}`}>
              <div className={`text-[9px] font-mono ${resolved ? 'text-emerald-300/80' : 'text-slate-400'}`}>해결</div>
              <div className={`text-[11px] mt-0.5 ${resolved ? 'text-emerald-300' : 'text-slate-400'}`}>{resolved ? '☑ 해결' : '☐ 미해결'}</div>
            </div>
          </div>

          {/* 클레임 등록 미니 */}
          <div className="space-y-2.5">
            <div className="p-2.5 rounded-md bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-500">접수처</div>
              <div className="text-sm text-slate-200 mt-0.5">{anchor.customer}</div>
            </div>
            <div>
              <span className="text-[11px] text-slate-400">해결여부</span>
              <div className="flex items-center gap-2 mt-1.5">
                <button onClick={() => toggleResolved(false)} className={`flex-1 py-1.5 rounded-md text-xs font-medium border transition ${!resolved ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' : 'bg-slate-900 text-slate-400 border-slate-700/60 hover:border-slate-600'}`}>미해결</button>
                <button onClick={() => toggleResolved(true)} className={`flex-1 py-1.5 rounded-md text-xs font-medium border transition ${resolved ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-slate-900 text-slate-400 border-slate-700/60 hover:border-slate-600'}`}>해결</button>
              </div>
            </div>
            <button className="w-full py-2 rounded-lg bg-slate-800 border border-slate-700/60 hover:bg-slate-700 text-sm text-slate-200 flex items-center justify-center gap-1.5"><Icon name="plus" className="w-3.5 h-3.5" />클레임 등록</button>
            <div className="text-[10px] font-mono text-slate-600">POST /api/claims</div>
          </div>

          {/* ⑪ 알림 */}
          {(rate >= 7 || !resolved) && (
            <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/50 text-xs">
              <div className="flex items-center gap-1.5 text-rose-200 font-medium mb-1"><Icon name="bell" className="w-3.5 h-3.5" />⑪ 알림</div>
              <div className="text-slate-400 leading-relaxed">
                {rate >= 7 && <div>⚠ 불량률 <span className="text-rose-300 font-semibold tabular-nums">{rate.toFixed(1)}%</span> — 임계 7% 초과 (위험)</div>}
                {!resolved && <div>⚠ 미해결 클레임 <span className="text-rose-300 font-semibold">1건</span> (CL-2026-0009)</div>}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── C5 감사추적 (mono) ── */}
      <Card className="p-5">
        <h4 className="text-xs uppercase tracking-wider text-slate-400 mb-3">C5 · 감사추적 <span className="normal-case text-slate-600">(불량·클레임 등록 · audit_logs · 읽기전용)</span></h4>
        <div className="space-y-1.5 text-[11px] font-mono text-slate-500 max-h-44 overflow-y-auto">
          {audit.map((a, i) => (
            <div key={i} className="leading-relaxed">
              <span className="text-slate-400">{a.t}</span> · <span className="text-slate-300">{a.who}</span> · <span className="text-rose-300">{a.act}</span>
              <div className="text-slate-600 pl-1">{a.detail}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { Production, Quality, Defect });
