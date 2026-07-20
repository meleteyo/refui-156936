# EDEN OS — 레퍼런스 UI (refui 트랙)

위시켓 프로젝트 **#156936** (EDEN OS · 이든철강 통합 운영 시스템) 지원용 **정적 레퍼런스 UI**.
`wishket-refui` 스킬의 4트랙 중 **정적 분석 UI 트랙**으로, 프로젝트 분석 산출물을 마케팅·랜딩 톤으로 시각화한다.

## 목적

- 제안서/미팅에서 **한 번의 URL 공유**로 프로젝트 이해도·역량을 즉시 체감시킨다.
- 경쟁 차별화 5개 섹션(**INSIGHTS·QUESTIONS·RISKS·ARCHITECTURE·TIMELINE**)을 실제 분석 데이터로 채운다.
- CP·수율·환율·손익을 핵심 서사로, 도메인 톤은 인디고(FLANGE)·틸(WEB).

## 파일 구성

| 파일 | 설명 | 비고 |
|---|---|---|
| `index.html` | 랜딩 (2-카드: IT / 일반 선택) | `./it.html` · `./nonit.html` 링크 |
| `it.html` | **IT 담당자용** — 기술 용어 유지, ARCHITECTURE 4탭(다이어그램/스택/ADR/코드) 풀 | `data-client-type="it"` |
| `nonit.html` | **일반 고객용** — 용어 번역, ARCHITECTURE는 흐름도 1개, FAQ·안심 뱃지 | `data-client-type="nonit"` |
| `styles.css` | 공통 스타일 (템플릿 그대로 복사) | 수정 금지 |
| `client.js` | 공통 JS: CountUp · ⌘K · 아코디언 · 아키텍처 탭 · 사이드 패널 · ROI (템플릿 그대로 복사) | 수정 금지 |
| `data.json` | 추출 구조화 데이터 (META·insights·questions·risks·architecture·timeline 등) | 재사용/재배포용 |

## Hero 진입점 (형제 트랙 연결)

- **라이브 데모 →** `../proto/index.html` (클릭 가능한 관리자 콘솔 프로토타입)
- **1분 30초 자동 시연 →** `../demo/자동시연.html` (캡션 + 자동 순환)

두 링크는 refui가 생성하는 형제 트랙(proto·demo)을 가리킨다. 로컬에서 파일로 열면 상대경로로 연결되고, 배포 시 `deploy.sh`가 경로를 보정한다.

## 기술 메모

- **차트**: 각 HTML 하단 인라인 `<script>`가 도메인 전용 canvas ID(`eden-trend`·`eden-currency`·`eden-radar`·`eden-risks`·`eden-spark`)로 Chart.js를 직접 초기화한다. `client.js`의 `initCharts()`가 찾는 ID(`chart-*`)와 분리되어 **중복 렌더가 없다.**
- **리스크 산점도**: 점 클릭 → `window.openSidePanel()`(client.js)로 대응 전략 표시. IT는 기술 해설, 일반은 비즈니스 영향으로 번역.
- **수율 절감 시뮬레이터**: OPERATOR 섹션. `eden-mat`·`eden-yield` 슬라이더 → 연간 절감액. (client.js `initMrrSim`은 요소 부재로 no-op)
- **ROI 계산기**: CTA 섹션. `roi-*` ID로 client.js `initRoi` 재사용 — "월 CP 수립 횟수 → 연간 시간·인건비 절감".
- **CountUp / ⌘K / 아코디언 / 아키텍처 탭 / 사이드 패널**: client.js 공통 로직 사용.
- **Prism.js**: `it.html`만 Python 컴포넌트 로드 → `behaviors.py` 코드 미리보기 하이라이트.
- **챗봇 / Cal.com / Loom**: 미렌더(기본). 목업 오인·실서비스 혼동 방지. 미팅에서 라이브 시연 원칙.

## IT / 일반 버전 차이 요약

| 축 | it.html | nonit.html |
|---|---|---|
| 용어 | Django·Celery·CP-SAT·커팅스톡·RBAC·NP-hard 유지 | "자동 계산"·"버리는 철"·"권한 나눔" 등 결과 중심 번역 |
| ARCHITECTURE | 4탭 (다이어그램·스택·ADR 6건·behaviors.py 코드) | 흐름도 1개(`이렇게 동작합니다`) + "IT 버전 참고" 링크 |
| QUESTIONS | 기술 선택지·트레이드오프 그대로 (Q1·Q2·Q3 …) | 비즈니스 영향으로 번역 + 개발자 권장안 |
| RISKS | 기술 용어 해설(2D·CP-SAT·JSONB) | "일정 지연"·"비용 추가" 등 영향 중심 |
| 추가 섹션 | 없음 | Mini FAQ(불안 해소) · 안심 뱃지 · 흐름도 |
| 톤 | 기술 자신감·트레이드오프 명시 | 안심·단정·짧은 문장 |

## 데이터 출처

- `1_요구사항검토서.md` — META·Hero Insights·모호 M1–M11·누락 §8
- `2_발주자질의서_IT.md` / `_비IT.md` — QUESTIONS 아코디언
- `3_실행계획.md` — 스택(§2.1)·ADR(§2.1.1 3안)·API(§4.1)·주차 일정(§8)·마일스톤(§9)
- `5_제안서_IT.md` — WHY-US·CTA·차별화
- `6_리스크분석.md` — RISKS 매트릭스 R1~R19 + 연쇄 분석
- `domain/behaviors.py` — CP 코드 미리보기(`optimize_cutting_plan`)
- `models/5_프로토타입_0_UX설계원칙.md` — NestView·수율→금액·의미색(FLANGE 인디고/WEB 틸)
- `~/projects/my-apps/wishket-scraping/data/profile.yaml` — 경력·포트폴리오

## 재배포

정적 파일이라 그대로 정적 호스팅(Netlify/Vercel/GitHub Pages)에 올리면 된다.
`refui/`, `proto/`, `demo/`를 동일 부모 아래 유지하면 Hero의 상대경로 링크가 그대로 동작한다.

> 실제 서비스가 아니며 화면의 수치는 데모 목업이다. 마지막 갱신: 2026-07-18.
