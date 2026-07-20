/* pt/slides.js — 슬라이드 렌더링 + 키보드 네비게이션
 * - 좌/우/스페이스: 이동 (좌클릭=다음 · 우클릭=이전)
 * - N: 발표자 노트 토글
 * - Esc: 개요 그리드 토글
 * - URL hash sync (#1 ~ #6)
 */
(function () {
  "use strict";

  const SLIDES = window.SLIDES || [];
  const PROTO_SCREENS = window.PROTO_SCREENS || [];
  const SYSTEM_FLOW = window.SYSTEM_FLOW || [];
  const MILESTONES = window.MILESTONES || [];

  /* ── Mini SVG previews for 8 proto screens (EDEN OS) ─────── */
  function svgPreview(id) {
    // Lightweight layout-structure placeholders; replace with PNG screenshots later.
    const map = {
      // 프로젝트·수주 — 여정 스텝퍼(Journey Spine)
      "project":    '<svg viewBox="0 0 120 38"><line x1="12" y1="13" x2="108" y2="13" stroke="rgba(255,255,255,0.15)" stroke-width="1"/><circle cx="12" cy="13" r="4" fill="rgba(110,231,183,0.75)"/><circle cx="36" cy="13" r="4" fill="rgba(110,231,183,0.75)"/><circle cx="60" cy="13" r="4.5" fill="rgba(168,85,247,0.85)"/><circle cx="84" cy="13" r="4" fill="rgba(255,255,255,0.2)"/><circle cx="108" cy="13" r="4" fill="rgba(255,255,255,0.2)"/><rect x="8" y="26" width="104" height="6" rx="1" fill="rgba(255,255,255,0.05)"/><rect x="8" y="26" width="52" height="6" rx="1" fill="rgba(168,85,247,0.35)"/></svg>',
      // 견적·손익 — 원가 행 + 이익 막대 + 도넛(원가 구성)
      "quote":      '<svg viewBox="0 0 120 38"><rect x="3" y="4" width="66" height="3" rx="0.5" fill="rgba(255,255,255,0.1)"/><rect x="3" y="11" width="66" height="3" rx="0.5" fill="rgba(255,255,255,0.08)"/><rect x="3" y="18" width="66" height="3" rx="0.5" fill="rgba(255,255,255,0.08)"/><rect x="3" y="27" width="48" height="5" rx="1" fill="rgba(110,231,183,0.55)"/><circle cx="98" cy="18" r="12" fill="none" stroke="rgba(129,140,248,0.45)" stroke-width="4"/><circle cx="98" cy="18" r="12" fill="none" stroke="rgba(110,231,183,0.7)" stroke-width="4" stroke-dasharray="28 100"/></svg>',
      // BH Cutting Plan — NestView 절단배열(FLANGE 인디고·WEB 틸·잔재 회색해치)
      "cp":         '<svg viewBox="0 0 120 38"><rect x="3" y="7" width="114" height="9" rx="1" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)"/><rect x="4" y="8" width="34" height="7" fill="rgba(129,140,248,0.75)"/><rect x="39" y="8" width="26" height="7" fill="rgba(45,212,191,0.75)"/><rect x="66" y="8" width="30" height="7" fill="rgba(129,140,248,0.55)"/><rect x="97" y="8" width="19" height="7" fill="rgba(148,163,184,0.35)"/><rect x="3" y="22" width="114" height="9" rx="1" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)"/><rect x="4" y="23" width="44" height="7" fill="rgba(45,212,191,0.7)"/><rect x="49" y="23" width="40" height="7" fill="rgba(129,140,248,0.6)"/><rect x="90" y="23" width="26" height="7" fill="rgba(148,163,184,0.3)"/></svg>',
      // 생산·품질 — 작업지시 칸반 4열
      "production": '<svg viewBox="0 0 120 38"><rect x="3" y="4" width="26" height="30" rx="1" fill="rgba(255,255,255,0.05)"/><rect x="6" y="7" width="20" height="6" rx="1" fill="rgba(252,211,77,0.4)"/><rect x="6" y="15" width="20" height="6" rx="1" fill="rgba(252,211,77,0.25)"/><rect x="33" y="4" width="26" height="30" rx="1" fill="rgba(255,255,255,0.05)"/><rect x="36" y="7" width="20" height="6" rx="1" fill="rgba(129,140,248,0.4)"/><rect x="63" y="4" width="26" height="30" rx="1" fill="rgba(255,255,255,0.05)"/><rect x="66" y="7" width="20" height="6" rx="1" fill="rgba(129,140,248,0.3)"/><rect x="93" y="4" width="24" height="30" rx="1" fill="rgba(255,255,255,0.05)"/><rect x="96" y="7" width="18" height="6" rx="1" fill="rgba(110,231,183,0.55)"/></svg>',
      // 출하·자금 — 출하 캘린더 + 수금/미수 막대
      "shipping":   '<svg viewBox="0 0 120 38"><rect x="3" y="5" width="50" height="28" rx="1" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)"/><line x1="3" y1="12" x2="53" y2="12" stroke="rgba(255,255,255,0.1)"/><rect x="7" y="16" width="6" height="5" fill="rgba(129,140,248,0.4)"/><rect x="16" y="16" width="6" height="5" fill="rgba(255,255,255,0.08)"/><rect x="25" y="16" width="6" height="5" fill="rgba(110,231,183,0.5)"/><rect x="34" y="16" width="6" height="5" fill="rgba(255,255,255,0.08)"/><rect x="7" y="24" width="6" height="5" fill="rgba(255,255,255,0.08)"/><rect x="16" y="24" width="6" height="5" fill="rgba(252,211,77,0.4)"/><rect x="62" y="24" width="8" height="9" fill="rgba(110,231,183,0.6)"/><rect x="74" y="17" width="8" height="16" fill="rgba(110,231,183,0.65)"/><rect x="86" y="11" width="8" height="22" fill="rgba(110,231,183,0.75)"/><rect x="98" y="20" width="8" height="13" fill="rgba(244,114,182,0.5)"/></svg>',
      // 유통 — 매입 ↔ 매출 매칭 카드 + 이익
      "trading":    '<svg viewBox="0 0 120 38"><rect x="4" y="10" width="40" height="18" rx="2" fill="rgba(129,140,248,0.18)" stroke="rgba(129,140,248,0.4)"/><path d="M48 19 L60 19 M56 15 L60 19 L56 23" stroke="rgba(255,255,255,0.45)" stroke-width="1.2" fill="none"/><rect x="64" y="10" width="40" height="18" rx="2" fill="rgba(110,231,183,0.18)" stroke="rgba(110,231,183,0.4)"/><rect x="108" y="13" width="8" height="12" rx="1" fill="rgba(110,231,183,0.6)"/></svg>',
      // 경영 대시보드 — KPI 카드 + 추세선
      "dashboard":  '<svg viewBox="0 0 120 38"><rect x="3" y="3" width="26" height="14" rx="1" fill="rgba(168,85,247,0.18)"/><rect x="33" y="3" width="26" height="14" rx="1" fill="rgba(110,231,183,0.18)"/><rect x="63" y="3" width="26" height="14" rx="1" fill="rgba(252,211,77,0.18)"/><rect x="93" y="3" width="24" height="14" rx="1" fill="rgba(244,114,182,0.18)"/><polyline points="3,30 20,24 40,28 60,20 80,26 100,18 117,22" fill="none" stroke="rgba(110,231,183,0.7)" stroke-width="1.5"/></svg>',
      // 로그인·공통 마스터 — 계정 테이블 + 권한 토글
      "master":     '<svg viewBox="0 0 120 38"><rect x="3" y="4" width="114" height="6" rx="1" fill="rgba(168,85,247,0.2)"/><rect x="3" y="13" width="58" height="4" fill="rgba(255,255,255,0.1)"/><rect x="90" y="12" width="14" height="5" rx="2.5" fill="rgba(110,231,183,0.55)"/><rect x="3" y="21" width="58" height="4" fill="rgba(255,255,255,0.08)"/><rect x="90" y="20" width="14" height="5" rx="2.5" fill="rgba(148,163,184,0.4)"/><rect x="3" y="29" width="58" height="4" fill="rgba(255,255,255,0.08)"/><rect x="90" y="28" width="14" height="5" rx="2.5" fill="rgba(110,231,183,0.55)"/></svg>',
    };
    return map[id] || '<svg viewBox="0 0 120 38"><rect x="0" y="0" width="120" height="38" fill="rgba(255,255,255,0.04)"/></svg>';
  }

  /* ── Slide renderers ─────────────────────────────────── */
  function renderCover(s) {
    return `
      <div class="slide-cover">
        <div class="badge">
          <span class="pulse"></span>
          위시켓 #156936 · 사전 분석 완료
        </div>
        <h1>
          ${escapeHtml(s.title)}<br/>
          <span class="grad-text">${escapeHtml(s.subtitle)}</span>
        </h1>
        <div class="meta">이든철강 전용 · 6,000만원 · 150일 · CP 선검증(PoC) 전략</div>
      </div>
    `;
  }

  function renderWho(s) {
    return `
      <div class="slide-chapter-label">
        ${escapeHtml(s.chapter)}
        <span class="duration">${escapeHtml(s.duration)}</span>
      </div>
      <h2 class="slide-title">${escapeHtml(s.title)}</h2>
      <p class="slide-subtitle">22년 엔터프라이즈 백엔드 · DDD/Hexagonal 설계 · 최근 Python·AI 통합 — 업무 시스템 32건 완수</p>

      <div class="career-timeline">
        <div class="career-block si">
          <div class="span">2003 — 현재</div>
          <div class="label">엔터프라이즈 백엔드 · 22년</div>
          <div class="desc">금융·공공·제조 업무 시스템 설계·구축 (산업은행 EKP·ERP·관리시스템 등 32건)</div>
        </div>
        <div class="career-block sm">
          <div class="span">설계 방법론</div>
          <div class="label">DDD · Hexagonal · MSA</div>
          <div class="desc">도메인 모델링·레이어 분리 → 본 프로젝트 RSM 컬레보레이션·순수 도메인 설계에 직접 전이</div>
        </div>
        <div class="career-block remote">
          <div class="span">최근</div>
          <div class="label">Python · AI 통합</div>
          <div class="desc">FastAPI·RAG(판례 8만건)·AI 래피드 프로토타이핑 — 1주 내 동작 화면으로 스펙 조기 수렴</div>
        </div>
      </div>

      <div class="highlight-box">
        <div class="label">정직하게 — 갭 고지</div>
        <div class="text">철강 CP·네스팅·생산계획 도메인 경험은 없습니다</div>
        <div class="sub">그래서 말이 아니라 <strong>1주 내 동작하는 PoC</strong>로 증명합니다 — 대표 프로젝트 엑셀 1건 → FLANGE/WEB 전개 → FFD 1D 커팅스톡으로 발주사 수율을 오차 내 재현</div>
      </div>
    `;
  }

  function renderFit(s) {
    const flow = SYSTEM_FLOW.map(f => `
      <div class="flow-card">
        <div class="step">STEP ${f.step}</div>
        <div class="icon">${f.icon}</div>
        <div class="label">${escapeHtml(f.label)}</div>
        <div class="note">${escapeHtml(f.note)}</div>
      </div>
    `).join("");

    const screens = PROTO_SCREENS.map(p => {
      const grpClass = p.group === "수주·CP" ? "member" : "admin";
      return `
        <div class="screen-card">
          <div class="head">
            <span class="grp ${grpClass}">${escapeHtml(p.group)}</span>
            <span class="uc">${escapeHtml(p.uc)}</span>
          </div>
          <div class="label">${escapeHtml(p.label)}</div>
          <div class="preview">${svgPreview(p.id)}</div>
        </div>
      `;
    }).join("");

    return `
      <div class="slide-chapter-label">
        ${escapeHtml(s.chapter)}
        <span class="duration">${escapeHtml(s.duration)}</span>
      </div>
      <h2 class="slide-title">${escapeHtml(s.title)}</h2>

      <div class="flow-row">${flow}</div>

      <div class="screens-section">
        <div class="screens-caption">
          공고 분석과 병행해 <strong>8개 핵심 화면을 클릭 가능한 프로토타입</strong>으로 미리 구현했습니다 — 수주·CP 3 + 운영·경영 5
        </div>
        <div class="screens-grid">${screens}</div>
        <div class="url-caption"><span class="arrow">↗</span>meleteyo.github.io/refui-156936/proto/</div>
      </div>
    `;
  }

  function renderHow(s) {
    const cards = MILESTONES.map(m => `
      <div class="milestone${m.highlight ? ' featured' : ''}">
        <div class="week">${escapeHtml(m.week)}</div>
        <div class="focus">${escapeHtml(m.focus)}</div>
        <ul class="items">
          ${m.items.map(i => `<li>${escapeHtml(i)}</li>`).join("")}
        </ul>
        ${m.highlight ? `<div class="pin">📌 ${escapeHtml(m.highlight)}</div>` : ""}
      </div>
    `).join("");

    return `
      <div class="slide-chapter-label">
        ${escapeHtml(s.chapter)}
        <span class="duration">${escapeHtml(s.duration)}</span>
      </div>
      <h2 class="slide-title">${escapeHtml(s.title)}</h2>
      <p class="slide-subtitle">차수 분리(1→2→3)와 주간 보고·검수로 후반 압축·품질 붕괴를 막습니다.</p>

      <div class="milestones">${cards}</div>

      <div class="comm-bar">
        <div class="item">💬 <strong>당일 응답</strong> — 전담 소통 채널</div>
        <div class="item">📅 <strong>주간 보고 + 차수별 검수</strong> — 1→2→3차</div>
        <div class="item">🔀 <strong>변경 시 비용·일정 먼저 산정</strong> — 투명 공유</div>
      </div>
    `;
  }

  function renderAsk(s) {
    return `
      <div class="slide-chapter-label">
        ${escapeHtml(s.chapter)}
        <span class="duration">${escapeHtml(s.duration)}</span>
      </div>

      <h2 class="question-headline">
        <em>BH Cutting Plan</em><br/>
        — 1D 길이 최적화인가, 2D 플레이트 네스팅인가?
      </h2>

      <div class="branches">
        <div class="branch good">
          <div class="case">CASE A · 1D 커팅스톡 + 근사해</div>
          <div class="verdict">150일 일정 그대로 가능</div>
          <div class="desc">모재 길이 기준 1D 배치 + 근사해(수 초). 계획 예산·일정 내 완수. FFD→(선택)CP-SAT 승격 경로를 INestingOptimizer 프로토콜로 확보.</div>
        </div>
        <div class="branch warn">
          <div class="case">CASE B · 2D 네스팅 / 수학적 최적</div>
          <div class="verdict">별도 알고리즘 트랙</div>
          <div class="desc">강판 2D 배치(길로틴/회전)는 NP-hard 난도 2~5배. 본 계약과 분리해 별도 견적으로 안내(+8~12주).</div>
        </div>
      </div>

      <p class="bottom-line">
        <strong>150일 일정의 최대 변수</strong> — CP 차원(1D/2D)·"최적"의 정의(목표 수율·허용시간)·엑셀 양식 구조를 첫날 확정하면 매끄럽게 진행됩니다.
      </p>
    `;
  }

  function renderThanks(s) {
    return `
      <div class="slide-cover">
        <h1 class="grad-text" style="margin-bottom: 0.5rem;">${escapeHtml(s.title)}</h1>
        <p class="slide-subtitle" style="text-align:center; margin: 0 0 1rem;">${escapeHtml(s.subtitle)}</p>
      </div>

      <div class="thanks-grid">
        <a class="url-card" href="https://meleteyo.github.io/refui-156936/" target="_blank" rel="noopener">
          <div class="ic">🌐</div>
          <div class="label">랜딩 (허브)</div>
          <div class="url">meleteyo.github.io/refui-156936/</div>
          <div class="desc">IT·일반 2벌 진입</div>
        </a>
        <a class="url-card" href="https://meleteyo.github.io/refui-156936/it.html" target="_blank" rel="noopener">
          <div class="ic">🧩</div>
          <div class="label">IT 전문가용</div>
          <div class="url">meleteyo.github.io/refui-156936/it.html</div>
          <div class="desc">아키텍처·CP·리스크·간트</div>
        </a>
        <a class="url-card" href="https://meleteyo.github.io/refui-156936/nonit.html" target="_blank" rel="noopener">
          <div class="ic">👥</div>
          <div class="label">일반 고객용</div>
          <div class="url">meleteyo.github.io/refui-156936/nonit.html</div>
          <div class="desc">쉬운 말 · 업무 흐름 중심</div>
        </a>
        <a class="url-card" href="https://meleteyo.github.io/refui-156936/proto/" target="_blank" rel="noopener">
          <div class="ic">🖥️</div>
          <div class="label">라이브 프로토타입</div>
          <div class="url">meleteyo.github.io/refui-156936/proto/</div>
          <div class="desc">8화면 클릭 · CP NestView</div>
        </a>
        <a class="url-card" href="https://meleteyo.github.io/refui-156936/demo/자동시연.html" target="_blank" rel="noopener">
          <div class="ic">▶️</div>
          <div class="label">90초 자동 시연</div>
          <div class="url">meleteyo.github.io/refui-156936/demo/자동시연.html</div>
          <div class="desc">클릭 없이 자동 재생</div>
        </a>
      </div>

      <p class="thanks-attach">
        <span class="attach-label">별첨 자료</span>
        요구사항 검토서 · 발주자 질의서 · 리스크 분석(R1~R19) · EPM/RSM 도메인 설계 · CP PoC 계획
      </p>
    `;
  }

  const RENDERERS = {
    "cover": renderCover,
    "who": renderWho,
    "fit": renderFit,
    "how": renderHow,
    "ask": renderAsk,
    "thanks": renderThanks,
  };

  /* ── Mount slides ────────────────────────────────────── */
  const deck = document.getElementById("deck");
  SLIDES.forEach((s, i) => {
    const el = document.createElement("section");
    el.className = "slide";
    el.dataset.index = String(i);
    el.dataset.id = s.id;
    const renderer = RENDERERS[s.id] || (() => `<h2 class="slide-title">${escapeHtml(s.title || "")}</h2>`);
    el.innerHTML = renderer(s);
    deck.appendChild(el);
  });

  /* ── Mount overview ──────────────────────────────────── */
  const overviewGrid = document.getElementById("overview-grid");
  SLIDES.forEach((s, i) => {
    const tile = document.createElement("div");
    tile.className = "overview-tile";
    tile.dataset.index = String(i);
    tile.innerHTML = `
      <div class="num">${String(i + 1).padStart(2, "0")} / ${String(SLIDES.length).padStart(2, "0")}</div>
      <div class="title">${escapeHtml(s.title || "")}</div>
      <div class="ch">${escapeHtml(s.chapter || "")}${s.duration ? " · " + escapeHtml(s.duration) : ""}</div>
    `;
    tile.addEventListener("click", () => {
      goTo(i);
      closeOverview();
    });
    overviewGrid.appendChild(tile);
  });

  /* ── State ───────────────────────────────────────────── */
  let current = parseHash();

  function parseHash() {
    const m = (location.hash || "").match(/^#(\d+)$/);
    if (!m) return 0;
    const n = parseInt(m[1], 10) - 1;
    return clamp(n, 0, SLIDES.length - 1);
  }

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  /* ── Navigation ──────────────────────────────────────── */
  function goTo(idx) {
    current = clamp(idx, 0, SLIDES.length - 1);
    renderState();
    location.hash = String(current + 1);
  }
  function next() { if (current < SLIDES.length - 1) goTo(current + 1); }
  function prev() { if (current > 0) goTo(current - 1); }

  function renderState() {
    // Active slide
    [...deck.children].forEach((el, i) => {
      el.classList.toggle("active", i === current);
      el.classList.toggle("prev", i < current);
    });
    // Overview tiles
    [...overviewGrid.children].forEach((el, i) => {
      el.classList.toggle("active", i === current);
    });
    // Footer
    const s = SLIDES[current];
    document.getElementById("slide-num").textContent = `${current + 1} / ${SLIDES.length}`;
    document.getElementById("slide-chapter").textContent = (s.chapter || "") + (s.duration ? " · " + s.duration : "");
    // Notes
    document.getElementById("notes-body").textContent = s.note || "";
  }

  /* ── Notes ──────────────────────────────────────────── */
  const notesEl = document.getElementById("notes");
  function toggleNotes() { notesEl.classList.toggle("open"); }

  /* ── Overview ───────────────────────────────────────── */
  const overviewEl = document.getElementById("overview");
  function openOverview() { overviewEl.classList.add("open"); }
  function closeOverview() { overviewEl.classList.remove("open"); }
  function toggleOverview() { overviewEl.classList.toggle("open"); }

  /* ── Keyboard ───────────────────────────────────────── */
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
      e.preventDefault();
      if (overviewEl.classList.contains("open")) return;
      next();
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      if (overviewEl.classList.contains("open")) return;
      prev();
    } else if (e.key === "Escape") {
      e.preventDefault();
      toggleOverview();
    } else if (e.key === "n" || e.key === "N") {
      e.preventDefault();
      toggleNotes();
    } else if (e.key === "Home") {
      goTo(0);
    } else if (e.key === "End") {
      goTo(SLIDES.length - 1);
    }
  });

  // Touch swipe (optional, simple)
  let touchStartX = 0;
  document.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  document.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) next();
    else prev();
  }, { passive: true });

  // Mouse click navigation
  // - Left-click on slide content → next slide
  // - Right-click on slide content → previous slide (preventDefault context menu)
  // - Skip if click is on a link (<a>), notes panel, footer, or overview
  function shouldIgnoreClick(target) {
    return !!(target.closest("a") ||
              target.closest(".notes") ||
              target.closest(".overview") ||
              target.closest(".deck-footer"));
  }

  deck.addEventListener("click", (e) => {
    if (shouldIgnoreClick(e.target)) return;
    if (overviewEl.classList.contains("open")) return;
    next();
  });

  deck.addEventListener("contextmenu", (e) => {
    if (shouldIgnoreClick(e.target)) return;
    if (overviewEl.classList.contains("open")) return;
    e.preventDefault();
    prev();
  });

  // hashchange for back/forward buttons
  window.addEventListener("hashchange", () => {
    const idx = parseHash();
    if (idx !== current) {
      current = idx;
      renderState();
    }
  });

  /* ── Font size scaler ───────────────────────────────── */
  const FS_KEY = "pt156936.fontScale";
  const fsButtons = [...document.querySelectorAll(".fs-btn")];
  const allowedScales = fsButtons.map(b => parseFloat(b.dataset.scale));

  function applyFontScale(scale) {
    const s = allowedScales.includes(scale) ? scale : 1;
    document.documentElement.style.fontSize = (16 * s) + "px";
    fsButtons.forEach(b => {
      b.classList.toggle("active", parseFloat(b.dataset.scale) === s);
    });
    try { localStorage.setItem(FS_KEY, String(s)); } catch (_) {}
  }

  fsButtons.forEach(b => {
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      applyFontScale(parseFloat(b.dataset.scale));
    });
  });

  let initialScale = 1.5;
  try {
    const saved = parseFloat(localStorage.getItem(FS_KEY) || "");
    if (allowedScales.includes(saved)) initialScale = saved;
  } catch (_) {}
  applyFontScale(initialScale);

  // Initial render
  renderState();
})();
