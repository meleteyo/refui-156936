// console.jsx — BH Cutting Plan 4-step 위저드 (모델 13)
//   ★ 2026-07-20 고객 실물 엑셀 역공학 반영 — 폭 방향 배열(스트리핑) CP
//   ⑥ 여정 스텝퍼 · ⑦ Excel Bridge · ③ What-if(배열수 J) · ① NestView(폭 단면) · ② YieldMoney(할증률/kg) · C2 해 신뢰 · C6 확정 게이트
//   Tweaks policyMode(근사/최적) → Step3/4 결과가 실제로 달라짐(solution_type·할증률·발주 매수)
const { useState: useState_c, useEffect: useEffect_c } = React;

// 부재 마크별 색 (폭 배열 병합 시각 구분)
const MARK_COLORS = ["#6366f1", "#14b8a6", "#0ea5e9", "#8b5cf6", "#f59e0b"];
const markColor = (mark) => {
  const i = window.CP_MEMBERS.findIndex((m) => m.mark === mark);
  return MARK_COLORS[(i >= 0 ? i : 0) % MARK_COLORS.length];
};
// 할증률 색 (≤1.03 초록 · ≤1.06 주황 · 초과 빨강)
const markupHex = (v) => (v == null ? "#64748b" : v <= 1.03 ? "#10b981" : v <= 1.06 ? "#f59e0b" : "#f43f5e");

// ① NestView — 플레이트 1장 = 폭 단면. 부재 스트립이 폭 방향으로 배열됨(에지트림·커프·잉여폭 표시)
function PlateBar({ layout }) {
  const { fmt } = window;
  const total = layout.width;
  const pct = (mm) => `${(mm / total) * 100}%`;
  const KERF = window.KERF_MM;
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 shrink-0 text-[11px] font-mono text-slate-400">
        {layout.plate}
        <div className="text-[10px] text-slate-600 tabular-nums">{layout.th}t · L{fmt(layout.length)} · {layout.count}매</div>
      </div>
      <div className="flex-1 flex h-8 rounded-md overflow-hidden border border-slate-700/60 bg-slate-950">
        {/* 좌 에지트림 */}
        <div className="bg-slate-700/70 flex items-center justify-center text-[8px] text-slate-400" style={{ width: pct(layout.edge / 2) }} title={`에지트림 ${layout.edge}mm`}></div>
        {/* 부재 스트립(마크별 블록) */}
        {layout.strips.map((s, i) => {
          const groupW = s.cols * s.stripW + KERF * (s.cols - 1);
          return (
            <div key={i} className="flex items-center justify-center text-[10px] font-mono text-white/90 border-l border-slate-950/50"
              style={{ width: pct(groupW), background: markColor(s.mark) }} title={`${s.mark} · ${s.cols}열 × ${s.stripW}폭`}>
              {(groupW / total) > 0.14 ? `${s.mark} ×${s.cols}` : `×${s.cols}`}
            </div>
          );
        })}
        {/* 잉여폭 (재사용 후보) */}
        {layout.remnantW > 0 && (
          <div className="scrap-hatch flex items-center justify-center text-[9px] font-mono text-slate-300 border-l border-slate-950/50" style={{ width: pct(layout.remnantW) }} title={`잉여폭 ${layout.remnantW}mm`}>
            {(layout.remnantW / total) > 0.12 ? `잉여 ${layout.remnantW}` : ''}
          </div>
        )}
        {/* 우 에지트림 */}
        <div className="bg-slate-700/70" style={{ width: pct(layout.edge / 2) }} title={`에지트림 ${layout.edge}mm`}></div>
      </div>
      <div className="w-32 shrink-0 text-right text-[11px] tabular-nums">
        <span className="text-slate-300">폭 {fmt(layout.width)}</span>
        {layout.forcedMin
          ? <div className="text-[10px] text-rose-300">최소폭강제 · 잉여 {fmt(layout.remnantW)}</div>
          : <div className="text-[10px] text-slate-500">{fmt(layout.weight)}kg</div>}
      </div>
    </div>
  );
}

function Console({ tweaks, navigate }) {
  const { fmt, won, man, Card, SectionLabel, Icon, SolutionBadge, TrustBadge } = window;
  const [step, setStep] = useState_c(1);
  const [uploaded, setUploaded] = useState_c(false);
  const [specSel, setSpecSel] = useState_c("SPEC-30");
  const [arrayJ, setArrayJ] = useState_c(4);
  const [objective, setObjective] = useState_c("minMarkup");
  const [progress, setProgress] = useState_c(0);
  const [phaseIdx, setPhaseIdx] = useState_c(0);
  const [done, setDone] = useState_c(false);
  const [checks, setChecks] = useState_c({});
  const [confirmed, setConfirmed] = useState_c(false);

  const policyMode = tweaks.policyMode || "근사";
  const sol = window.CP_SOLUTIONS[policyMode];
  const opt = window.CP_SOLUTIONS["최적"];
  const isApprox = sol.solutionType === "근사";

  const netKg = window.CP_NET_WEIGHT_KG;
  const pieceCount = window.CP_MEMBERS.reduce((a, m) => a + m.qty, 0);
  const whatif = window.WHATIF_ARRAY[arrayJ];

  const optPhases = ["부재 전개 (702·W/FU/FL)", "두께·재질 그룹핑", policyMode === "최적" ? "CP-SAT 폭배정 완전탐색" : "그리디 폭배정", "제약 검증 · 폭보존"];

  // Step4 진입 → 최적화 잡 진행률 애니메이션
  useEffect_c(() => {
    if (step !== 4) return;
    setProgress(0); setPhaseIdx(0); setDone(false); setConfirmed(false);
    setChecks({ constraint: true, solution: true });
    let p = 0, ph = 0;
    const tick = () => {
      p += 6 + Math.random() * 7;
      if (p >= 100) { p = 100; setProgress(100); setDone(true); return; }
      setProgress(Math.round(p));
      const nextPh = Math.min(optPhases.length - 1, Math.floor((p / 100) * optPhases.length));
      if (nextPh !== ph) { ph = nextPh; setPhaseIdx(ph); }
      setTimeout(tick, 150 + Math.random() * 120);
    };
    const t = setTimeout(tick, 350);
    return () => clearTimeout(t);
  }, [step, policyMode, objective]);

  const requiredChecks = ["constraint", "solution", "alternative", ...(isApprox ? ["confidence"] : [])];
  const allChecked = requiredChecks.every((k) => checks[k]);
  const toggleCheck = (k) => setChecks((s) => ({ ...s, [k]: !s[k] }));

  const steps = [
    { n: 1, label: "대상 (엑셀·전개)", icon: "upload" },
    { n: 2, label: "발주 규격·What-if", icon: "grid" },
    { n: 3, label: "옵션·정책", icon: "filter" },
    { n: 4, label: "결과·확정", icon: "gauge" },
  ];
  const canNext = (step === 1 && uploaded) || (step === 2 && !!specSel) || step === 3;

  return (
    <div className="space-y-5">
      {/* ⑥ 프로젝트 여정 스텝퍼 */}
      <Card className="p-4">
        <div className="flex items-center justify-between text-xs mb-2.5">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="font-mono text-slate-400">EDN-2026-0031</span>
            <span className="text-slate-600">·</span>
            <span>니혼스틸웍스</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-500">일본 / JPY</span>
          </div>
          <window.StatusBadge status="CUTTING_PLANNED" />
        </div>
        <div className="flex items-center">
          {window.JOURNEY_STEPS.map((s, i) => {
            const cur = i === 2; // 절단계획
            const before = i < 2;
            const gate = i === 3; // CP 확정 시 잠금해제 게이트
            return (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${before ? 'bg-emerald-500/25 text-emerald-300' : cur ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                    {before ? '✓' : i + 1}
                  </div>
                  <div className={`text-[10px] mt-1 ${cur ? 'text-indigo-300' : 'text-slate-500'}`}>{s}</div>
                </div>
                {i < window.JOURNEY_STEPS.length - 1 && (
                  <div className="flex-1 flex items-center justify-center px-1">
                    {gate ? <span className="text-xs" title="CP 확정 시 잠금해제">{confirmed ? '🔓' : '🔒'}</span>
                          : <div className={`h-px w-full ${before ? 'bg-emerald-500/40' : 'bg-slate-700'}`}></div>}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </Card>

      {/* 헤더 */}
      <div className="flex items-end justify-between">
        <div>
          <SectionLabel color="cyan">CUTTING PLAN CONSOLE · 모델 13</SectionLabel>
          <h1 className="text-3xl font-bold mt-1.5 tracking-tight text-slate-50">절단계획(CP) 콘솔</h1>
          <p className="text-sm text-slate-400 mt-1">엑셀 업로드 → 부재 전개 → 폭 방향 배열 최적화 → 발주 확정. <span className="text-slate-500">두께·재질별 스트리핑 · 문제 103·104</span></p>
        </div>
        <div className="text-right text-xs">
          <div className="text-slate-500">현재 탐색 정책 (Tweaks)</div>
          <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/60">
            <span className={`w-1.5 h-1.5 rounded-full ${policyMode === '최적' ? 'bg-amber-400' : 'bg-cyan-400'}`}></span>
            <span className="font-medium">{policyMode === '최적' ? '최적 (CP-SAT)' : '근사 (그리디)'}</span>
          </div>
        </div>
      </div>

      {/* 4-dot 진행 */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className={`flex-1 h-1 rounded-full ${n <= step ? 'bg-indigo-500' : 'bg-slate-800'}`}></div>
        ))}
      </div>

      {/* Stepper */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-2">
          {steps.map((s, i, arr) => {
            const active = step === s.n, sdone = step > s.n;
            return (
              <React.Fragment key={s.n}>
                <button disabled={s.n > step + (canNext ? 1 : 0)} onClick={() => s.n <= step && setStep(s.n)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition ${active ? 'bg-indigo-500/20 text-indigo-100' : sdone ? 'text-emerald-300 hover:bg-slate-800' : 'text-slate-500'}`}>
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold ${active ? 'bg-indigo-500 text-white' : sdone ? 'bg-emerald-500/25 text-emerald-200' : 'bg-slate-800 text-slate-500'}`}>
                    {sdone ? <Icon name="check" className="w-3 h-3" /> : s.n}
                  </div>
                  <span className="text-sm font-medium">{s.label}</span>
                </button>
                {i < arr.length - 1 && <div className={`flex-1 h-px ${step > s.n ? 'bg-emerald-500/40' : 'bg-slate-700'}`}></div>}
              </React.Fragment>
            );
          })}
        </div>
      </Card>

      {/* ===== Step 1 — 엑셀 업로드 → 부재 전개 (W/FU/FL) ===== */}
      {step === 1 && (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="upload" className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold">⑦ CP 엑셀 업로드 (Excel Bridge)</span>
              <span className="text-[11px] font-mono text-slate-500 ml-2">→ POST /api/cutting-plans/&#123;id&#125;/excel</span>
            </div>
            {!uploaded ? (
              <button onClick={() => setUploaded(true)}
                className="w-full py-8 rounded-lg border-2 border-dashed border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/40 transition text-center">
                <Icon name="upload" className="w-7 h-7 text-slate-500 mx-auto mb-2" />
                <div className="text-sm text-slate-300 font-medium">BH_CP_EDN0031.xlsx 끌어다 놓기 · 클릭해 업로드</div>
                <div className="text-xs text-slate-500 mt-1">업로드 시 좌 원본 ↔ 우 매핑 미리보기 · 오기/누락 셀 빨강</div>
              </button>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40">
                <div className="w-9 h-11 rounded bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold text-emerald-300">XLS</div>
                <div className="flex-1">
                  <div className="text-sm font-mono text-slate-200">BH_CP_EDN0031.xlsx</div>
                  <div className="text-[11px] text-emerald-300/80">파싱 완료 · BH BEAM → {pieceCount}개 부재 전개(W/FU/FL) · 오류 0행 <TrustBadge kind="엑셀" show={tweaks.showTrustBadges} /></div>
                </div>
                <button onClick={() => setUploaded(false)} className="text-xs text-slate-400 hover:text-slate-200">다시 올리기</button>
              </div>
            )}
          </Card>

          {uploaded && (
            <Card className="overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-700/60 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">요구 부재 전개 결과 (702)</h3>
                  <div className="text-xs text-slate-500 mt-0.5">BH BEAM → WEB / FU / FL 3분해 · 정미 소요중량 총 <span className="tabular-nums text-slate-300">{fmt(netKg)}kg</span></div>
                </div>
                <TrustBadge kind="자동계산" show={tweaks.showTrustBadges} />
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                    <th className="px-5 py-2 font-medium">MARK · 유형</th>
                    <th className="px-3 py-2 font-medium">재질</th>
                    <th className="px-3 py-2 font-medium text-right">두께(t)</th>
                    <th className="px-3 py-2 font-medium text-right">부재폭(mm)</th>
                    <th className="px-3 py-2 font-medium text-right">길이(mm)</th>
                    <th className="px-3 py-2 font-medium text-right">수량</th>
                    <th className="px-5 py-2 font-medium text-right">중량(kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {window.CP_MEMBERS.map((m, i) => (
                    <tr key={i} className="border-b border-slate-800/70">
                      <td className="px-5 py-2.5">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: markColor(m.mark) }}></span>
                          <span className="font-mono text-slate-200">{m.mark}</span>
                          <span className="text-[10px] text-slate-500">{m.memberType}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-400">{m.matl}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{m.th}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{fmt(m.width)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{fmt(m.length)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{m.qty}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums text-slate-200">{fmt(m.weightKg)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-2.5 text-[11px] text-slate-500 border-t border-slate-800 bg-slate-900/40">
                ⓘ 전개 규칙 — WEB(두께 T1, 폭 H1−T2−T3) · FU 상부플랜지(두께 T2, 폭 B, 수량×2) · FL 하부플랜지(비대칭 단면만). 중량 = 두께×폭×길이×수량×7.85e-6 (비중 7.85)
              </div>
            </Card>
          )}

          <div className="flex justify-end">
            <button disabled={!uploaded} onClick={() => setStep(2)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-sm font-semibold flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20">
              발주 규격 설정 <Icon name="arrowRight" className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ===== Step 2 — 발주 규격 제약 + What-if(배열수 J) ===== */}
      {step === 2 && (
        <div className="grid grid-cols-12 gap-4">
          <Card className="col-span-12 lg:col-span-7 p-5">
            <h3 className="font-semibold mb-1">발주 규격 제약 · 잉여판</h3>
            <p className="text-xs text-slate-500 mb-3">플레이트는 재고가 아니라 CP가 산출해 제강사에 주문합니다 (두께별 폭 밴드·최소폭·단가 마스터)</p>
            <div className="space-y-2">
              {window.MOTHER_BARS.map((b) => {
                const on = specSel === b.id;
                return (
                  <button key={b.id} onClick={() => setSpecSel(b.id)}
                    className={`w-full text-left p-3 rounded-lg border transition ${on ? 'bg-indigo-500/10 border-indigo-500/40' : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${on ? 'border-indigo-400' : 'border-slate-600'}`}>
                          {on && <div className="w-2 h-2 rounded-full bg-indigo-400"></div>}
                        </div>
                        <span className="font-mono text-sm text-slate-200">{b.matl} · {b.th}t</span>
                        {b.remnant && <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">잉여판</span>}
                        {b.recommended && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">해당 그룹 ★</span>}
                      </div>
                      <div className="text-right">
                        {b.remnant
                          ? <div className="text-sm tabular-nums text-teal-300">{fmt(b.remnantWidth)}×{fmt(b.remnantLength)}<span className="text-xs text-slate-500"> 보유</span></div>
                          : <div className="text-sm tabular-nums text-slate-200">{won(b.pricePerKg)}<span className="text-xs text-slate-500">/kg</span></div>}
                        <div className="text-[11px] text-slate-500">에지 {b.edgeTrim} · 최소폭 {fmt(b.minWidth)} · {b.mill} · <span className="font-mono text-teal-300/80" title="밀시트(heat) 번호 — 인증재 추적">{b.heat}</span></div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 text-[11px] text-slate-500 leading-relaxed">
              폭 밴드 {window.WIDTH_BANDS.map((w) => `${fmt(w[0])}~${fmt(w[1])}`).join(" · ")} · 수출건은 heat(밀시트) 경계 내에서만 배치 · 잉여판 보유분 우선 투입 <span className="text-indigo-300/70">[선택범위]</span>
            </div>
          </Card>

          {/* ③ What-if 배열수 J */}
          <Card className="col-span-12 lg:col-span-5 p-5">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="sparkles" className="w-4 h-4 text-cyan-400" />
              <h3 className="font-semibold">③ What-if · 배열수 J</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">대표 부재 SM-005-W(폭700·수량8) · J열을 폭 방향으로 배열</p>

            <div className="text-center py-2">
              <div className="text-4xl font-bold tabular-nums text-slate-100">폭 {fmt(whatif.plateWidth)}<span className="text-lg text-slate-500">mm</span></div>
              <div className="text-xs text-slate-500 mt-1">배열수 J={arrayJ} · 발주 {whatif.plateCount}매 {whatif.forced && <span className="text-rose-300">· 최소폭 강제</span>}</div>
            </div>

            {/* 폭 미니 프리뷰 */}
            <div className="flex h-6 rounded-md overflow-hidden border border-slate-700/60 bg-slate-950 my-3">
              <div className="bg-slate-700/70" style={{ width: `${(16 / whatif.plateWidth) * 100}%` }}></div>
              {Array.from({ length: arrayJ }).map((_, i) => (
                <div key={i} className="border-l border-slate-950/50" style={{ width: `${(700 / whatif.plateWidth) * 100}%`, background: MARK_COLORS[0] }}></div>
              ))}
              {whatif.forced && <div className="scrap-hatch flex items-center justify-center text-[8px] text-slate-300" style={{ width: `${((whatif.plateWidth - (arrayJ * 700 + 16 + 3 * (arrayJ - 1))) / whatif.plateWidth) * 100}%` }}>잉여</div>}
            </div>

            <input type="range" min={1} max={4} step={1} value={arrayJ} onChange={(e) => setArrayJ(+e.target.value)}
              className="w-full mt-1 accent-indigo-500" />
            <div className="flex justify-between text-[10px] text-slate-600 font-mono mt-1">
              <span>J=1</span><span>2</span><span>3</span><span>4</span>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-slate-400 leading-relaxed">
              <Icon name="info" className="w-3.5 h-3.5 inline text-cyan-400 mr-1" />
              {whatif.note} — 배열수를 늘리면 폭을 채워 할증이 줄지만, 폭 밴드(≤3,300) 상한을 넘으면 매수가 늘어납니다.
            </div>

            <button disabled={!specSel} onClick={() => setStep(3)}
              className="w-full mt-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-30 shadow-lg shadow-indigo-500/20">
              옵션·정책 설정 <Icon name="arrowRight" className="w-3.5 h-3.5" />
            </button>
          </Card>
        </div>
      )}

      {/* ===== Step 3 — 옵션 · 정책 ===== */}
      {step === 3 && (
        <div className="grid grid-cols-12 gap-4">
          <Card className="col-span-12 lg:col-span-7 p-5 space-y-5">
            <div>
              <h3 className="font-semibold mb-1">최적화 목적함수 (objective)</h3>
              <p className="text-xs text-slate-500">폭 배열 우선순위를 결정합니다</p>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {window.CP_OBJECTIVES.map((o) => {
                  const on = objective === o.key;
                  return (
                    <button key={o.key} onClick={() => setObjective(o.key)}
                      className={`p-3 rounded-lg border text-left transition ${on ? 'bg-indigo-500/10 border-indigo-500/40' : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'}`}>
                      <div className="text-sm font-semibold text-slate-100">{o.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{o.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* policyMode 연동 안내 */}
            <div>
              <h3 className="font-semibold mb-1">해 탐색 모드 <span className="text-xs text-slate-500 font-normal">(Tweaks · policyMode)</span></h3>
              <div className={`mt-2 p-4 rounded-lg border ${policyMode === '최적' ? 'bg-amber-950/40 border-amber-800/50' : 'bg-cyan-950/40 border-cyan-800/50'}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <window.SolutionBadge type={policyMode} />
                  <span className="text-sm font-semibold text-slate-100">{policyMode === '최적' ? '최적 — OR-Tools CP-SAT 폭배정 완전탐색' : '근사 — 그리디 폭배정 (수초)'}</span>
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  {policyMode === '최적'
                    ? '두께·재질 그룹 내에서 스트립을 폭으로 병합해 최소 할증 해를 탐색합니다. 예상 결과: 발주 4매 · 할증률 1.028 · 수율 97.3%.'
                    : '마크별 개별 발주(병합 미적용). 좁은 단품은 최소폭 1501에 걸립니다. 예상 결과: 발주 6매 · 할증률 1.166 · 수율 85.7%.'}
                </div>
                <div className="mt-2 text-[11px] text-slate-500">💡 우하단 Tweaks 패널에서 모드를 바꾸면 Step 4 결과가 실제로 달라집니다.</div>
              </div>
            </div>
          </Card>

          {/* 예상 결과 요약 (모드별 상이) */}
          <Card className="col-span-12 lg:col-span-5 p-5">
            <h3 className="font-semibold mb-3">최적화 미리 요약</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-800"><span className="text-slate-400">해 유형</span><window.SolutionBadge type={sol.solutionType} /></div>
              <div className="flex justify-between py-2 border-b border-slate-800"><span className="text-slate-400">예상 할증률</span>
                <span className="flex items-center gap-1.5"><span className="tabular-nums font-semibold" style={{ color: markupHex(sol.markup) }}>{sol.markup}</span>
                  <window.InfoTip title="계산 근거 — BS1105 (입력 → 식 → 결과)" lines={[`입력 · 정미 소요 ${fmt(netKg)}kg`, `식 · 발주중량 ÷ 정미 = ${fmt(sol.orderedWeightKg)} ÷ ${fmt(netKg)}`, `결과 · 할증률 ${sol.markup} (수율 ${sol.yieldPct}%)`]} /></span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800"><span className="text-slate-400">발주 매수</span><span className="tabular-nums font-semibold text-slate-100">{sol.plateCount}매</span></div>
              <div className="flex justify-between py-2 border-b border-slate-800"><span className="text-slate-400">발주중량</span><span className="tabular-nums text-slate-300">{fmt(sol.orderedWeightKg)}kg</span></div>
              <div className="flex justify-between py-2"><span className="text-slate-400">목적함수</span><span className="text-slate-200">{window.CP_OBJECTIVES.find(o => o.key === objective)?.label}</span></div>
            </div>
            <button onClick={() => setStep(4)}
              className="w-full mt-4 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30">
              <Icon name="play" className="w-4 h-4" />최적화 실행
            </button>
            <button onClick={() => setStep(2)} className="w-full mt-2 py-2 rounded-lg bg-slate-800 border border-slate-700/60 hover:bg-slate-750 text-sm text-slate-300">이전 단계</button>
          </Card>
        </div>
      )}

      {/* ===== Step 4 — 결과 · 확정 ===== */}
      {step === 4 && (
        <div className="space-y-4">
          {/* 진행률 애니메이션 (완료 전) */}
          {!done && (
            <Card className="p-7">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Icon name="scissors" className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">폭 배정 최적화 중… <span className="text-sm font-normal text-slate-400">({policyMode === '최적' ? 'CP-SAT' : '그리디'})</span></h3>
                  <div className="text-xs text-slate-500 font-mono">Job · width-nesting · maxSeconds=10</div>
                </div>
                <div className="ml-auto text-xs text-indigo-300 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>비동기 잡 폴링</div>
              </div>
              <div className="h-3 rounded-full bg-slate-800 overflow-hidden mb-2">
                <div className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-teal-400 transition-all duration-200" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="text-right text-xs text-slate-500 tabular-nums mb-4">{progress}%</div>
              <div className="space-y-1.5">
                {optPhases.map((ph, i) => (
                  <div key={i} className={`flex items-center gap-3 px-3 py-1.5 rounded-md text-sm ${i === phaseIdx ? 'bg-indigo-500/10 text-indigo-100' : i < phaseIdx ? 'text-emerald-300' : 'text-slate-500'}`}>
                    <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${i === phaseIdx ? 'bg-indigo-500 text-white animate-pulse' : i < phaseIdx ? 'bg-emerald-500/25 text-emerald-200' : 'bg-slate-800'}`}>
                      {i < phaseIdx ? '✓' : i + 1}
                    </span>
                    {ph}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {done && (
            <>
              {/* ① NestView — 폭 단면 */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-base flex items-center gap-2"><Icon name="scissors" className="w-4 h-4 text-indigo-400" />① 폭 배열 — NestView</h3>
                    <div className="text-xs text-slate-500 mt-0.5">플레이트 {sol.plateCount}매 · 부재 스트립을 폭 방향으로 배열 · 색블록=마크 · 회색=잉여폭</div>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: MARK_COLORS[1] }}></span>WEB</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-slate-600"></span>에지트림</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm scrap-hatch"></span>잉여폭(재사용)</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {sol.layouts.map((l) => <PlateBar key={l.plate} layout={l} />)}
                </div>
                <div className="mt-3 text-[11px] text-slate-500">막대 = 플레이트 폭 단면(가로=발주폭). 최적 모드는 좁은 단품을 폭으로 병합해 잉여를 없앱니다.</div>
              </Card>

              <div className="grid grid-cols-12 gap-4">
                {/* ② YieldMoney → 할증률 · kg */}
                <Card className="col-span-12 lg:col-span-7 p-5">
                  <h3 className="font-semibold text-base mb-3 flex items-center gap-2"><Icon name="coins" className="w-4 h-4 text-amber-400" />② 할증률 · 금액 (YieldMoney)</h3>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-slate-400">할증률 V</span>
                    <span className="text-2xl font-bold tabular-nums" style={{ color: markupHex(sol.markup) }}>{sol.markup}</span>
                    <span className="text-sm text-slate-400">(수율 {sol.yieldPct}%)</span>
                    <window.InfoTip title="계산 근거 — BS1105 (입력 → 식 → 결과)" lines={[`입력 · 정미 소요 ${fmt(netKg)}kg`, `식 · 발주중량 ÷ 정미 = ${fmt(sol.orderedWeightKg)} ÷ ${fmt(netKg)}`, `결과 · 할증률 ${sol.markup} · 수율 ${sol.yieldPct}%`]} />
                    <span className="text-[11px] text-slate-500">(≤1.03 초록 · ~1.06 주황 · ↑ 빨강)</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-800 overflow-hidden mb-4">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, sol.yieldPct)}%`, background: markupHex(sol.markup) }}></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                      <div className="text-[11px] text-slate-500">초과 발주(잉여)</div>
                      <div className="tabular-nums text-slate-100 font-semibold">{fmt(sol.overWeightKg)}kg</div>
                      <div className="text-[11px] text-amber-300 mt-0.5">≈ {man(sol.overCostKRW)} <span className="text-slate-500">(× {won(window.PRICE_PER_KG)}/kg)</span></div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                      <div className="text-[11px] text-slate-500">발주 매수 · 중량</div>
                      <div className="tabular-nums text-slate-100 font-semibold">{sol.plateCount}매</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">발주 {fmt(sol.orderedWeightKg)}kg</div>
                    </div>
                  </div>
                  <div className="mt-3 p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200">
                    ◆ 할증률 1%p ≈ <span className="tabular-nums font-semibold">{man(sol.markupSensitivityKRW)}</span> · 목적함수 = 발주중량(kg) 최소화 · 좁은 단품 폭 병합이 핵심 레버
                  </div>
                  {/* 발주 원가 구성 — C1 자동계산 */}
                  <div className="mt-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-slate-300">발주 원가 구성 (kg × 원/kg)</span>
                      <TrustBadge kind="자동계산" show={tweaks.showTrustBadges} />
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between"><span className="text-slate-500">정미 소요 {fmt(netKg)}kg × {won(window.PRICE_PER_KG)}</span><span className="tabular-nums text-slate-200">{won(Math.round(netKg * window.PRICE_PER_KG))}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">+ 초과 발주(잉여) {fmt(sol.overWeightKg)}kg</span><span className="tabular-nums text-amber-300">+{won(sol.overCostKRW)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">− 잉여판 재사용 (잉여판 재고 <span className="text-indigo-300/70">[선택범위]</span>)</span><span className="text-slate-500">적립 시 반영</span></div>
                      <div className="flex justify-between pt-1 border-t border-slate-700/60"><span className="text-slate-400">발주 원가 합계</span><span className="tabular-nums text-slate-100 font-semibold">{won(Math.round(sol.orderedWeightKg * window.PRICE_PER_KG))}</span></div>
                    </div>
                  </div>
                </Card>

                {/* C2 해 신뢰 패널 */}
                <Card className="col-span-12 lg:col-span-5 p-5">
                  <h3 className="font-semibold text-base mb-3">C2 · 해(解) 신뢰</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <window.SolutionBadge type={sol.solutionType} />
                    {isApprox && (
                      <span className="flex items-center gap-1 text-xs text-slate-300">신뢰도 <span className="tabular-nums font-semibold">{sol.confidence}%</span>
                        <span className="font-mono tracking-tighter text-cyan-400">{'▰'.repeat(Math.round(sol.confidence / 20))}{'▱'.repeat(5 - Math.round(sol.confidence / 20))}</span>
                      </span>
                    )}
                  </div>
                  {isApprox && (
                    <div className="mb-3 p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-[11px] text-cyan-200 tabular-nums">
                      최적 대비 격차 · 할증률 +{(sol.markup - opt.markup).toFixed(3)} · 발주 +{sol.plateCount - opt.plateCount}매 · 초과중량 +{fmt(sol.overWeightKg - opt.overWeightKg)}kg (≈ +{man(sol.overCostKRW - opt.overCostKRW)}) <span className="text-slate-500">(CP-SAT 전환 시 개선)</span>
                    </div>
                  )}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-300"><Icon name="check" className="w-3.5 h-3.5" />제약검증 · 전량배치 · heat 경계 · 폭보존
                      <window.InfoTip title="폭 보존 검산 (mm)" lines={[`발주폭 = Σ(부재폭×배열수) + 에지트림 + 커프×(절단선수)`, `예) P2 = (700×3)+(700×1) + 16 + 3×3 = 2,825mm`, `길이 = 부재길이 + 여유(10mm) · 커프 ${window.KERF_MM}mm/절단선`]} />
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 leading-relaxed">
                      <span className="text-slate-300 font-medium">왜 이 배열?</span> {sol.rationale}
                    </div>
                    <div className="text-slate-500">탐색범위 · {sol.search}</div>
                    {isApprox && <div className="text-amber-300/80 text-[11px]">ⓘ 근사해 — 제한된 탐색의 최선해입니다. 완전탐색(최적)은 Tweaks에서 전환하세요.</div>}
                  </div>
                </Card>
              </div>

              {/* ⑤ 해 비교 — 근사 vs 최적 나란히 (C3) */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-base">⑤ 해 비교 — 근사 vs 최적</h3>
                  <span className="text-[11px] text-slate-500">카드 클릭으로 전환 · Tweaks 패널에서도 가능</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {["근사", "최적"].map((k) => {
                    const s = window.CP_SOLUTIONS[k];
                    const on = policyMode === k;
                    return (
                      <button key={k} onClick={() => window.__setPolicyMode && window.__setPolicyMode(k)}
                        className={`p-4 rounded-lg border text-left transition ${on ? 'bg-indigo-500/10 border-indigo-500/40' : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <SolutionBadge type={s.solutionType} />
                          <span className="text-xs text-slate-400">{k === '근사' ? '그리디 폭배정 · 수초' : 'CP-SAT 폭배정 · 최적성 증명'}</span>
                          {on && <span className="ml-auto text-[10px] text-indigo-300">● 현재 해</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          <div className="flex justify-between"><span className="text-slate-500 text-xs">할증률</span><span className="tabular-nums font-semibold" style={{ color: markupHex(s.markup) }}>{s.markup}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500 text-xs">발주</span><span className="tabular-nums text-slate-200">{s.plateCount}매</span></div>
                          <div className="flex justify-between"><span className="text-slate-500 text-xs">수율</span><span className="tabular-nums text-slate-300">{s.yieldPct}%</span></div>
                          <div className="flex justify-between"><span className="text-slate-500 text-xs">초과</span><span className="tabular-nums text-amber-300">{man(s.overCostKRW)}</span></div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 text-[11px] text-slate-500">실측 앵커 — 잘 묶은 지상1절 V=1.035(수율96.6%) · 표준폭 강제된 C2-2 V=1.147(개별 최대 2.51). 데모는 폭 병합 메커니즘 시연.</div>
              </Card>

              {/* C6 확정 게이트 */}
              <Card className="p-5">
                <h3 className="font-semibold text-base mb-3">C6 · 절단계획 확정 검토 <span className="text-xs text-slate-500 font-normal">(cp1304)</span></h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                  {window.CP_COMMIT_CHECKS.filter(c => c.key !== 'confidence' || isApprox).map((c) => {
                    const on = !!checks[c.key];
                    return (
                      <button key={c.key} onClick={() => toggleCheck(c.key)}
                        className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition ${on ? 'bg-emerald-950/40 border-emerald-800/50' : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'}`}>
                        <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${on ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                          {on && <Icon name="check" className="w-3 h-3 text-white" />}
                        </div>
                        <div>
                          <div className="text-sm text-slate-200">{c.label}</div>
                          {c.auto && <div className="text-[10px] text-slate-500 mt-0.5">자동 검증됨</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    확정 시 폭 배열이 <span className="font-mono">[잠금]</span>되고 발주(15) 입력이 열립니다.
                    {confirmed && <span className="text-emerald-300 ml-2">✓ 확정됨 · PO-2026-0031 발주 대기</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setStep(3); }} className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700/60 hover:bg-slate-750 text-sm text-slate-300">재계산</button>
                    {!confirmed ? (
                      <button disabled={!allChecked} onClick={() => setConfirmed(true)}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-sm font-semibold flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25">
                        <Icon name="lock" className="w-3.5 h-3.5" />검토완료 · 확정
                      </button>
                    ) : (
                      <button onClick={() => navigate('history', { projectNo: 'EDN-2026-0031' })}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-sm font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-500/25">
                        이력 보기 <Icon name="arrowRight" className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}

window.Console = Console;
