// screens-finance.jsx — 3차 · 자금 / 손익 화면 2종
//   window.Finance = 기성·수금·미수금 (모델 19) — 기성↔수금 매칭 · ⑨ FX Risk Radar · C1 미수 근거(BS1104) · ⑪ 미수 경과 · 문제 111
//   window.Profit  = 최종 손익분석 (모델 20) — 손익 구성(BS1106) · C4 예상 vs 실제 편차(워터폴) · ② YieldMoney · C-RBAC · 문제 112·114
const { useState: useState_f } = React;

// ── 공용 소형 ⓘ 근거 팝오버 (hover, 무상태) ──────────────────────
const InfoDot = ({ children, w = "w-72" }) => (
  <span className="relative inline-flex group align-middle">
    <window.Icon name="info" className="w-3.5 h-3.5 text-slate-500 hover:text-indigo-300 cursor-help" />
    <span className={`pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 ${w} p-3 rounded-lg bg-slate-950 border border-slate-700 shadow-2xl text-[11px] text-slate-300 opacity-0 group-hover:opacity-100 transition z-40 leading-relaxed text-left normal-case font-normal tracking-normal`}>
      {children}
    </span>
  </span>
);

// ── ⑥ 여정 스텝퍼 (history.jsx 패턴 재사용) ──────────────────────
const JourneySpine = ({ status }) => {
  const curStep = window.PROJECT_STATUS_META[status].step;
  return (
    <div className="flex items-center">
      {window.JOURNEY_STEPS.map((s, i) => {
        const passed = i < curStep, cur = i === curStep;
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${passed ? 'bg-emerald-500/25 text-emerald-300' : cur ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-600'}`}>
                {passed ? '✓' : i + 1}
              </div>
              <div className={`text-[9px] mt-1 ${cur ? 'text-indigo-300' : 'text-slate-600'}`}>{s}</div>
            </div>
            {i < window.JOURNEY_STEPS.length - 1 && <div className={`flex-1 h-px ${passed ? 'bg-emerald-500/40' : 'bg-slate-800'}`}></div>}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ============================================================
// 기성/수금 mock (가상 · BILL-2026-#### · 계약 = Σ회차 · 미수 = receivable.foreign 일치)
// ============================================================
const BILLINGS = {
  "EDN-2026-0031": { sym: "¥", currency: "JPY", contractForeign: 180000000, appliedBaseDate: "2026-07-10", rows: [
    { round: 1, billNo: "BILL-2026-0071", billedDate: "2026-05-10", billed: 60000000, paidDate: "2026-05-31", paid: 60000000, status: "완료" },
    { round: 2, billNo: "BILL-2026-0082", billedDate: "2026-06-10", billed: 60000000, paidDate: "2026-06-30", paid: 60000000, status: "완료" },
    { round: 3, billNo: "BILL-2026-0093", billedDate: "2026-07-10", billed: 60000000, paidDate: null, paid: 0, status: "미수", overdueDays: 8 },
  ] },
  "EDN-2026-0029": { sym: "A$", currency: "AUD", contractForeign: 420000, appliedBaseDate: "2026-07-03", rows: [
    { round: 1, billNo: "BILL-2026-0064", billedDate: "2026-05-20", billed: 140000, paidDate: "2026-06-12", paid: 140000, status: "완료" },
    { round: 2, billNo: "BILL-2026-0078", billedDate: "2026-06-20", billed: 140000, paidDate: "2026-07-08", paid: 140000, status: "완료" },
    { round: 3, billNo: "BILL-2026-0091", billedDate: "2026-07-03", billed: 140000, paidDate: null, paid: 0, status: "미수", overdueDays: 15 },
  ] },
  "EDN-2026-0028": { sym: "¥", currency: "JPY", contractForeign: 120000000, appliedBaseDate: "2026-05-27", rows: [
    { round: 1, billNo: "BILL-2026-0052", billedDate: "2026-04-15", billed: 54000000, paidDate: "2026-05-06", paid: 54000000, status: "완료" },
    { round: 2, billNo: "BILL-2026-0066", billedDate: "2026-05-15", billed: 54000000, paidDate: "2026-06-04", paid: 54000000, status: "완료" },
    { round: 3, billNo: "BILL-2026-0081", billedDate: "2026-05-27", billed: 12000000, paidDate: null, paid: 0, status: "미수", overdueDays: 52 },
  ] },
  "EDN-2026-0025": { sym: "¥", currency: "JPY", contractForeign: 96500000, appliedBaseDate: "2026-05-31", rows: [
    { round: 1, billNo: "BILL-2026-0048", billedDate: "2026-04-20", billed: 40000000, paidDate: "2026-05-12", paid: 40000000, status: "완료" },
    { round: 2, billNo: "BILL-2026-0059", billedDate: "2026-05-20", billed: 40000000, paidDate: "2026-06-10", paid: 40000000, status: "완료" },
    { round: 3, billNo: "BILL-2026-0073", billedDate: "2026-05-31", billed: 16500000, paidDate: null, paid: 0, status: "미수", overdueDays: 48 },
  ] },
};
const OVERDUE_LIMIT = 45; // 장기미수 임계(일)

// ============================================================
// window.Finance — 기성 · 수금 · 미수금 (모델 19)
// ============================================================
function Finance({ tweaks, navigate, route }) {
  const { fmt, won, man, Card, SectionLabel, Icon, StatusBadge, TrustBadge, Masked } = window;
  const canFinance = window.FINANCE_ROLES.includes(tweaks.role);
  const showBadge = tweaks.showTrustBadges;

  const fxProjects = window.PROJECTS.filter((p) => p.receivable && p.receivable.foreign > 0 && BILLINGS[p.projectNo]);
  const initial = fxProjects.find((p) => p.projectNo === route?.payload?.projectNo) ? route.payload.projectNo : "EDN-2026-0031";
  const [sel, setSel] = useState_f(initial);
  const [scenario, setScenario] = useState_f(-2); // 환율 변동 시나리오(%)

  const proj = fxProjects.find((p) => p.projectNo === sel) || fxProjects[0];
  const bill = BILLINGS[proj.projectNo];
  const r = proj.receivable;
  const rate = window.FX_SNAPSHOT.rates[proj.currency];          // 적용 환율 스냅샷(704)
  const snapDate = window.FX_SNAPSHOT.baseDate;

  // 누적 청구 / 기성률
  const contract = bill.contractForeign;
  let cum = 0;
  const rows = bill.rows.map((row) => { cum += row.billed; return { ...row, cumulative: cum, rate: +(cum / contract * 100).toFixed(1) }; });
  const receivableForeign = bill.rows.filter((x) => x.status === "미수").reduce((a, x) => a + x.billed, 0);

  // 미수 평가 기준일 경과일 (기준일 → 최신 스냅샷)
  const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
  const staleDays = daysBetween(bill.appliedBaseDate, snapDate);

  // 환율 시나리오 재평가
  const scAbs = Math.abs(scenario) / 100;
  const scRate = +(rate * (1 + scenario / 100)).toFixed(4);
  const reval = Math.round(r.exposureKRW * (1 + scenario / 100));
  const revalDiff = r.exposureKRW - reval;                        // 손실(양수)
  const perWon = Math.round(r.exposureKRW / rate);                // 환율 1원 변동 민감도

  // ⑪ 미수 경과 알림 (전 외화 프로젝트 롤업)
  const overdue = fxProjects.map((p) => {
    const b = BILLINGS[p.projectNo];
    const mi = b.rows.find((x) => x.status === "미수");
    return { projectNo: p.projectNo, name: p.name, sym: b.sym, round: mi.round, amount: mi.billed, days: mi.overdueDays };
  }).sort((a, bb) => bb.days - a.days);

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <SectionLabel color="amber">FINANCE · 기성 · 수금 · 미수금 (모델 19)</SectionLabel>
          <h1 className="text-3xl font-bold mt-1.5 tracking-tight text-slate-50">기성 · 수금 · 미수금</h1>
          <p className="text-sm text-slate-400 mt-1">기성 청구 ↔ 수금 매칭 · 외화 미수 환산(BS1104) · 환리스크 모니터링 · <span className="text-slate-500">문제 111 해소</span></p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <Icon name="fx" className="w-4 h-4 text-cyan-400" />환율 스냅샷 {snapDate} · {proj.currency} <span className="font-mono text-slate-300">{fmt(rate)}</span>
          <TrustBadge kind="시스템" show={showBadge} />
        </div>
      </div>

      {/* 외화 미수 프로젝트 선택 */}
      <div className="flex items-center gap-1.5 flex-wrap p-1 rounded-lg bg-slate-900 border border-slate-800 w-fit">
        {fxProjects.map((p) => (
          <button key={p.projectNo} onClick={() => setSel(p.projectNo)}
            className={`px-3 py-1.5 rounded-md text-xs font-mono flex items-center gap-2 transition ${sel === p.projectNo ? 'bg-indigo-500/25 text-indigo-100 border border-indigo-500/40' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}>
            {p.projectNo}<span className="text-[10px] text-slate-500">{p.currency}</span>
          </button>
        ))}
      </div>

      {/* 프로젝트 여정 ⑥ */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-3 text-sm flex-wrap">
          <span className="font-mono text-xs text-slate-500">{proj.projectNo}</span>
          <span className="font-medium text-slate-200">{proj.name}</span>
          <span className="text-xs text-slate-500">{proj.customer} · {proj.country} / {proj.currency}</span>
          <div className="ml-auto"><StatusBadge status={proj.status} /></div>
        </div>
        <JourneySpine status={proj.status} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 좌: 기성 청구 목록 + 기성↔수금 매칭 (col 2) */}
        <div className="lg:col-span-2 space-y-5">
          {/* 기성 청구 목록 */}
          <Card className="overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-base flex items-center gap-2"><Icon name="doc" className="w-4 h-4 text-indigo-400" />기성 청구 목록</h3>
              <span className="text-[11px] text-slate-500">계약 {bill.sym}{fmt(contract)} · progress_billings</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                    <th className="px-5 py-2.5 font-medium">회차</th>
                    <th className="px-3 py-2.5 font-medium">청구번호 · 청구일</th>
                    <th className="px-3 py-2.5 font-medium text-right">청구금액</th>
                    <th className="px-3 py-2.5 font-medium text-right">기성률(누적)</th>
                    <th className="px-5 py-2.5 font-medium text-right">청구상태</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.round} className="border-b border-slate-800/70">
                      <td className="px-5 py-3 tabular-nums text-slate-300">{row.round}</td>
                      <td className="px-3 py-3">
                        <div className="font-mono text-xs text-slate-300">{row.billNo}</div>
                        <div className="text-[11px] text-slate-500">{row.billedDate}</div>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-200">{bill.sym}{fmt(row.billed)}</td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-teal-400 rounded-full" style={{ width: `${row.rate}%` }}></div>
                          </div>
                          <span className="tabular-nums text-slate-400 text-xs w-12">{row.rate}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {row.status === "미수"
                          ? <span className="text-xs px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30">미수 ⚠</span>
                          : <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">완료</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* 기성 ↔ 수금 매칭 (1─* settlements) */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base flex items-center gap-2"><Icon name="coins" className="w-4 h-4 text-teal-400" />기성 ↔ 수금 매칭</h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60 font-mono">progress_billings 1─* settlements</span>
            </div>
            <div className="space-y-2.5">
              {rows.map((row) => {
                const paid = row.status !== "미수";
                return (
                  <div key={row.round} className="flex items-center gap-3">
                    {/* 청구 */}
                    <div className="flex-1 p-3 rounded-lg bg-slate-800/50 border border-slate-700/60">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">{row.round}회차 청구 · {row.billedDate}</span>
                        <span className="tabular-nums text-sm text-slate-200">{bill.sym}{fmt(row.billed)}</span>
                      </div>
                    </div>
                    {/* 연결선 */}
                    <div className="flex flex-col items-center w-14 shrink-0">
                      <div className={`w-full h-px ${paid ? 'bg-emerald-500/50' : 'bg-rose-500/40 border-t border-dashed border-rose-500/50'}`}></div>
                      <span className={`text-[9px] mt-0.5 ${paid ? 'text-emerald-400' : 'text-rose-400'}`}>{paid ? '수금 ✓' : '미수 ⚠'}</span>
                    </div>
                    {/* 수금 */}
                    <div className={`flex-1 p-3 rounded-lg border ${paid ? 'bg-slate-800/50 border-slate-700/60' : 'bg-rose-950/30 border-rose-800/40 border-dashed'}`}>
                      {paid ? (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-500">수금 · {row.paidDate}</span>
                          <span className="tabular-nums text-sm text-emerald-300">{bill.sym}{fmt(row.paid)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-rose-300/80">미수 · 경과 {row.overdueDays}일</span>
                          <span className="tabular-nums text-sm text-slate-500">—</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">매칭 규칙: 청구건(billing_id) 1건에 수금건 다수 대응 · 미수 = 청구 − 수금</span>
              <span className="text-slate-300 tabular-nums">미수 외화 <span className="text-rose-300 font-semibold">{bill.sym}{fmt(receivableForeign)}</span></span>
            </div>
          </Card>
        </div>

        {/* 우: 미수금 환산(C1) + ⑨ FX Radar + 재평가 */}
        <div className="space-y-5">
          {/* 미수금 (외화 환산) + C1 근거 */}
          <Card className="p-5">
            <h3 className="font-semibold text-base flex items-center gap-2 mb-3"><Icon name="globe" className="w-4 h-4 text-cyan-400" />미수금 (외화 환산)</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">미수 외화 <TrustBadge kind="자동계산" show={showBadge} /></span>
                <span className="tabular-nums text-slate-200 font-medium">{bill.sym}{fmt(receivableForeign)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  적용환율 <TrustBadge kind="시스템" show={showBadge} />
                  <InfoDot w="w-80">
                    <div className="font-semibold text-slate-200 mb-1">ⓘ 계산 근거 — BS1104</div>
                    <div>입력 · 미수 외화 <span className="font-mono text-slate-200">{bill.sym}{fmt(receivableForeign)}</span> [시스템]</div>
                    <div>입력 · 환율스냅샷 <span className="font-mono text-slate-200">{fmt(rate)}</span> [704 · 시스템]</div>
                    <div className="mt-1 text-slate-400">수식 · 원화미수 = 외화금액 × 환율스냅샷(평가기준일)</div>
                    <div className="mt-1">결과 · <span className="font-mono text-emerald-300">{bill.sym}{fmt(receivableForeign)} × {fmt(rate)} = {won(r.exposureKRW)}</span></div>
                    <div className="text-slate-500">기준일 {bill.appliedBaseDate}</div>
                  </InfoDot>
                </span>
                <span className="tabular-nums text-slate-300 font-mono">{fmt(rate)} <span className="text-[10px] text-slate-500">[704]</span></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">기준일</span>
                <span className="tabular-nums text-slate-400 text-xs">{bill.appliedBaseDate}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">원화 미수 <TrustBadge kind="자동계산" show={showBadge} /></span>
                <span className="tabular-nums text-lg font-bold text-amber-200">{won(r.exposureKRW)}</span>
              </div>
            </div>
          </Card>

          {/* ⑨ FX Risk Radar (FINANCE · CEO 전용) */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-base flex items-center gap-2"><Icon name="alert" className="w-4 h-4 text-rose-400" />⑨ 환리스크 레이더</h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">FINANCE · CEO 전용</span>
            </div>
            {canFinance ? (
              <div className="space-y-3">
                {/* 시나리오 선택 */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500">환율 변동 시나리오</span>
                  <div className="flex items-center gap-1 p-0.5 rounded-md bg-slate-800/70 border border-slate-700/60 ml-auto">
                    {[-1, -2, -3].map((v) => (
                      <button key={v} onClick={() => setScenario(v)}
                        className={`px-2 py-0.5 rounded tabular-nums ${scenario === v ? 'bg-rose-500/25 text-rose-200' : 'text-slate-400 hover:text-slate-200'}`}>{v}%</button>
                    ))}
                  </div>
                </div>
                {/* 서사 */}
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-xs text-rose-100 leading-relaxed">
                  미수 <span className="tabular-nums font-semibold">{bill.sym}{fmt(receivableForeign)} = {won(r.exposureKRW)}</span>,
                  환율 <span className="tabular-nums font-semibold">{scenario}%</span> 변동 시
                  <span className="tabular-nums font-semibold"> ▼ {won(Math.round(r.exposureKRW * scAbs))}</span> 손실 위험 ⚠
                </div>
                {/* 민감도 막대 */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>노출액 {won(r.exposureKRW)}</span>
                    <span>위험구간 −3% ~ +3%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gradient-to-r from-rose-500 via-slate-700 to-emerald-500 opacity-70"></div>
                  <div className="mt-1.5 text-[11px] text-slate-500 tabular-nums">민감도 · 환율 1원 변동 ≈ {won(perWon)} · 현재 {fmt(rate)} → 시나리오 {fmt(scRate)}</div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <Masked visible={false} need="FINANCE·CEO">x</Masked>
                <div className="text-xs text-slate-500 mt-3">환리스크 지표는 FINANCE·CEO 권한만 열람합니다.<br />Tweaks에서 부서를 <span className="text-slate-300">자금/대표</span>로 바꿔보세요.</div>
              </div>
            )}
          </Card>

          {/* ★ 매입측 환노출 (트리거③) — 매출측만 보면 순노출 오판 */}
          <Card className="p-4 border-amber-800/40">
            <h3 className="text-sm font-semibold text-amber-200 flex items-center gap-2"><Icon name="fx" className="w-4 h-4" />매입측 환노출 · 순노출 = 매출 − 매입</h3>
            <div className="mt-2 space-y-1 text-xs">
              {window.FX_PURCHASE.map((q) => (
                <div key={q.currency} className="flex justify-between text-slate-300">
                  <span>{q.currency} 매입 · {q.note}</span>
                  <span className="tabular-nums">{q.sym}{fmt(q.foreign)} = {won(q.exposureKRW)}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">현 데모의 환리스크 레이더는 <b>매출측 미수</b>만 표시합니다. 실제로는 수입 후판 등 <b>매입측 노출</b>을 차감한 <b>순노출</b>로 봐야 자연헤지·역노출을 오판하지 않습니다.</p>
          </Card>

          {/* 스냅샷 신선도 + 재평가 편차 (FINANCE · CEO) */}
          {canFinance && (
            <Card className="p-5">
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/40 text-xs mb-3">
                <div className="flex items-center gap-2 text-amber-200 font-medium">
                  <Icon name="clock" className="w-3.5 h-3.5" /> 환율 스냅샷 {staleDays}일 경과 <TrustBadge kind="기준값없음" show={showBadge} />
                </div>
                <div className="text-slate-400 mt-1 leading-relaxed">미수 평가 기준일 <span className="font-mono text-slate-300">{bill.appliedBaseDate}</span> · 최신 스냅샷 <span className="font-mono text-slate-300">{snapDate}</span> — 재평가 권장.</div>
              </div>
              <h4 className="text-xs uppercase tracking-wider text-slate-400 mb-2">재평가 편차 (환율 {scenario}%)</h4>
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-slate-800">
                    <td className="py-1.5 text-slate-500">적용환율</td>
                    <td className="py-1.5 text-right tabular-nums text-slate-300 font-mono">{fmt(rate)}</td>
                    <td className="py-1.5 text-right tabular-nums text-slate-300 font-mono">{fmt(scRate)}</td>
                    <td className="py-1.5 text-right tabular-nums text-rose-400">▼ {scenario}%</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-slate-500">원화 미수</td>
                    <td className="py-1.5 text-right tabular-nums text-slate-300">{won(r.exposureKRW)}</td>
                    <td className="py-1.5 text-right tabular-nums text-slate-300">{won(reval)}</td>
                    <td className="py-1.5 text-right tabular-nums text-rose-400">▼ {fmt(revalDiff)}</td>
                  </tr>
                </tbody>
              </table>
              <button className="mt-3 w-full py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 text-xs font-medium hover:bg-indigo-500/30 flex items-center justify-center gap-1.5">
                <Icon name="refresh" className="w-3.5 h-3.5" />재평가 실행 <span className="text-[10px] text-indigo-300/70 font-mono">/settlements/{'{id}'}/evaluate</span>
              </button>
            </Card>
          )}
        </div>
      </div>

      {/* ⑪ 미수 경과 알림 (전 외화 프로젝트) */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-base flex items-center gap-2"><Icon name="bell" className="w-4 h-4 text-amber-400" />⑪ 미수 경과 알림</h3>
          <span className="text-[11px] text-slate-500">경과 {OVERDUE_LIMIT}일 이상 = 장기미수 위험</span>
        </div>
        <div className="space-y-2">
          {overdue.map((o) => {
            const long = o.days >= OVERDUE_LIMIT;
            return (
              <button key={o.projectNo} onClick={() => setSel(o.projectNo)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition ${o.projectNo === sel ? 'bg-indigo-500/10 border-indigo-500/40' : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${long ? 'bg-rose-400' : 'bg-amber-400'}`}></span>
                <span className="font-mono text-xs text-slate-300 w-32">{o.projectNo}</span>
                <span className="text-sm text-slate-300 flex-1 truncate">{o.name}</span>
                <span className="text-xs text-slate-400 tabular-nums">{o.round}회차 미수 {o.sym}{fmt(o.amount)}</span>
                <span className="text-xs text-slate-400 tabular-nums w-16 text-right">경과 {o.days}일</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-md border w-24 text-center ${long ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' : 'bg-amber-500/15 text-amber-300 border-amber-500/30'}`}>
                  {long ? '장기미수 위험' : '수금예정 초과'}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          <button className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700/60 text-xs text-slate-300 hover:bg-slate-750">수금 독촉</button>
          <button className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700/60 text-xs text-slate-300 hover:bg-slate-750">전체 알림</button>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// 손익 · 예상(견적) mock — 실제 = PROJECTS.finance · 예상 = EXPECTED(없으면 합성)
// ============================================================
const EXPECTED = {
  "EDN-2026-0031": { revenue: 552000000, rawMaterialCost: 288000000, manufacturingCost: 88000000, overheadCost: 30000000 },
  "EDN-2026-0029": { revenue: 610000000, rawMaterialCost: 345000000, manufacturingCost: 106000000, overheadCost: 35000000 },
  "EDN-2026-0028": { revenue: 790000000, rawMaterialCost: 415000000, manufacturingCost: 138000000, overheadCost: 45000000 },
  "EDN-2026-0023": { revenue: 300000000, rawMaterialCost: 190000000, manufacturingCost: 76000000, overheadCost: 24000000 }, // 적자: 예상 이익 +10M → 실제 −16M
};
const synthExpected = (a) => ({
  revenue: Math.round(a.revenue * 1.015),
  rawMaterialCost: Math.round(a.rawMaterialCost * 0.95),
  manufacturingCost: a.manufacturingCost,
  overheadCost: a.overheadCost,
});

// ============================================================
// window.Profit — 프로젝트 최종 손익분석 (모델 20, BS1106) + C4 편차 워터폴
// ============================================================
function Profit({ tweaks, navigate, route }) {
  const { fmt, won, Card, SectionLabel, Icon, StatusBadge, TrustBadge, Masked, profitColor } = window;
  const canFinance = window.FINANCE_ROLES.includes(tweaks.role);
  const showBadge = tweaks.showTrustBadges;

  const finProjects = window.PROJECTS.filter((p) => p.finance);
  const initial = finProjects.find((p) => p.projectNo === route?.payload?.projectNo) ? route.payload.projectNo : "EDN-2026-0031";
  const [sel, setSel] = useState_f(initial);
  const proj = finProjects.find((p) => p.projectNo === sel) || finProjects[0];

  const a = proj.finance;                                    // 실제(손익 20)
  const e = EXPECTED[proj.projectNo] || synthExpected(a);    // 예상(견적 12)
  const eProfit = e.revenue - e.rawMaterialCost - e.manufacturingCost - e.overheadCost;
  const foreign = proj.currency !== "KRW";
  const rate = window.FX_SNAPSHOT.rates[proj.currency];

  const cShort = (n) => (n < 0 ? '−' : '') + '₩' + fmt(Math.round(Math.abs(n) / 1000000)) + 'M';

  // 손익 구성 행
  const lines = [
    { key: "매출",     val: a.revenue,           tone: "text-slate-200", basis: "출하·거래명세서 집계" },
    { key: "원자재비", val: a.rawMaterialCost,   tone: "text-slate-300", basis: "확정 CP 소요 모재 × 실 매입가 − 스크랩 크레딧(~40%) · ② YieldMoney (트리거③: 고철 매각 크레딧 반영 필요)", yield: true },
    { key: "제조원가", val: a.manufacturingCost, tone: "text-slate-300", basis: "작업지시 공수·설비 집계" },
    { key: "간접비",   val: a.overheadCost,      tone: "text-slate-300", basis: "간접비 " + window.OVERHEAD_MODEL.mode + " 배부 · 트리거③: 용접집약 BH는 공수/머신아워 기준 차등 배부 필요" },
  ];

  // C4 편차 (항목별) + 손익 기여도
  const vitems = [
    { key: "매출",     exp: e.revenue,           act: a.revenue,           impact: a.revenue - e.revenue },
    { key: "원자재비", exp: e.rawMaterialCost,   act: a.rawMaterialCost,   impact: -(a.rawMaterialCost - e.rawMaterialCost) },
    { key: "제조원가", exp: e.manufacturingCost, act: a.manufacturingCost, impact: -(a.manufacturingCost - e.manufacturingCost) },
    { key: "간접비",   exp: e.overheadCost,      act: a.overheadCost,      impact: -(a.overheadCost - e.overheadCost) },
  ];
  const impactSum = vitems.reduce((s, v) => s + Math.abs(v.impact), 0) || 1;
  const drivers = vitems.map((v) => ({ ...v, contribPct: Math.round(Math.abs(v.impact) / impactSum * 100) }));
  const worst = drivers.filter((v) => v.impact < 0).sort((x, y) => x.impact - y.impact)[0];
  const profitDiff = a.finalProfit - eProfit;

  // 워터폴 (실제 기준)
  const WF_H = 168;
  const p1 = a.revenue, p2 = p1 - a.rawMaterialCost, p3 = p2 - a.manufacturingCost, p4 = a.finalProfit;
  const minVal = Math.min(0, p4), maxVal = a.revenue;
  const pxFor = (v) => ((v - minVal) / (maxVal - minVal)) * WF_H;
  const zeroY = pxFor(0);
  const wf = [
    { key: "매출",     lo: 0,                 hi: p1, label: cShort(a.revenue),            color: "bg-emerald-500/70 border-emerald-400" },
    { key: "원자재비", lo: p2,                hi: p1, label: cShort(-a.rawMaterialCost),   color: "bg-rose-500/60 border-rose-400" },
    { key: "제조원가", lo: p3,                hi: p2, label: cShort(-a.manufacturingCost), color: "bg-rose-500/60 border-rose-400" },
    { key: "간접비",   lo: p4,                hi: p3, label: cShort(-a.overheadCost),      color: "bg-rose-500/60 border-rose-400" },
    { key: "손익",     lo: Math.min(0, p4),   hi: Math.max(0, p4), label: cShort(p4),     color: p4 >= 0 ? "bg-emerald-500/80 border-emerald-300" : "bg-rose-500/80 border-rose-300" },
  ];

  const MaskInline = () => <Masked visible={false} need="FINANCE·CEO">x</Masked>;

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <SectionLabel color="rose">FINANCE · 최종 손익분석 (모델 20)</SectionLabel>
          <h1 className="text-3xl font-bold mt-1.5 tracking-tight text-slate-50">프로젝트 최종 손익분석</h1>
          <p className="text-sm text-slate-400 mt-1">손익 구성(BS1106) · 예상 vs 실제 편차 "어디서 샜나"(C4) · ② YieldMoney 연계 · <span className="text-slate-500">문제 112·114 해소</span></p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">손익 · 손익률 = FINANCE · CEO 전용 (C-RBAC)</span>
      </div>

      {/* 프로젝트 선택 */}
      <div className="flex items-center gap-1.5 flex-wrap p-1 rounded-lg bg-slate-900 border border-slate-800">
        {finProjects.map((p) => {
          const loss = p.finance.finalProfit < 0;
          return (
            <button key={p.projectNo} onClick={() => setSel(p.projectNo)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-mono flex items-center gap-1.5 transition ${sel === p.projectNo ? 'bg-indigo-500/25 text-indigo-100 border border-indigo-500/40' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}>
              {p.projectNo}{loss && <span className="text-[9px] text-rose-400" title="적자">▽</span>}
            </button>
          );
        })}
      </div>

      {/* 프로젝트 헤더 바 + 적용환율(704) */}
      <Card className="p-4 flex items-center gap-4 flex-wrap">
        <span className="font-mono text-xs text-slate-500">{proj.projectNo}</span>
        <span className="font-medium text-slate-200">{proj.name}</span>
        <span className="text-xs text-slate-500">{proj.customer} · {proj.country} / {proj.currency}</span>
        <StatusBadge status={proj.status} />
        <div className="ml-auto text-xs text-slate-400 flex items-center gap-1.5">
          <Icon name="fx" className="w-3.5 h-3.5 text-cyan-400" />적용환율
          {foreign ? <span className="font-mono text-slate-200">{fmt(rate)} <span className="text-[10px] text-slate-500">[704 · {window.FX_SNAPSHOT.baseDate}]</span></span>
                   : <span className="text-slate-500">원화 (환산 불요)</span>}
        </div>
      </Card>

      {!canFinance ? (
        /* C-RBAC 마스킹 (구매 등 타부서) */
        <Card className="p-12 text-center">
          <div className="inline-flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center"><Icon name="lock" className="w-6 h-6 text-slate-500" /></div>
            <MaskInline />
            <div className="text-sm text-slate-400 mt-1">손익 · 손익률은 <span className="text-slate-200">FINANCE · CEO</span> 권한만 열람합니다 <span className="text-slate-600">(문제 114)</span>.</div>
            <div className="text-xs text-slate-500">현재 부서: <span className="text-slate-300">{tweaks.role}</span> · Tweaks에서 <span className="text-slate-300">자금/대표</span>로 바꿔 열람하세요.</div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 손익 구성 (BS1106) */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base flex items-center gap-2"><Icon name="gauge" className="w-4 h-4 text-indigo-400" />손익 구성 <span className="text-xs text-slate-500 font-normal font-mono">BS1106</span></h3>
            </div>
            <div className="space-y-1">
              {lines.map((l) => (
                <div key={l.key} className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-sm text-slate-400 flex items-center gap-1.5">
                    {l.key}
                    <TrustBadge kind="자동계산" show={showBadge} />
                    <InfoDot>{l.yield ? <><span className="font-semibold text-slate-200">◆ ② YieldMoney</span><br />{l.basis}</> : l.basis}</InfoDot>
                    {l.yield && <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">② YieldMoney</span>}
                  </span>
                  <span className={`tabular-nums text-sm ${l.tone}`}>{won(l.val)}</span>
                </div>
              ))}
              {/* 최종 손익 */}
              <div className="flex items-center justify-between pt-3">
                <span className="text-sm font-medium text-slate-200 flex items-center gap-1.5">최종 손익 <TrustBadge kind="자동계산" show={showBadge} /></span>
                <div className="text-right">
                  <div className={`tabular-nums text-xl font-bold ${profitColor(a.finalProfit)}`}>
                    {a.finalProfit < 0 ? '▽ (' + won(Math.abs(a.finalProfit)) + ')' : '▲ ' + won(a.finalProfit)}
                  </div>
                  <div className={`text-xs tabular-nums ${profitColor(a.finalProfit)}`}>손익률 {a.profitRate}%</div>
                </div>
              </div>
            </div>
            {a.finalProfit < 0 && (
              <div className="mt-3 p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-xs text-rose-200 flex items-center gap-2">
                <Icon name="alert" className="w-3.5 h-3.5 shrink-0" />적자 프로젝트 — 실제 원자재비가 예상을 초과했습니다 (아래 편차 참조).
              </div>
            )}
          </Card>

          {/* C4 예상 vs 실제 편차 + 워터폴 */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base">C4 · 예상 vs 실제 편차 <span className="text-xs text-slate-500 font-normal">"어디서 샜나"</span></h3>
            </div>

            {/* 워터폴 */}
            <div className="relative mb-4" style={{ height: WF_H + 26 }}>
              <div className="absolute left-0 right-0 border-t border-dashed border-slate-700" style={{ bottom: zeroY + 22 }}></div>
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2" style={{ height: WF_H + 22 }}>
                {wf.map((s) => (
                  <div key={s.key} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div className="relative w-full flex justify-center" style={{ height: WF_H }}>
                      <div className={`absolute w-3/4 rounded-sm border ${s.color}`}
                        style={{ bottom: pxFor(s.lo), height: Math.max(2, pxFor(s.hi) - pxFor(s.lo)) }}></div>
                      <div className="absolute w-full text-center text-[9px] tabular-nums text-slate-400" style={{ bottom: pxFor(s.hi) + 2 }}>{s.label}</div>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 text-center leading-tight">{s.key}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 편차 테이블 */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                    <th className="py-2 font-medium">항목</th>
                    <th className="py-2 font-medium text-right">예상(견적12)</th>
                    <th className="py-2 font-medium text-right">실제(손익20)</th>
                    <th className="py-2 font-medium text-right">차이</th>
                    <th className="py-2 font-medium w-24">손익 기여</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((v) => {
                    const diff = v.act - v.exp;
                    const up = diff > 0;
                    return (
                      <tr key={v.key} className="border-b border-slate-800/70">
                        <td className="py-2 text-slate-300">{v.key}</td>
                        <td className="py-2 text-right tabular-nums text-slate-500">{won(v.exp)}</td>
                        <td className="py-2 text-right tabular-nums text-slate-300">{won(v.act)}</td>
                        <td className={`py-2 text-right tabular-nums ${up ? 'text-sky-400' : 'text-rose-400'}`}>{diff === 0 ? '—' : (up ? '▲ ' : '▼ ') + won(Math.abs(diff))}</td>
                        <td className="py-2">
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div className={`h-full rounded-full ${v.impact < 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${v.contribPct}%` }}></div>
                            </div>
                            <span className="text-[10px] text-slate-500 tabular-nums w-7">{v.contribPct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="font-semibold">
                    <td className="py-2.5 text-slate-200">최종 손익 <span className="text-[10px] text-slate-500 font-normal font-mono">BS1106</span></td>
                    <td className="py-2.5 text-right tabular-nums text-slate-400">{won(eProfit)}</td>
                    <td className={`py-2.5 text-right tabular-nums ${profitColor(a.finalProfit)}`}>{won(a.finalProfit)}</td>
                    <td className={`py-2.5 text-right tabular-nums ${profitDiff > 0 ? 'text-sky-400' : 'text-rose-400'}`}>{profitDiff >= 0 ? '▲ ' : '▼ '}{won(Math.abs(profitDiff))}</td>
                    <td className="py-2.5 text-[10px] text-rose-400">손익률 {a.finalProfit < 0 ? '↓↓' : '↓'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 어디서 샜나 서사 */}
            {worst && worst.impact < 0 && (
              <div className="mt-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/60 text-xs text-slate-300 leading-relaxed">
                <span className="text-amber-300 font-medium">어디서 샜나 · </span>
                <span className="text-slate-200 font-medium">{worst.key}</span>가 예상 대비
                <span className="tabular-nums text-rose-300"> {won(Math.abs(worst.act - worst.exp))}</span> 초과 —
                손익 악화의 <span className="tabular-nums text-rose-300 font-semibold">{worst.contribPct}%</span>를 차지합니다.
                {worst.key === "원자재비" && <span className="text-slate-500"> (◆ 확정 CP 소요모재 × 실매입가 · ② YieldMoney)</span>}
              </div>
            )}
            <div className="mt-3 flex items-center justify-end gap-2">
              <button onClick={() => navigate('history', { projectNo: proj.projectNo })} className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700/60 text-xs text-slate-300 hover:bg-slate-750 flex items-center gap-1.5"><Icon name="clock" className="w-3.5 h-3.5" />이력 탭 (C5)</button>
              <button className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700/60 text-xs text-slate-300 hover:bg-slate-750 flex items-center gap-1.5"><Icon name="download" className="w-3.5 h-3.5" />PDF 출력 (705)</button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Finance, Profit });
