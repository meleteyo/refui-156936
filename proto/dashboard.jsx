// dashboard.jsx — 경영 대시보드 (대표이사 전사 뷰, 모델 41)
// ⑧ CEO Pipeline Board · ⑨ FX Risk Radar · 목표 대비 실적 · C4 예상 vs 실제 · C-RBAC
const { useState: useState_d } = React;

function Dashboard({ tweaks, navigate }) {
  const [period, setPeriod] = useState_d("당월");
  const { fmt, won, millionKRW, Card, SectionLabel, Sparkline, Icon, StatusBadge, TrustBadge, Masked } = window;
  const canFinance = window.FINANCE_ROLES.includes(tweaks.role);
  const showBadge = tweaks.showTrustBadges;

  // 파이프라인 건수 = PROJECTS 상태별 GROUP BY
  const countByStatus = window.PROJECTS.reduce((a, p) => { a[p.status] = (a[p.status] || 0) + 1; return a; }, {});
  const funnel = window.PIPELINE_FUNNEL;

  return (
    <div className="space-y-5">
      {/* 전역 상단바 (전사 뷰 · 프로젝트 비종속) */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <SectionLabel color="indigo">DASHBOARD · 전사 경영 뷰 (대표이사)</SectionLabel>
          <h1 className="text-3xl font-bold mt-1.5 tracking-tight text-slate-50">경영 대시보드</h1>
          <p className="text-sm text-slate-400 mt-1">
            수주 파이프라인 · 목표 대비 실적 · 환리스크를 한 화면에서 · <span className="text-slate-500">문제 115 해소</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs p-0.5 rounded-lg bg-slate-800/70 border border-slate-700/60">
            {["당월", "분기", "연간"].map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 rounded ${period === p ? 'bg-indigo-500/25 text-indigo-200' : 'text-slate-400 hover:text-slate-200'}`}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* 환율 스냅샷 위젯 + 데이터 최신성 (C1) */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Icon name="fx" className="w-4 h-4 text-cyan-400" />환율 스냅샷
              <TrustBadge kind="시스템" show={showBadge} />
              <TrustBadge kind="확정" show={showBadge} />
            </div>
            {[["JPY(100)", 902.15, "▲"], ["USD", 1342.5, "▼"], ["AUD", 890.3, "▲"]].map(([c, r, d]) => (
              <div key={c} className="flex items-center gap-1.5 tabular-nums">
                <span className="text-slate-500 text-xs">{c}</span>
                <span className="font-mono text-slate-200">{fmt(r)}</span>
                <span className={d === "▲" ? "text-emerald-400 text-xs" : "text-rose-400 text-xs"}>{d}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>집계 {window.FX_SNAPSHOT.baseDate} 15:40 <TrustBadge kind="자동계산" show={showBadge} /></span>
            <span className="flex items-center gap-1 text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>실시간</span>
          </div>
        </div>
      </Card>

      {/* KPI 카드 4개 (수주/생산/자금/손익) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {window.KPIS.map((k) => {
          const emphasize = k.accent === "rose";
          const emph = k.accent === "rose" ? "!bg-rose-950 !border-rose-700"
                     : k.accent === "amber" ? "!bg-amber-950 !border-amber-700" : "";
          const labelC = k.accent === "rose" ? "text-rose-200" : k.accent === "amber" ? "text-amber-200" : "text-slate-400";
          const valueC = k.accent === "rose" ? "text-rose-50" : k.accent === "amber" ? "text-amber-50" : "text-slate-50";
          const masked = k.rbac && !canFinance;
          return (
            <Card key={k.key} className={`p-5 ${emph}`}>
              <div className="flex items-start justify-between">
                <div className={`text-xs ${labelC}`}>{k.label}</div>
                <div className="p-1.5 rounded-md bg-slate-800/60" style={{ color: k.color }}><Icon name={k.icon} className="w-4 h-4" /></div>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                {masked ? (
                  <div className="text-2xl"><Masked visible={false} need="CEO·FINANCE">x</Masked></div>
                ) : (
                  <>
                    <div className={`text-3xl font-bold tabular-nums ${valueC}`}>{fmt(k.value)}</div>
                    <div className="text-sm text-slate-500">{k.unit}</div>
                  </>
                )}
              </div>
              <div className="mt-2"><Sparkline data={k.trend} color={k.color} height={28} /></div>
              <div className="mt-1.5 flex items-center gap-1 text-[11px]">
                <span className={k.delta >= 0 ? "text-emerald-400" : "text-rose-400"}>{k.delta >= 0 ? "▲" : "▼"} {Math.abs(k.delta)}%</span>
                <span className="text-slate-500">전월 대비</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ⑧ CEO Pipeline Board */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-base flex items-center gap-2"><Icon name="layers" className="w-4 h-4 text-indigo-400" />⑧ 수주 파이프라인</h3>
            <div className="text-xs text-slate-500 mt-0.5">카드 클릭 = 상태별 프로젝트 이력 드릴다운 · 윈도우함수 집계</div>
          </div>
          <div className="text-[11px] text-slate-500">전환율 견적→수주 <span className="text-slate-300 font-mono">{funnel.quoteToOrder}%</span> · 수주→출하 <span className="text-slate-300 font-mono">{funnel.orderToShip}%</span> · 리드타임 <span className="text-slate-300 font-mono">{funnel.avgLeadTimeDays}일</span></div>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {window.PIPELINE.map((s, i) => {
            const cnt = countByStatus[s.key] || 0;
            return (
              <button key={s.key} onClick={() => navigate('history', { status: s.key })}
                className="text-left p-3 rounded-lg bg-slate-800/50 border border-slate-700/60 hover:border-indigo-500/40 hover:bg-slate-800 transition group relative">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">{s.label}</div>
                  <Icon name="chevronRight" className="w-3 h-3 text-slate-600 group-hover:text-indigo-400" />
                </div>
                <div className="mt-1.5 text-2xl font-bold tabular-nums text-slate-100">{cnt}<span className="text-xs text-slate-500 ml-0.5">건</span></div>
                <div className="text-[11px] text-slate-500 tabular-nums mt-0.5">{millionKRW(s.amountM)}</div>
                {s.alert && (
                  <div className={`mt-2 text-[10px] px-1.5 py-0.5 rounded inline-flex items-center gap-1 ${s.alert.kind === 'warn' ? 'bg-amber-500/15 text-amber-300' : 'bg-cyan-500/15 text-cyan-300'}`}>
                    <span>{s.alert.kind === 'warn' ? '⚠' : '●'}</span>{s.alert.text}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {/* 퍼널 진행 막대 */}
        <div className="mt-4 flex items-center gap-1">
          {window.PIPELINE.map((s, i) => {
            const cnt = countByStatus[s.key] || 0;
            const maxCnt = Math.max(...window.PIPELINE.map(x => countByStatus[x.key] || 0)) || 1;
            return (
              <div key={s.key} className="flex-1">
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-teal-400" style={{ width: `${(cnt / maxCnt) * 100}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ⑨ FX Risk Radar + 목표 대비 실적 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ⑨ FX Risk Radar (CEO·FINANCE 전용) */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-base flex items-center gap-2"><Icon name="globe" className="w-4 h-4 text-cyan-400" />⑨ 환리스크 레이더</h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">CEO · FINANCE 전용</span>
          </div>
          {canFinance ? (
            <div className="space-y-2.5">
              {window.FX_RADAR.map((f) => (
                <div key={f.currency} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/50">
                  <div className="w-12 text-sm font-semibold text-slate-200">{f.currency}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-400 tabular-nums">미수 {f.sym}{fmt(f.foreign)}</div>
                    <div className="text-sm font-semibold tabular-nums text-slate-100">{won(f.exposureKRW)}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs tabular-nums ${f.fxDeltaPct < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{f.fxDeltaPct < 0 ? '▼' : '▲'} {Math.abs(f.fxDeltaPct)}%</div>
                    <div className="text-[11px] text-rose-300 tabular-nums flex items-center gap-1 justify-end">
                      −2% 시 {won(f.fxRiskKRW)} {f.currency === 'JPY' && <span title="위험">⚠</span>}
                    </div>
                  </div>
                  {f.stale && showBadge && <TrustBadge kind="기준값없음" show={true} />}
                </div>
              ))}
              <div className="mt-1 p-3 rounded-lg bg-rose-950/50 border border-rose-800/40 text-xs text-rose-200">
                서사: 미수 <span className="tabular-nums">¥88,500,000 = {won(798402750)}</span>, 환율 −2% 시 <span className="tabular-nums font-semibold">{won(15968055)}</span> 손실 위험 ⚠ <span className="text-rose-300/70">(BS1104 · 704 스냅샷)</span>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center">
              <Masked visible={false} need="CEO·FINANCE">x</Masked>
              <div className="text-xs text-slate-500 mt-3">환리스크·손익 지표는 CEO·FINANCE 권한만 열람합니다.<br />Tweaks에서 부서를 <span className="text-slate-300">자금/대표</span>로 바꿔보세요.</div>
            </div>
          )}
        </Card>

        {/* 목표 대비 실적 */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-base flex items-center gap-2"><Icon name="trend" className="w-4 h-4 text-indigo-400" />목표 대비 실적 <span className="text-xs text-slate-500 font-normal">({period}·전사)</span></h3>
          </div>
          <div className="space-y-3">
            {window.TARGETS.map((t) => {
              const rate = +(t.actual / t.target * 100).toFixed(1);
              const masked = t.rbac && !canFinance;
              const alertC = t.status === "정상" ? "text-emerald-400" : t.status === "주의" ? "text-amber-400" : "text-rose-400";
              const alertDot = t.status === "정상" ? "🟢" : t.status === "주의" ? "🟠" : "🔴";
              return (
                <div key={t.metric}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-300">{t.metric}</span>
                    <span className="flex items-center gap-2 text-xs">
                      {masked ? <Masked visible={false} need="CEO·FINANCE">x</Masked> : (
                        <>
                          <span className="text-slate-500 tabular-nums">목표 {fmt(t.target)}{t.unit}</span>
                          <span className="text-slate-200 tabular-nums font-medium">실적 {fmt(t.actual)}{t.unit}</span>
                        </>
                      )}
                      <span className={alertC}>{alertDot}</span>
                    </span>
                  </div>
                  {!masked && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className={`h-full rounded-full ${t.status === '위험' ? 'bg-rose-500' : t.status === '주의' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, rate)}%` }}></div>
                      </div>
                      <span className={`text-xs tabular-nums w-24 text-right ${alertC}`}>{rate}% {t.trend === 'up' ? '▲' : '▼'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* C4 예상 vs 실제 편차 (전사 롤업) */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-base">C4 · 예상 vs 실제 편차 <span className="text-xs text-slate-500 font-normal">(전사 롤업)</span></h3>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">CEO · FINANCE 전용</span>
        </div>
        {canFinance ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-700/50">
                  <th className="py-2 font-medium">항목</th>
                  <th className="py-2 font-medium text-right">예상 (견적 12)</th>
                  <th className="py-2 font-medium text-right">실제 (손익 20)</th>
                  <th className="py-2 font-medium text-right">차이</th>
                  <th className="py-2 font-medium w-40">기여</th>
                </tr>
              </thead>
              <tbody>
                {window.VARIANCE.map((v) => {
                  const diff = v.expected - v.actual;
                  const up = v.actual > v.expected;
                  return (
                    <tr key={v.item} className={`border-b border-slate-800 ${v.isProfit ? 'font-semibold' : ''}`}>
                      <td className="py-2.5 text-slate-300">{v.item} {v.isProfit && <span className="text-[10px] text-slate-500">(BS1106)</span>}</td>
                      <td className="py-2.5 text-right tabular-nums text-slate-400">{won(v.expected)}</td>
                      <td className="py-2.5 text-right tabular-nums text-slate-200">{won(v.actual)}</td>
                      <td className={`py-2.5 text-right tabular-nums ${up ? 'text-sky-400' : 'text-rose-400'}`}>{up ? '▲' : '▼'} {won(Math.abs(diff))}</td>
                      <td className="py-2.5">
                        {v.contribPct != null ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${v.contribPct}%` }}></div>
                            </div>
                            <span className="text-[11px] text-slate-500 tabular-nums w-8">{v.contribPct}%</span>
                          </div>
                        ) : <span className="text-[11px] text-rose-400">손익률 ↓</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center"><Masked visible={false} need="CEO·FINANCE">x</Masked></div>
        )}
      </Card>
    </div>
  );
}

window.Dashboard = Dashboard;
