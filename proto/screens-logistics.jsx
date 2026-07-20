// screens-logistics.jsx — 출하/유통 화면 2종 (EDEN OS proto · #156936)
//   window.Shipping = 출하·거래명세서 (모델 18 · 문제 110)
//   window.Trading  = 유통 매입/매출 이익률 (모델 31/32 · 문제 113 · TradingPipeline 사업부 분리)
// 규칙: 솔리드 다크 · glassmorphism 금지 · accent ≤3(indigo/emerald/rose) · 금액 우측정렬 tabular-nums
//       손익·이익률 = window.Masked(visible=FINANCE_ROLES) · 신뢰배지 = show(tweaks.showTrustBadges)
const { useState: useStateL, useMemo: useMemoL } = React;

const SYM_L = { KRW: "₩", JPY: "¥", USD: "$", AUD: "A$" };

// 유통 이익률 의미색 — window.yieldColor 계열 (적자 rose / 저마진 amber / 흑자 emerald)
const marginColor = (r) => (r == null ? "slate" : r < 0 ? "rose" : r < 5 ? "amber" : "emerald");
const marginHex = (r) => (r == null ? "#64748b" : r < 0 ? "#f43f5e" : r < 5 ? "#f59e0b" : "#10b981");

// ============================================================
// window.Shipping — 출하·거래명세서 (모델 18)
// ============================================================
const SHIPMENTS = [
  { shpNo: "SHP-2026-0028", projectNo: "EDN-2026-0028", name: "박스 거더 모듈 (고가도로)", customer: "가야중공업",
    country: "일본", currency: "JPY", plannedDate: "2026-07-20", destination: "광양항 야드", transport: "해상운송",
    vehicleNo: "HMM-072W", qty: 21, spec: "BG-2100", item: "박스 거더 모듈", state: "PENDING", tsNo: "TS-2026-0028",
    isExport: true, supplyForeign: 86460000, supplyKRW: 780000000, taxKRW: 0 },
  { shpNo: "SHP-2026-0027", projectNo: "EDN-2026-0027", name: "플레이트 거더 (철도교량)", customer: "한빛스틸",
    country: "국내", currency: "KRW", plannedDate: "2026-07-24", destination: "오봉역 인입선", transport: "육상운송",
    vehicleNo: "—", qty: 24, spec: "PG-1800", item: "플레이트 거더", state: "PLANNED", tsNo: null,
    isExport: false, supplyForeign: null, supplyKRW: 520000000, taxKRW: 52000000 },
  { shpNo: "SHP-2026-0031", projectNo: "EDN-2026-0031", name: "BH빔 120톤 (교량 거더)", customer: "니혼스틸웍스",
    country: "일본", currency: "JPY", plannedDate: "2026-07-28", destination: "광양항 야드", transport: "해상운송",
    vehicleNo: "—", qty: 120, spec: "BH-900", item: "BH빔 (교량 거더)", state: "PLANNED", tsNo: null,
    isExport: true, supplyForeign: 60000000, supplyKRW: 541290000, taxKRW: 0 },
  { shpNo: "SHP-2026-0026", projectNo: "EDN-2026-0026", name: "강교 세그먼트 (하천 횡단교)", customer: "태평양철강",
    country: "국내", currency: "KRW", plannedDate: "2026-07-15", destination: "현장 직송(김포)", transport: "육상운송",
    vehicleNo: "경기99바1204", qty: 96, spec: "SEG-1200", item: "강교 세그먼트", state: "SHIPPED", tsNo: "TS-2026-0026",
    isExport: false, supplyForeign: null, supplyKRW: 470000000, taxKRW: 47000000 },
  { shpNo: "SHP-2026-0022", projectNo: "EDN-2026-0022", name: "BH빔 세트 (물류센터 램프)", customer: "미래빔",
    country: "일본", currency: "JPY", plannedDate: "2026-07-16", destination: "부산신항 CY", transport: "해상운송",
    vehicleNo: "HMM-068E", qty: 64, spec: "BH-700", item: "BH빔 세트", state: "SHIPPED", tsNo: "TS-2026-0022",
    isExport: true, supplyForeign: 49900000, supplyKRW: 450173000, taxKRW: 0 },
];

// 출하 캘린더 마커 (● 완료 / ◐ 예정 / ○ 계획)
const SHP_MARK = {
  SHIPPED: { glyph: "●", cls: "text-violet-300", label: "완료", dot: "bg-violet-400" },
  PENDING: { glyph: "◐", cls: "text-amber-300", label: "예정", dot: "bg-amber-400" },
  PLANNED: { glyph: "○", cls: "text-sky-300", label: "계획", dot: "bg-sky-400" },
};

function Shipping({ tweaks, navigate }) {
  const { fmt, won, Card, SectionLabel, Icon, StatusBadge, TrustBadge } = window;
  const showBadge = tweaks.showTrustBadges;

  const [selectedId, setSelectedId] = useStateL("SHP-2026-0028");
  const [checks, setChecks] = useStateL({ qty: false, vehicle: false });
  const [confirmed, setConfirmed] = useStateL([]); // 이번 세션에 SHIPPED 전이한 출하번호
  const [pdfShp, setPdfShp] = useStateL(null);      // 거래명세서 PDF 미리보기 대상

  const effState = (s) => (confirmed.includes(s.shpNo) ? "SHIPPED" : s.state);
  const sel = SHIPMENTS.find((s) => s.shpNo === selectedId);
  const selEff = effState(sel);

  const selectShp = (id) => {
    setSelectedId(id);
    setChecks({ qty: false, vehicle: false });
  };

  // 캘린더 (2026-07)
  const CAL_YEAR = 2026, CAL_MONTH = 6; // July (0-index)
  const firstWeekday = new Date(CAL_YEAR, CAL_MONTH, 1).getDay();
  const daysInMonth = new Date(CAL_YEAR, CAL_MONTH + 1, 0).getDate();
  const dayMark = {};
  SHIPMENTS.forEach((s) => { dayMark[parseInt(s.plannedDate.slice(8, 10), 10)] = s; });
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const cntPlanned = SHIPMENTS.filter((s) => effState(s) !== "SHIPPED").length;
  const cntShipped = SHIPMENTS.filter((s) => effState(s) === "SHIPPED").length;
  const cntTs = SHIPMENTS.filter((s) => effState(s) === "SHIPPED" && s.tsNo).length;

  // 출하 확정 체크리스트 (C6 게이트)
  const autoChecks = [
    { key: "cert", label: "시험성적서 발행 완료 (모델 17)", auto: true },
    { key: "quality", label: "품질 판정 합격 (BS1109)", auto: true },
  ];
  const manualChecks = [
    { key: "qty", label: "출하 수량 검수 = 수주 수량", auto: false },
    { key: "vehicle", label: "차량/편명 배차 확정", auto: false },
  ];
  const gatePassed = checks.qty && checks.vehicle;

  const confirmShip = () => {
    if (!gatePassed || selEff === "SHIPPED") return;
    setConfirmed((c) => [...c, sel.shpNo]);
  };

  const money = (s, val) => (s.isExport ? `${SYM_L[s.currency]}${fmt(val)}` : won(val));
  const pdfShipment = pdfShp ? SHIPMENTS.find((s) => s.shpNo === pdfShp) : null;

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <SectionLabel color="violet">SHIPPING · 출하 · 거래명세서</SectionLabel>
          <h1 className="text-3xl font-bold mt-1.5 tracking-tight text-slate-50">출하 · 거래명세서</h1>
          <p className="text-sm text-slate-400 mt-1">
            출하 캘린더 · C6 확정 게이트 · 거래명세서 자동 발행(705) · <span className="text-slate-500">문제 110 해소</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[["출하 예정", cntPlanned, "text-amber-300"], ["출하 완료", cntShipped, "text-violet-300"], ["명세서 발행", cntTs, "text-indigo-300"]].map(([l, v, c]) => (
            <div key={l} className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700/60 text-center">
              <div className="text-[10px] text-slate-500">{l}</div>
              <div className={`text-lg font-bold tabular-nums ${c}`}>{v}<span className="text-[10px] text-slate-500 ml-0.5">건</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* 출하 캘린더 */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-base flex items-center gap-2"><Icon name="clock" className="w-4 h-4 text-violet-400" />출하 캘린더 <span className="text-xs text-slate-500 font-normal font-mono">2026-07</span></h3>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            {Object.values(SHP_MARK).map((m) => (
              <span key={m.label} className="flex items-center gap-1"><span className={m.cls}>{m.glyph}</span>{m.label}</span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {["일", "월", "화", "수", "목", "금", "토"].map((w, i) => (
            <div key={w} className={`text-center text-[11px] font-medium pb-1 ${i === 0 ? "text-rose-400/80" : i === 6 ? "text-sky-400/80" : "text-slate-500"}`}>{w}</div>
          ))}
          {cells.map((d, i) => {
            if (d == null) return <div key={`e${i}`} />;
            const s = dayMark[d];
            const mk = s ? SHP_MARK[effState(s)] : null;
            const isSel = s && s.shpNo === selectedId;
            return (
              <button key={d} disabled={!s} onClick={() => s && selectShp(s.shpNo)}
                className={`h-14 rounded-lg border p-1.5 text-left transition ${
                  s ? `cursor-pointer ${isSel ? "border-indigo-500/60 bg-indigo-500/10" : "border-slate-700/60 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-600"}`
                    : "border-transparent"
                }`}>
                <div className="text-[11px] tabular-nums text-slate-400">{d}</div>
                {mk && (
                  <div className={`mt-0.5 flex items-center gap-1 text-[10px] ${mk.cls}`}>
                    <span>{mk.glyph}</span>
                    <span className="font-mono truncate">{s.projectNo.slice(-4)}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* 목록 + 상세 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* 출하 목록 */}
        <Card className="lg:col-span-2 overflow-hidden self-start">
          <div className="px-4 py-3 border-b border-slate-700/60 flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2"><Icon name="ship" className="w-4 h-4 text-violet-400" />출하 목록</h3>
            <span className="text-[11px] text-slate-500">{SHIPMENTS.length}건</span>
          </div>
          <div className="divide-y divide-slate-800">
            {SHIPMENTS.map((s) => {
              const eff = effState(s);
              const isSel = s.shpNo === selectedId;
              return (
                <button key={s.shpNo} onClick={() => selectShp(s.shpNo)}
                  className={`w-full text-left px-4 py-3 transition ${isSel ? "bg-indigo-500/10" : "hover:bg-slate-800/50"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-slate-300">{s.shpNo}</span>
                    <StatusBadge status={eff === "SHIPPED" ? "SHIPPED" : "IN_PRODUCTION"} />
                  </div>
                  <div className="text-sm text-slate-200 mt-1 truncate">{s.name}</div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[11px] text-slate-500 font-mono">{s.projectNo} · {s.customer}</span>
                    <span className="text-[11px] text-slate-400 tabular-nums">계획 {s.plannedDate.slice(5)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* 상세: 체크리스트(C6) 또는 거래명세서 */}
        <div className="lg:col-span-3 space-y-4">
          {/* 선택 출하 요약 */}
          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-mono text-[11px] text-slate-500">{sel.shpNo} · {sel.projectNo}</div>
                <h3 className="font-bold text-base text-slate-50 mt-0.5">{sel.name}</h3>
                <div className="text-xs text-slate-400 mt-1">{sel.customer} · {sel.country} / {sel.currency}</div>
              </div>
              <StatusBadge status={selEff === "SHIPPED" ? "SHIPPED" : "IN_PRODUCTION"} size="md" />
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3 text-xs">
              {[["출하지", sel.destination], ["운송수단", sel.transport], ["차량/편명", sel.vehicleNo], ["수량", `${fmt(sel.qty)}`]].map(([l, v]) => (
                <div key={l} className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/50">
                  <div className="text-[10px] text-slate-500">{l}</div>
                  <div className="text-slate-200 font-medium truncate mt-0.5">{v}</div>
                </div>
              ))}
            </div>
          </Card>

          {selEff === "SHIPPED" ? (
            /* ── 거래명세서 (발행됨) ── */
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-base flex items-center gap-2"><Icon name="doc" className="w-4 h-4 text-indigo-400" />거래명세서</h3>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-400">{sel.tsNo}</span>
                  <TrustBadge kind="자동계산" show={showBadge} />
                  <TrustBadge kind="확정" show={showBadge} />
                </div>
              </div>
              <div className="rounded-lg bg-slate-800/40 border border-slate-700/50 divide-y divide-slate-800 text-sm">
                <div className="grid grid-cols-4 px-3 py-2 text-[11px] uppercase tracking-wider text-slate-500">
                  <span>품목</span><span>규격</span><span className="text-right">수량</span><span className="text-right">공급가액</span>
                </div>
                <div className="grid grid-cols-4 px-3 py-2.5 items-center">
                  <span className="text-slate-200">{sel.item}</span>
                  <span className="text-slate-400 font-mono text-xs">{sel.spec}</span>
                  <span className="text-right tabular-nums text-slate-300">{fmt(sel.qty)}</span>
                  <span className="text-right tabular-nums text-slate-100">{money(sel, sel.supplyKRW && sel.isExport ? sel.supplyForeign : sel.supplyKRW)}</span>
                </div>
              </div>
              <div className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">공급가액</span><span className="tabular-nums text-slate-200">{money(sel, sel.isExport ? sel.supplyForeign : sel.supplyKRW)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">세액 {sel.isExport && <span className="text-[10px] text-emerald-300">영세율(수출)</span>}</span><span className="tabular-nums text-slate-300">{sel.isExport ? `${SYM_L[sel.currency]}0` : won(sel.taxKRW)}</span></div>
                <div className="flex justify-between pt-1.5 border-t border-slate-700/60"><span className="text-slate-300 font-medium">합계</span><span className="tabular-nums font-bold text-slate-50">{money(sel, sel.isExport ? sel.supplyForeign : sel.supplyKRW + sel.taxKRW)}</span></div>
                {sel.isExport && (
                  <div className="flex justify-between text-[11px] text-slate-500"><span>원화 환산 (704 스냅샷)</span><span className="tabular-nums">≈ {won(sel.supplyKRW)}</span></div>
                )}
              </div>
              <button onClick={() => setPdfShp(sel.shpNo)}
                className="mt-4 w-full py-2.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 text-sm font-medium hover:bg-indigo-500/30 transition flex items-center justify-center gap-2">
                <Icon name="file" className="w-4 h-4" />거래명세서 PDF 생성 <span className="text-[10px] text-indigo-300/70">(705)</span>
              </button>
            </Card>
          ) : selEff === "PENDING" ? (
            /* ── 출하 확정 체크리스트 (C6 게이트) ── */
            <Card className="p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-base flex items-center gap-2"><Icon name="shieldCheck" className="w-4 h-4 text-amber-400" />출하 확정 체크리스트 <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">C6 게이트</span></h3>
                <span className="text-xs tabular-nums text-slate-400">{2 + (checks.qty ? 1 : 0) + (checks.vehicle ? 1 : 0)}/4</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">4개 항목 충족 시 상태가 <span className="text-violet-300">SHIPPED</span>로 전이되고 거래명세서 발행이 열립니다.</p>
              <div className="space-y-2">
                {autoChecks.map((c) => (
                  <div key={c.key} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/50">
                    <span className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300"><Icon name="check" className="w-3 h-3" /></span>
                    <span className="text-sm text-slate-300 flex-1">{c.label}</span>
                    <TrustBadge kind="자동계산" show={showBadge} />
                  </div>
                ))}
                {manualChecks.map((c) => {
                  const on = checks[c.key];
                  return (
                    <button key={c.key} onClick={() => setChecks((p) => ({ ...p, [c.key]: !p[c.key] }))}
                      className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg border transition text-left ${on ? "bg-emerald-500/10 border-emerald-500/40" : "bg-slate-800/40 border-slate-700/50 hover:border-slate-600"}`}>
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center ${on ? "bg-emerald-500/25 border border-emerald-500/50 text-emerald-300" : "bg-slate-800 border border-slate-600 text-transparent"}`}><Icon name="check" className="w-3 h-3" /></span>
                      <span className="text-sm text-slate-200 flex-1">{c.label}</span>
                      {!on && <span className="text-[10px] text-amber-300/80">확인 필요</span>}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-[11px] text-slate-500">검토자 <span className="text-slate-300">출하 최담당</span> <span className="text-slate-600">(자동)</span></div>
                <button onClick={confirmShip} disabled={!gatePassed}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${gatePassed ? "bg-violet-500/25 border border-violet-500/50 text-violet-100 hover:bg-violet-500/35" : "bg-slate-800 border border-slate-700 text-slate-600 cursor-not-allowed"}`}>
                  <Icon name="ship" className="w-4 h-4" />출하 확정 · SHIPPED 전이
                </button>
              </div>
            </Card>
          ) : (
            /* ── 출하 계획(준비 전) ── */
            <Card className="p-5">
              <h3 className="font-semibold text-base flex items-center gap-2 mb-2"><Icon name="clock" className="w-4 h-4 text-sky-400" />출하 계획 등록</h3>
              <p className="text-sm text-slate-400">출하 예정일 <span className="text-slate-200 font-mono">{sel.plannedDate}</span> · 상태 <span className="text-sky-300">계획</span>.</p>
              <div className="mt-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 text-xs text-slate-400 flex items-center gap-2">
                <Icon name="info" className="w-4 h-4 text-slate-500 shrink-0" />
                생산 완료 후 <span className="text-amber-300">출하 확정 체크리스트(C6)</span>가 활성화됩니다. 확정 시 거래명세서가 자동 발행됩니다.
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* 거래명세서 PDF 미리보기 (705 템플릿 자동생성) */}
      {pdfShipment && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-6 bg-slate-950/80" onClick={() => setPdfShp(null)}>
          <div className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* 문서 헤더바 */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700 rounded-t-lg">
              <span className="text-xs text-slate-300 flex items-center gap-2"><Icon name="file" className="w-3.5 h-3.5 text-indigo-400" />{pdfShipment.tsNo}.pdf · 705 자동생성</span>
              <div className="flex items-center gap-2">
                <button className="text-xs text-slate-400 hover:text-indigo-300 flex items-center gap-1"><Icon name="download" className="w-3.5 h-3.5" />다운로드</button>
                <button onClick={() => setPdfShp(null)} className="p-1 rounded hover:bg-slate-700"><Icon name="x" className="w-4 h-4 text-slate-400" /></button>
              </div>
            </div>
            {/* 문서 지면 (PDF 시뮬레이션) */}
            <div className="bg-slate-100 text-slate-800 p-8">
              <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3">
                <div>
                  <div className="text-2xl font-bold tracking-tight text-slate-900">거 래 명 세 서</div>
                  <div className="text-xs text-slate-500 mt-1 font-mono">{pdfShipment.tsNo}</div>
                </div>
                <div className="text-right text-xs text-slate-600">
                  <div>발행일 2026-07-{pdfShipment.plannedDate.slice(8)}</div>
                  <div className="mt-0.5">EDEN OS 전자문서</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
                <div>
                  <div className="text-slate-400 uppercase tracking-wider text-[10px] mb-1">공급자</div>
                  <div className="font-semibold text-slate-800">이든철강(주)</div>
                  <div className="text-slate-500 mt-0.5">전남 광양시 · 철강제작 사업부</div>
                </div>
                <div>
                  <div className="text-slate-400 uppercase tracking-wider text-[10px] mb-1">공급받는 자</div>
                  <div className="font-semibold text-slate-800">{pdfShipment.customer}</div>
                  <div className="text-slate-500 mt-0.5">{pdfShipment.country} · {pdfShipment.projectNo}</div>
                </div>
              </div>
              <table className="w-full mt-4 text-xs border-t border-slate-300">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-300">
                    <th className="text-left py-1.5 font-medium">품목</th>
                    <th className="text-left py-1.5 font-medium">규격</th>
                    <th className="text-right py-1.5 font-medium">수량</th>
                    <th className="text-right py-1.5 font-medium">공급가액</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="py-2 text-slate-800">{pdfShipment.item}</td>
                    <td className="py-2 text-slate-600 font-mono">{pdfShipment.spec}</td>
                    <td className="py-2 text-right tabular-nums text-slate-700">{fmt(pdfShipment.qty)}</td>
                    <td className="py-2 text-right tabular-nums text-slate-800">{money(pdfShipment, pdfShipment.isExport ? pdfShipment.supplyForeign : pdfShipment.supplyKRW)}</td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-3 ml-auto w-52 text-xs space-y-1">
                <div className="flex justify-between"><span className="text-slate-500">공급가액</span><span className="tabular-nums">{money(pdfShipment, pdfShipment.isExport ? pdfShipment.supplyForeign : pdfShipment.supplyKRW)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">세액</span><span className="tabular-nums">{pdfShipment.isExport ? `${SYM_L[pdfShipment.currency]}0 (영세율)` : won(pdfShipment.taxKRW)}</span></div>
                <div className="flex justify-between font-bold border-t border-slate-400 pt-1"><span>합계</span><span className="tabular-nums">{money(pdfShipment, pdfShipment.isExport ? pdfShipment.supplyForeign : pdfShipment.supplyKRW + pdfShipment.taxKRW)}</span></div>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-300 text-[10px] text-slate-400 leading-relaxed">
                {pdfShipment.isExport ? "수출 영세율 적용 시 세액 0. " : ""}본 명세서는 EDEN OS에서 자동 생성되었으며 전자문서로 보관됩니다. (705 문서 자동발행)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// window.Trading — 유통 매입/매출 이익률 (모델 31/32 · TradingPipeline 사업부 분리)
// ============================================================
const DEALS = [
  { dealNo: "TD-2026-0031", supplier: "오사카제강(주)", customer: "우진건설(주)", currency: "JPY",
    purchaseAmount: 52000000, salesAmount: 540000000, dealDate: "2026-07-18", status: "검토대기" },
  { dealNo: "TD-2026-0030", supplier: "대한특수강(주)", customer: "동성구조(주)", currency: "KRW",
    purchaseAmount: 320000000, salesAmount: 356000000, dealDate: "2026-07-17", status: "확정" },
  { dealNo: "TD-2026-0029", supplier: "시드니메탈(Pty)", customer: "남해건설(주)", currency: "AUD",
    purchaseAmount: 180000, salesAmount: 152000000, dealDate: "2026-07-16", status: "확정" },
  { dealNo: "TD-2026-0028", supplier: "후성스틸(주)", customer: "태창건설(주)", currency: "KRW",
    purchaseAmount: 210000000, salesAmount: 246000000, dealDate: "2026-07-15", status: "확정" },
  { dealNo: "TD-2026-0027", supplier: "US Steel Trading", customer: "광양산업(주)", currency: "USD",
    purchaseAmount: 312000, salesAmount: 470000000, dealDate: "2026-07-14", status: "확정" },
];

const rateOfL = (cur) => (cur === "KRW" ? 1 : (window.FX_SNAPSHOT.rates[cur] || 1));
const calcMargin = (purchase, sales, cur) => {
  const rate = rateOfL(cur);
  const purchaseKRW = Math.round(purchase * rate);
  const profit = sales - purchaseKRW;
  const marginRate = sales ? +((profit / sales) * 100).toFixed(2) : 0;
  return { rate, purchaseKRW, profit, marginRate };
};

function Trading({ tweaks, navigate }) {
  const { fmt, won, Card, SectionLabel, Icon, TrustBadge, Masked } = window;
  const canFinance = window.FINANCE_ROLES.includes(tweaks.role);
  const showBadge = tweaks.showTrustBadges;

  const [dealNo, setDealNo] = useStateL("TD-2026-0031");
  const base = DEALS.find((d) => d.dealNo === dealNo);
  const [purchase, setPurchase] = useStateL(base.purchaseAmount);
  const [sales, setSales] = useStateL(base.salesAmount);
  const [cur, setCur] = useStateL(base.currency);
  const [showBasis, setShowBasis] = useStateL(false);

  const loadDeal = (d) => {
    setDealNo(d.dealNo); setPurchase(d.purchaseAmount); setSales(d.salesAmount); setCur(d.currency);
  };

  // 실시간 자동 산출 (BS2101/2102/2103)
  const live = calcMargin(purchase, sales, cur);
  const mColor = marginColor(live.marginRate);
  const mHex = marginHex(live.marginRate);
  const gaugeW = Math.max(0, Math.min(100, (live.marginRate / 25) * 100));
  const isImport = cur !== "KRW";

  // 목록 합계
  const totals = DEALS.reduce((a, d) => {
    const c = calcMargin(d.purchaseAmount, d.salesAmount, d.currency);
    a.purchaseKRW += c.purchaseKRW; a.salesKRW += d.salesAmount; a.profit += c.profit; return a;
  }, { purchaseKRW: 0, salesKRW: 0, profit: 0 });
  const avgMargin = totals.salesKRW ? +((totals.profit / totals.salesKRW) * 100).toFixed(2) : 0;

  const numInput = (val, on) => (
    <input type="text" inputMode="numeric" value={fmt(val)}
      onChange={(e) => on(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)}
      className="w-full text-right tabular-nums bg-slate-950/60 border border-slate-700/60 rounded-md px-2.5 py-1.5 text-sm text-slate-100 focus:border-indigo-500 outline-none font-mono" />
  );

  return (
    <div className="space-y-5">
      {/* 사업부 분리 헤더 (TradingPipeline — 제작 프로젝트와 별개) */}
      <div className="rounded-xl bg-slate-900 border border-teal-700/40 overflow-hidden">
        <div className="px-5 py-4 flex items-start justify-between flex-wrap gap-3 border-b border-slate-700/50">
          <div>
            <SectionLabel color="teal">TRADING · 유통 사업부 (TradingPipeline)</SectionLabel>
            <h1 className="text-3xl font-bold mt-1.5 tracking-tight text-slate-50">유통 매입 / 매출 이익률</h1>
            <p className="text-sm text-slate-400 mt-1">
              제작 프로젝트 파이프라인(⑥ 7단계)과 <span className="text-teal-300">분리된 별도 사업부</span> · 건별 손익 실시간 자동 산출 · <span className="text-slate-500">문제 113 해소</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2 py-1 rounded-md bg-teal-500/15 text-teal-300 border border-teal-500/30">부서 · 유통</span>
            <span className="text-[11px] px-2 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">권한 · CRUD</span>
          </div>
        </div>
        {/* 유통 거래 컨텍스트 스텝퍼 (①매입 ②매출 ③이익률 확정) */}
        <div className="px-5 py-2.5 flex items-center gap-3 text-xs text-slate-400 bg-slate-950/40">
          <span className="font-mono text-slate-500">{dealNo}</span>
          <span className="text-slate-600">·</span>
          {["① 매입", "② 매출", "③ 이익률 확정"].map((s, i) => (
            <React.Fragment key={s}>
              <span className={i < 2 ? "text-teal-300" : "text-slate-500"}>{s}</span>
              {i < 2 && <span className="text-slate-700">—</span>}
            </React.Fragment>
          ))}
          <span className="ml-auto text-slate-500">매입 {base.supplier} → 매출 {base.customer}</span>
        </div>
      </div>

      {/* ⑤ 매입 ↔ 매출 매칭 카드 (BS2101 · 실시간 자동 산출) */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-base flex items-center gap-2"><Icon name="trend" className="w-4 h-4 text-teal-400" />⑤ 매입 ↔ 매출 매칭 <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60 font-mono">BS2101</span></h3>
          <span className="flex items-center gap-1.5 text-[11px] text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>실시간 자동 산출</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1.1fr_auto_1fr] items-stretch gap-3">
          {/* 매입 */}
          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">매입</div>
            <label className="text-[11px] text-slate-400">매입처</label>
            <div className="text-sm text-slate-200 font-medium mb-2 truncate">{base.supplier}</div>
            <label className="text-[11px] text-slate-400 flex items-center justify-between">매입액 <TrustBadge kind="수기" show={showBadge} /></label>
            <div className="flex items-center gap-1.5 mt-1">
              <select value={cur} onChange={(e) => setCur(e.target.value)}
                className="bg-slate-950/60 border border-slate-700/60 rounded-md px-1.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none">
                {["KRW", "JPY", "USD", "AUD"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="flex-1">{numInput(purchase, setPurchase)}</div>
            </div>
            {isImport && (
              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                <span>원화 환산 <span className="font-mono text-slate-400">×{live.rate}</span></span>
                <span className="tabular-nums text-slate-300">{won(live.purchaseKRW)}</span>
              </div>
            )}
          </div>

          {/* 화살표 */}
          <div className="hidden lg:flex items-center justify-center text-slate-600"><Icon name="arrowRight" className="w-5 h-5" /></div>

          {/* 이익률 게이지 (중앙) */}
          <div className={`p-4 rounded-lg border text-center ${mColor === "rose" ? "bg-rose-950/30 border-rose-800/40" : mColor === "amber" ? "bg-amber-950/20 border-amber-800/40" : "bg-emerald-950/20 border-emerald-800/40"}`}>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-center gap-1">이익률 <button onClick={() => setShowBasis((v) => !v)} className="text-slate-500 hover:text-slate-300"><Icon name="info" className="w-3 h-3" /></button></div>
            {canFinance ? (
              <>
                <div className="text-3xl font-bold tabular-nums" style={{ color: mHex }}>
                  {live.marginRate < 0 ? `(${Math.abs(live.marginRate).toFixed(2)})` : live.marginRate.toFixed(2)}<span className="text-lg">%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${gaugeW}%`, background: mHex }}></div>
                </div>
                <div className="mt-2 text-sm tabular-nums font-semibold" style={{ color: mHex }}>
                  이익 {live.profit < 0 ? "▽" : "▲"} {won(Math.abs(live.profit))}
                </div>
                <div className="mt-1"><TrustBadge kind="자동계산" show={showBadge} /></div>
              </>
            ) : (
              <div className="py-4">
                <Masked visible={false} need="유통·FINANCE·CEO">x</Masked>
                <div className="text-[10px] text-slate-600 mt-2">이익·이익률은 자금/대표 권한</div>
              </div>
            )}
          </div>

          {/* 화살표 */}
          <div className="hidden lg:flex items-center justify-center text-slate-600"><Icon name="arrowRight" className="w-5 h-5 rotate-180" /></div>

          {/* 매출 */}
          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-2 text-right">매출</div>
            <label className="text-[11px] text-slate-400">매출처</label>
            <div className="text-sm text-slate-200 font-medium mb-2 truncate">{base.customer}</div>
            <label className="text-[11px] text-slate-400 flex items-center justify-between">매출액 <TrustBadge kind="수기" show={showBadge} /></label>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-slate-500 px-1.5 py-1.5 font-mono">KRW</span>
              <div className="flex-1">{numInput(sales, setSales)}</div>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 text-right">국내 매출 · 원화</div>
          </div>
        </div>

        {/* BS2103 수입거래 환율 스냅샷 */}
        <div className="mt-3 flex items-center justify-between text-[11px] px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/50">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Icon name="fx" className="w-3.5 h-3.5 text-cyan-400" />
            수입거래 적용환율 {isImport ? <><span className="font-mono text-slate-200">{live.rate}</span> <TrustBadge kind="자동계산" show={showBadge} /> <span className="text-slate-500">스냅샷 {window.FX_SNAPSHOT.baseDate} (BS2103)</span></> : <span className="text-slate-500">— 국내거래(KRW), 환산 없음</span>}
          </span>
          <span className="text-slate-500">건별 이익률 확정 시 잠금(status 확정)</span>
        </div>

        {/* ⓘ C1 계산 근거 (BS2101/2102/2103) */}
        {showBasis && (
          <div className="mt-3 p-4 rounded-lg bg-slate-950/60 border border-slate-700/60 text-xs space-y-1.5">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5"><Icon name="info" className="w-3.5 h-3.5 text-indigo-400" />계산 근거 — BS2101 / BS2102 / BS2103</div>
            <div className="text-slate-400">입력 &nbsp;매출 <span className="tabular-nums text-slate-200">{won(sales)}</span> <TrustBadge kind="수기" show={showBadge} /> · 매입 <span className="tabular-nums text-slate-200">{SYM_L[cur]}{fmt(purchase)}</span> <TrustBadge kind="수기" show={showBadge} /></div>
            {isImport && <div className="text-slate-400">환산 &nbsp;<span className="font-mono text-slate-500">BS2103</span> 매입 {SYM_L[cur]}{fmt(purchase)} × 환율스냅샷 {live.rate} = <span className="tabular-nums text-slate-200">{won(live.purchaseKRW)}</span></div>}
            <div className="text-slate-400">수식 &nbsp;<span className="font-mono text-slate-500">BS2101</span> 이익 = 매출 − 매입(원화환산)</div>
            <div className="text-slate-400">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="font-mono text-slate-500">BS2102</span> 이익률 = 이익 ÷ 매출 × 100</div>
            <div className="text-slate-300 pt-1 border-t border-slate-800">결과 &nbsp;{won(sales)} − {won(live.purchaseKRW)} = <span className="tabular-nums font-semibold" style={{ color: mHex }}>{live.profit < 0 ? `(${won(Math.abs(live.profit))})` : won(live.profit)}</span> → <span style={{ color: mHex }}>{live.marginRate.toFixed(2)}%</span></div>
          </div>
        )}
      </Card>

      {/* 건별 손익 현황 (inquiry · 실시간 자동 산출) */}
      <Card className="overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-700/60 flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2"><Icon name="coins" className="w-4 h-4 text-teal-400" />유통 거래 건별 손익 <span className="text-[11px] text-slate-500 font-normal">행 클릭 = 매칭 카드 로드</span></h3>
          <button className="px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700/60 hover:bg-slate-750 text-xs flex items-center gap-1.5 text-slate-300">
            <Icon name="download" className="w-3.5 h-3.5" />엑셀 내보내기
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                <th className="px-5 py-2.5 font-medium">거래번호</th>
                <th className="px-3 py-2.5 font-medium">매입처 → 매출처</th>
                <th className="px-3 py-2.5 font-medium">통화</th>
                <th className="px-3 py-2.5 font-medium text-right">매입액</th>
                <th className="px-3 py-2.5 font-medium text-right">매출액</th>
                <th className="px-3 py-2.5 font-medium text-right">이익</th>
                <th className="px-5 py-2.5 font-medium text-right">이익률</th>
              </tr>
            </thead>
            <tbody>
              {DEALS.map((d) => {
                const c = calcMargin(d.purchaseAmount, d.salesAmount, d.currency);
                const dHex = marginHex(c.marginRate);
                const isSel = d.dealNo === dealNo;
                const w = Math.max(4, Math.min(100, (c.marginRate / 25) * 100));
                return (
                  <tr key={d.dealNo} onClick={() => loadDeal(d)}
                    className={`border-b border-slate-800/70 hover:bg-slate-800/40 cursor-pointer transition ${isSel ? "bg-teal-500/10" : ""}`}>
                    <td className="px-5 py-3 font-mono text-xs text-slate-300">{d.dealNo}</td>
                    <td className="px-3 py-3 text-slate-300 text-xs">{d.supplier} <span className="text-slate-600">→</span> {d.customer}</td>
                    <td className="px-3 py-3">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${d.currency === "KRW" ? "bg-slate-500/10 text-slate-300 border-slate-500/25" : "bg-cyan-500/10 text-cyan-300 border-cyan-500/25"}`}>{d.currency}{d.currency !== "KRW" && " 수입"}</span>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-300">{SYM_L[d.currency]}{fmt(d.purchaseAmount)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-300">{won(d.salesAmount)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {canFinance ? (
                        <span style={{ color: dHex }}>{c.profit < 0 ? "▽ (" + won(Math.abs(c.profit)) + ")" : "▲ " + won(c.profit)}</span>
                      ) : <Masked visible={false} need="유통·FINANCE">x</Masked>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {canFinance ? (
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-14 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${w}%`, background: dHex }}></div>
                          </div>
                          <span className="tabular-nums w-14 text-right" style={{ color: dHex }}>{c.marginRate < 0 ? `(${Math.abs(c.marginRate).toFixed(1)})` : c.marginRate.toFixed(1)}%</span>
                        </div>
                      ) : <Masked visible={false} need="유통·FINANCE">x</Masked>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-700/60 font-medium">
                <td className="px-5 py-3 text-slate-400 text-xs" colSpan={3}>합계 · {DEALS.length}건 (매입 원화환산)</td>
                <td className="px-3 py-3 text-right tabular-nums text-slate-200">{won(totals.purchaseKRW)}</td>
                <td className="px-3 py-3 text-right tabular-nums text-slate-200">{won(totals.salesKRW)}</td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {canFinance ? <span className={totals.profit < 0 ? "text-rose-300" : "text-emerald-300"}>{totals.profit < 0 ? "▽ (" + won(Math.abs(totals.profit)) + ")" : "▲ " + won(totals.profit)}</span> : <Masked visible={false} need="유통·FINANCE">x</Masked>}
                </td>
                <td className="px-5 py-3 text-right tabular-nums">
                  {canFinance ? <span style={{ color: marginHex(avgMargin) }}>평균 {avgMargin.toFixed(1)}%</span> : <Masked visible={false} need="유통·FINANCE">x</Masked>}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { Shipping, Trading });
