// history.jsx — 프로젝트 이력 (모델 11 목록 + 여정 요약)
// 테이블 → 행 클릭 → 우측 사이드 패널(⑥ 여정 스텝퍼 · CP 요약 · 손익 · C5 감사 로그) · Esc 닫기
// fallback(근사해 자동대체) 케이스: EDN-2026-0031
const { useState: useState_h, useEffect: useEffect_h } = React;

function History({ tweaks, navigate, route }) {
  const { fmt, won, man, Card, SectionLabel, Icon, StatusBadge, SolutionBadge, TrustBadge, Masked, yieldHex, profitColor } = window;
  const canFinance = window.FINANCE_ROLES.includes(tweaks.role);
  const payload = route?.payload || {};

  const [detail, setDetail] = useState_h(null);
  const [statusFilter, setStatusFilter] = useState_h(payload.status || "ALL");
  const [q, setQ] = useState_h("");

  // 파이프라인 드릴다운 / 콘솔 확정 진입 시 프리셋
  useEffect_h(() => {
    if (payload.projectNo) {
      const p = window.PROJECTS.find((x) => x.projectNo === payload.projectNo);
      if (p) setDetail(p);
    }
  }, []);

  // Esc 닫기
  useEffect_h(() => {
    const onKey = (e) => { if (e.key === "Escape") setDetail(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = window.PROJECTS.filter((p) => {
    if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
    if (q && !p.projectNo.includes(q) && !p.name.includes(q) && !p.customer.includes(q)) return false;
    return true;
  });

  const withYield = window.PROJECTS.filter((p) => p.yieldRate != null);
  const avgYield = (withYield.reduce((a, p) => a + p.yieldRate, 0) / withYield.length).toFixed(1);
  const fxCount = window.PROJECTS.filter((p) => p.receivable && p.receivable.foreign > 0).length;

  const statusTabs = [["ALL", "전체"], ...window.ENUMS.ProjectStatus.map((s) => [s, window.PROJECT_STATUS_META[s].label])];

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <SectionLabel color="emerald">PROJECTS · 프로젝트 이력</SectionLabel>
          <h1 className="text-3xl font-bold mt-1.5 tracking-tight text-slate-50">프로젝트 이력</h1>
          <p className="text-sm text-slate-400 mt-1">전 프로젝트 여정·수율·손익 추적 · 행 클릭 = 여정 상세 · <span className="text-slate-500">문제 101 해소</span></p>
        </div>
        <button className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700/60 hover:bg-slate-750 text-sm flex items-center gap-2 text-slate-300">
          <Icon name="download" className="w-3.5 h-3.5" />엑셀 내보내기
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-xs text-slate-400">총 프로젝트</div>
          <div className="text-3xl font-bold tabular-nums mt-1 text-slate-50">{window.PROJECTS.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">DRAFT ~ SETTLED</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-400">평균 수율</div>
          <div className="text-3xl font-bold tabular-nums mt-1" style={{ color: yieldHex(+avgYield) }}>{avgYield}%</div>
          <div className="text-[11px] text-slate-500 mt-1">CP 확정 {withYield.length}건 평균</div>
        </Card>
        <Card className="p-4 !bg-amber-950 !border-amber-700">
          <div className="text-xs font-medium text-amber-200">외화 미수 프로젝트</div>
          <div className="text-3xl font-bold tabular-nums mt-1 text-amber-50">{fxCount}</div>
          <div className="text-[11px] text-amber-200/80 mt-1">환리스크 모니터링 대상</div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        {/* 필터 */}
        <div className="px-5 py-3.5 border-b border-slate-700/60 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Icon name="search" className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="프로젝트번호·명·고객사 검색"
              className="w-full pl-9 pr-3 py-1.5 rounded-md bg-slate-950/60 border border-slate-700/60 text-sm focus:border-indigo-500 outline-none" />
          </div>
          <div className="flex items-center gap-1 text-xs p-0.5 rounded-md bg-slate-800/70 border border-slate-700/60 flex-wrap">
            {statusTabs.map(([k, l]) => (
              <button key={k} onClick={() => setStatusFilter(k)}
                className={`px-2.5 py-1 rounded ${statusFilter === k ? 'bg-indigo-500/25 text-indigo-200' : 'text-slate-400 hover:text-slate-200'}`}>{l}</button>
            ))}
          </div>
          <div className="text-xs text-slate-500 ml-auto">{filtered.length}건</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                <th className="px-5 py-2.5 font-medium">프로젝트번호</th>
                <th className="px-3 py-2.5 font-medium">프로젝트명 · 고객사</th>
                <th className="px-3 py-2.5 font-medium">국가/통화</th>
                <th className="px-3 py-2.5 font-medium">상태</th>
                <th className="px-3 py-2.5 font-medium text-right">수율</th>
                <th className="px-3 py-2.5 font-medium text-right">손익</th>
                <th className="px-5 py-2.5 font-medium text-right">액션</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.projectNo} onClick={() => setDetail(p)}
                  className={`border-b border-slate-800/70 hover:bg-slate-800/40 cursor-pointer transition ${detail?.projectNo === p.projectNo ? 'bg-indigo-500/10' : ''}`}>
                  <td className="px-5 py-3 font-mono text-xs text-slate-300">{p.projectNo}</td>
                  <td className="px-3 py-3">
                    <div className="font-medium text-slate-200 truncate max-w-[220px]">{p.name}</div>
                    <div className="text-[11px] text-slate-500">{p.customer}</div>
                  </td>
                  <td className="px-3 py-3 text-slate-400 text-xs">{p.country} / {p.currency}</td>
                  <td className="px-3 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-3 py-3 text-right">
                    {p.yieldRate != null ? (
                      <span className="inline-flex items-center gap-1.5 tabular-nums font-medium" style={{ color: yieldHex(p.yieldRate) }}>
                        {p.fallback && <span className="text-[9px] px-1 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30" title="CP-SAT 시간초과 → 근사 자동대체">대체→</span>}
                        {p.yieldRate}%
                      </span>
                    ) : <span className="text-slate-600 text-xs">—</span>}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {p.finance ? (
                      canFinance ? <span className={`tabular-nums ${profitColor(p.finance.finalProfit)}`}>{p.finance.finalProfit < 0 ? '(' + won(Math.abs(p.finance.finalProfit)) + ')' : won(p.finance.finalProfit)}</span>
                                 : <Masked visible={false} need="FINANCE·CEO">x</Masked>
                    ) : <span className="text-slate-600 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={(e) => { e.stopPropagation(); setDetail(p); }} className="text-xs text-slate-400 hover:text-indigo-300">여정 →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 우측 사이드 패널 */}
      {detail && (
        <div className="fixed inset-0 z-30 flex">
          <div onClick={() => setDetail(null)} className="flex-1 bg-slate-950/70"></div>
          <div className="w-full max-w-lg bg-slate-950 border-l border-slate-800 shadow-2xl overflow-y-auto">
            {/* 헤더 */}
            <div className="p-5 border-b border-slate-800 flex items-start justify-between sticky top-0 bg-slate-950 z-10">
              <div>
                <div className="text-[11px] font-mono text-slate-500">{detail.projectNo}</div>
                <h3 className="font-bold text-lg mt-0.5 text-slate-50">{detail.name}</h3>
                <div className="text-xs text-slate-400 mt-1">{detail.customer} · {detail.country} / {detail.currency}</div>
              </div>
              <button onClick={() => setDetail(null)} className="p-1.5 rounded-md hover:bg-slate-800"><Icon name="x" className="w-4 h-4 text-slate-400" /></button>
            </div>

            <div className="p-5 space-y-5">
              {/* ⑥ 여정 스텝퍼 7단계 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs uppercase tracking-wider text-slate-400">⑥ 프로젝트 여정</h4>
                  <StatusBadge status={detail.status} />
                </div>
                <div className="flex items-center">
                  {window.JOURNEY_STEPS.map((s, i) => {
                    const curStep = window.PROJECT_STATUS_META[detail.status].step;
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
              </div>

              {/* fallback 배너 */}
              {detail.fallback && (
                <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-xs">
                  <div className="flex items-center gap-2 text-cyan-200 font-medium mb-1"><Icon name="alert" className="w-3.5 h-3.5" />CP 최적화 자동대체 발생</div>
                  <div className="text-slate-400 leading-relaxed">최적(CP-SAT) 모드로 실행했으나 <span className="text-cyan-300 font-mono">10.0초 시간초과</span> → 근사 최선해(FFD)로 자동 대체 후 확정. <span className="text-slate-500">제약 위반 없음.</span></div>
                </div>
              )}

              {/* CP 결과 요약 */}
              {detail.cp ? (
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-slate-400 mb-2">절단계획 결과 <span className="font-mono text-slate-500 normal-case">{detail.cp.cpNo}</span></h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-700/60">
                      <div className="text-[11px] text-slate-500">수율</div>
                      <div className="text-xl font-bold tabular-nums" style={{ color: yieldHex(detail.yieldRate) }}>{detail.yieldRate}%</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-700/60">
                      <div className="text-[11px] text-slate-500">해 유형</div>
                      <div className="mt-1"><SolutionBadge type={detail.solutionType} /></div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-700/60">
                      <div className="text-[11px] text-slate-500">발주 매수 · 할증률</div>
                      <div className="text-xl font-bold tabular-nums text-slate-100">{detail.cp.plateCount}매 <span className="text-sm text-slate-400">· V {detail.markup}</span></div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-700/60">
                      <div className="text-[11px] text-slate-500">초과 발주(잉여)</div>
                      <div className="text-sm font-semibold tabular-nums text-slate-200">{fmt(detail.cp.overWeightKg)}kg</div>
                      <div className="text-[11px] text-amber-300">{man(detail.cp.overCostKRW)}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 p-3 rounded-lg bg-slate-900 border border-slate-800">아직 절단계획이 수립되지 않았습니다 (상태 {window.PROJECT_STATUS_META[detail.status].label}).</div>
              )}

              {/* 손익 (C-RBAC) */}
              {detail.finance && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs uppercase tracking-wider text-slate-400">손익 (BS1106)</h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700/60">FINANCE·CEO</span>
                  </div>
                  {canFinance ? (
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between py-1.5 border-b border-slate-800"><span className="text-slate-500">매출</span><span className="tabular-nums text-slate-200">{won(detail.finance.revenue)}</span></div>
                      <div className="flex justify-between py-1.5 border-b border-slate-800"><span className="text-slate-500">원자재비</span><span className="tabular-nums text-slate-300">{won(detail.finance.rawMaterialCost)}</span></div>
                      <div className="flex justify-between py-1.5 border-b border-slate-800"><span className="text-slate-500">제조원가 + 간접비</span><span className="tabular-nums text-slate-300">{won(detail.finance.manufacturingCost + detail.finance.overheadCost)}</span></div>
                      <div className="flex justify-between py-2">
                        <span className="text-slate-300 font-medium">최종 손익 <TrustBadge kind="자동계산" show={tweaks.showTrustBadges} /></span>
                        <span className={`tabular-nums font-bold ${profitColor(detail.finance.finalProfit)}`}>
                          {detail.finance.finalProfit < 0 ? '▽ (' + won(Math.abs(detail.finance.finalProfit)) + ')' : '▲ ' + won(detail.finance.finalProfit)} · {detail.finance.profitRate}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center"><Masked visible={false} need="FINANCE·CEO">x</Masked></div>
                  )}
                </div>
              )}

              {/* 미수금 / 환리스크 (외화 프로젝트) */}
              {detail.receivable && detail.receivable.foreign > 0 && canFinance && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-xs">
                  <div className="flex items-center gap-1.5 text-rose-200 font-medium mb-1.5"><Icon name="globe" className="w-3.5 h-3.5" />⑨ 환리스크 (BS1104)</div>
                  <div className="flex justify-between text-slate-400"><span>미수 외화</span><span className="tabular-nums text-slate-200">{detail.receivable.sym}{fmt(detail.receivable.foreign)}</span></div>
                  <div className="flex justify-between text-slate-400 mt-1"><span>원화환산 (exposure)</span><span className="tabular-nums text-slate-200">{won(detail.receivable.exposureKRW)}</span></div>
                  <div className="flex justify-between text-rose-300 mt-1"><span>−2% 시 손실</span><span className="tabular-nums font-semibold">{won(detail.receivable.fxRiskKRW)} ⚠</span></div>
                </div>
              )}

              {/* C5 감사 로그 */}
              <div>
                <h4 className="text-xs uppercase tracking-wider text-slate-400 mb-2">C5 · 감사추적</h4>
                <div className="space-y-1.5 text-[11px] font-mono text-slate-500">
                  {detail.audit.map((a, i) => (
                    <div key={i} className="leading-relaxed">
                      <span className="text-slate-400">{a.t}</span> · <span className="text-slate-300">{a.who}</span> · <span className="text-indigo-300">{a.act}</span>
                      <div className="text-slate-600 pl-1">{a.detail}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-1 text-[10px] text-slate-600">Esc 키로 닫기</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.History = History;
