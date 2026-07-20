// templates.jsx — 문서 템플릿 라이브 프리뷰 (705 문서 자동발행 · 모델 92/18)
// 3단: 목록(견적서/발주서/거래명세서) · 편집기 · 라이브 A4 프리뷰. 편집 즉시 반영 · brandColor 반영.
const { useState: useState_t, useEffect: useEffect_t } = React;

// 문서 유형별 샘플 본문 (EDN-2026-0031 기준, 가상 금액)
const DOC_SAMPLE = {
  QUOTATION: {
    docNo: "QTN-2026-0031",
    rows: [
      ["프로젝트", "EDN-2026-0031 · BH빔 120톤"],
      ["고객사", "니혼스틸웍스"],
      ["품목 / 규격", "Built-Up H Beam · BH-800x200x30x50"],
      ["수량 / 단가", "120 EA / ¥4,500,000"],
    ],
    highlight: { label: "예상 총원가 (BS1101)", value: "₩427,500,000", sub: "예상이익 ₩120,000,000 · 이익률 22.2%" },
  },
  PURCHASE_ORDER: {
    docNo: "PO-2026-0031",
    rows: [
      ["공급사", "현대제철 (최소비용 ★)"],
      ["재질 / 두께", "SM355TMC / 30t"],
      ["발주매수 / 중량", "6매 / 31,974kg"],
      ["단가 / 운임", "₩1,100/kg / ₩850,000"],
    ],
    highlight: { label: "발주액 (BS1108)", value: "₩36,021,400", sub: "발주중량×원/kg + 운임 · 발주대기" },
  },
  STATEMENT: {
    docNo: "TS-2026-0031",
    rows: [
      ["프로젝트", "EDN-2026-0031"],
      ["품목 / 규격", "Built-Up H Beam · BH-800x200x30x50"],
      ["수량", "120 EA"],
      ["공급가액 / 세액", "¥180,000,000 / ¥0 (영세율)"],
    ],
    highlight: { label: "합계", value: "¥180,000,000", sub: "수출 영세율 적용 · 전자문서 보관" },
  },
  INSPECTION: {
    docNo: "INS-2026-0031",
    rows: [
      ["부재", "WEB · SM-001-W (SM355TMC 30t)"],
      ["시험항목", "인장강도 / 항복점"],
      ["규격값 / 측정값", "≥490 / 512 MPa"],
      ["판정 (BS1109)", "합격"],
    ],
    highlight: { label: "종합 판정", value: "합격", sub: "기준서 허용범위 내 · 국가양식 자동전환" },
  },
};

function Templates({ tweaks, navigate }) {
  const { Card, SectionLabel, Icon, TrustBadge } = window;
  const [selectedId, setSelectedId] = useState_t("PTN-DOC-QTN");
  const tmpl = window.DOC_TEMPLATES.find((t) => t.id === selectedId);

  const [editing, setEditing] = useState_t({
    name: tmpl.name, headline: tmpl.headline, company: tweaks.brandName,
    primaryColor: tweaks.brandColor, footer: tmpl.footer, fontSize: 11,
  });

  // 템플릿 전환 시 편집기 리셋
  useEffect_t(() => {
    setEditing({ name: tmpl.name, headline: tmpl.headline, company: tweaks.brandName, primaryColor: tweaks.brandColor, footer: tmpl.footer, fontSize: 11 });
  }, [selectedId]);

  // Tweaks 브랜드색 변경 → 프리뷰 즉시 반영
  useEffect_t(() => {
    setEditing((s) => ({ ...s, primaryColor: tweaks.brandColor, company: tweaks.brandName }));
  }, [tweaks.brandColor, tweaks.brandName]);

  const sample = DOC_SAMPLE[tmpl.type];

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <SectionLabel color="violet">TEMPLATES · 문서 템플릿</SectionLabel>
          <h1 className="text-3xl font-bold mt-1.5 tracking-tight text-slate-50">문서 템플릿</h1>
          <p className="text-sm text-slate-400 mt-1">견적서·발주서·거래명세서 브랜드·문구 편집 → 라이브 A4 미리보기 (705). <span className="text-slate-500">문제 110 해소</span></p>
        </div>
        <button className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/25">
          <Icon name="plus" className="w-3.5 h-3.5" />새 템플릿
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* 목록 */}
        <Card className="col-span-12 lg:col-span-3 p-3">
          <div className="space-y-1">
            {window.DOC_TEMPLATES.map((t) => (
              <button key={t.id} onClick={() => setSelectedId(t.id)}
                className={`w-full text-left p-3 rounded-md transition border ${selectedId === t.id ? 'bg-indigo-500/10 border-indigo-500/30' : 'border-transparent hover:bg-slate-800/50'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-medium text-slate-200 leading-tight">{t.name}</div>
                  {!t.active && <span className="text-[9px] px-1 py-0.5 rounded bg-slate-700 text-slate-400">비활성</span>}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-mono text-slate-500">{t.docNoFmt}</span>
                  <span className="text-[10px] font-mono text-slate-600">{t.version}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* 편집기 */}
        <Card className="col-span-12 lg:col-span-5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">편집</h3>
            <span className="text-[10px] font-mono text-slate-500">{tmpl.id} · {tmpl.version}</span>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-500">템플릿명</label>
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-md bg-slate-950/60 border border-slate-700/60 text-sm focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-500">제목 (Headline)</label>
              <input value={editing.headline} onChange={(e) => setEditing({ ...editing, headline: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-md bg-slate-950/60 border border-slate-700/60 text-sm focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-500">발행자명</label>
              <input value={editing.company} onChange={(e) => setEditing({ ...editing, company: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-md bg-slate-950/60 border border-slate-700/60 text-sm focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-500">브랜드 색상 <span className="text-slate-600 normal-case">· Tweaks 연동</span></label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={editing.primaryColor} onChange={(e) => setEditing({ ...editing, primaryColor: e.target.value })}
                  className="w-12 h-9 rounded-md bg-transparent border border-slate-700/60 cursor-pointer" />
                <input value={editing.primaryColor} onChange={(e) => setEditing({ ...editing, primaryColor: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-md bg-slate-950/60 border border-slate-700/60 text-sm font-mono focus:border-indigo-500 outline-none" />
                <div className="flex gap-1">
                  {["#4f46e5", "#0891b2", "#0d9488", "#dc2626", "#ea580c", "#475569"].map((c) => (
                    <button key={c} onClick={() => setEditing({ ...editing, primaryColor: c })}
                      className="w-7 h-7 rounded-md border border-slate-600 hover:scale-110 transition" style={{ background: c }} aria-label={c}></button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-500">하단 안내문</label>
              <textarea value={editing.footer} onChange={(e) => setEditing({ ...editing, footer: e.target.value })} rows={2}
                className="w-full mt-1 px-3 py-2 rounded-md bg-slate-950/60 border border-slate-700/60 text-sm focus:border-indigo-500 outline-none resize-none" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-500">본문 폰트 크기 ({editing.fontSize}pt)</label>
              <input type="range" min={9} max={14} value={editing.fontSize} onChange={(e) => setEditing({ ...editing, fontSize: +e.target.value })}
                className="w-full mt-2 accent-indigo-500" />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div className="text-[10px] text-slate-500">변경 즉시 우측 프리뷰 반영 · 저장 시 신규 버전</div>
            <button className="px-4 py-2 rounded-md bg-gradient-to-r from-indigo-500 to-violet-500 text-sm font-semibold shadow-lg shadow-indigo-500/25">저장</button>
          </div>
        </Card>

        {/* 라이브 A4 프리뷰 */}
        <Card className="col-span-12 lg:col-span-4 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon name="eye" className="w-4 h-4 text-slate-400" />
              <h3 className="font-semibold text-sm">라이브 미리보기</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">A4 · 210×297</span>
          </div>
          <div className="rounded-lg bg-slate-100 p-6 aspect-[210/297] shadow-2xl overflow-hidden">
            <div className="h-full flex flex-col text-slate-900" style={{ fontSize: `${editing.fontSize}px`, lineHeight: 1.5 }}>
              {/* 헤더 */}
              <div className="flex items-start justify-between pb-3 border-b-2 mb-4" style={{ borderColor: editing.primaryColor }}>
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-slate-500">{editing.company}</div>
                  <div className="font-bold mt-0.5" style={{ color: editing.primaryColor, fontSize: `${editing.fontSize + 7}px` }}>{editing.headline}</div>
                  <div className="text-[9px] font-mono text-slate-400 mt-0.5">{sample.docNo}</div>
                </div>
                <div className="w-10 h-10 rounded-md flex items-center justify-center text-white font-bold shrink-0" style={{ background: editing.primaryColor, fontSize: `${editing.fontSize + 3}px` }}>
                  {(editing.company || 'E')[0]}
                </div>
              </div>
              {/* 본문 */}
              <div className="space-y-2">
                {sample.rows.map(([k, v], i) => (
                  <div key={i} className="flex justify-between gap-2">
                    <span className="text-slate-500 shrink-0">{k}</span>
                    <span className="text-right font-medium text-slate-800">{v}</span>
                  </div>
                ))}
              </div>
              {/* 하이라이트 */}
              <div className="mt-4 p-3 rounded-md" style={{ background: `${editing.primaryColor}12`, border: `1px solid ${editing.primaryColor}33` }}>
                <div className="text-[9px] uppercase tracking-wider text-slate-500">{sample.highlight.label}</div>
                <div className="font-bold mt-0.5" style={{ color: editing.primaryColor, fontSize: `${editing.fontSize + 10}px` }}>{sample.highlight.value}</div>
                <div className="text-[9px] text-slate-500 mt-0.5">{sample.highlight.sub}</div>
              </div>
              <div className="mt-auto pt-3 border-t border-slate-200 text-[8px] text-slate-400 leading-relaxed">{editing.footer}</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="py-2 rounded-md bg-slate-800 border border-slate-700/60 hover:bg-slate-750 text-xs flex items-center justify-center gap-1.5 text-slate-300"><Icon name="download" className="w-3 h-3" />PDF 받기</button>
            <button className="py-2 rounded-md bg-slate-800 border border-slate-700/60 hover:bg-slate-750 text-xs flex items-center justify-center gap-1.5 text-slate-300"><Icon name="file" className="w-3 h-3" />테스트 발행</button>
          </div>
        </Card>
      </div>
    </div>
  );
}

window.Templates = Templates;
