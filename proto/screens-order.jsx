// screens-order.jsx — EDEN OS proto · 수주/CP 트랙 3화면 (모델 12·14·15)
//   window.Quotation = 견적·예상원가 (12, BS1101/1102 · C1 근거 팝오버)
//   window.Mills     = 제강사 단가/운임 비교 (14, ⑤ Solution Compare · C3 override · C5 이력)
//   window.Order     = 수주확정·발주 (15, C6 확정 게이트 · ⑫ Auto-PO Preview · BS1108)
// 규칙: 솔리드 다크 · accent ≤3색 · 금액 우측정렬 tabular-nums · 손익/원가 C-RBAC 마스킹 · 신뢰배지 tweaks 연동
// mock inline(가상 수치) · 제강사 실명(현대/동국/포스코) 유지 · ID: EDN/CP/PO/QTN-2026-####
const { useState: useState_o, useEffect: useEffect_o, useMemo: useMemo_o } = React;

// ── 인라인 mock (가상) ────────────────────────────────────────
// 견적 대상 프로젝트 (data.js PROJECTS 중 finance 보유분만)
const ORD_QUOTE_PROJECTS = window.PROJECTS.filter((p) => p.finance);

// 기본 견적 항목 그리드 — Σ = 540,000,000 (EDN-2026-0031 견적금액)
const ORD_QUOTE_LINES = [
  { item: "Built-Up H Beam", spec: "BH-500x300", qty: 80,  unitPrice: 4500000 }, // 360,000,000
  { item: "보강 플레이트",   spec: "PL-12x300",  qty: 200, unitPrice: 900000 },   // 180,000,000
];

// 제강사 견적 (확정 CP 발주 플레이트 SM355TMC 30t · 6매 · 31,974kg · 폭 배열 발주)
//   2026-07-20 폭 배열 CP 반영 — 단가 원/kg × 발주중량(kg) 비교
const ORD_REQUIRED = { cpNo: "CP-2026-0031", matl: "SM355TMC", th: 30, plateCount: 6, weightKg: 31974 };
const ORD_MILLS = [
  { id: "M-HD", mill: "현대제철", unitPrice: 1100, freight: 850000,  leadTime: 14, note: "최소비용" },
  { id: "M-DK", mill: "동국제강", unitPrice: 1150, freight: 900000,  leadTime: 10, note: "납기 우선" },
  { id: "M-PS", mill: "포스코",   unitPrice: 1120, freight: 1350000, leadTime: 18, note: "대안" },
].map((m) => ({ ...m, totalCost: m.unitPrice * ORD_REQUIRED.weightKg + m.freight }));
// 총원가(BS1108) = 발주중량(kg)×원/kg + 운임 → 현대 36,021,400 · 포스코 37,160,880 · 동국 37,670,100
const ORD_MIN_ID = ORD_MILLS.reduce((a, b) => (b.totalCost < a.totalCost ? b : a)).id; // 현대제철

// 비교 이력 초기값 (C5)
const ORD_HISTORY_SEED = [
  { t: "2026-07-18 14:40", who: "구매 김담당", act: "비교 실행", detail: "3사 · 최소비용 현대제철 (BS1108)" },
];

// ── ⑥ 프로젝트 여정 스텝퍼 공통 헤더 ─────────────────────────
function OrdJourney({ project, current, cpConfirmed = true }) {
  const { Card, StatusBadge } = window;
  const steps = window.JOURNEY_STEPS;
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between text-xs mb-2.5">
        <div className="flex items-center gap-2 text-slate-300 flex-wrap">
          <span className="font-mono text-slate-400">{project.projectNo}</span>
          <span className="text-slate-600">·</span>
          <span>{project.customer}</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-500">{project.country} / {project.currency}</span>
        </div>
        <StatusBadge status={project.status} />
      </div>
      <div className="flex items-center">
        {steps.map((s, i) => {
          const before = i < current, cur = i === current;
          const gate = i === 2; // 절단계획 → 수주확정 연결부 = CP 확정 게이트
          return (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${before ? "bg-emerald-500/25 text-emerald-300" : cur ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-500"}`}>
                  {before ? "✓" : i + 1}
                </div>
                <div className={`text-[10px] mt-1 ${cur ? "text-indigo-300" : "text-slate-500"}`}>{s}</div>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 flex items-center justify-center px-1">
                  {gate ? (
                    <span className="text-xs" title={cpConfirmed ? "CP 확정 · 잠금해제" : "CP 미확정 · 잠금"}>{cpConfirmed ? "🔓" : "🔒"}</span>
                  ) : (
                    <div className={`h-px w-full ${before ? "bg-emerald-500/40" : "bg-slate-700"}`}></div>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </Card>
  );
}

// ── C1 ⓘ 계산 근거 팝오버 (hover/click 토글) ─────────────────
function OrdInfo({ children, align = "right" }) {
  const [open, setOpen] = useState_o(false);
  return (
    <span className="relative inline-flex align-middle"
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button onClick={() => setOpen((o) => !o)} aria-label="계산 근거"
        className="ml-1 w-4 h-4 rounded-full bg-slate-700/70 text-slate-300 text-[10px] leading-none flex items-center justify-center hover:bg-indigo-500/50 hover:text-white transition">ⓘ</button>
      {open && (
        <div className={`absolute z-30 top-6 ${align === "right" ? "right-0" : "left-0"} w-80 p-3 rounded-lg bg-slate-950 border border-slate-700 shadow-2xl text-left cursor-default`}>
          {children}
        </div>
      )}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// 화면 12 — 견적 · 예상원가 (BS1101/1102)
// ─────────────────────────────────────────────────────────────
function Quotation({ route, navigate, tweaks }) {
  const { fmt, won, Card, SectionLabel, Icon, TrustBadge, Masked, profitColor } = window;
  const canFinance = window.FINANCE_ROLES.includes(tweaks.role); // 손익/원가 열람 권한
  const showTB = tweaks.showTrustBadges;

  const [projectNo, setProjectNo] = useState_o(route?.payload?.projectNo || "EDN-2026-0031");
  const project = ORD_QUOTE_PROJECTS.find((p) => p.projectNo === projectNo) || ORD_QUOTE_PROJECTS[0];

  const [lines, setLines] = useState_o(ORD_QUOTE_LINES.map((l) => ({ ...l })));
  const [standardCost, setStandardCost] = useState_o(380000000); // 표준 제조원가 [수기] · '' = 기준값없음
  const [overheadRate, setOverheadRate] = useState_o(12.5);       // 간접비율 %
  const [saved, setSaved] = useState_o(false);

  // 프로젝트 전환 시 통화/기준값 재설정 (표준원가 = raw+mfg 프록시)
  useEffect_o(() => {
    const f = project.finance;
    setStandardCost(f ? f.rawMaterialCost + f.manufacturingCost : "");
    setSaved(false);
  }, [projectNo]);

  const hasStd = standardCost !== "" && +standardCost > 0;
  const quotedAmount = useMemo_o(() => lines.reduce((a, l) => a + l.qty * l.unitPrice, 0), [lines]);
  const overhead = hasStd ? Math.round(+standardCost * (overheadRate / 100)) : 0; // 간접비
  const estTotal = hasStd ? +standardCost + overhead : null;                       // BS1101 예상총원가
  const expProfit = hasStd ? quotedAmount - estTotal : null;                        // BS1102 예상이익
  const marginRate = hasStd && quotedAmount ? ((expProfit / quotedAmount) * 100) : null;

  const setLine = (i, key, v) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, [key]: Math.max(0, +v || 0) } : l)));

  const AutoBadges = () => (
    <span className="inline-flex items-center gap-1 ml-1">
      <TrustBadge kind="자동계산" show={showTB} />
      <TrustBadge kind="시스템" show={showTB} />
    </span>
  );

  return (
    <div className="space-y-5">
      <OrdJourney project={{ ...project, status: "QUOTED" }} current={1} cpConfirmed={!!project.cp} />

      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <SectionLabel color="indigo">QUOTATION · 모델 12 · BS1101/1102</SectionLabel>
          <h1 className="text-3xl font-bold mt-1.5 tracking-tight text-slate-50">견적 · 예상원가</h1>
          <p className="text-sm text-slate-400 mt-1">견적 항목 → 표준원가·간접비 → <span className="text-indigo-300">예상총원가·예상이익 자동계산</span> · <span className="text-slate-500">문제 102·112 해소</span></p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">프로젝트</span>
          <select value={projectNo} onChange={(e) => setProjectNo(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-200 outline-none focus:border-indigo-500">
            {ORD_QUOTE_PROJECTS.map((p) => <option key={p.projectNo} value={p.projectNo}>{p.projectNo} · {p.customer}</option>)}
          </select>
          <span className="text-slate-500 ml-1">통화</span>
          <span className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700/60 font-mono text-slate-200">{project.currency}</span>
        </div>
      </div>

      {/* 견적 항목 그리드 */}
      <Card className="overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-700/60 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">견적 항목</h3>
            <div className="text-xs text-slate-500 mt-0.5">품목 · 규격 · 수량 · 단가 (직접입력) → 견적금액 자동 합산</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-slate-500">견적금액 (Σ 수량×단가)</div>
            <div className="text-lg font-bold tabular-nums text-slate-100">{won(quotedAmount)}</div>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
              <th className="px-5 py-2 font-medium">품목</th>
              <th className="px-3 py-2 font-medium">규격</th>
              <th className="px-3 py-2 font-medium text-right">수량</th>
              <th className="px-3 py-2 font-medium text-right">단가</th>
              <th className="px-5 py-2 font-medium text-right">금액</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-b border-slate-800/70">
                <td className="px-5 py-2.5 text-slate-200">{l.item}</td>
                <td className="px-3 py-2.5 font-mono text-slate-300">{l.spec}</td>
                <td className="px-3 py-2.5 text-right">
                  <input type="number" value={l.qty} onChange={(e) => setLine(i, "qty", e.target.value)}
                    className="w-24 px-2 py-1 rounded-md bg-slate-950/60 border border-slate-700/60 text-right tabular-nums text-slate-200 outline-none focus:border-indigo-500" />
                </td>
                <td className="px-3 py-2.5 text-right">
                  <input type="number" value={l.unitPrice} onChange={(e) => setLine(i, "unitPrice", e.target.value)}
                    className="w-36 px-2 py-1 rounded-md bg-slate-950/60 border border-slate-700/60 text-right tabular-nums text-slate-200 outline-none focus:border-indigo-500" />
                </td>
                <td className="px-5 py-2.5 text-right tabular-nums text-slate-100 font-medium">{won(l.qty * l.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="grid grid-cols-12 gap-4">
        {/* 원가 입력 (수기) */}
        <Card className="col-span-12 lg:col-span-5 p-5 space-y-4">
          <h3 className="font-semibold text-sm">원가 기준 입력</h3>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-slate-400">표준 제조원가 <TrustBadge kind="수기" show={showTB} /></label>
              {!hasStd && <TrustBadge kind="기준값없음" show={showTB} />}
            </div>
            <input type="number" value={standardCost} placeholder="기준값 미등록 — 수기 입력 필요"
              onChange={(e) => setStandardCost(e.target.value === "" ? "" : Math.max(0, +e.target.value))}
              className={`w-full px-3 py-2 rounded-lg bg-slate-950/60 border text-right tabular-nums outline-none focus:border-indigo-500 ${hasStd ? "border-slate-700/60 text-slate-100" : "border-amber-500/40 text-amber-200"}`} />
            {!hasStd && (
              <div className="mt-1.5 text-[11px] text-amber-300/90 leading-relaxed flex items-start gap-1.5">
                <Icon name="alert" className="w-3.5 h-3.5 shrink-0 mt-px" />
                제한된 데이터 — 표준원가 기준값이 없어 수기 입력이 필요합니다 (701 False 경로 · [기준값없음]).
              </div>
            )}
          </div>
          <div>
            <label className="text-xs text-slate-400">간접비율 (%)</label>
            <input type="number" step="0.1" value={overheadRate} onChange={(e) => setOverheadRate(Math.max(0, +e.target.value || 0))}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-700/60 text-right tabular-nums text-slate-100 outline-none focus:border-indigo-500" />
            <div className="mt-1 text-[11px] text-slate-500">간접비 = 표준제조원가 × {overheadRate}% = {hasStd ? won(overhead) : "—"}</div>
          </div>
          <button onClick={() => setStandardCost("")} className="text-[11px] text-slate-500 hover:text-amber-300 underline underline-offset-2">기준값 미등록 시뮬레이션 (701 False)</button>
        </Card>

        {/* 자동계산 결과 (C1 근거 팝오버 · C-RBAC) */}
        <Card className="col-span-12 lg:col-span-7 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">예상 원가 · 이익 <span className="text-slate-500 font-normal">(자동계산)</span></h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700/60">원가·이익 · FINANCE·CEO</span>
          </div>

          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">견적금액</span>
              <span className="tabular-nums text-slate-200">{won(quotedAmount)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400 flex items-center">예상 총원가 <AutoBadges />
                <OrdInfo>
                  <div className="text-xs space-y-1.5">
                    <div className="text-indigo-300 font-mono uppercase tracking-wider text-[10px]">C1 · 계산 근거 (BS1101)</div>
                    <div><span className="text-slate-500">입력 </span>표준제조원가 {hasStd ? won(+standardCost) : "[기준값없음]"} · 간접비율 {overheadRate}%</div>
                    <div><span className="text-slate-500">수식 </span><span className="font-mono text-slate-300">예상총원가 = 표준제조원가 + (표준제조원가 × 간접비율)</span></div>
                    <div className="pt-1.5 border-t border-slate-800"><span className="text-slate-500">결과 </span>{canFinance ? (hasStd ? `${won(+standardCost)} + ${won(overhead)} = ` : "") : ""}<span className="text-emerald-300">{canFinance ? (hasStd ? won(estTotal) : "—") : "[권한없음]"}</span></div>
                  </div>
                </OrdInfo>
              </span>
              <span className="tabular-nums font-semibold text-slate-100">
                <Masked visible={canFinance} need="FINANCE·CEO">{hasStd ? won(estTotal) : "—"}</Masked>
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400 flex items-center">예상 이익 <AutoBadges />
                <OrdInfo>
                  <div className="text-xs space-y-1.5">
                    <div className="text-indigo-300 font-mono uppercase tracking-wider text-[10px]">C1 · 계산 근거 (BS1102)</div>
                    <div><span className="text-slate-500">입력 </span>견적금액 {won(quotedAmount)} · 예상총원가 {canFinance ? (hasStd ? won(estTotal) : "—") : "[권한없음]"}</div>
                    <div><span className="text-slate-500">수식 </span><span className="font-mono text-slate-300">예상이익 = 견적금액 − 예상총원가</span></div>
                    <div className="pt-1.5 border-t border-slate-800"><span className="text-slate-500">결과 </span><span className="text-emerald-300">{canFinance ? (hasStd ? won(expProfit) : "—") : "[권한없음]"}</span></div>
                  </div>
                </OrdInfo>
              </span>
              <span className={`tabular-nums font-semibold ${canFinance && hasStd ? profitColor(expProfit) : ""}`}>
                <Masked visible={canFinance} need="FINANCE·CEO">{hasStd ? won(expProfit) : "—"}</Masked>
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-400 flex items-center">예상 이익률 <TrustBadge kind="자동계산" show={showTB} /></span>
              <span className={`tabular-nums font-bold text-lg ${canFinance && hasStd ? profitColor(expProfit) : ""}`}>
                <Masked visible={canFinance} need="FINANCE·CEO">{hasStd ? marginRate.toFixed(1) + "%" : "—"}</Masked>
              </span>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-[11px] text-indigo-200 leading-relaxed">
            <Icon name="info" className="w-3.5 h-3.5 inline text-indigo-300 mr-1" />
            결정론적 산술이므로 신뢰도 %를 표기하지 않고 <span className="font-mono">[자동계산]</span> 배지 + ⓘ 근거(입력→BS수식→결과)로 재현가능성을 보입니다.
            {!canFinance && <span className="text-amber-300/90 block mt-1">현재 {tweaks.role} 권한 — 원가·이익 값은 마스킹됩니다 (Tweaks에서 자금/대표 전환 시 열람).</span>}
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700/60 hover:bg-slate-750 text-sm text-slate-300 disabled:opacity-30" disabled={!hasStd}>원가산출</button>
            <button disabled={!hasStd} onClick={() => setSaved(true)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-sm font-semibold flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20">
              <Icon name="check" className="w-3.5 h-3.5" />견적 저장
            </button>
          </div>
          {saved && (
            <div className="mt-2 text-right text-xs text-emerald-300">✓ 견적 저장됨 · QTN-2026-0031 · 감사 기록 (경량 커밋)</div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 화면 14 — 제강사 단가/운임 비교 (⑤ Solution Compare · C3 · C5)
// ─────────────────────────────────────────────────────────────
function Mills({ route, navigate, tweaks }) {
  const { fmt, won, Card, SectionLabel, Icon, TrustBadge } = window;
  const showTB = tweaks.showTrustBadges;
  const project = { projectNo: "EDN-2026-0031", customer: "니혼스틸웍스", country: "일본", currency: "JPY", status: "CUTTING_PLANNED", cp: true };

  const [selected, setSelected] = useState_o(ORD_MIN_ID);       // 기본 = 추천(최소비용)안
  const [overrideReason, setOverrideReason] = useState_o("");
  const [history, setHistory] = useState_o(ORD_HISTORY_SEED);
  const [confirmed, setConfirmed] = useState_o(false);

  const isOverride = selected !== ORD_MIN_ID;                    // 비추천안 선택 = override
  const needsReason = isOverride && !overrideReason.trim();      // C3 사유 필수
  const selMill = ORD_MILLS.find((m) => m.id === selected);

  const runCompare = () => {
    setHistory((h) => [...h, { t: "2026-07-18 14:47", who: "구매 김담당", act: "비교 실행", detail: "3사 재조회 · 최소비용 " + ORD_MILLS.find((m) => m.id === ORD_MIN_ID).mill }]);
  };
  const confirm = () => {
    if (needsReason) return;
    const entries = [];
    if (isOverride) entries.push({ t: "2026-07-18 14:48", who: "구매 김담당", act: "수동 선택", detail: `${ORD_MILLS.find((m) => m.id === ORD_MIN_ID).mill}→${selMill.mill} · 사유: ${overrideReason.trim()} ⚑` });
    entries.push({ t: "2026-07-18 14:49", who: "구매 이팀장", act: "비교 확정", detail: `[확정] 발주 후보=${selMill.mill}` });
    setHistory((h) => [...h, ...entries]);
    setConfirmed(true);
  };

  return (
    <div className="space-y-5">
      <OrdJourney project={project} current={2} cpConfirmed />

      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <SectionLabel color="cyan">MILL COMPARE · 모델 14 · BS1108</SectionLabel>
          <h1 className="text-3xl font-bold mt-1.5 tracking-tight text-slate-50">제강사 단가 · 운임 비교</h1>
          <p className="text-sm text-slate-400 mt-1">확정 CP 발주 플레이트 → 제강사별 총원가 비교 · 최소비용 자동추천 · <span className="text-slate-500">문제 105 해소</span></p>
        </div>
        <button onClick={runCompare} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700/60 hover:bg-slate-750 text-sm flex items-center gap-2 text-slate-300">
          <Icon name="refresh" className="w-3.5 h-3.5" />제강사 비교 실행
        </button>
      </div>

      {/* 발주 플레이트 요약 */}
      <Card className="p-4 flex items-center flex-wrap gap-x-6 gap-y-2 text-sm">
        <div className="flex items-center gap-2"><span className="text-slate-500 text-xs">절단계획</span><span className="font-mono text-slate-200">{ORD_REQUIRED.cpNo}</span><TrustBadge kind="확정" show={showTB} /></div>
        <div className="flex items-center gap-2"><span className="text-slate-500 text-xs">발주 플레이트</span><span className="font-mono text-slate-200">{ORD_REQUIRED.matl} · {ORD_REQUIRED.th}t · {ORD_REQUIRED.plateCount}매</span></div>
        <div className="flex items-center gap-2"><span className="text-slate-500 text-xs">발주 중량</span><span className="tabular-nums text-slate-200 font-semibold">{fmt(ORD_REQUIRED.weightKg)}kg</span></div>
      </Card>

      {/* ⑤ Solution Compare 카드 3사 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ORD_MILLS.map((m) => {
          const on = selected === m.id, best = m.id === ORD_MIN_ID;
          return (
            <button key={m.id} onClick={() => setSelected(m.id)}
              className={`text-left p-4 rounded-xl border transition relative ${on ? (best ? "bg-amber-500/10 border-amber-500/50" : "bg-indigo-500/10 border-indigo-500/50") : "bg-slate-900 border-slate-700/60 hover:border-slate-600"}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-slate-100">{m.mill}</span>
                {best
                  ? <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/40 font-semibold">최소비용 ★</span>
                  : <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-700/40 text-slate-400 border border-slate-600/40">{m.note}</span>}
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-slate-500 text-xs">단가 <TrustBadge kind="시스템" show={showTB} /></span><span className="tabular-nums text-slate-300">{won(m.unitPrice)}<span className="text-[11px] text-slate-500">/kg</span></span></div>
                <div className="flex justify-between"><span className="text-slate-500 text-xs">운임</span><span className="tabular-nums text-slate-300">{won(m.freight)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 text-xs">발주중량</span><span className="tabular-nums text-slate-300">{fmt(ORD_REQUIRED.weightKg)}kg</span></div>
                <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-700/60">
                  <span className="text-slate-400 text-xs flex items-center">총원가
                    <OrdInfo align="left">
                      <div className="text-xs space-y-1.5">
                        <div className="text-cyan-300 font-mono uppercase tracking-wider text-[10px]">C1 · 계산 근거 (BS1108)</div>
                        <div><span className="text-slate-500">입력 </span>단가 {won(m.unitPrice)}/kg × {fmt(ORD_REQUIRED.weightKg)}kg · 운임 {won(m.freight)}</div>
                        <div><span className="text-slate-500">수식 </span><span className="font-mono text-slate-300">총원가 = 발주중량×원/kg + 운임</span></div>
                        <div className="pt-1.5 border-t border-slate-800"><span className="text-slate-500">결과 </span>{won(m.unitPrice * ORD_REQUIRED.weightKg)} + {won(m.freight)} = <span className="text-emerald-300">{won(m.totalCost)}</span></div>
                      </div>
                    </OrdInfo>
                  </span>
                  <span className={`tabular-nums font-bold ${best ? "text-amber-300" : "text-slate-100"}`}>{won(m.totalCost)}</span>
                </div>
                <div className="flex justify-between"><span className="text-slate-500 text-xs">리드타임</span><span className="tabular-nums text-slate-300">{m.leadTime}일</span></div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${on ? (best ? "border-amber-400" : "border-indigo-400") : "border-slate-600"}`}>
                  {on && <span className={`w-2 h-2 rounded-full ${best ? "bg-amber-400" : "bg-indigo-400"}`}></span>}
                </span>
                <span className={on ? "text-slate-200" : "text-slate-500"}>{on ? "이 안 선택됨" : "선택"}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* C3 대안 비교 · 선택 (override 사유) */}
      <Card className="p-5">
        <h3 className="font-semibold text-sm mb-3">대안 비교 · 선택 <span className="text-slate-500 font-normal">(C3 · override)</span></h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                <th className="px-3 py-2 font-medium">선택</th>
                <th className="px-3 py-2 font-medium">제강사</th>
                <th className="px-3 py-2 font-medium text-right">단가</th>
                <th className="px-3 py-2 font-medium text-right">운임</th>
                <th className="px-3 py-2 font-medium text-right">총원가 (BS1108)</th>
                <th className="px-3 py-2 font-medium text-right">리드타임</th>
                <th className="px-3 py-2 font-medium">비고</th>
              </tr>
            </thead>
            <tbody>
              {ORD_MILLS.map((m) => {
                const on = selected === m.id, best = m.id === ORD_MIN_ID;
                return (
                  <tr key={m.id} onClick={() => setSelected(m.id)}
                    className={`border-b border-slate-800/70 cursor-pointer transition ${on ? "bg-slate-800/50" : "hover:bg-slate-800/30"}`}>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex w-4 h-4 rounded-full border-2 items-center justify-center ${on ? (best ? "border-amber-400" : "border-indigo-400") : "border-slate-600"}`}>
                        {on && <span className={`w-2 h-2 rounded-full ${best ? "bg-amber-400" : "bg-indigo-400"}`}></span>}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-200">{m.mill}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{won(m.unitPrice)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{won(m.freight)}</td>
                    <td className={`px-3 py-2.5 text-right tabular-nums font-semibold ${best ? "text-amber-300" : "text-slate-100"}`}>{won(m.totalCost)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{m.leadTime}일</td>
                    <td className="px-3 py-2.5 text-xs">{best ? <span className="text-amber-300">추천 ★</span> : <span className="text-slate-400">{m.note}</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* override 사유 (비추천 선택 시 필수) */}
        {isOverride && (
          <div className="mt-4 p-3 rounded-lg bg-amber-950/30 border border-amber-800/40">
            <label className="text-xs text-amber-200 flex items-center gap-1.5 mb-1.5">
              <Icon name="alert" className="w-3.5 h-3.5" />수동 선택 사유 <span className="text-amber-300">*필수</span> — 비추천안({selMill.mill}) 선택은 ⚑로 감사 기록됩니다.
            </label>
            <input value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="예: 납기 우선 — 리드타임 10일"
              className={`w-full px-3 py-2 rounded-lg bg-slate-950/60 border text-sm text-slate-100 outline-none focus:border-amber-500 ${needsReason ? "border-rose-500/50" : "border-amber-700/50"}`} />
            {needsReason && <div className="mt-1 text-[11px] text-rose-300">사유를 입력해야 비교를 확정할 수 있습니다.</div>}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            선택안: <span className="text-slate-300">{selMill.mill}</span> · 총원가 <span className="tabular-nums text-slate-300">{won(selMill.totalCost)}</span>
            {isOverride && <span className="text-amber-300 ml-2">⚑ 추천안 대비 +{won(selMill.totalCost - ORD_MILLS.find((m) => m.id === ORD_MIN_ID).totalCost)}</span>}
            {confirmed && <span className="text-emerald-300 ml-2">✓ 확정됨 · 발주 후보 {selMill.mill}</span>}
          </div>
          <button onClick={confirm} disabled={needsReason || confirmed}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-sm font-semibold flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25">
            <Icon name="check" className="w-3.5 h-3.5" />비교 확정
          </button>
        </div>
      </Card>

      {/* C5 비교 이력 (mono 타임라인) */}
      <Card className="p-5">
        <h3 className="font-semibold text-sm mb-3">비교 이력 <span className="text-slate-500 font-normal">(C5 · audit_logs · 문제 105)</span></h3>
        <div className="space-y-1.5 text-[11px] font-mono text-slate-500">
          {history.map((a, i) => (
            <div key={i} className="leading-relaxed border-l-2 border-slate-800 pl-3">
              <span className="text-slate-400">{a.t}</span> · <span className="text-slate-300">{a.who}</span> · <span className="text-cyan-300">{a.act}</span>
              <div className="text-slate-600">{a.detail}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 화면 15 — 수주 확정 / 발주서 자동생성 (C6 게이트 · ⑫ Auto-PO)
// ─────────────────────────────────────────────────────────────
function Order({ route, navigate, tweaks }) {
  const { fmt, won, Card, SectionLabel, Icon, TrustBadge } = window;
  const showTB = tweaks.showTrustBadges;
  const project = { projectNo: "EDN-2026-0031", customer: "니혼스틸웍스", country: "일본", currency: "JPY", status: "CUTTING_PLANNED", cp: true };

  const [cpConfirmed, setCpConfirmed] = useState_o(true); // is_confirmed (mock 토글로 잠금/해제 시연)
  const [confirmed, setConfirmed] = useState_o(false);

  const rec = ORD_MILLS.find((m) => m.id === ORD_MIN_ID); // 추천 제강사 = 현대제철
  const line = { matl: ORD_REQUIRED.matl, th: ORD_REQUIRED.th, plateCount: ORD_REQUIRED.plateCount, weightKg: ORD_REQUIRED.weightKg, unitPrice: rec.unitPrice };
  const lineAmount = line.weightKg * line.unitPrice;     // 35,171,400
  const poAmount = lineAmount + rec.freight;             // BS1108 발주액 36,021,400

  // C6 확정 게이트 (OrderConfirmValidator)
  const gate = [
    { key: "cp", label: "절단계획 확정됨 (cutting_plans.is_confirmed = true)", ok: cpConfirmed },
    { key: "mill", label: "제강사 비교 완료 · 추천 확정 (14)", ok: true },
    { key: "quote", label: "견적 확정 (QTN-2026-0031)", ok: true },
  ];
  const gatePass = gate.every((g) => g.ok);

  const confirmOrder = () => {
    if (!gatePass) return;
    setConfirmed(true);
    window.alert("수주 확정 완료 · 상태 ORDER_CONFIRMED 전이 · 발주서 PO-2026-0031 자동 생성됨");
  };

  return (
    <div className="space-y-5">
      <OrdJourney project={{ ...project, status: confirmed ? "ORDER_CONFIRMED" : "CUTTING_PLANNED" }} current={3} cpConfirmed={cpConfirmed} />

      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <SectionLabel color="indigo">ORDER CONFIRM · 모델 15 · BS1108</SectionLabel>
          <h1 className="text-3xl font-bold mt-1.5 tracking-tight text-slate-50">수주 확정 · 발주서 자동생성</h1>
          <p className="text-sm text-slate-400 mt-1">확정 게이트 통과 시 발주서 자동 생성 · 발주 플레이트 × 추천 제강사 · <span className="text-slate-500">문제 106 방어</span></p>
        </div>
        {/* mock: CP 확정 상태 토글 (잠금/해제 시연) */}
        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none px-3 py-2 rounded-lg bg-slate-800 border border-slate-700/60">
          <span>절단계획 확정 상태 (mock)</span>
          <button onClick={() => { setCpConfirmed((v) => !v); setConfirmed(false); }}
            className={`relative w-9 h-5 rounded-full transition ${cpConfirmed ? "bg-emerald-500" : "bg-slate-600"}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${cpConfirmed ? "left-4" : "left-0.5"}`}></span>
          </button>
          <span className={cpConfirmed ? "text-emerald-300 font-mono" : "text-slate-500 font-mono"}>{cpConfirmed ? "확정" : "검토대기"}</span>
        </label>
      </div>

      {/* 수주 확정 컨텍스트 */}
      <Card className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div><div className="text-[11px] text-slate-500">견적번호</div><div className="font-mono text-slate-200 mt-0.5 flex items-center gap-1.5">QTN-2026-0031 <TrustBadge kind="확정" show={showTB} /></div></div>
        <div><div className="text-[11px] text-slate-500">견적금액</div><div className="tabular-nums text-slate-200 mt-0.5">{won(540000000)} <span className="text-[11px] text-slate-500">{project.currency}</span></div></div>
        <div><div className="text-[11px] text-slate-500">절단계획</div><div className="font-mono text-slate-200 mt-0.5 flex items-center gap-1.5">{ORD_REQUIRED.cpNo} {cpConfirmed ? <TrustBadge kind="확정" show={showTB} /> : <TrustBadge kind="검토대기" show={showTB} />}</div></div>
        <div><div className="text-[11px] text-slate-500">추천 제강사</div><div className="text-slate-200 mt-0.5 flex items-center gap-1.5">{rec.mill} <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/40">최소비용 ★</span></div></div>
      </Card>

      {/* C6 확정 게이트 */}
      <Card className={`p-5 border ${gatePass ? "border-slate-700/60" : "!border-rose-700/50 !bg-rose-950/20"}`}>
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Icon name={gatePass ? "unlock" : "lock"} className={`w-4 h-4 ${gatePass ? "text-emerald-400" : "text-rose-400"}`} />
          확정 게이트 <span className="text-slate-500 font-normal">(C6 · OrderConfirmValidator)</span>
        </h3>
        <div className="space-y-2">
          {gate.map((g) => (
            <div key={g.key} className={`flex items-center gap-2.5 text-sm ${g.ok ? "text-slate-300" : "text-rose-300"}`}>
              <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${g.ok ? "bg-emerald-500 border-emerald-500" : "border-rose-500/60"}`}>
                {g.ok ? <Icon name="check" className="w-3 h-3 text-white" /> : <Icon name="x" className="w-3 h-3 text-rose-400" />}
              </span>
              {g.label}{!g.ok && <span className="text-[11px] text-rose-400 ml-1">← 미충족</span>}
            </div>
          ))}
        </div>

        {!cpConfirmed && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/50 flex items-center justify-between gap-3">
            <div className="flex items-start gap-2 text-xs text-rose-200">
              <Icon name="lock" className="w-4 h-4 shrink-0 mt-px" />
              <div><span className="font-medium">잠금 사유: "절단계획 미확정"</span><div className="text-rose-300/80 mt-0.5">먼저 절단계획(13)을 확정하세요. 수주 확정 · 발주서 생성이 불가합니다.</div></div>
            </div>
            <button onClick={() => navigate("console")} className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700/60 hover:bg-slate-750 text-xs text-slate-200 shrink-0 flex items-center gap-1.5">
              <Icon name="scissors" className="w-3.5 h-3.5" />절단계획으로 이동
            </button>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            검토자 <span className="text-slate-400">system(자동)</span> · 확정 시 상태 <span className="font-mono">ORDER_CONFIRMED</span> 전이 + 발주서 자동생성
            {confirmed && <span className="text-emerald-300 ml-2">✓ 수주 확정됨 · PO-2026-0031</span>}
          </div>
          <button onClick={confirmOrder} disabled={!gatePass || confirmed}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-sm font-semibold flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25">
            <Icon name="check" className="w-3.5 h-3.5" />수주 확정 · 발주 생성
          </button>
        </div>
      </Card>

      {/* ⑫ Auto-PO Preview */}
      <Card className={`overflow-hidden ${!cpConfirmed ? "opacity-40 pointer-events-none" : ""}`}>
        <div className="px-5 py-3.5 border-b border-slate-700/60 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2"><Icon name="doc" className="w-4 h-4 text-indigo-400" />⑫ 발주서 미리보기 (Auto-PO Preview)</h3>
            <div className="text-xs text-slate-500 mt-0.5">확정 CP 발주 플레이트 × 추천 제강사({rec.mill}) 자동 편집</div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div><span className="text-slate-500">공급사</span> <span className="text-slate-200">{rec.mill}</span></div>
            <div><span className="text-slate-500">발주번호</span> <span className="font-mono text-slate-200">PO-2026-0031</span> <TrustBadge kind="시스템" show={showTB} /></div>
            <div><span className="text-slate-500">상태</span> <span className="text-amber-300">발주대기</span></div>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
              <th className="px-5 py-2 font-medium">재질·두께</th>
              <th className="px-3 py-2 font-medium text-right">발주매수</th>
              <th className="px-3 py-2 font-medium text-right">중량(kg)</th>
              <th className="px-3 py-2 font-medium text-right">단가(/kg)</th>
              <th className="px-5 py-2 font-medium text-right">금액</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-800/70">
              <td className="px-5 py-2.5 font-mono text-slate-300">{line.matl} · {line.th}t</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{line.plateCount}매</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{fmt(line.weightKg)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{won(line.unitPrice)}</td>
              <td className="px-5 py-2.5 text-right tabular-nums text-slate-100 font-medium">{won(lineAmount)}</td>
            </tr>
            <tr className="border-b border-slate-800/70">
              <td className="px-5 py-2.5 text-slate-400 text-xs" colSpan={4}>운임 (freight)</td>
              <td className="px-5 py-2.5 text-right tabular-nums text-slate-300">{won(rec.freight)}</td>
            </tr>
          </tbody>
        </table>

        <div className="px-5 py-4 border-t border-slate-700/60 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">발주액</span>
            <span className="text-xl font-bold tabular-nums text-slate-50">{won(poAmount)}</span>
            <TrustBadge kind="자동계산" show={showTB} />
            <TrustBadge kind="시스템" show={showTB} />
            <OrdInfo align="left">
              <div className="text-xs space-y-1.5">
                <div className="text-indigo-300 font-mono uppercase tracking-wider text-[10px]">C1 · 계산 근거 (BS1108)</div>
                <div><span className="text-slate-500">입력 </span>발주중량 {fmt(line.weightKg)}kg × 단가 {won(line.unitPrice)}/kg · 운임 {won(rec.freight)}</div>
                <div><span className="text-slate-500">수식 </span><span className="font-mono text-slate-300">발주액 = 발주중량×원/kg + 운임</span></div>
                <div className="pt-1.5 border-t border-slate-800"><span className="text-slate-500">결과 </span>{won(lineAmount)} + {won(rec.freight)} = <span className="text-emerald-300">{won(poAmount)}</span></div>
              </div>
            </OrdInfo>
          </div>
          <button onClick={() => window.alert("발주서 PDF 생성 (705) · PO-2026-0031")}
            className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700/60 hover:bg-slate-750 text-sm text-slate-200 flex items-center gap-1.5">
            <Icon name="download" className="w-3.5 h-3.5" />발주서 PDF 출력 (705)
          </button>
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { Quotation, Mills, Order });
