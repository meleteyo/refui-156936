// components.jsx — EDEN OS proto 공용 UI (전역 export)
// 중립 프리미티브(fmt/pad/Card/SectionLabel/Sparkline/Icon)는 스킬 템플릿과 동일,
// 도메인 배지(신뢰 표기 C1~C6 · ProjectStatus · SolutionType)만 EDEN OS로 교체.
const { useState, useEffect, useMemo, useRef } = React;

// ── 숫자·통화 포맷 ────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('ko-KR').format(n);
const pad = (n) => String(n).padStart(2, '0');
const won = (n) => '₩' + fmt(Math.round(n));
const man = (n) => {                                    // 원 → "약 N만원"
  const m = Math.round(n / 10000);
  return '약 ' + fmt(m) + '만원';
};
const millionKRW = (m) => '₩' + fmt(m) + 'M';           // 백만원 단위 값

// ── Card (솔리드 다크) ────────────────────────────────────────
const Card = ({ children, className = "", ...rest }) => (
  <div className={`rounded-xl bg-slate-900 border border-slate-700/60 ${className}`} {...rest}>
    {children}
  </div>
);

// ── SectionLabel ─────────────────────────────────────────────
const SectionLabel = ({ children, color = "indigo" }) => {
  const map = {
    indigo: "text-indigo-400", emerald: "text-emerald-400", cyan: "text-cyan-400",
    teal: "text-teal-400", amber: "text-amber-400", rose: "text-rose-400", violet: "text-violet-400",
  };
  return <div className={`text-[11px] font-mono uppercase tracking-wider ${map[color] || map.indigo}`}>{children}</div>;
};

// ── Sparkline (SVG only) ─────────────────────────────────────
const Sparkline = ({ data, color = "#6366f1", height = 32 }) => {
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 100}`).join(' ');
  const fillPoints = `0,100 ${points} 100,100`;
  const gid = `spk-${color.replace('#', '')}`;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill={`url(#${gid})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

// ── Icon (inline SVG, currentColor) ──────────────────────────
const Icon = ({ name, className = "w-4 h-4" }) => {
  const paths = {
    home: <path d="M3 12L12 4l9 8M5 10v10h14V10" />,
    chart: <><path d="M3 3v18h18" /><path d="M7 14l4-4 4 4 5-5" /></>,
    scissors: <><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" /></>,
    layers: <><path d="M12 2l9 5-9 5-9-5 9-5z" /><path d="M3 12l9 5 9-5M3 17l9 5 9-5" /></>,
    doc: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h6" /></>,
    factory: <><path d="M2 20h20V9l-6 4V9l-6 4V4H4l-2 16z" /><path d="M7 20v-4M12 20v-4M17 20v-4" /></>,
    ship: <><path d="M3 15l1.5-5h15L21 15M12 3v7M5 10V6h14v4" /><path d="M3 15c1.5 2 3 2 4.5 0S10.5 13 12 15s3 2 4.5 0S19.5 13 21 15" /></>,
    coins: <><ellipse cx="9" cy="7" rx="6" ry="3" /><path d="M3 7v5c0 1.7 2.7 3 6 3M15 11.5c3.3.4 6 1.7 6 3.5 0 1.7-2.7 3-6 3s-6-1.3-6-3" /><path d="M3 12c0 1.7 2.7 3 6 3" /></>,
    trend: <><path d="M3 17l6-6 4 4 8-8" /><path d="M17 7h4v4" /></>,
    gauge: <><path d="M12 14l4-4" /><path d="M4 20a8 8 0 1 1 16 0" /><circle cx="12" cy="14" r="1" /></>,
    lock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
    unlock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 7.5-2" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
    check: <path d="M5 12l5 5L20 7" />,
    x: <path d="M18 6L6 18M6 6l12 12" />,
    chevronRight: <path d="M9 18l6-6-6-6" />,
    chevronLeft: <path d="M15 18l-6-6 6-6" />,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></>,
    refresh: <><path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-6.7-3L3 16" /><path d="M3 21v-5h5" /><path d="M3 12a9 9 0 0 1 9-9 9 9 0 0 1 6.7 3L21 8" /><path d="M21 3v5h-5" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
    alert: <><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0z" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a7 7 0 0 1 14 0v1" /></>,
    play: <path d="M5 3v18l15-9z" />,
    plus: <path d="M12 5v14M5 12h14" />,
    arrowRight: <><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></>,
    filter: <path d="M22 3H2l8 9.5V19l4 2v-8.5z" />,
    db: <><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14a9 3 0 0 0 18 0V5" /><path d="M3 12a9 3 0 0 0 18 0" /></>,
    sparkles: <><path d="M12 3l1.9 5.8L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-2.2z" /><path d="M5 3v4M19 17v4M3 5h4M17 19h4" /></>,
    shieldCheck: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></>,
    fx: <><path d="M4 7h9M4 7l3-3M4 7l3 3" /><path d="M20 17h-9M20 17l-3-3M20 17l-3 3" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>,
  };
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths[name] || null}
    </svg>
  );
};

// ── ProjectStatus 뱃지 (7단계 의미색) ─────────────────────────
const StatusBadge = ({ status, size = "sm" }) => {
  const map = {
    DRAFT:           { label: "생성",     c: "bg-slate-500/15 text-slate-300 border-slate-500/30",     dot: "bg-slate-400" },
    QUOTED:          { label: "견적",     c: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",  dot: "bg-indigo-400" },
    CUTTING_PLANNED: { label: "절단계획", c: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",        dot: "bg-cyan-400" },
    ORDER_CONFIRMED: { label: "수주확정", c: "bg-sky-500/15 text-sky-300 border-sky-500/30",           dot: "bg-sky-400" },
    IN_PRODUCTION:   { label: "생산중",   c: "bg-amber-500/15 text-amber-300 border-amber-500/30",     dot: "bg-amber-400" },
    SHIPPED:         { label: "출하완료", c: "bg-violet-500/15 text-violet-300 border-violet-500/30",  dot: "bg-violet-400" },
    SETTLED:         { label: "정산완료", c: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400" },
  };
  const m = map[status] || map.DRAFT;
  const px = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border ${m.c} ${px} font-medium whitespace-nowrap`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`}></span>{m.label}
    </span>
  );
};

// ── 해 유형 뱃지 [최적]/[근사] (골드/실버) ────────────────────
const SolutionBadge = ({ type }) => {
  const optimal = type === "최적";
  const c = optimal
    ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
    : "bg-cyan-500/15 text-cyan-300 border-cyan-500/40";
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border ${c} px-2 py-0.5 text-xs font-semibold`}>
      {optimal ? "◆ 최적" : "◈ 근사"}
    </span>
  );
};

// ── 신뢰 표기 배지 (C1) — [자동계산]/[시스템·엑셀·수기]/[확정·검토대기·잠금] ──
const TrustBadge = ({ kind, show = true }) => {
  if (!show) return null;
  const map = {
    자동계산: "bg-indigo-500/10 text-indigo-300 border-indigo-500/25",
    시스템:   "bg-slate-500/10 text-slate-300 border-slate-500/25",
    엑셀:     "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
    수기:     "bg-amber-500/10 text-amber-300 border-amber-500/25",
    확정:     "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
    검토대기: "bg-slate-500/10 text-slate-400 border-slate-500/25",
    잠금:     "bg-slate-600/15 text-slate-300 border-slate-500/30",
    기준값없음: "bg-amber-500/10 text-amber-300 border-amber-500/25",
  };
  const lockIcon = kind === "잠금" ? "🔒 " : "";
  return (
    <span className={`inline-flex items-center rounded border ${map[kind] || map.시스템} px-1.5 py-0.5 text-[10px] font-medium font-mono`}>
      {lockIcon}[{kind}]
    </span>
  );
};

// ── RBAC 마스킹 값 (C-RBAC) ──────────────────────────────────
//   visible=false → ●●●● [권한없음]. [자동계산] 배지는 유지(존재 인지).
const Masked = ({ visible, children, need = "CEO·FINANCE" }) => {
  if (visible) return children;
  return (
    <span className="inline-flex items-center gap-1 text-slate-500" title={`${need} 권한 필요`}>
      <span className="font-mono tracking-widest">●●●●●●</span>
      <span className="text-[10px] text-slate-600">[권한없음]</span>
      <Icon name="info" className="w-3 h-3 text-slate-600" />
    </span>
  );
};

// ── 수율 의미색 (<90 빨강 / 90~95 주황 / ≥95 초록) ────────────
const yieldColor = (r) => (r == null ? "slate" : r >= 95 ? "emerald" : r >= 90 ? "amber" : "rose");
const yieldHex = (r) => (r == null ? "#64748b" : r >= 95 ? "#10b981" : r >= 90 ? "#f59e0b" : "#f43f5e");

// ── 손익 색 (흑자 초록 / 적자 빨강) ──────────────────────────
const profitColor = (n) => (n == null ? "text-slate-400" : n >= 0 ? "text-emerald-300" : "text-rose-300");

// ── ⓘ InfoTip — C1 계산 근거 hover 팝오버 (무상태 공용, 입력→식→결과) ──
const InfoTip = ({ title, lines, className = "" }) => (
  <span className={`relative inline-flex group align-middle ${className}`}>
    <span className="w-4 h-4 rounded-full bg-slate-800 border border-slate-600 text-slate-300 text-[10px] flex items-center justify-center cursor-help select-none">ⓘ</span>
    <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-5 z-40 hidden group-hover:block w-72 p-3 rounded-lg bg-slate-900 border border-slate-600 shadow-xl text-left normal-case tracking-normal">
      <span className="block text-[11px] font-semibold text-slate-200 mb-1">{title}</span>
      {lines.map((l, i) => (
        <span key={i} className="block text-[11px] text-slate-400 leading-relaxed tabular-nums">{l}</span>
      ))}
    </span>
  </span>
);

Object.assign(window, {
  fmt, pad, won, man, millionKRW,
  Card, SectionLabel, Sparkline, Icon,
  StatusBadge, SolutionBadge, TrustBadge, Masked,
  yieldColor, yieldHex, profitColor, InfoTip,
});
