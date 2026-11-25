/*
 * Safe Teen 프로토타입 — SafeTwin 국립청소년수련시설 스마트 안전관제
 * 2단계: SVG 등각투영 3D 건물 모델 + 가상 센서 시뮬레이터(전 화면 실시간 연동)
 * 사용 라이브러리: React · Tailwind CSS · lucide-react · recharts
 * 센서·기상·이벤트 값과 건물 평면은 모두 시연용 가상 데이터입니다.
 */
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Monitor, Smartphone, Bell, User, Radio, AudioWaveform, Droplets, Cloud, CloudRain, Wind, Umbrella,
  Gauge, Siren, Eye, Maximize2, Minimize2, RotateCw, Layers, SlidersHorizontal, Info, ShieldCheck,
  AlertTriangle, Flame, HardHat, HeartPulse, PhoneCall, Navigation, BookOpen, Mic, Menu, Signal, Wifi,
  BatteryFull, ChevronsUpDown, ChevronDown, ChevronRight, Bluetooth, QrCode, MapPin, DoorOpen, X, Cpu,
  Volume2, BadgeCheck, Check,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';

/* ════════════════ 1. 디자인 토큰 ════════════════ */
const N = {
  bg: '#0a1424', panel: '#0e1b30', line: '#1c3050', grid: '#172b48',
  text: '#e7eef8', sub: '#98abc4', mute: '#647c9b', sky: '#38bdf8',
};
const LV = {
  safe: { label: '안전', color: '#22c55e', text: '#86efac', bg: 'rgba(34,197,94,0.14)' },
  caution: { label: '주의', color: '#f59e0b', text: '#fcd34d', bg: 'rgba(245,158,11,0.16)' },
  danger: { label: '위험', color: '#ef4444', text: '#fca5a5', bg: 'rgba(239,68,68,0.18)' },
};
const GRADE = { safe: '안전', caution: '주의', danger: '비상' };
const RGB = { safe: '34,197,94', caution: '245,158,11', danger: '239,68,68' };
const RED = '#e5222f';
const FONT = "'IBM Plex Sans KR','Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR','Noto Sans CJK KR',system-ui,sans-serif";
const CARD_SHADOW = '0 1px 2px rgba(15,23,42,0.06), 0 6px 16px rgba(15,23,42,0.06)';

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap');
:root{--sim-h:78px}
.st-root{font-family:${FONT};-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
.st-root button,.st-root input{font-family:inherit}
.st-num{font-variant-numeric:tabular-nums}
.st-keep{word-break:keep-all}
.st-shell{padding-bottom:var(--sim-h)}
.st-simbar{position:fixed;left:0;right:0;bottom:0;height:var(--sim-h);z-index:45}
.st-twin{height:640px}
.st-stage-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:16px}
.st-expanded{position:fixed;left:12px;right:12px;top:12px;bottom:calc(var(--sim-h) + 12px);z-index:50}
.st-backdrop{position:fixed;left:0;right:0;top:0;bottom:var(--sim-h);z-index:40;background:rgba(2,6,16,.72)}
@media (min-width:1024px){
  :root{--sim-h:76px}
  .st-shell{height:100vh;display:flex;flex-direction:column;padding-bottom:0;overflow:hidden}
  .st-main{flex:1 1 auto;min-height:0}
  .st-simbar{position:relative;flex:0 0 auto}
  .st-dash,.st-stage,.st-twin{height:100%}
  .st-stage-grid{grid-template-columns:270px minmax(0,1fr) 270px;grid-template-rows:minmax(0,1fr);height:100%;gap:24px}
}
.st-fade{animation:st-fade .35s ease}
@keyframes st-fade{from{opacity:0}to{opacity:1}}
.st-pop{animation:st-pop .32s ease}
@keyframes st-pop{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
.st-ping{animation:st-ping 1.8s cubic-bezier(0,0,.2,1) infinite}
@keyframes st-ping{0%{transform:scale(.8);opacity:.85}80%,100%{transform:scale(2.3);opacity:0}}
.st-ring,.st-ring2{animation:st-ring 1.6s ease-out infinite}
.st-ring2{animation-delay:.8s}
@keyframes st-ring{0%{transform:scale(.35);opacity:.95}100%{transform:scale(2.4);opacity:0}}
.st-flow{animation:st-flow .9s linear infinite}
@keyframes st-flow{to{stroke-dashoffset:-20}}
.st-blink{animation:st-blink 1.1s ease-in-out infinite}
@keyframes st-blink{50%{opacity:.35}}
.st-glow-safe{animation:st-glow 5s ease-in-out infinite}
.st-glow-caution{animation:st-glow 2s ease-in-out infinite}
.st-glow-danger{animation:st-glow .9s ease-in-out infinite}
@keyframes st-glow{0%,100%{opacity:.32}50%{opacity:1}}
.st-alert{animation:st-alert 1.6s ease-in-out infinite}
@keyframes st-alert{0%,100%{background-color:#7f1d1d}50%{background-color:#b91c1c}}
.st-newlog{animation:st-newlog 2.6s ease}
@keyframes st-newlog{from{background:rgba(56,189,248,.2)}to{background:transparent}}
.st-eq{display:inline-flex;align-items:flex-end;gap:2px;height:16px}
.st-eq i{display:block;width:3px;height:100%;border-radius:2px;background:currentColor;transform-origin:bottom;animation:st-eq .8s ease-in-out infinite}
.st-eq i:nth-child(2){animation-delay:.12s}.st-eq i:nth-child(3){animation-delay:.24s}.st-eq i:nth-child(4){animation-delay:.36s}
@keyframes st-eq{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
.st-scroll{scrollbar-width:thin;scrollbar-color:rgba(120,150,190,.35) transparent}
.st-scroll::-webkit-scrollbar{width:8px;height:8px}
.st-scroll::-webkit-scrollbar-thumb{background:rgba(120,150,190,.3);border-radius:8px}
.st-canvas{background-color:#0a172b;background-image:radial-gradient(ellipse at 50% 46%,rgba(37,99,235,.18),transparent 68%),linear-gradient(rgba(56,130,220,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(56,130,220,.07) 1px,transparent 1px);background-size:100% 100%,28px 28px,28px 28px}
.st-chev{opacity:.22;animation:st-chev 1.5s linear infinite}
@keyframes st-chev{0%{opacity:.2}14%{opacity:1}42%{opacity:.3}100%{opacity:.2}}
.st-draw{animation:st-draw 1.3s ease-out forwards}
@keyframes st-draw{0%{stroke-dashoffset:var(--len);opacity:1}75%{stroke-dashoffset:0;opacity:.95}100%{stroke-dashoffset:0;opacity:0}}
.st-route-in{animation:st-fade .5s ease}
.st-route-out{animation:st-out .55s ease forwards}
@keyframes st-out{to{opacity:0}}
.st-check{animation:st-check .5s cubic-bezier(.2,1.5,.4,1)}
@keyframes st-check{from{transform:scale(.3);opacity:0}to{transform:none;opacity:1}}
.st-root :focus-visible{outline:2px solid #38bdf8;outline-offset:2px}
@media (prefers-reduced-motion:reduce){.st-fade,.st-pop,.st-ping,.st-ring,.st-ring2,.st-flow,.st-blink,.st-glow-safe,.st-glow-caution,.st-glow-danger,.st-alert,.st-newlog,.st-eq i,.st-route-in,.st-route-out,.st-check{animation:none!important}.st-chev{animation:none!important;opacity:.9}.st-draw{display:none}}
`;

/* ════════════════ 2. 건물 모델 (시연용 가상 청소년수련원) ════════════════ */
const BW = 40; // 동서 길이(m)
const BD = 16; // 남북 길이(m)
const CORR_N = 6; // 복도 북쪽 경계(y)
const CORR_S = 10; // 복도 남쪽 경계(y)
const FLOOR_H = 3.4; // 층고(m) — 층을 쌓았을 때 간격
const EXPLODED_GAP = 12; // 층별 펼치기 간격(m)
const WALL_T = 0.18; // 벽 두께(m)

const TYPE_LABEL = {
  room: '숙소', corridor: '복도', restroom: '공용 화장실', shower: '공용 샤워실', dressing: '탈의실', stair: '계단실',
  exit: '비상계단', lobby: '로비', medical: '보건실', office: '사무·지도자실', lounge: '휴게 공간', dining: '식당',
  activity: '체험·프로그램실', auditorium: '강당', utility: '기계·창고', deck: '야외 데크',
};
const BLIND_TYPES = ['room', 'restroom', 'shower', 'dressing', 'stair', 'exit', 'deck'];
const DOOR_W = {
  room: 1.1, office: 1.1, medical: 1.4, restroom: 1.4, shower: 1.4, dressing: 1.4, utility: 1.4, lounge: 1.6,
  stair: 1.8, exit: 1.8, activity: 1.8, dining: 2.4, auditorium: 2.4, lobby: 3,
};
const SENSOR_LABEL = { radar: 'mmWave 레이더', acoustic: '음향 센서', climate: '온습도 센서', dew: '결로 센서' };
const SENSOR_COLOR = { radar: '#38bdf8', acoustic: '#a78bfa', climate: '#2dd4bf', dew: '#fbbf24' };
const SENSORS_BY_TYPE = {
  corridor: ['radar', 'acoustic'], restroom: ['acoustic', 'climate'], shower: ['acoustic', 'climate'],
  dressing: ['acoustic', 'climate'], stair: ['radar', 'acoustic'], exit: ['radar'], deck: ['dew'],
};

const Z = (id, name, short, type, x, y, w, h, extra) => ({ id, name, short, type, x, y, w, h, ...(extra || {}) });
const FLOORS = [
  {
    id: '1F', title: '로비·식당층',
    zones: [
      Z('1-ws', '서쪽 비상계단', '비상계단', 'exit', 0, 0, 4, 6, { doors: ['W'] }),
      Z('1-lobby', '로비·안내데스크', '로비', 'lobby', 4, 0, 13, 6, { doors: ['N'] }),
      Z('1-nurse', '보건실', '보건실', 'medical', 17, 0, 6, 6),
      Z('1-admin', '행정실', '행정실', 'office', 23, 0, 7, 6),
      Z('1-shop', '매점·휴게실', '매점', 'lounge', 30, 0, 10, 6),
      Z('1-corr', '1F 복도', '복도', 'corridor', 0, CORR_N, BW, 4),
      Z('1-wc', '공용 화장실', '화장실', 'restroom', 0, CORR_S, 6, 6),
      Z('1-cafe', '식당', '식당', 'dining', 6, CORR_S, 16, 6, { doors: ['S'] }),
      Z('1-cs', '중앙계단', '중앙계단', 'stair', 22, CORR_S, 5, 6),
      Z('1-prog', '프로그램실', '프로그램실', 'activity', 27, CORR_S, 7, 6),
      Z('1-mech', '기계실', '기계실', 'utility', 34, CORR_S, 6, 6),
      Z('1-deck', '야외 나무 데크', '야외 데크', 'deck', 8, BD, 12, 7),
    ],
  },
  {
    id: '2F', title: '숙소층',
    zones: [
      Z('2-ws', '서쪽 비상계단', '비상계단', 'exit', 0, 0, 4, 6),
      Z('2-r1', '201호', '201', 'room', 4, 0, 7, 6),
      Z('2-r2', '202호', '202', 'room', 11, 0, 7, 6),
      Z('2-r3', '203호', '203', 'room', 18, 0, 7, 6),
      Z('2-r4', '204호', '204', 'room', 25, 0, 7, 6),
      Z('2-r5', '205호', '205', 'room', 32, 0, 8, 6),
      Z('2-corr', '2F 숙소 복도', '복도', 'corridor', 0, CORR_N, BW, 4, { blind: true }),
      Z('2-wc', '공용 화장실', '화장실', 'restroom', 0, CORR_S, 6, 6),
      Z('2-sh', '공용 샤워실', '샤워실', 'shower', 6, CORR_S, 7, 6),
      Z('2-lounge', '세탁·휴게실', '휴게실', 'lounge', 13, CORR_S, 9, 6),
      Z('2-cs', '중앙계단', '중앙계단', 'stair', 22, CORR_S, 5, 6),
      Z('2-lead', '지도자실', '지도자실', 'office', 27, CORR_S, 7, 6),
      Z('2-store', '비품창고', '창고', 'utility', 34, CORR_S, 6, 6),
    ],
  },
  {
    id: '3F', title: '강당·체험층',
    zones: [
      Z('3-ws', '서쪽 비상계단', '비상계단', 'exit', 0, 0, 4, 6),
      Z('3-hall', '강당', '강당', 'auditorium', 4, 0, 24, 6),
      Z('3-booth', '방송실', '방송실', 'office', 28, 0, 5, 6),
      Z('3-lead', '인솔교사실', '교사실', 'office', 33, 0, 7, 6),
      Z('3-corr', '3F 복도', '복도', 'corridor', 0, CORR_N, BW, 4),
      Z('3-wc', '공용 화장실', '화장실', 'restroom', 0, CORR_S, 6, 6),
      Z('3-exp1', '안전 체험실', '안전체험실', 'activity', 6, CORR_S, 8, 6),
      Z('3-exp2', '창작 체험실', '창작체험실', 'activity', 14, CORR_S, 8, 6),
      Z('3-cs', '중앙계단', '중앙계단', 'stair', 22, CORR_S, 5, 6),
      Z('3-dress', '탈의실', '탈의실', 'dressing', 27, CORR_S, 6, 6),
      Z('3-prep', '체험 준비실', '준비실', 'utility', 33, CORR_S, 7, 6),
    ],
  },
];
const FLOOR_MAP = Object.fromEntries(FLOORS.map((f) => [f.id, f]));
const FLOOR_ORDER = ['1F', '2F', '3F'];
const FLOOR_KO = { '1F': '1층', '2F': '2층', '3F': '3층' };
const nextFloor = (id) => FLOOR_ORDER[(FLOOR_ORDER.indexOf(id) + 1) % FLOOR_ORDER.length];

const isBlind = (z) => Boolean(z.blind) || BLIND_TYPES.includes(z.type);
const zoneSensors = (z) => (isBlind(z) ? SENSORS_BY_TYPE[z.type] || [] : []);
const ALL_ZONES = FLOORS.flatMap((f) => f.zones.map((z) => ({ ...z, floor: f.id })));
const ZONE_COUNT = ALL_ZONES.length;
const SENSOR_TOTAL = ALL_ZONES.reduce((n, z) => n + zoneSensors(z).length, 0);
const findZone = (id) => ALL_ZONES.find((z) => z.id === id) || null;

/* 출발 위치(BLE 비콘·QR 태그 시뮬레이션)와 대피 경로 탐색 — 평면 좌표(m) */
const NAV_FLOOR = '2F';
const LOCATIONS = {
  r203: { id: 'r203', label: '203호 숙소', short: '203호', report: '2층 203호 앞', zone: '2-r3', x: 21.5, y: 3.2, door: [21.5, 6], front: [21.5, 7.2], src: 'ble', tag: 'BLE 비콘 B2-03' },
  r205: { id: 'r205', label: '205호 숙소', short: '205호', report: '2층 205호 앞', zone: '2-r5', x: 36, y: 3.2, door: [36, 6], front: [36, 7.2], src: 'ble', tag: 'BLE 비콘 B2-05' },
  wc2: { id: 'wc2', label: '2층 공용화장실', short: '공용화장실', report: '2층 공용화장실 앞', zone: '2-wc', x: 3, y: 12.8, door: [3, 10], front: [3, 8.8], src: 'qr', tag: 'QR 태그 Q2-WC' },
};
const LOC_ORDER = ['r203', 'r205', 'wc2'];
const EXITS = {
  center: { id: 'center', label: '중앙계단', zone: '2-cs', door: [24.5, 10], inside: [24.5, 12.8] },
  west: { id: 'west', label: '서쪽 비상구', zone: '2-ws', door: [2, 6], inside: [2, 3.2] },
};
const LANE = { c: 8, n: 6.9 }; // 복도 중앙선 · 북쪽 벽면을 따라가는 동선
const NAV_XS = [2, 3, 7.5, 9.5, 14.5, 17.5, 21.5, 22, 24.5, 27, 28.5, 30.5, 36, 37];
const HAZARD = { x0: 21.9, x1: 27.1, area: [21.8, 7.55, 5.4, 2.45] }; // 중앙계단 앞 통제 구역(복도 남쪽 절반)
const WALK_SPEED = 1.3; // 대피 보행 속도(m/s)
const routeLen = (pts) => pts.reduce((sum, q, i) => (i ? sum + Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) : 0), 0);
const MOBILE_VIEW = { theta: 100, k: 0.6 };

/* 복도 그래프 + 다익스트라: 평시엔 중앙계단, 비상시엔 통제 구역을 그래프에서 빼고 서쪽 비상구로 */
const ROUTE_CACHE = new Map();
function planRoute(locId, mstate) {
  const key = `${locId}|${mstate}`;
  const hit = ROUTE_CACHE.get(key);
  if (hit) return hit;
  const loc = LOCATIONS[locId];
  const emergency = mstate === 'emergency';
  const target = emergency ? EXITS.west : EXITS.center;
  const nodes = new Map();
  const adj = new Map();
  const node = (id, x, y) => { nodes.set(id, [x, y]); if (!adj.has(id)) adj.set(id, []); };
  const link = (a, b) => {
    if (!nodes.has(a) || !nodes.has(b)) return;
    const [ax, ay] = nodes.get(a); const [bx, by] = nodes.get(b);
    const w = Math.hypot(ax - bx, ay - by);
    adj.get(a).push([b, w]);
    adj.get(b).push([a, w]);
  };
  const blocked = (x) => emergency && x > HAZARD.x0 && x < HAZARD.x1;
  NAV_XS.forEach((x) => { node(`n${x}`, x, LANE.n); if (!blocked(x)) node(`c${x}`, x, LANE.c); });
  NAV_XS.forEach((x, i) => {
    link(`n${x}`, `c${x}`);
    if (i > 0) { const px = NAV_XS[i - 1]; link(`n${px}`, `n${x}`); link(`c${px}`, `c${x}`); }
  });
  const attach = (id, [x, y]) => { node(id, x, y); if (y <= CORR_N + 1e-6) link(id, `n${x}`); link(id, `c${x}`); };
  node('start', loc.x, loc.y);
  attach('sdoor', loc.door);
  link('start', 'sdoor');
  node('goal', target.inside[0], target.inside[1]);
  attach('gdoor', target.door);
  link('gdoor', 'goal');
  const dist = new Map([['start', 0]]);
  const prev = new Map();
  const done = new Set();
  for (;;) {
    let u = null; let best = Infinity;
    dist.forEach((d, id) => { if (!done.has(id) && d < best) { best = d; u = id; } });
    if (u === null || u === 'goal') break;
    done.add(u);
    adj.get(u).forEach(([v, w]) => {
      if (best + w < (dist.has(v) ? dist.get(v) : Infinity)) { dist.set(v, best + w); prev.set(v, u); }
    });
  }
  const chain = [];
  let cur = dist.has('goal') ? 'goal' : null;
  while (cur) { chain.unshift(nodes.get(cur)); cur = prev.get(cur); }
  const pts = chain.filter((q, i) => {
    if (i === 0 || i === chain.length - 1) return true;
    const a = chain[i - 1]; const b = chain[i + 1];
    return Math.abs((q[0] - a[0]) * (b[1] - a[1]) - (q[1] - a[1]) * (b[0] - a[0])) > 1e-6;
  });
  const len = routeLen(pts);
  const res = { key, loc, target, pts, dist: Math.round(len), secs: Math.round(len / WALK_SPEED), emergency, blocked: emergency ? EXITS.center : null };
  ROUTE_CACHE.set(key, res);
  return res;
}
const INCIDENT = {
  fire: { floor: '2F', x: 24.5, y: 13, title: '2F 낙상·화재 감지', sub: '사각지대 · 중앙계단' },
  rain: { floor: '1F', x: 14, y: 19.5, title: '결로 주의', sub: '미끄럼 우려 · 야외 데크' },
};

/* ════════════════ 3. 시연 시나리오 ════════════════ */
const WEATHER_NORMAL = { sky: '흐림', icon: Cloud, temp: 7.0, rh: 62, rainProb: 20, rain: 0, wind: 1.6 };
const SCENARIOS = {
  normal: {
    no: 1, title: '평시 정상', sub: '전 구역 안전', icon: ShieldCheck, color: '#22c55e', score: 12,
    factors: { dew: 14, weather: 10, radar: 2, sound: 4, fire: 0 }, zones: {}, mobile: 'normal', weather: WEATHER_NORMAL,
    check: { tone: 'safe', icon: ShieldCheck, title: '교차 검증 정상 · 이상 신호 없음', sub: '레이더·음향·결로 센서 모두 기준 이내' },
  },
  rain: {
    no: 2, title: '강우·결로 주의', sub: '우천 · 습도 90%', icon: CloudRain, color: '#f59e0b', score: 76,
    factors: { dew: 86, weather: 82, radar: 3, sound: 5, fire: 0 }, zones: { '1-deck': 'caution' }, mobile: 'caution',
    weather: { sky: '우천', icon: CloudRain, temp: 5.8, rh: 90, rainProb: 90, rain: 4.5, wind: 3.2 },
    check: { tone: 'caution', icon: CloudRain, title: '규칙 기반 예측 · 결로 주의 발령', sub: '바닥온도 ≤ 이슬점+1℃ · 우천 · 습도 90%' },
  },
  impact: {
    no: 3, title: '단순 충격음', sub: '오경보 필터링 테스트', icon: Volume2, color: '#38bdf8', score: 18,
    factors: { dew: 14, weather: 10, radar: 4, sound: 58, fire: 0 }, zones: {}, mobile: 'normal', weather: WEATHER_NORMAL,
    check: { tone: 'info', icon: BadgeCheck, title: '단순 활동 감지 - 오경보 필터링 완료', sub: '음향 85dB 단독 · 레이더 정상 움직임 → 경보 보류' },
  },
  fire: {
    no: 4, title: '2F 중앙계단 화재·낙상', sub: '교차 검증 · 비상', icon: Flame, color: '#ef4444', score: 96,
    factors: { dew: 14, weather: 10, radar: 98, sound: 95, fire: 92 },
    zones: { '2-cs': 'danger', '2-corr': 'caution', '1-cs': 'caution', '3-cs': 'caution' }, mobile: 'emergency', weather: WEATHER_NORMAL,
    check: { tone: 'danger', icon: Siren, title: '교차 검증 통과 · 2단계 비상 경보', sub: '고도 급강하·무동작 10초 + 비명·충격음 92dB' },
  },
};
const SCENARIO_IDS = ['normal', 'rain', 'impact', 'fire'];
const FACTOR_LABEL = { dew: '결로·미끄럼', weather: '기상 위험', radar: '낙상·무동작', sound: '충격음·비명', fire: '화재 신호' };
const CHECK_TONE = {
  safe: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.45)', fg: '#86efac' },
  caution: { bg: 'rgba(245,158,11,0.13)', border: 'rgba(245,158,11,0.55)', fg: '#fcd34d' },
  info: { bg: 'rgba(56,189,248,0.13)', border: 'rgba(56,189,248,0.6)', fg: '#7dd3fc' },
  danger: { bg: 'rgba(239,68,68,0.16)', border: 'rgba(239,68,68,0.7)', fg: '#fca5a5' },
};
const ZONE_NOTE = {
  rain: { '1-deck': '결로 주의 · 바닥온도가 이슬점+1℃ 이하' },
  fire: { '2-cs': '낙상·화재 감지 · 계단 통제', '2-corr': '연기 확산 우려 · 대피 동선', '1-cs': '계단 연기 유입 주의', '3-cs': '계단 연기 유입 주의' },
};

const MOBILE_STATES = {
  normal: {
    label: '평시',
    banner: { bg: '#14532d', fg: '#dcfce7', icon: ShieldCheck, title: '평시 · 안전 상태', sub: '현재 감지된 위험이 없습니다' },
    voice: '현재 평시 안전 상태입니다. 비상시에는 초록색 점선을 따라 가장 가까운 중앙계단으로 이동하세요.',
  },
  caution: {
    label: '주의',
    banner: { bg: '#7c4a03', fg: '#fef3c7', icon: AlertTriangle, title: '안전 주의 안내', sub: '1층 야외 데크 결로 · 미끄럼 주의' },
    voice: '1층 야외 데크가 결로로 미끄럽습니다. 데크 출입을 피하고 초록색 점선을 따라 중앙계단을 이용하세요.',
  },
  emergency: {
    label: '비상',
    banner: { bg: '#8c1b22', fg: '#fde2e2', icon: AlertTriangle, title: '비상 대피 안내', sub: '2층 중앙계단 화재·낙상 · 서쪽 비상구로 대피' },
    voice: '비상 상황입니다. 중앙계단이 통제되었습니다. 파란색 경로를 따라 서쪽 비상구로 대피하세요.',
  },
};

const MANUALS = [
  {
    id: 'fire', no: '01', title: '화재 대피', summary: '젖은 수건으로 코와 입을 막고 대피', icon: Flame, color: '#ea580c', tint: '#fff1e6',
    steps: [
      '"불이야!" 크게 외치고 가까운 비상벨을 누르세요.',
      '젖은 수건으로 코와 입을 막고 낮은 자세로 이동하세요.',
      '엘리베이터 대신 계단으로, 앱이 안내하는 비상구로 대피하세요.',
    ],
  },
  {
    id: 'fall', no: '02', title: '낙상·붕괴 대비', summary: '머리를 감싸고 신속히 대피', icon: HardHat, color: '#b45309', tint: '#fef6e4',
    steps: [
      '넘어진 친구는 억지로 일으키지 말고 인솔교사에게 바로 알리세요.',
      '떨어지는 물체가 있으면 가방이나 팔로 머리를 감싸세요.',
      '흔들림이 멈추면 계단으로 건물 밖 넓은 곳으로 이동하세요.',
    ],
  },
  {
    id: 'cpr', no: '03', title: '응급 처치', summary: '심폐소생술(CPR) 실시 및 119 신고', icon: HeartPulse, color: '#dc2626', tint: '#fdecec',
    steps: [
      '어깨를 두드려 반응을 확인하고, 주변 사람을 지목해 119 신고와 AED를 요청하세요.',
      '가슴 중앙을 분당 100~120회, 약 5cm 깊이로 강하고 빠르게 누르세요.',
      'AED가 도착하면 전원을 켜고 음성 안내에 따라 패드를 붙이세요.',
    ],
  },
];

const LOG_TAG = {
  alarm: { label: '경보', color: '#f87171' },
  caution: { label: '주의', color: '#fbbf24' },
  ok: { label: '정상', color: '#4ade80' },
  info: { label: '안내', color: '#7dd3fc' },
};
let logSeq = 0;
const withId = (e) => { logSeq += 1; return { ...e, id: logSeq }; };
function seedLog() {
  const now = Date.now();
  const m = (min) => now - min * 60 * 1000;
  return [
    { lv: 'ok', ts: m(3), text: `전 구역 센서 정기 점검 완료 (${SENSOR_TOTAL}/${SENSOR_TOTAL} 정상)` },
    { lv: 'info', ts: m(11), text: '기상청 실황 수신 · 흐림, 습도 62%' },
    { lv: 'ok', ts: m(26), text: '1F 야외 데크 결로 센서 · 결로 여유 6.2℃' },
    { lv: 'caution', ts: m(54), text: '2F 공용 샤워실 습도 92% → 환기 후 해제' },
    { lv: 'info', ts: m(125), text: '야간 관제 모드 전환 · 당직 지도자 2명' },
  ].map(withId);
}
function scenarioLogs(id, now) {
  const ago = (sec) => now - sec * 1000;
  switch (id) {
    case 'rain':
      return [
        { lv: 'caution', ts: now, text: '지도자 예방 조치 권고 발송 — 데크 미끄럼 방지 매트 점검·실내 활동 전환' },
        { lv: 'caution', ts: now, text: '1F 야외 데크 결로 주의 — 바닥온도가 이슬점+1℃ 이하로 하강' },
        { lv: 'info', ts: now, text: '기상청 실황 수신 — 우천 · 습도 90% · 강수확률 90%' },
      ];
    case 'impact':
      return [
        { lv: 'ok', ts: now, text: 'AI 교차 검증 — 레이더 정상 움직임 확인, 오경보 필터링(경보 보류)' },
        { lv: 'info', ts: now, text: '2F 공용 샤워실 충격음 85dB 감지 (음향 센서 단독)' },
      ];
    case 'fire':
      return [
        { lv: 'alarm', ts: now, text: '중앙계단 통제 · 모바일 대피 경로를 서쪽 비상구로 전환' },
        { lv: 'alarm', ts: now, text: '2단계 전체 비상 경보 발령 — 교차 검증 통과 (무동작 10초)' },
        { lv: 'alarm', ts: ago(5), text: '1단계 관리자 확인 알림 — 무동작 5초 지속' },
        { lv: 'alarm', ts: ago(10), text: '2F 중앙계단 화재감지기 작동 · 비명·충격음 92dB' },
        { lv: 'alarm', ts: ago(10), text: '2F 중앙계단 mmWave 고도 급강하 1.2m → 0.3m' },
      ];
    default:
      return [{ lv: 'ok', ts: now, text: `시나리오 1 · 평시 정상 관제 — 전 구역 안전 (센서 ${SENSOR_TOTAL}/${SENSOR_TOTAL})` }];
  }
}

/* ════════════════ 4. 유틸리티 · 훅 ════════════════ */
const pad2 = (n) => String(n).padStart(2, '0');
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
let uidSeed = 0;
const uid = (p) => { uidSeed += 1; return `${p}-${uidSeed}`; };
const levelOf = (score) => (score >= 90 ? 'danger' : score >= 50 ? 'caution' : 'safe');

function kst(ts) {
  const d = new Date(ts + 9 * 3600 * 1000);
  return { y: d.getUTCFullYear(), mo: d.getUTCMonth() + 1, d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes(), s: d.getUTCSeconds(), wd: d.getUTCDay() };
}
const hms = (ts) => { const p = kst(ts); return `${pad2(p.h)}:${pad2(p.mi)}:${pad2(p.s)}`; };
const ymd = (ts) => { const p = kst(ts); return `${p.y}.${pad2(p.mo)}.${pad2(p.d)} (${WEEK[p.wd]})`; };

function dewPoint(t, rh) {
  const a = 17.62; const b = 243.12;
  const g = Math.log(rh / 100) + (a * t) / (b + t);
  return (b * g) / (a - g);
}

function textWidth(str, fs) {
  let w = 0;
  for (const ch of String(str)) {
    const code = ch.charCodeAt(0);
    if (code >= 0x1100) w += 1;
    else if (ch === ' ') w += 0.3;
    else w += 0.6;
  }
  return w * fs;
}

/* Web Speech API(speechSynthesis) 한국어 음성 안내 */
const SPEECH = { voice: null, utter: null };
function loadKoVoice() {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return null;
    const ko = synth.getVoices().filter((v) => /^ko([-_]|$)/i.test(v.lang));
    SPEECH.voice = ko.find((v) => v.localService) || ko[0] || SPEECH.voice;
  } catch (e) { /* 무시 */ }
  return SPEECH.voice;
}
function speakKo(text, onEnd) {
  try {
    const synth = window.speechSynthesis;
    if (!synth || typeof window.SpeechSynthesisUtterance === 'undefined') return 'unsupported';
    if (synth.speaking || synth.pending) synth.cancel();
    const u = new window.SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 1;
    u.pitch = 1;
    u.volume = 1;
    const v = loadKoVoice();
    let voiced = false;
    if (v) { try { u.voice = v; voiced = true; } catch (e) { voiced = false; } }
    u.onend = onEnd;
    u.onerror = onEnd;
    SPEECH.utter = u; // 일부 브라우저에서 onend가 사라지지 않도록 참조 유지
    synth.speak(u);
    if (synth.paused) synth.resume();
    return voiced ? 'ok' : 'novoice';
  } catch (e) {
    return 'unsupported';
  }
}
function stopSpeech() {
  try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) { /* 무시 */ }
}

function useTicker(ms) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

function useElementSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => {
      const w = el.clientWidth; const h = el.clientHeight;
      setSize((s) => (s.width === w && s.height === h ? s : { width: w, height: h }));
    };
    update();
    let ro = null;
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(update); ro.observe(el); }
    window.addEventListener('resize', update);
    return () => { if (ro) ro.disconnect(); window.removeEventListener('resize', update); };
  }, []);
  return [ref, size];
}

function useMedia(query) {
  const read = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false);
  const [match, setMatch] = useState(read);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    if (mq.addEventListener) mq.addEventListener('change', on); else mq.addListener(on);
    return () => { if (mq.removeEventListener) mq.removeEventListener('change', on); else mq.removeListener(on); };
  }, [query]);
  return match;
}

/* 값이 바뀌면 부드럽게 따라가는 숫자(점수 카운트, 층 펼치기 애니메이션) */
function useTween(target, ms) {
  const [val, setVal] = useState(target);
  const cur = useRef(target);
  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const from = cur.current;
    if (reduce || from === target) { cur.current = target; setVal(target); return undefined; }
    const t0 = performance.now();
    let raf = 0;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - p, 3);
      const v = from + (target - from) * e;
      cur.current = v;
      setVal(v);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return val;
}

/* ════════════════ 5. 가상 센서 스트림 (시나리오 연동) ════════════════ */
const DEW_TARGET = { normal: { temp: 7.0, rh: 62, floor: 6.4 }, rain: { temp: 5.8, rh: 90, floor: 4.9 } };
const SIM = {
  scenario: 'normal', since: Date.now(), n: 0, radar: [], sound: [], dew: [], queue: [],
  env: { temp: 7.0, rh: 62, floor: 6.4 }, ver: 0, listeners: new Set(), started: false,
};

function radarSample(ts, i, sc, el) {
  if (sc === 'fire') return { t: hms(ts), v: Math.round((Math.random() - 0.5) * 10), alt: 0.27 + (Math.random() - 0.5) * 0.03, walk: false, still: true };
  const t = i * 0.42;
  let v = 22 * Math.sin(t * 1.6) + 12 * Math.sin(t * 3.9 + 0.7) + (Math.random() - 0.5) * 18;
  const phase = i % 46;
  const forced = sc === 'impact' && el < 14;
  const walk = forced || phase > 34;
  if (walk) {
    const env = forced ? 0.85 : Math.sin(((phase - 34) / 12) * Math.PI);
    v += env * (150 + Math.random() * 50) * Math.sin(t * 5.3);
  }
  return { t: hms(ts), v: Math.round(clamp(v, -245, 245)), alt: 1.16 + (Math.random() - 0.5) * 0.06, walk, still: false };
}
function soundSample(ts, i, sc) {
  if (SIM.queue.length) return { t: hms(ts), db: SIM.queue.shift() };
  if (sc === 'fire') return { t: hms(ts), db: Math.round(clamp(74 + 3 * Math.sin(i / 3) + (Math.random() - 0.5) * 8, 64, 84)) };
  let db = 37 + 4 * Math.sin(i / 6) + (Math.random() - 0.5) * 7;
  if (Math.random() < 0.05) db += 10 + Math.random() * 12;
  return { t: hms(ts), db: Math.round(clamp(db, 28, 70)) };
}
function dewRow(temp, rh, floor, ts) {
  const dew = dewPoint(temp, rh);
  return { t: hms(ts), temp: +temp.toFixed(2), rh: +rh.toFixed(1), floor: +floor.toFixed(2), dew: +dew.toFixed(2), limit: +(dew + 1).toFixed(2) };
}
function simNotify() {
  SIM.ver += 1;
  SIM.listeners.forEach((fn) => fn(SIM.ver));
}
function simTickFast() {
  const now = Date.now();
  const el = (now - SIM.since) / 1000;
  SIM.radar = [...SIM.radar.slice(1), radarSample(now, SIM.n, SIM.scenario, el)];
  SIM.sound = [...SIM.sound.slice(1), soundSample(now, SIM.n, SIM.scenario)];
  SIM.n += 1;
  simNotify();
}
function simTickSlow() {
  const tg = DEW_TARGET[SIM.scenario] || DEW_TARGET.normal;
  const e = SIM.env;
  e.temp += (tg.temp - e.temp) * 0.45 + (Math.random() - 0.5) * 0.06;
  e.rh = clamp(e.rh + (tg.rh - e.rh) * 0.45 + (Math.random() - 0.5) * 0.6, 30, 99);
  e.floor += (tg.floor - e.floor) * 0.45 + (Math.random() - 0.5) * 0.05;
  SIM.dew = [...SIM.dew.slice(1), dewRow(e.temp, e.rh, e.floor, Date.now())];
  simNotify();
}
(function simInit() {
  const now = Date.now();
  for (let i = 71; i >= 0; i -= 1) {
    SIM.radar.push(radarSample(now - i * 500, SIM.n, 'normal', 99));
    if (i < 60) SIM.sound.push(soundSample(now - i * 500, SIM.n, 'normal'));
    SIM.n += 1;
  }
  for (let i = 89; i >= 0; i -= 1) {
    const e = SIM.env;
    SIM.dew.push(dewRow(e.temp + (Math.random() - 0.5) * 0.1, e.rh + (Math.random() - 0.5) * 1, e.floor + (Math.random() - 0.5) * 0.08, now - i * 1000));
  }
}());
function simStart() {
  if (SIM.started) return;
  SIM.started = true;
  setInterval(simTickFast, 500);
  setInterval(simTickSlow, 1000);
}
function simSetScenario(sc, at) {
  SIM.scenario = sc;
  SIM.since = at;
  SIM.queue = [];
  if (sc === 'impact') {
    const s = SIM.sound.slice();
    s[s.length - 1] = { ...s[s.length - 1], db: 85 };
    SIM.sound = s;
    SIM.queue = [74, 58];
  }
  if (sc === 'fire') {
    // 버튼을 누른 시점 = 낙상 후 10초 무동작이 확인된 시점 → 최근 10초(20샘플) 기록을 사고 파형으로 재구성
    const R = SIM.radar.slice();
    const r0 = R.length - 20;
    const spike = [236, -228, 162, -96];
    for (let j = r0; j < R.length; j += 1) {
      const k = j - r0;
      R[j] = { ...R[j], v: k < spike.length ? spike[k] : Math.round((Math.random() - 0.5) * 10), alt: k < 2 ? 1.0 - k * 0.4 : 0.27, walk: false, still: k >= 2 };
    }
    SIM.radar = R;
    const S2 = SIM.sound.slice();
    const s0 = S2.length - 20;
    const burst = [92, 90, 87, 82];
    for (let j = s0; j < S2.length; j += 1) {
      const k = j - s0;
      S2[j] = { ...S2[j], db: k < burst.length ? burst[k] : Math.round(72 + (Math.random() - 0.5) * 8) };
    }
    SIM.sound = S2;
  }
  simNotify();
}
function useSim() {
  const [, setVer] = useState(SIM.ver);
  useEffect(() => {
    SIM.listeners.add(setVer);
    simStart();
    return () => { SIM.listeners.delete(setVer); };
  }, []);
  return SIM;
}

/* ════════════════ 6. SVG 등각투영 3D 건물 엔진 ════════════════ */
const rectPts = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
const RECT_EDGES = [
  { i: 0, j: 1, n: [0, -1], side: 'N' },
  { i: 1, j: 2, n: [1, 0], side: 'E' },
  { i: 2, j: 3, n: [0, 1], side: 'S' },
  { i: 3, j: 0, n: [-1, 0], side: 'W' },
];

/* 벽 선분: 구역 경계를 합치고 문 자리를 비움 */
function floorSegments(f) {
  const map = new Map();
  const rank = { ext: 3, int: 2, rail: 1 };
  const put = (a, b, meta) => {
    const [p, q] = a[0] < b[0] || (a[0] === b[0] && a[1] <= b[1]) ? [a, b] : [b, a];
    const key = `${p[0]},${p[1]},${q[0]},${q[1]}`;
    const old = map.get(key);
    if (old) {
      old.door = old.door || meta.door;
      old.doorW = Math.max(old.doorW, meta.doorW);
      if (rank[meta.style] > rank[old.style]) old.style = meta.style;
    } else {
      map.set(key, { a: p, b: q, ...meta });
    }
  };
  f.zones.forEach((z) => {
    const cs = rectPts(z.x, z.y, z.w, z.h);
    RECT_EDGES.forEach((e) => {
      const a = cs[e.i]; const b = cs[e.j];
      const onEdge = z.type !== 'deck' && ((a[0] === b[0] && (a[0] === 0 || a[0] === BW)) || (a[1] === b[1] && (a[1] === 0 || a[1] === BD)));
      if (z.type === 'corridor' && !onEdge) return;
      if (z.type === 'deck' && e.side === 'N') return;
      const toCorr = (e.side === 'S' && z.y + z.h === CORR_N) || (e.side === 'N' && z.y === CORR_S);
      const door = z.type !== 'corridor' && z.type !== 'deck' && (toCorr || (z.doors || []).includes(e.side));
      put(a, b, { door, doorW: DOOR_W[z.type] || 1.2, style: z.type === 'deck' ? 'rail' : onEdge ? 'ext' : 'int' });
    });
  });
  const out = [];
  map.forEach((w) => {
    if (!w.door) { out.push(w); return; }
    const len = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
    const t0 = (len - Math.min(w.doorW, len * 0.6)) / 2 / len;
    const at = (t) => [w.a[0] + (w.b[0] - w.a[0]) * t, w.a[1] + (w.b[1] - w.a[1]) * t];
    out.push({ ...w, b: at(t0) }, { ...w, a: at(1 - t0) });
  });
  return out;
}

/* 구역별 가구·집기·계단(상자) — 구역 기준 좌표 */
function zoneBoxes(z, furniture) {
  const out = [];
  const add = (x, y, w, d, h, tone) => out.push({ x: z.x + x, y: z.y + y, w, d, h, tone: tone || 'f' });
  const northRow = z.y + z.h <= CORR_N + 1e-6;
  if (z.type === 'stair' || z.type === 'exit') {
    const n = 8; const sd = 0.55; const off = 0.9;
    for (let i = 0; i < n; i += 1) {
      const y = northRow ? z.h - off - (i + 1) * sd : off + i * sd;
      add(0.45, y, z.w - 0.9, sd, 0.2 * (i + 1), 'step');
    }
    return out;
  }
  if (!furniture) return out;
  const ext = (d) => (northRow ? 0.35 : z.h - 0.35 - d);
  const inner = (d) => (northRow ? z.h - 0.5 - d : 0.5);
  switch (z.type) {
    case 'room': {
      const bw = 1.1; const g = (z.w - 3 * bw) / 4;
      for (let i = 0; i < 3; i += 1) add(g + i * (bw + g), ext(2.0), bw, 2.0, 0.55, 'bed');
      add(z.w - 1.75, inner(0.6), 1.3, 0.6, 0.75);
      break;
    }
    case 'restroom':
      for (let i = 0; i < 3; i += 1) add(0.4 + i * 1.6, ext(1.35), 1.35, 1.35, 1.1, 'stall');
      add(z.w - 0.85, 1.6, 0.5, 2.8, 0.85);
      break;
    case 'shower':
      for (let i = 0; i < 4; i += 1) add(0.35 + i * 1.6, ext(1.2), 1.3, 1.2, 1.7, 'stall');
      add(0.4, 1.6, 0.45, 2.2, 0.45);
      break;
    case 'dressing':
      add(0.4, ext(0.5), z.w - 0.8, 0.5, 1.8, 'stall');
      add(1.2, 2.4, z.w - 2.4, 0.5, 0.45);
      break;
    case 'lobby':
      add(0.8, 2.2, 3.0, 0.8, 1.05);
      add(0.8, 3.0, 0.8, 1.6, 1.05);
      add(9.0, 0.9, 3.0, 0.9, 0.45, 'seat');
      add(9.0, 4.1, 3.0, 0.9, 0.45, 'seat');
      add(9.6, 2.4, 1.8, 0.9, 0.4);
      break;
    case 'medical':
      add(0.5, ext(2.0), 1.0, 2.0, 0.65, 'bed');
      add(2.0, ext(2.0), 1.0, 2.0, 0.65, 'bed');
      add(z.w - 0.85, 1.6, 0.5, 2.0, 1.5, 'stall');
      break;
    case 'office':
      add(0.6, 2.2, 1.6, 0.8, 0.75);
      if (z.w >= 6) add(z.w - 2.2, 2.2, 1.6, 0.8, 0.75);
      add(0.5, ext(0.5), Math.min(2.4, z.w - 1), 0.5, 1.5, 'stall');
      break;
    case 'lounge':
      add(0.6, 1.2, 0.9, 2.6, 0.5, 'seat');
      add(1.9, 1.8, 1.2, 1.4, 0.45);
      for (let i = 0; i < 3; i += 1) add(z.w - 1.1 - i * 1.0, ext(0.8), 0.8, 0.8, 0.95, 'stall');
      break;
    case 'dining':
      [0.8, 3.6, 10.0, 12.8].forEach((x) => { add(x, 1.3, 2.2, 0.9, 0.75); add(x, 3.8, 2.2, 0.9, 0.75); });
      break;
    case 'activity': {
      const tw = z.w / 2 - 1.2;
      [0.8, z.w / 2 + 0.4].forEach((x) => { add(x, 1.4, tw, 0.9, 0.75); add(x, 3.6, tw, 0.9, 0.75); });
      break;
    }
    case 'auditorium':
      add(z.w - 4.6, 0.4, 4.2, z.h - 0.8, 0.6, 'stage');
      for (let i = 0; i < 8; i += 1) add(1.0 + i * 2.2, 0.5, 0.5, 3.9, 0.45, 'seat');
      break;
    case 'utility':
      add(0.4, ext(0.6), z.w - 0.8, 0.6, 1.6, 'stall');
      add(0.8, 2.4, 1.4, 1.2, 0.9);
      break;
    case 'deck':
      add(0.8, z.h - 1.2, 3.2, 0.5, 0.45, 'wood');
      add(z.w - 4.0, z.h - 1.2, 3.2, 0.5, 0.45, 'wood');
      add(0.4, 0.5, 0.8, 0.8, 0.6, 'plant');
      add(z.w - 1.2, 0.5, 0.8, 0.8, 0.6, 'plant');
      break;
    default:
      break;
  }
  return out;
}

/* 화가 알고리즘용 앞뒤 판정(평면 AABB 분리축) */
function behind(a, b, s, c) {
  const E = 1e-6;
  let vx = 0; let vy = 0;
  if (s > E) { if (a.x1 <= b.x0 + E) vx = -1; else if (b.x1 <= a.x0 + E) vx = 1; } else if (s < -E) { if (a.x0 >= b.x1 - E) vx = -1; else if (b.x0 >= a.x1 - E) vx = 1; }
  if (c > E) { if (a.y1 <= b.y0 + E) vy = -1; else if (b.y1 <= a.y0 + E) vy = 1; } else if (c < -E) { if (a.y0 >= b.y1 - E) vy = -1; else if (b.y0 >= a.y1 - E) vy = 1; }
  if (vx && vy && vx !== vy) return 0;
  return vx || vy;
}
function topoOrder(items, s, c) {
  const n = items.length;
  const depth = (it) => ((it.box.x0 + it.box.x1) / 2) * s + ((it.box.y0 + it.box.y1) / 2) * c;
  const indeg = new Array(n).fill(0);
  const adj = items.map(() => []);
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      const r = behind(items[i].box, items[j].box, s, c);
      if (r === -1) { adj[i].push(j); indeg[j] += 1; } else if (r === 1) { adj[j].push(i); indeg[i] += 1; }
    }
  }
  const ready = [];
  for (let i = 0; i < n; i += 1) if (!indeg[i]) ready.push(i);
  const out = [];
  while (ready.length) {
    ready.sort((u, v) => depth(items[u]) - depth(items[v]));
    const u = ready.shift();
    out.push(u);
    adj[u].forEach((v) => { indeg[v] -= 1; if (!indeg[v]) ready.push(v); });
  }
  if (out.length < n) {
    const rest = [];
    for (let i = 0; i < n; i += 1) if (!out.includes(i)) rest.push(i);
    rest.sort((u, v) => depth(items[u]) - depth(items[v])).forEach((i) => out.push(i));
  }
  return out;
}

/* 층별 그리기 순서(시점·가구 표시별 캐시): 벽은 '보는 쪽 구역'에 붙여 그 구역 가구보다 먼저 그림 */
const PLAN_CACHE = new Map();
function planFloor(fid, theta, furniture) {
  const key = `${fid}|${theta}|${furniture ? 1 : 0}`;
  const hit = PLAN_CACHE.get(key);
  if (hit) return hit;
  const f = FLOOR_MAP[fid];
  const th = (theta * Math.PI) / 180;
  const s = Math.sin(th); const c = Math.cos(th);
  const zones = f.zones;
  const zoneAt = (px, py) => zones.findIndex((z) => px > z.x + 1e-6 && px < z.x + z.w - 1e-6 && py > z.y + 1e-6 && py < z.y + z.h - 1e-6);
  const groups = zones.map(() => []);
  const front = [];
  floorSegments(f).forEach((w) => {
    const horiz = Math.abs(w.a[1] - w.b[1]) < 1e-9;
    const box = horiz
      ? { x0: Math.min(w.a[0], w.b[0]), x1: Math.max(w.a[0], w.b[0]), y0: w.a[1] - WALL_T / 2, y1: w.a[1] + WALL_T / 2 }
      : { x0: w.a[0] - WALL_T / 2, x1: w.a[0] + WALL_T / 2, y0: Math.min(w.a[1], w.b[1]), y1: Math.max(w.a[1], w.b[1]) };
    let nx = horiz ? 0 : 1; let ny = horiz ? 1 : 0;
    if (nx * s + ny * c < 0) { nx = -nx; ny = -ny; }
    const mx = (w.a[0] + w.b[0]) / 2; const my = (w.a[1] + w.b[1]) / 2;
    const zi = zoneAt(mx + nx * 0.4, my + ny * 0.4);
    const inside = zi >= 0 && zones[zi].type !== 'deck';
    const role = w.style === 'rail' ? 'rail' : w.style === 'int' ? 'int' : inside ? 'back' : 'front';
    const item = { kind: 'wall', role, horiz, box, a: w.a, b: w.b };
    if (zi >= 0) groups[zi].push(item); else front.push(item);
  });
  zones.forEach((z, zi) => {
    zoneBoxes(z, furniture).forEach((bx) => groups[zi].push({ kind: 'box', box: { x0: bx.x, x1: bx.x + bx.w, y0: bx.y, y1: bx.y + bx.d }, h: bx.h, tone: bx.tone }));
  });
  const zoneOrder = topoOrder(zones.map((z) => ({ box: { x0: z.x, x1: z.x + z.w, y0: z.y, y1: z.y + z.h } })), s, c);
  const ordered = [];
  zoneOrder.forEach((zi) => { const g = groups[zi]; topoOrder(g, s, c).forEach((k) => ordered.push(g[k])); });
  const res = { ordered, front: topoOrder(front, s, c).map((k) => front[k]) };
  PLAN_CACHE.set(key, res);
  return res;
}

const ZONE_ALPHA = { room: 0.2, corridor: 0.08, stair: 0.12, exit: 0.3, lobby: 0.13, medical: 0.15, office: 0.15, lounge: 0.14, dining: 0.13, activity: 0.14, auditorium: 0.13, utility: 0.1, restroom: 0.17, shower: 0.17, dressing: 0.17 };
const THEMES = {
  dash: {
    slabTop: '#0f2139', slabSide: ['#0b1830', '#081324'], slabEdge: 'rgba(96,165,250,0.3)',
    walls: {
      int: { x: 'rgba(150,195,255,0.17)', y: 'rgba(120,165,235,0.14)', top: 'rgba(195,225,255,0.68)' },
      back: { x: 'rgba(120,165,230,0.26)', y: 'rgba(100,145,215,0.22)', top: 'rgba(210,232,255,0.78)' },
      front: { x: 'rgba(150,195,255,0.2)', y: 'rgba(120,165,235,0.17)', top: 'rgba(210,232,255,0.82)' },
      rail: { x: 'rgba(253,186,116,0.34)', y: 'rgba(251,146,60,0.3)', top: 'rgba(254,215,170,0.85)' },
    },
    glass: { safe: 'rgba(125,190,255,0.09)', caution: 'rgba(245,158,11,0.16)', danger: 'rgba(239,68,68,0.2)' },
    glassLine: 'rgba(170,210,255,0.34)', window: 'rgba(125,211,252,0.26)', windowLine: 'rgba(186,230,253,0.55)',
    furn: {
      f: { x: 'rgba(150,192,240,0.2)', y: 'rgba(120,165,225,0.18)', top: 'rgba(196,224,255,0.3)' },
      bed: { top: 'rgba(103,232,249,0.32)' },
      seat: { top: 'rgba(196,181,253,0.3)' },
      stage: { x: 'rgba(251,191,36,0.18)', y: 'rgba(217,119,6,0.18)', top: 'rgba(251,191,36,0.3)' },
      stall: { top: 'rgba(203,213,225,0.3)' },
      step: { x: 'rgba(170,205,245,0.26)', y: 'rgba(140,180,235,0.24)', top: 'rgba(214,234,255,0.42)' },
      wood: { x: 'rgba(180,120,60,0.45)', y: 'rgba(150,95,45,0.45)', top: 'rgba(222,170,110,0.6)' },
      plant: { x: 'rgba(22,101,52,0.6)', y: 'rgba(20,83,45,0.6)', top: 'rgba(74,222,128,0.55)' },
    },
    furnLine: 'rgba(210,235,255,0.35)',
    tile(z, st) {
      if (z.type === 'deck' && st === 'safe') return { fill: 'rgba(140,94,50,0.62)', stroke: 'rgba(74,222,128,0.55)' };
      if (z.type === 'deck') return { fill: st === 'caution' ? 'rgba(217,119,6,0.6)' : 'rgba(220,38,38,0.6)', stroke: LV[st].color };
      const a = (ZONE_ALPHA[z.type] || 0.14) + (st === 'safe' ? 0 : 0.24);
      return { fill: `rgba(${RGB[st]},${a.toFixed(2)})`, stroke: `rgba(${RGB[st]},${st === 'safe' ? 0.4 : 0.95})` };
    },
    planks: 'rgba(253,186,116,0.3)', label: '#d9e9ff', labelHalo: 'rgba(8,18,34,0.9)', hl: '#67e8f9',
    guide: 'rgba(96,165,250,0.4)', hatch: 'rgba(251,191,36,0.3)', shadowOpacity: 0.6, shadowBlur: 9,
    glowSafe: true,
  },
  mobile: {
    slabTop: '#3a414b', slabSide: ['#23282f', '#1c2026'], slabEdge: 'rgba(0,0,0,0.35)',
    walls: {
      int: { x: '#79818c', y: '#6b737e', top: '#c4cbd4' },
      back: { x: '#858d98', y: '#757d88', top: '#d5dbe2' },
      front: { x: '#7e8690', y: '#707883', top: '#d5dbe2' },
      rail: { x: '#8b6b47', y: '#7a5c3c', top: '#c9a57a' },
    },
    glass: { safe: 'transparent', caution: 'transparent', danger: 'transparent' },
    glassLine: 'transparent', window: null, windowLine: null,
    furn: { f: { x: '#6b737e', y: '#5d6570', top: '#8a939f' }, step: { x: '#6b737e', y: '#5d6570', top: '#8f98a4' } },
    furnLine: 'rgba(0,0,0,0.2)',
    tile(z, st) {
      if (st === 'danger') return { fill: 'rgba(239,68,68,0.5)', stroke: 'rgba(248,113,113,0.95)' };
      if (st === 'caution') return { fill: 'rgba(245,158,11,0.55)', stroke: 'rgba(252,211,77,0.95)' };
      const fills = { corridor: '#4b535f', exit: 'rgba(22,163,74,0.55)', stair: '#3e454e', deck: '#6e5236', room: '#3f4650' };
      return { fill: fills[z.type] || '#434a55', stroke: 'rgba(0,0,0,0.25)' };
    },
    planks: 'rgba(255,210,150,0.3)', label: '#e6eaef', labelHalo: 'rgba(38,44,52,0.92)', hl: '#93c5fd',
    guide: 'transparent', hatch: 'transparent', shadowOpacity: 0.55, shadowBlur: 7, glowSafe: false,
  },
};

function buildGeometry(p) {
  const { width, height } = p;
  if (!width || !height || width < 80 || height < 80) return null;
  const T = THEMES[p.theme];
  const th = (p.theta * Math.PI) / 180;
  const c = Math.cos(th); const s = Math.sin(th);
  const cx = BW / 2; const cy = BD / 2;
  const multi = p.floorIds.length > 1;
  const grid2d = !p.mode3d && multi;
  const cols = p.cols || 2;
  const st = p.statusMap || {};
  const placed = p.floorIds.map((id, i) => ({
    id, f: FLOOR_MAP[id], z0: p.mode3d ? i * p.gap : 0,
    ox: grid2d ? (i % cols) * (BW + 8) : 0, oy: grid2d ? Math.floor(i / cols) * 35 : 0,
  }));
  const top = placed.length - 1;
  const P = (x, y, z, pl) => {
    const dx = x + pl.ox - cx; const dy = y + pl.oy - cy;
    const rx = dx * c - dy * s; const ry = dx * s + dy * c;
    return [rx, ry * p.k - (z + pl.z0) * p.zs];
  };
  let x0 = Infinity; let x1 = -Infinity; let y0 = Infinity; let y1 = -Infinity;
  const grow = (q) => { if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1]; };

  const raw = placed.map((pl, fi) => {
    const f = pl.f;
    const Pz = (x, y, z) => P(x, y, z, pl);
    const worst = f.zones.reduce((w, z) => {
      const v = st[z.id];
      return v === 'danger' || w === 'danger' ? 'danger' : v === 'caution' || w === 'caution' ? 'caution' : 'safe';
    }, 'safe');
    const deck = f.zones.find((z) => z.type === 'deck');
    const slabDefs = [{ x: 0, y: 0, w: BW, h: BD, t: 0.35 }];
    if (deck) slabDefs.push({ x: deck.x, y: deck.y, w: deck.w, h: deck.h, t: 0.25 });
    const slabs = slabDefs.map((d) => {
      const cs = rectPts(d.x, d.y, d.w, d.h);
      const topPts = cs.map(([x, y]) => Pz(x, y, 0));
      const sides = p.mode3d
        ? RECT_EDGES.filter((e) => e.n[0] * s + e.n[1] * c > 1e-6).map((e) => {
          const a = cs[e.i]; const b = cs[e.j];
          return [Pz(a[0], a[1], 0), Pz(b[0], b[1], 0), Pz(b[0], b[1], -d.t), Pz(a[0], a[1], -d.t)];
        })
        : [];
      topPts.forEach(grow);
      sides.forEach((q) => q.forEach(grow));
      return { top: topPts, sides };
    });
    const tiles = f.zones.map((z) => {
      const zs = st[z.id] || 'safe';
      const planks = [];
      if (z.type === 'deck') for (let xx = z.x + 0.75; xx < z.x + z.w - 0.2; xx += 0.75) planks.push([Pz(xx, z.y + 0.15, 0.03), Pz(xx, z.y + z.h - 0.15, 0.03)]);
      return { z, st: zs, style: T.tile(z, zs), pts: rectPts(z.x, z.y, z.w, z.h).map(([x, y]) => Pz(x, y, 0.02)), ctr: Pz(z.x + z.w / 2, z.y + z.h / 2, 0.02), planks };
    });

    const list = [];
    const front = [];
    const emit = (arr, item) => { arr.push(item); if (item.pts) item.pts.forEach(grow); if (item.a2) { grow(item.a2); grow(item.b2); } };
    const glassMode = p.frontH >= 1.6 && T.window !== null;
    const drawWall = (it, arr) => {
      const role = it.role;
      const h = role === 'rail' ? 0.55 : role === 'int' ? p.intH : role === 'back' ? p.backH : p.frontH;
      if (h <= 0.01) return;
      const col = T.walls[role];
      if (role === 'front' && glassMode && p.mode3d) {
        const [ax, ay] = it.a; const [bx, by] = it.b;
        emit(arr, { pts: [Pz(ax, ay, 0), Pz(bx, by, 0), Pz(bx, by, h), Pz(ax, ay, h)], fill: T.glass[worst], stroke: T.glassLine, sw: 0.8, pick: pl.id, cls: worst === 'safe' ? '' : `st-glow-${worst}` });
        const L = Math.hypot(bx - ax, by - ay);
        const n = Math.max(1, Math.round(L / 2));
        for (let i = 1; i < n; i += 1) {
          const t = i / n; const mx = ax + (bx - ax) * t; const my = ay + (by - ay) * t;
          emit(arr, { line: true, a2: Pz(mx, my, 0), b2: Pz(mx, my, h), stroke: T.glassLine, sw: 0.7 });
        }
        emit(arr, { line: true, a2: Pz(ax, ay, h * 0.34), b2: Pz(bx, by, h * 0.34), stroke: T.glassLine, sw: 0.7 });
        emit(arr, { line: true, a2: Pz(ax, ay, h), b2: Pz(bx, by, h), stroke: col.top, sw: 1.4 });
        return;
      }
      const b = it.box;
      if (p.zs > 0) {
        if (it.horiz && Math.abs(c) > 1e-6) {
          const fy = c > 0 ? b.y1 : b.y0;
          emit(arr, { pts: [Pz(b.x0, fy, 0), Pz(b.x1, fy, 0), Pz(b.x1, fy, h), Pz(b.x0, fy, h)], fill: col.y });
        } else if (!it.horiz && Math.abs(s) > 1e-6) {
          const fx = s > 0 ? b.x1 : b.x0;
          emit(arr, { pts: [Pz(fx, b.y0, 0), Pz(fx, b.y1, 0), Pz(fx, b.y1, h), Pz(fx, b.y0, h)], fill: col.x });
        }
        if (role === 'back' && T.window && h >= 2.0) {
          const L = it.horiz ? b.x1 - b.x0 : b.y1 - b.y0;
          const n = Math.floor(L / 2.3);
          const zA = 0.95; const zB = Math.min(h - 0.35, 2.05);
          for (let i = 0; i < n; i += 1) {
            const m = (it.horiz ? b.x0 : b.y0) + (i + 0.5) * (L / n);
            const pts = it.horiz
              ? [Pz(m - 0.6, c > 0 ? b.y1 : b.y0, zA), Pz(m + 0.6, c > 0 ? b.y1 : b.y0, zA), Pz(m + 0.6, c > 0 ? b.y1 : b.y0, zB), Pz(m - 0.6, c > 0 ? b.y1 : b.y0, zB)]
              : [Pz(s > 0 ? b.x1 : b.x0, m - 0.6, zA), Pz(s > 0 ? b.x1 : b.x0, m + 0.6, zA), Pz(s > 0 ? b.x1 : b.x0, m + 0.6, zB), Pz(s > 0 ? b.x1 : b.x0, m - 0.6, zB)];
            emit(arr, { pts, fill: T.window, stroke: T.windowLine, sw: 0.6 });
          }
        }
      }
      emit(arr, { pts: [Pz(b.x0, b.y0, h), Pz(b.x1, b.y0, h), Pz(b.x1, b.y1, h), Pz(b.x0, b.y1, h)], fill: col.top });
    };
    const drawBox = (it, arr) => {
      const tone = T.furn[it.tone] || T.furn.f;
      const base = T.furn.f;
      const b = it.box; const h = it.h;
      if (p.zs > 0) {
        if (Math.abs(s) > 1e-6) { const fx = s > 0 ? b.x1 : b.x0; emit(arr, { pts: [Pz(fx, b.y0, 0), Pz(fx, b.y1, 0), Pz(fx, b.y1, h), Pz(fx, b.y0, h)], fill: tone.x || base.x }); }
        if (Math.abs(c) > 1e-6) { const fy = c > 0 ? b.y1 : b.y0; emit(arr, { pts: [Pz(b.x0, fy, 0), Pz(b.x1, fy, 0), Pz(b.x1, fy, h), Pz(b.x0, fy, h)], fill: tone.y || base.y }); }
      }
      emit(arr, { pts: [Pz(b.x0, b.y0, h), Pz(b.x1, b.y0, h), Pz(b.x1, b.y1, h), Pz(b.x0, b.y1, h)], fill: tone.top || base.top, stroke: T.furnLine, sw: 0.6 });
    };
    const plan = planFloor(pl.id, p.mode3d ? p.theta : 0, p.furniture);
    plan.ordered.forEach((it) => (it.kind === 'wall' ? drawWall(it, list) : drawBox(it, list)));
    plan.front.forEach((it) => drawWall(it, front));
    return { pl, fi, worst, slabs, tiles, list, front, showLabels: !p.labelsTopOnly || fi === top };
  });

  const tagMode = p.tags && multi ? (p.mode3d ? 'side' : 'top') : null;
  const tagW = (title) => (p.tagCompact ? 38 : 48 + textWidth(title, 12));
  const padR = p.pad.r + (tagMode === 'side' ? (p.tagCompact ? 50 : 150) : 0);
  const padT = p.pad.t + (tagMode === 'top' ? 30 : 0);
  const availW = Math.max(40, width - p.pad.l - padR);
  const availH = Math.max(40, height - padT - p.pad.b);
  const bw = Math.max(1e-6, x1 - x0); const bh = Math.max(1e-6, y1 - y0);
  const sc = Math.min(availW / bw, availH / bh);
  const ox = p.pad.l + (availW - bw * sc) / 2 - x0 * sc;
  const oy = padT + (availH - bh * sc) / 2 - y0 * sc;
  const S = (q) => [q[0] * sc + ox, q[1] * sc + oy];
  const str = (arr) => arr.map((q) => { const v = S(q); return `${v[0].toFixed(1)},${v[1].toFixed(1)}`; }).join(' ');
  const fs = clamp(sc * p.labelK, p.labelMin, p.labelMax);
  const conv = (it) => (it.line
    ? { line: true, a: S(it.a2), b: S(it.b2), stroke: it.stroke, sw: it.sw }
    : { pts: str(it.pts), fill: it.fill, stroke: it.stroke, sw: it.sw, pick: it.pick, cls: it.cls });

  const floors = raw.map(({ pl, worst, slabs, tiles, list, front, showLabels }) => ({
    id: pl.id, title: pl.f.title, worst,
    slabs: slabs.map((sl) => ({ top: str(sl.top), sides: sl.sides.map(str), topPts: sl.top.map(S) })),
    tiles: tiles.map(({ z, st: zst, style, pts, ctr, planks }) => {
      const sp = pts.map(S);
      const xs = sp.map((v) => v[0]); const ys = sp.map((v) => v[1]);
      const zw = Math.max(...xs) - Math.min(...xs);
      const zh = Math.max(...ys) - Math.min(...ys);
      const cc = S(ctr);
      const room = (p.mode3d ? 0.6 : 0.88) * zw;
      const cands = p.short ? [z.short] : [z.name, z.short];
      let label = null;
      if (showLabels) {
        for (let i = 0; i < cands.length && !label; i += 1) {
          const t = cands[i];
          const fitsH = fs * 1.25 <= zh * (z.type === 'exit' ? 0.5 : 0.9);
          if (textWidth(t, fs) <= room && fitsH) label = { text: t, x: cc[0], y: cc[1] + (z.type === 'exit' ? fs * 1.2 : 0), fs };
        }
      }
      const d = planks.map(([a, b]) => { const u = S(a); const v = S(b); return `M${u[0].toFixed(1)} ${u[1].toFixed(1)}L${v[0].toFixed(1)} ${v[1].toFixed(1)}`; }).join('');
      return { z, st: zst, fill: style.fill, stroke: style.stroke, pts: str(pts), c: cc, label, d };
    }),
    list: list.map(conv),
    front: front.map(conv),
  }));

  const shadow = [];
  if (p.mode3d) {
    const pl = placed[0];
    shadow.push(str(rectPts(-1, -1, BW + 2, BD + 2).map(([x, y]) => P(x, y, -0.8, pl))));
    const deck = pl.f.zones.find((z) => z.type === 'deck');
    if (deck) shadow.push(str(rectPts(deck.x - 0.8, deck.y, deck.w + 1.6, deck.h + 0.8).map(([x, y]) => P(x, y, -0.6, pl))));
  }
  const guides = [];
  if (p.mode3d && multi && p.gap > FLOOR_H + 0.6) {
    const cs = rectPts(0, 0, BW, BD);
    for (let i = 0; i < placed.length - 1; i += 1) {
      cs.forEach(([x, y]) => {
        const a = S(P(x, y, 0, placed[i])); const b = S(P(x, y, -0.35, placed[i + 1]));
        guides.push([a[0], a[1], b[0], b[1]]);
      });
    }
  }
  const tags = [];
  floors.forEach((F) => {
    const pts = F.slabs[0].topPts;
    const w = tagW(F.title);
    if (tagMode === 'side') {
      const r = pts.reduce((m, q) => (q[0] > m[0] ? q : m), pts[0]);
      tags.push({ id: F.id, title: F.title, worst: F.worst, ax: r[0] + 4, ay: r[1], x: Math.min(width - w - 6, r[0] + (p.tagCompact ? 10 : 22)), y: r[1], w, lead: true, compact: p.tagCompact });
    } else if (tagMode === 'top') {
      const tl = pts.reduce((m, q) => (q[0] + q[1] < m[0] + m[1] ? q : m), pts[0]);
      tags.push({ id: F.id, title: F.title, worst: F.worst, x: tl[0], y: tl[1] - 18, w, lead: false, compact: p.tagCompact });
    }
  });
  const floorIndex = (fid) => placed.findIndex((pl) => pl.id === fid);
  const toScreen = (x, y, z = 0, fi = 0) => S(P(x, y, z, placed[fi] || placed[0]));
  return { width, height, sc, floors, shadow, guides, tags, toScreen, floorIndex };
}

function useIsoGeometry(params) {
  const key = JSON.stringify(params);
  return useMemo(() => buildGeometry(params), [key]); // eslint-disable-line react-hooks/exhaustive-deps
}

/* 정적인 건물 레이어(호버와 분리해 메모) */
const BuildingLayer = React.memo(function BuildingLayer({ geo, theme, layers, mute, onHover, onSelect, onFloorPick }) {
  const ids = useMemo(() => ({ hatch: uid('hatch'), blur: uid('blur'), glow: uid('glow') }), []);
  const T = THEMES[theme];
  const L = layers || { labels: true };
  const muted = (id) => Boolean(mute && mute.includes(id));
  const draw = (it, i, pickable) => {
    if (it.line) return <line key={i} x1={it.a[0]} y1={it.a[1]} x2={it.b[0]} y2={it.b[1]} stroke={it.stroke} strokeWidth={it.sw} pointerEvents="none" />;
    const canPick = pickable && it.pick && onFloorPick;
    return (
      <polygon
        key={i} points={it.pts} fill={it.fill} stroke={it.stroke || 'none'} strokeWidth={it.sw || 0} className={it.cls || undefined}
        pointerEvents={canPick ? 'visiblePainted' : 'none'} style={canPick ? { cursor: 'pointer' } : undefined}
        onClick={canPick ? (e) => { e.stopPropagation(); onFloorPick(it.pick); } : undefined}
      />
    );
  };
  return (
    <g>
      <defs>
        <pattern id={ids.hatch} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="2.2" height="6" fill={T.hatch} />
        </pattern>
        <filter id={ids.blur} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={T.shadowBlur} /></filter>
        <filter id={ids.glow} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      {geo.shadow.map((pts, i) => <polygon key={`sh${i}`} points={pts} fill="#000" opacity={T.shadowOpacity} filter={`url(#${ids.blur})`} />)}
      {geo.guides.map((g, i) => <line key={`gd${i}`} x1={g[0]} y1={g[1]} x2={g[2]} y2={g[3]} stroke={T.guide} strokeWidth="1" strokeDasharray="3 4" />)}
      {geo.floors.map((F) => {
        const caution = F.tiles.filter((t) => t.st === 'caution');
        const danger = F.tiles.filter((t) => t.st === 'danger');
        return (
          <g key={F.id}>
            {F.slabs.map((sl, i) => (
              <g key={`sl${i}`}>
                {sl.sides.map((pts, j) => <polygon key={j} points={pts} fill={T.slabSide[j % 2]} stroke={T.slabEdge} strokeWidth="0.6" />)}
                <polygon points={sl.top} fill={T.slabTop} stroke={T.slabEdge} strokeWidth="1" />
              </g>
            ))}
            {F.tiles.map((t) => (
              <polygon
                key={t.z.id} points={t.pts} fill={t.fill} stroke={t.stroke} strokeWidth="1"
                onMouseEnter={onHover ? () => onHover(t.z.id) : undefined}
                onMouseLeave={onHover ? () => onHover(null) : undefined}
                onClick={onSelect ? (e) => { e.stopPropagation(); onSelect(t.z.id, F.id); } : undefined}
                style={{ cursor: onSelect ? 'pointer' : 'default', transition: 'fill .4s ease' }}
              />
            ))}
            <g pointerEvents="none">
              {F.tiles.map((t) => (t.d ? <path key={`pl${t.z.id}`} d={t.d} stroke={T.planks} strokeWidth="1" fill="none" /> : null))}
              {T.glowSafe && (
                <g className="st-glow-safe">
                  {F.tiles.filter((t) => t.st === 'safe' && t.z.type !== 'corridor').map((t) => (
                    <polygon key={`gs${t.z.id}`} points={t.pts} fill="none" stroke="rgba(74,222,128,0.55)" strokeWidth="2" strokeLinejoin="round" />
                  ))}
                </g>
              )}
              {caution.length > 0 && (
                <g className="st-glow-caution">
                  {caution.map((t) => <polygon key={`gc${t.z.id}`} points={t.pts} fill="rgba(245,158,11,0.22)" stroke="#fbbf24" strokeWidth="6" strokeLinejoin="round" filter={`url(#${ids.glow})`} />)}
                </g>
              )}
              {danger.length > 0 && (
                <g className="st-glow-danger">
                  {danger.map((t) => <polygon key={`gd${t.z.id}`} points={t.pts} fill="rgba(239,68,68,0.42)" stroke="#f87171" strokeWidth="7" strokeLinejoin="round" filter={`url(#${ids.glow})`} />)}
                </g>
              )}
              {L.blind && F.tiles.filter((t) => isBlind(t.z)).map((t) => <polygon key={`b${t.z.id}`} points={t.pts} fill={`url(#${ids.hatch})`} />)}
              {F.list.map((it, i) => draw(it, i, false))}
            </g>
            <g>{F.front.map((it, i) => draw(it, i, true))}</g>
            <g pointerEvents="none">
              {[...caution, ...danger].map((t) => <polygon key={`o${t.z.id}`} points={t.pts} fill="none" stroke={LV[t.st].color} strokeWidth="1.6" />)}
              {F.tiles.filter((t) => t.z.type === 'exit' && !muted(t.z.id)).map((t) => (
                <g key={`x${t.z.id}`} transform={`translate(${(t.c[0] - 8).toFixed(1)},${(t.c[1] - 8).toFixed(1)})`}>
                  <rect width="16" height="16" rx="4" fill="#16a34a" stroke="rgba(255,255,255,0.85)" strokeWidth="1" />
                  <DoorOpen x={2.5} y={2.5} size={11} color="#fff" strokeWidth={2.4} />
                </g>
              ))}
              {L.sensors && F.tiles.map((t) => {
                const sens = zoneSensors(t.z);
                if (!sens.length) return null;
                const yy = t.c[1] - (t.label ? t.label.fs + 5 : 0);
                return (
                  <g key={`s${t.z.id}`}>
                    {sens.map((k, i) => <circle key={k} cx={t.c[0] + (i - (sens.length - 1) / 2) * 9} cy={yy} r="3.4" fill={SENSOR_COLOR[k]} stroke="#0a1424" strokeWidth="1.2" />)}
                  </g>
                );
              })}
              {L.labels !== false && F.tiles.map((t) => (t.label && !muted(t.z.id) ? (
                <text
                  key={`t${t.z.id}`} x={t.label.x} y={t.label.y} fontSize={t.label.fs} textAnchor="middle" dominantBaseline="central"
                  fill={T.label} stroke={T.labelHalo} strokeWidth="3" fontWeight="600" style={{ paintOrder: 'stroke' }}
                >
                  {t.label.text}
                </text>
              ) : null))}
            </g>
          </g>
        );
      })}
      {geo.tags.map((t) => {
        const tone = t.worst === 'safe' ? 'rgba(96,165,250,0.5)' : LV[t.worst].color;
        return (
          <g
            key={`tag${t.id}`} style={{ cursor: onFloorPick ? 'pointer' : 'default' }}
            onClick={onFloorPick ? (e) => { e.stopPropagation(); onFloorPick(t.id); } : undefined}
          >
            {t.lead && <line x1={t.ax} y1={t.ay} x2={t.x} y2={t.y} stroke={T.guide} strokeWidth="1" />}
            <rect x={t.x} y={t.y - 13} width={t.w} height="26" rx="8" fill="rgba(13,27,48,0.94)" stroke={tone} strokeWidth={t.worst === 'safe' ? 1 : 1.6} className={t.worst === 'safe' ? undefined : `st-glow-${t.worst}`} />
            <text x={t.compact ? t.x + t.w / 2 : t.x + 10} y={t.y} textAnchor={t.compact ? 'middle' : 'start'} dominantBaseline="central" fontSize="12.5" fontWeight="700" fill="#fff">{t.id}</text>
            {!t.compact && <text x={t.x + 36} y={t.y} dominantBaseline="central" fontSize="12" fill={N.sub}>{t.title}</text>}
          </g>
        );
      })}
    </g>
  );
});

function IsoSvg({ geo, theme, layers, mute, hoverId, selId, floorHover, onHover, onSelect, onFloorPick, children }) {
  const T = THEMES[theme];
  const hl = useMemo(() => {
    const out = [];
    geo.floors.forEach((F) => F.tiles.forEach((t) => {
      if (t.z.id === hoverId || t.z.id === selId) out.push({ id: t.z.id, pts: t.pts, sel: t.z.id === selId });
    }));
    return out;
  }, [geo, hoverId, selId]);
  const hf = floorHover && hoverId ? geo.floors.find((F) => F.tiles.some((t) => t.z.id === hoverId)) : null;
  return (
    <svg
      width={geo.width} height={geo.height} viewBox={`0 0 ${geo.width} ${geo.height}`}
      className="absolute inset-0 block select-none" role="img" aria-label="수련원 건물 층별 구역 배치도"
      onClick={onSelect ? () => onSelect(null) : undefined}
    >
      <BuildingLayer geo={geo} theme={theme} layers={layers} mute={mute} onHover={onHover} onSelect={onSelect} onFloorPick={onFloorPick} />
      {hf && <polygon points={hf.slabs[0].top} fill="rgba(103,232,249,0.06)" stroke={T.hl} strokeWidth="1.6" strokeDasharray="5 4" pointerEvents="none" />}
      {hl.map((h) => <polygon key={`hl${h.id}`} points={h.pts} fill="rgba(103,232,249,0.08)" stroke={T.hl} strokeWidth={h.sel ? 2.4 : 1.6} pointerEvents="none" />)}
      {children}
    </svg>
  );
}

/* ════════════════ 7. 공통 UI 조각 ════════════════ */
function LogoMark({ size = 30, tone = 'cyan' }) {
  const id = useMemo(() => uid('logo'), []);
  const [c1, c2] = tone === 'red' ? ['#ff5a5f', '#c8101d'] : ['#22d3ee', '#2563eb'];
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c1} /><stop offset="1" stopColor={c2} /></linearGradient>
      </defs>
      <path d="M22 4.5H12.5a6 6 0 0 0-6 6v.8a6 6 0 0 0 3.3 5.4l3.2 1.6" fill="none" stroke={`url(#${id})`} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 27.5h9.5a6 6 0 0 0 6-6v-.8a6 6 0 0 0-3.3-5.4l-3.2-1.6" fill="none" stroke={`url(#${id})`} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.88" />
    </svg>
  );
}

function StatusChip({ level = 'safe', label }) {
  const L = LV[level];
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: L.bg, color: L.text }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: L.color }} />
      {label || L.label}
    </span>
  );
}

function Panel({ icon: Icon, title, hint, children, tone }) {
  return (
    <section
      className="rounded-2xl border p-3.5 transition-colors sm:p-4"
      style={{ background: 'linear-gradient(180deg,#0f1d33,#0c182b)', borderColor: tone || N.line, boxShadow: tone ? `0 0 0 1px ${tone}33, 0 0 22px ${tone}22` : 'none' }}
    >
      <header className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg" style={{ background: 'rgba(56,189,248,0.12)', color: N.sky }}><Icon size={15} /></span>
          <h3 className="truncate font-semibold text-white" style={{ fontSize: 15 }}>{title}</h3>
        </div>
        <span className="shrink-0 text-xs" style={{ color: N.sub }}>{hint}</span>
      </header>
      {children}
    </section>
  );
}

function MetaRow({ where, label, level = 'safe' }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2 text-xs" style={{ color: N.sub }}>
      <span className="flex min-w-0 items-center gap-1.5 truncate"><MapPin size={12} className="shrink-0" />{where}</span>
      <StatusChip level={level} label={label} />
    </div>
  );
}

function Stat({ label, value, unit, tone }) {
  return (
    <div className="min-w-0 rounded-lg px-2.5 py-2" style={{ background: '#0a1628' }}>
      <div className="truncate text-xs" style={{ color: N.mute }}>{label}</div>
      <div className="st-num mt-0.5 truncate text-sm font-semibold" style={{ color: tone || N.text }}>
        {value}{unit ? <span className="ml-0.5 text-xs font-normal" style={{ color: N.sub }}>{unit}</span> : null}
      </div>
    </div>
  );
}

function IconBtn({ label, onClick, active, disabled, children }) {
  return (
    <button
      type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}
      className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40"
      style={{ background: active ? 'rgba(37,99,235,0.38)' : 'rgba(11,23,42,0.88)', borderColor: active ? 'rgba(96,165,250,0.75)' : N.line, color: '#dbeafe' }}
    >
      {children}
    </button>
  );
}

const TICK = { fill: '#647c9b', fontSize: 10 };
const TT_STYLE = { background: '#0b1628', border: '1px solid #1c3050', borderRadius: 10, fontSize: 12, color: '#e7eef8', padding: '6px 10px' };
const TT_LABEL = { color: '#98abc4', marginBottom: 2 };
const TT_ITEM = { color: '#e7eef8', padding: 0 };

/* ════════════════ 8. 글로벌 바 · 비상 알림 · 시뮬레이터 ════════════════ */
const MODES = [
  { id: 'admin', icon: Monitor, label: '관리자 3D 관제 대시보드', short: '관리자 대시보드' },
  { id: 'mobile', icon: Smartphone, label: '청소년 모바일 대피 앱', short: '모바일 대피 앱' },
];

function LiveClock() {
  const now = useTicker(1000);
  return (
    <div className="flex items-center gap-2 rounded-full border px-3 py-1.5" style={{ background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.38)' }}>
      <span className="relative flex h-2.5 w-2.5">
        <span className="st-ping absolute inline-flex h-full w-full rounded-full" style={{ background: '#22c55e' }} />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: '#22c55e' }} />
      </span>
      <span className="text-xs font-bold" style={{ color: '#4ade80' }}>LIVE</span>
      <span className="st-num text-sm font-semibold text-white">{hms(now)}</span>
      <span className="hidden text-xs xl:inline" style={{ color: N.sub }}>{ymd(now)} KST</span>
    </div>
  );
}

function ModeToggle({ mode, setMode, className }) {
  return (
    <div role="tablist" aria-label="화면 모드 전환" className={`flex rounded-xl border p-1 ${className}`} style={{ background: N.panel, borderColor: N.line }}>
      {MODES.map((m) => {
        const on = mode === m.id;
        const Icon = m.icon;
        return (
          <button
            key={m.id} type="button" role="tab" aria-selected={on} onClick={() => setMode(m.id)}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors lg:flex-none lg:px-4"
            style={on ? { background: 'linear-gradient(135deg,#0ea5e9,#2563eb)', color: '#fff', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' } : { color: N.sub }}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{m.label}</span>
            <span className="sm:hidden">{m.short}</span>
          </button>
        );
      })}
    </div>
  );
}

function TopBar({ mode, setMode, alerts }) {
  return (
    <header className="relative z-30 shrink-0 border-b" style={{ background: 'rgba(7,16,32,0.97)', borderColor: N.line }}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 px-3 py-2.5 sm:px-5 lg:h-16 lg:flex-nowrap lg:py-0">
        <div className="order-1 flex min-w-0 items-center gap-2.5">
          <LogoMark size={30} />
          <div className="min-w-0 leading-tight">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold tracking-tight text-white">SafeTwin</span>
              <span className="hidden text-slate-600 sm:inline">|</span>
              <span className="hidden truncate text-sm font-medium sm:inline" style={{ color: N.sub }}>국립청소년수련시설 스마트 안전관제</span>
            </div>
            <div className="st-keep text-xs sm:hidden" style={{ color: N.sub, maxWidth: 150 }}>국립청소년수련시설 스마트 안전관제</div>
          </div>
        </div>
        <ModeToggle mode={mode} setMode={setMode} className="order-3 w-full lg:order-2 lg:mx-auto lg:w-auto" />
        <div className="order-2 ml-auto flex items-center gap-3 lg:order-3 lg:ml-0">
          <LiveClock />
          <div className="hidden items-center gap-3 lg:flex" style={{ color: N.sub }}>
            <span className="relative" title={alerts ? `확인할 알림 ${alerts}건` : '새 알림 없음'}>
              <Bell size={19} />
              {alerts > 0 && <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-xs font-bold text-white" style={{ background: '#ef4444', fontSize: 10 }}>{alerts}</span>}
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-full" style={{ background: '#13243f' }} aria-hidden="true"><User size={16} /></span>
          </div>
        </div>
      </div>
    </header>
  );
}

function EmergencyAlert({ onLocate, onAck }) {
  return (
    <div className="st-alert relative z-20 shrink-0 text-white" role="alert">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3 py-2.5 sm:px-5">
        <span className="flex shrink-0 items-center gap-2 text-base font-bold"><Siren size={20} className="st-blink" />비상 경보 발령</span>
        <span className="st-keep order-3 w-full text-sm sm:order-none sm:w-auto sm:min-w-0 sm:flex-1">
          <b>2F 중앙계단 낙상·화재 감지</b>
          <span className="hidden sm:inline" style={{ opacity: 0.85 }}> · 사각지대 · 레이더 고도 급강하·무동작 10초 + 비명·충격음 교차 검증 통과</span>
          <span className="sm:hidden" style={{ opacity: 0.85 }}> · 교차 검증 통과</span>
        </span>
        <span className="ml-auto flex shrink-0 gap-2 sm:ml-0">
          <button type="button" onClick={onLocate} className="cursor-pointer rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-red-700">3D 위치 보기</button>
          <button type="button" onClick={onAck} className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.18)' }}>확인</button>
        </span>
      </div>
    </div>
  );
}

function SimBar({ scenario, onRun }) {
  const cur = SCENARIOS[scenario];
  const lv = levelOf(cur.score);
  return (
    <div className="st-simbar border-t" style={{ background: 'rgba(5,12,24,0.97)', borderColor: N.line, boxShadow: '0 -10px 30px rgba(0,0,0,0.35)' }}>
      <div className="flex h-full items-center gap-3 px-3 sm:px-5">
        <div className="hidden shrink-0 items-center gap-2.5 xl:flex">
          <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: 'rgba(56,189,248,0.14)', color: N.sky }}><Cpu size={18} /></span>
          <div className="leading-tight">
            <div className="text-sm font-bold text-white">가상 센서 시뮬레이터</div>
            <div className="text-xs" style={{ color: N.sub }}>심사위원 시연용 · 전 화면 연동</div>
          </div>
        </div>
        <div className="st-scroll flex min-w-0 flex-1 gap-2 overflow-x-auto py-2" role="group" aria-label="시연 시나리오">
          {SCENARIO_IDS.map((id) => {
            const S = SCENARIOS[id];
            const on = id === scenario;
            const Icon = S.icon;
            return (
              <button
                key={id} type="button" onClick={() => onRun(id)} aria-pressed={on}
                className="flex shrink-0 cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors lg:flex-1"
                style={{ minWidth: 172, borderColor: on ? S.color : N.line, background: on ? `${S.color}24` : '#0b172a' }}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white" style={{ background: on ? S.color : '#16263f' }}><Icon size={16} /></span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold" style={{ color: on ? S.color : N.mute }}>시나리오 {S.no}</span>
                  <span className="block truncate text-sm font-semibold text-white">{S.title}</span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="hidden shrink-0 flex-col items-end gap-1 lg:flex">
          <span className="text-xs" style={{ color: N.sub }}>현재 AI 위험도</span>
          <StatusChip level={lv} label={`${GRADE[lv]} ${cur.score}점`} />
        </div>
      </div>
    </div>
  );
}

/* ════════════════ 9. 모드 A: 관리자 3D 관제 대시보드 ════════════════ */
const TWIN_VIEWS = [
  { id: 'all', label: '전체 보기' }, { id: '1F', label: '1F' }, { id: '2F', label: '2F' }, { id: '3F', label: '3F' },
];
const VIEW_KO = { '1F': '1층', '2F': '2층', '3F': '3층', all: '전체 보기' };
const LAYER_OPTS = [
  { id: 'labels', label: '구역 이름' },
  { id: 'furniture', label: '가구·집기' },
  { id: 'blind', label: 'CCTV 사각지대' },
  { id: 'sensors', label: '센서 위치' },
];

function TwinLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: N.sub }}>
      {['safe', 'caution', 'danger'].map((k) => (
        <span key={k} className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: LV[k].color, boxShadow: `0 0 8px ${LV[k].color}` }} />{LV[k].label}</span>
      ))}
      <span className="flex items-center gap-1.5">
        <i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'repeating-linear-gradient(45deg,rgba(251,191,36,.85) 0 2px,transparent 2px 4px)' }} />사각지대
      </span>
    </div>
  );
}

function ZoneInfo({ zone, status, note }) {
  if (!zone) {
    return (
      <div className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs" style={{ background: 'rgba(9,19,36,0.88)', borderColor: N.line, color: N.sub }}>
        <Info size={13} className="shrink-0" />구역을 누르면 상세 정보<span className="hidden sm:inline"> · 전체 보기에서 층을 누르면 내부 보기</span>
      </div>
    );
  }
  const sensors = zoneSensors(zone);
  return (
    <div className="rounded-xl border p-3" style={{ width: 280, maxWidth: '100%', background: 'rgba(9,19,36,0.94)', borderColor: status === 'safe' ? 'rgba(34,211,238,0.5)' : LV[status].color }}>
      <div className="flex items-center justify-between gap-2">
        <div className="truncate text-sm font-semibold text-white">{zone.floor} · {zone.name}</div>
        <StatusChip level={status} />
      </div>
      <div className="mt-1 text-xs" style={{ color: N.sub }}>{TYPE_LABEL[zone.type]}{isBlind(zone) ? ' · CCTV 사각지대' : ' · 일반 구역'}</div>
      {note && <div className="mt-1.5 text-xs font-semibold" style={{ color: LV[status].text }}>{note}</div>}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {sensors.length
          ? sensors.map((k) => (
            <span key={k} className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs" style={{ background: 'rgba(56,189,248,0.12)', color: '#bae6fd' }}>
              <i className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: SENSOR_COLOR[k] }} />{SENSOR_LABEL[k]}
            </span>
          ))
          : <span className="text-xs" style={{ color: N.mute }}>{zone.type === 'room' ? '객실 내부 미설치 · 복도·공용부 우선 배치' : '센서 미설치 구역'}</span>}
      </div>
    </div>
  );
}

function AlarmPin({ x, y, title, sub, flip }) {
  return (
    <div className="pointer-events-none absolute z-10" style={{ left: x, top: y }}>
      <span className="st-ring absolute rounded-full" style={{ left: -30, top: -15, width: 60, height: 30, border: '2px solid #f87171' }} />
      <span className="st-ring2 absolute rounded-full" style={{ left: -30, top: -15, width: 60, height: 30, border: '2px solid #f87171' }} />
      <span className="absolute rounded-full" style={{ left: -9, top: -4.5, width: 18, height: 9, background: 'rgba(239,68,68,0.6)', filter: 'blur(2px)' }} />
      <svg className="absolute" style={{ left: -16, top: -44 }} width="32" height="44" viewBox="0 0 32 44" aria-hidden="true">
        <path d="M16 43s14-15.5 14-25A14 14 0 0 0 2 18c0 9.5 14 25 14 25z" fill="#dc2626" stroke="#fff" strokeWidth="2" />
        <circle cx="16" cy="17" r="5.5" fill="#fff" />
      </svg>
      <div
        className="absolute whitespace-nowrap rounded-lg border px-2.5 py-1.5"
        style={{ top: -66, left: flip ? undefined : 20, right: flip ? 20 : undefined, background: 'rgba(60,8,12,0.94)', borderColor: '#ef4444', boxShadow: '0 0 24px rgba(239,68,68,0.45)' }}
      >
        <div className="text-sm font-bold text-white">{title}</div>
        <div className="text-xs" style={{ color: '#fecaca' }}>{sub}</div>
      </div>
    </div>
  );
}

function ReportPin({ x, y, sub, flip }) {
  return (
    <div className="pointer-events-none absolute z-10" style={{ left: x, top: y }}>
      <span className="st-ring absolute rounded-full" style={{ left: -24, top: -12, width: 48, height: 24, border: '2px solid #60a5fa' }} />
      <svg className="absolute" style={{ left: -14, top: -38 }} width="28" height="38" viewBox="0 0 30 38" aria-hidden="true">
        <path d="M15 37s13-14 13-22.5A13 13 0 0 0 2 14.5C2 23 15 37 15 37z" fill="#2563eb" stroke="#fff" strokeWidth="2" />
        <circle cx="15" cy="14" r="5" fill="#fff" />
      </svg>
      <div
        className="st-pop absolute whitespace-nowrap rounded-lg border px-2.5 py-1.5"
        style={{ top: -62, left: flip ? undefined : 16, right: flip ? 16 : undefined, background: 'rgba(10,25,55,0.95)', borderColor: '#3b82f6', boxShadow: '0 0 22px rgba(59,130,246,0.45)' }}
      >
        <div className="flex items-center gap-1.5 text-sm font-bold text-white"><PhoneCall size={13} />모바일 119 신고 접수</div>
        <div className="text-xs" style={{ color: '#bfdbfe' }}>{sub} · 사각지대</div>
      </div>
    </div>
  );
}

function CautionTag({ x, y, title, sub }) {
  return (
    <div className="pointer-events-none absolute z-10" style={{ left: x, top: y, transform: 'translate(-50%,-100%)' }}>
      <div className="flex items-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2" style={{ background: 'rgba(40,26,4,0.94)', borderColor: '#f59e0b', boxShadow: '0 0 24px rgba(245,158,11,0.4)' }}>
        <AlertTriangle size={18} color="#fbbf24" />
        <div>
          <div className="text-sm font-bold" style={{ color: '#fde68a' }}>{title}</div>
          <div className="text-xs" style={{ color: '#fcd34d' }}>{sub}</div>
        </div>
      </div>
      <div className="mx-auto" style={{ width: 2, height: 22, background: 'linear-gradient(#f59e0b,rgba(245,158,11,0))' }} />
    </div>
  );
}

function AdvisoryPopup({ onDone }) {
  return (
    <div className="st-pop absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-2xl border p-4" style={{ width: 'min(440px, calc(100% - 24px))', background: 'rgba(32,22,4,0.97)', borderColor: '#f59e0b', boxShadow: '0 18px 50px rgba(0,0,0,0.55), 0 0 30px rgba(245,158,11,0.25)' }} role="alertdialog" aria-label="지도자 예방 조치 권고">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24' }}><AlertTriangle size={22} /></span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold" style={{ color: '#fbbf24' }}>지도자 예방 조치 권고 · AI 위험도 76점</div>
          <div className="st-keep mt-0.5 text-base font-bold leading-snug text-white">야외 데크 미끄럼 방지 매트 점검 및 실내 활동 전환 권고</div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
            {['우천 · 습도 90%', '바닥온도 ≤ 이슬점+1℃', '1F 야외 나무 데크'].map((t) => (
              <span key={t} className="rounded-md px-1.5 py-0.5" style={{ background: 'rgba(245,158,11,0.14)', color: '#fde68a' }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
      <button
        type="button" onClick={onDone}
        className="mt-3.5 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-bold text-slate-900"
        style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)' }}
      >
        <Check size={18} strokeWidth={2.6} />조치 완료
      </button>
    </div>
  );
}

function TwinCard({ view, setView, exploded, setExploded, scenario, advisory, onAdvisoryDone, report }) {
  const S = SCENARIOS[scenario];
  const [mode3d, setMode3d] = useState(true);
  const [rot, setRot] = useState(0);
  const [layers, setLayers] = useState({ labels: true, furniture: true, blind: false, sensors: false });
  const [layerOpen, setLayerOpen] = useState(false);
  const [hoverId, setHoverId] = useState(null);
  const [selId, setSelId] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [boxRef, size] = useElementSize();

  useEffect(() => {
    if (!expanded) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setExpanded(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  const isAll = view === 'all';
  const floorIds = isAll ? FLOOR_ORDER : [view];
  useEffect(() => {
    const z = selId && findZone(selId);
    if (z && !floorIds.includes(z.floor)) setSelId(null);
    setHoverId(null);
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  const gapT = useTween(isAll && exploded ? EXPLODED_GAP : FLOOR_H, 650);
  const f = isAll ? clamp((gapT - FLOOR_H) / (EXPLODED_GAP - FLOOR_H), 0, 1) : 1;
  const theta = mode3d ? (30 + rot * 90) % 360 : 0;
  const narrow = size.width > 0 && size.width < 640;
  const geo = useIsoGeometry({
    width: size.width, height: size.height, floorIds, mode3d, theta, theme: 'dash', statusMap: S.zones,
    k: mode3d ? (isAll ? 0.52 : 0.56) : 1, zs: mode3d ? 0.84 : 0, gap: Math.round(gapT * 100) / 100, cols: narrow ? 1 : 2,
    backH: +lerp(3.05, 2.5, f).toFixed(2), frontH: +lerp(3.05, 0.85, f).toFixed(2), intH: 1.25, furniture: layers.furniture,
    labelsTopOnly: isAll && f < 0.5,
    pad: narrow ? { l: 10, r: 10, t: 64, b: 64 } : { l: 72, r: 28, t: 28, b: 80 },
    labelMin: 10, labelMax: 13, labelK: 0.62, short: narrow, tags: true, tagCompact: narrow,
  });

  const pick = useCallback((fid) => { setView(fid); }, [setView]);
  const select = useCallback((id, fid) => {
    if (id && isAll && fid) { setView(fid); setSelId(id); return; }
    setSelId(id);
  }, [isAll, setView]);

  const toggleExplode = () => {
    if (!isAll) { setView('all'); setExploded(true); return; }
    setExploded((v) => !v);
  };

  const activeZone = findZone(selId || hoverId);
  const activeStatus = activeZone ? (S.zones[activeZone.id] || 'safe') : 'safe';
  const activeNote = activeZone && ZONE_NOTE[scenario] ? ZONE_NOTE[scenario][activeZone.id] : null;
  const counts = Object.values(S.zones).reduce((m, v) => ({ ...m, [v]: (m[v] || 0) + 1 }), {});

  const inc = INCIDENT[scenario];
  let overlay = null;
  let offView = null;
  if (inc && geo) {
    const fi = geo.floorIndex(inc.floor);
    if (fi >= 0) {
      const [x, y] = geo.toScreen(inc.x, inc.y, scenario === 'fire' ? 0.4 : 0.6, fi);
      if (scenario === 'fire') overlay = <AlarmPin x={x} y={y} title={inc.title} sub={inc.sub} flip={x > size.width - 190} />;
      else overlay = <CautionTag x={clamp(x, 90, size.width - 90)} y={y} title={inc.title} sub={inc.sub} />;
    } else {
      offView = inc;
    }
  }
  let reportOverlay = null;
  if (report && geo) {
    const fi = geo.floorIndex(NAV_FLOOR);
    if (fi >= 0) {
      const L = LOCATIONS[report.loc];
      const [x, y] = geo.toScreen(L.front[0], L.front[1], 0.4, fi);
      reportOverlay = <ReportPin key={report.ts} x={x} y={y} sub={L.report} flip={x > 230} />;
    }
  }

  return (
    <>
      {expanded && <div className="st-backdrop" onClick={() => setExpanded(false)} />}
      <section
        className={`flex flex-col rounded-2xl border ${expanded ? 'st-expanded' : 'st-twin relative'}`}
        style={{ background: 'linear-gradient(180deg,#0f1d33,#0c182b)', borderColor: N.line, boxShadow: expanded ? '0 30px 80px rgba(0,0,0,0.6)' : 'none' }}
      >
        <header className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5">
          <div className="min-w-0">
            <h2 className="st-keep text-base font-semibold text-white sm:text-lg">실시간 건물 디지털 트윈 (청소년수련원)</h2>
            <p className="mt-0.5 text-xs" style={{ color: N.sub }}>3층 숙소·교육동 · 구역 {ZONE_COUNT}개 · 비식별 센서 {SENSOR_TOTAL}개 · 시연용 가상 모델</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {counts.danger > 0 && <span className="hidden sm:inline-flex"><StatusChip level="danger" label={`위험 ${counts.danger}`} /></span>}
            {counts.caution > 0 && <span className="hidden sm:inline-flex"><StatusChip level="caution" label={`주의 ${counts.caution}`} /></span>}
            <button
              type="button" onClick={() => setMode3d((v) => !v)} aria-pressed={mode3d} title="3D/2D 보기 전환"
              className="flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold"
              style={{ background: '#0b172a', borderColor: N.line, color: '#dbeafe' }}
            >
              <Eye size={16} />{mode3d ? '3D' : '2D'}
            </button>
            <button
              type="button" onClick={() => setExpanded((v) => !v)} aria-label={expanded ? '창 크기로 보기' : '크게 보기'} title={expanded ? '창 크기로 보기 (Esc)' : '크게 보기'}
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl border" style={{ background: '#0b172a', borderColor: N.line, color: '#dbeafe' }}
            >
              {expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
            </button>
          </div>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pt-3 sm:px-5">
          <div className="flex flex-wrap items-center gap-2">
            <div role="tablist" aria-label="층 선택" className="flex rounded-xl border p-1" style={{ background: '#0a1628', borderColor: N.line }}>
              {TWIN_VIEWS.map((v) => {
                const on = view === v.id;
                const vWorst = v.id === 'all' ? null : FLOOR_MAP[v.id].zones.reduce((w, z) => (S.zones[z.id] === 'danger' || w === 'danger' ? 'danger' : S.zones[z.id] === 'caution' || w === 'caution' ? 'caution' : null), null);
                return (
                  <button
                    key={v.id} type="button" role="tab" aria-selected={on} onClick={() => setView(v.id)}
                    className="relative cursor-pointer rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors sm:px-3.5"
                    style={on ? { background: '#1d4ed8', color: '#fff' } : { color: N.sub }}
                  >
                    {v.label}
                    {vWorst && <span className="st-blink absolute right-1 top-1 h-1.5 w-1.5 rounded-full" style={{ background: LV[vWorst].color }} />}
                  </button>
                );
              })}
            </div>
            <button
              type="button" role="switch" aria-checked={isAll && exploded} onClick={toggleExplode} disabled={!mode3d}
              className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: isAll && exploded ? 'rgba(37,99,235,0.25)' : '#0a1628', borderColor: isAll && exploded ? 'rgba(96,165,250,0.7)' : N.line, color: '#dbeafe' }}
              title="층별 펼치기 (Exploded View)"
            >
              <Layers size={16} />층별 펼치기
              <span className="relative inline-block h-5 w-9 rounded-full transition-colors" style={{ background: isAll && exploded ? '#3b82f6' : '#1e3354' }}>
                <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all" style={{ left: isAll && exploded ? 18 : 2 }} />
              </span>
            </button>
          </div>
          <TwinLegend />
        </div>

        <div ref={boxRef} className="st-canvas relative m-3 min-h-0 flex-1 overflow-hidden rounded-xl border sm:m-4" style={{ borderColor: N.line }}>
          {geo && (
            <IsoSvg
              geo={geo} theme="dash" layers={layers}
              hoverId={hoverId} selId={selId} floorHover={isAll}
              onHover={setHoverId} onSelect={select} onFloorPick={pick}
            />
          )}
          {overlay}
          {reportOverlay}
          {offView && (
            <button
              type="button" onClick={() => setView(offView.floor)}
              className="st-pop absolute left-1/2 top-3 z-20 flex -translate-x-1/2 cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold"
              style={{ background: 'rgba(9,19,36,0.95)', borderColor: scenario === 'fire' ? '#ef4444' : '#f59e0b', color: scenario === 'fire' ? '#fecaca' : '#fde68a' }}
            >
              <AlertTriangle size={15} />{offView.floor} {offView.title} — {offView.floor} 보기<ChevronRight size={15} />
            </button>
          )}
          {advisory && <AdvisoryPopup onDone={onAdvisoryDone} />}
          <div className="absolute left-3 top-3 flex flex-row gap-2 sm:flex-col" style={{ top: advisory && narrow ? 190 : 12 }}>
            <IconBtn label="시점 90° 회전" onClick={() => setRot((r) => (r + 1) % 4)} disabled={!mode3d}><RotateCw size={18} /></IconBtn>
            <div className="relative">
              <IconBtn label="레이어 설정" active={layerOpen} onClick={() => setLayerOpen((o) => !o)}><SlidersHorizontal size={18} /></IconBtn>
              {layerOpen && (
                <div className="absolute left-0 top-12 z-30 w-48 rounded-xl border p-1.5 sm:left-12 sm:top-0" style={{ background: 'rgba(9,19,36,0.97)', borderColor: N.line }}>
                  {LAYER_OPTS.map((o) => (
                    <label key={o.id} className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-sm hover:bg-white/5" style={{ color: N.text }}>
                      <span>{o.label}</span>
                      <input type="checkbox" className="h-4 w-4 accent-sky-400" checked={layers[o.id]} onChange={() => setLayers((l) => ({ ...l, [o.id]: !l[o.id] }))} />
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex flex-wrap items-end justify-between gap-2">
            <div className="pointer-events-auto"><ZoneInfo zone={activeZone} status={activeStatus} note={activeNote} /></div>
            <div className="hidden rounded-lg px-2.5 py-1 text-xs sm:block" style={{ background: 'rgba(9,19,36,0.85)', color: N.sub }}>
              {VIEW_KO[view]}{isAll ? (exploded ? ' · 층별 펼치기' : ' · 쌓아 보기') : ''} · {mode3d ? `3D ${theta}°` : '2D 평면'}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function RadarPanel({ data, scenario, since }) {
  const gid = useMemo(() => uid('radar'), []);
  const last = data[data.length - 1];
  const fire = scenario === 'fire';
  const impact = scenario === 'impact';
  const still = fire ? 10 + Math.floor(Math.max(0, Date.now() - since) / 1000) : 0;
  const where = fire ? '2F 중앙계단 · 사각지대' : impact ? '2F 샤워실 앞 복도 · 사각지대' : '2F 숙소 복도 · 사각지대';
  const color = fire ? '#f87171' : '#38bdf8';
  return (
    <Panel icon={Radio} title="mmWave 레이더" hint="실시간 생체신호" tone={fire ? '#ef4444' : undefined}>
      <MetaRow where={where} level={fire ? 'danger' : 'safe'} label={fire ? '낙상 감지' : impact ? '정상 움직임' : '정상'} />
      <div style={{ height: 112 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 6, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.45} />
                <stop offset="100%" stopColor={color} stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={N.grid} vertical={false} />
            <XAxis dataKey="t" tick={TICK} tickLine={false} axisLine={false} minTickGap={56} interval="preserveStartEnd" />
            <YAxis domain={[-250, 250]} ticks={[-250, 0, 250]} tick={TICK} tickLine={false} axisLine={false} width={36} />
            <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} formatter={(v) => [v, '반사 신호']} cursor={{ stroke: 'rgba(148,180,220,0.35)' }} isAnimationActive={false} />
            <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.6} fill={`url(#${gid})`} dot={false} activeDot={{ r: 3 }} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Stat label="인체 고도" value={last.alt.toFixed(2)} unit="m" tone={fire ? LV.danger.text : undefined} />
        <Stat label="움직임" value={fire ? '무동작' : last.walk ? '보행 감지' : '미세 움직임'} tone={fire ? LV.danger.text : undefined} />
        <Stat label="무동작 지속" value={still} unit="초" tone={fire ? LV.danger.text : LV.safe.text} />
      </div>
    </Panel>
  );
}

function SoundPanel({ data, scenario }) {
  const last = data[data.length - 1];
  const peak = data.reduce((m, d) => Math.max(m, d.db), 0);
  const fire = scenario === 'fire';
  const impact = scenario === 'impact';
  const verdict = fire ? '비명·충격음' : impact ? '단순 충격음' : peak >= 85 ? '충격음 의심' : '평상 소음';
  const level = fire ? 'danger' : impact ? 'caution' : 'safe';
  return (
    <Panel icon={AudioWaveform} title="음향 센서" hint="실시간 데시벨" tone={fire ? '#ef4444' : impact ? '#38bdf8' : undefined}>
      <MetaRow where={fire ? '2F 중앙계단 · 사각지대' : '2F 공용 샤워실 · 사각지대'} level={level} label={fire ? '비명·충격음' : impact ? '충격음 감지' : '정상'} />
      <div style={{ height: 104 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap={1} margin={{ top: 4, right: 6, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={N.grid} vertical={false} />
            <XAxis dataKey="t" tick={TICK} tickLine={false} axisLine={false} minTickGap={56} interval="preserveStartEnd" />
            <YAxis domain={[0, 120]} ticks={[0, 40, 85, 120]} tick={TICK} tickLine={false} axisLine={false} width={36} />
            <ReferenceLine y={85} stroke="#ef4444" strokeDasharray="4 3" label={{ value: '충격음 기준 85dB', position: 'insideTopRight', fill: '#fca5a5', fontSize: 10 }} />
            <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} formatter={(v) => [`${v} dB`, '소리 세기']} cursor={{ fill: 'rgba(148,180,220,0.08)' }} isAnimationActive={false} />
            <Bar dataKey="db" radius={[2, 2, 0, 0]} isAnimationActive={false}>
              {data.map((d, i) => <Cell key={i} fill={d.db >= 85 ? '#ef4444' : d.db >= 60 ? '#f59e0b' : '#3b82f6'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Stat label="현재" value={last.db} unit="dB" />
        <Stat label="최근 30초 최대" value={peak} unit="dB" tone={peak >= 85 ? LV.danger.text : undefined} />
        <Stat label="판별" value={verdict} tone={LV[level].text} />
      </div>
      <p className="mt-2 text-xs" style={{ color: N.mute }}>대화를 녹음하지 않고 소리 세기·주파수 파형만 분석합니다.</p>
    </Panel>
  );
}

function WeatherWidget({ w }) {
  const now = useTicker(60000);
  const Icon = w.icon;
  const rain = w.sky === '우천';
  return (
    <div className="mt-3 rounded-xl border p-3 transition-colors" style={{ background: rain ? 'linear-gradient(135deg,#132b4d,#0b182c)' : 'linear-gradient(135deg,#112440,#0b182c)', borderColor: rain ? 'rgba(56,189,248,0.5)' : N.line }}>
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl" style={{ background: rain ? 'rgba(56,189,248,0.16)' : 'rgba(148,163,184,0.12)', color: rain ? '#7dd3fc' : '#cbd5e1' }}><Icon size={28} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-white">{w.sky}</span>
            <span className="st-num text-sm" style={{ color: N.sub }}>{w.temp.toFixed(1)}℃</span>
          </div>
          <div className="truncate text-xs" style={{ color: N.mute }}>기상청 실황(모의) · {pad2(kst(now).h)}:00 기준</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xs" style={{ color: N.sub }}>습도</div>
          <div className="st-num text-2xl font-bold" style={{ color: rain ? '#38bdf8' : '#7dd3fc' }}>{w.rh}%</div>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        <span className="flex items-center gap-1.5 whitespace-nowrap" style={{ color: N.sub }}><Umbrella size={13} />강수확률 <b className="st-num font-semibold text-white">{w.rainProb}%</b></span>
        <span className="flex items-center gap-1.5 whitespace-nowrap" style={{ color: N.sub }}><Droplets size={13} />강수량 <b className="st-num font-semibold text-white">{w.rain.toFixed(1)}mm</b></span>
        <span className="flex items-center gap-1.5 whitespace-nowrap" style={{ color: N.sub }}><Wind size={13} />바람 <b className="st-num font-semibold text-white">{w.wind}m/s</b></span>
      </div>
    </div>
  );
}

function DewPanel({ data, scenario }) {
  const gid = useMemo(() => uid('rh'), []);
  const last = data[data.length - 1];
  const margin = last.floor - last.dew;
  const rain = scenario === 'rain';
  const lv = rain ? 'caution' : margin <= 0 ? 'danger' : margin <= 1 ? 'caution' : 'safe';
  const fmt = (v, name) => [name === '습도' ? `${Math.round(v)}%` : `${Number(v).toFixed(1)}℃`, name];
  return (
    <Panel icon={Droplets} title="온습도·결로" hint="이슬점 vs 바닥온도" tone={rain ? '#f59e0b' : undefined}>
      <MetaRow where="1F 야외 나무 데크" level={lv} label={lv === 'safe' ? '결로 없음' : lv === 'caution' ? '결로 주의' : '결로 발생'} />
      <div style={{ height: 132 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 6, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.32} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={N.grid} vertical={false} />
            <XAxis dataKey="t" tick={TICK} tickLine={false} axisLine={false} minTickGap={56} interval="preserveStartEnd" />
            <YAxis yAxisId="c" domain={[-4, 12]} ticks={[-4, 0, 4, 8, 12]} tick={TICK} tickLine={false} axisLine={false} width={36} tickFormatter={(v) => `${v}°`} />
            <YAxis yAxisId="h" orientation="right" domain={[0, 100]} ticks={[0, 50, 100]} tick={TICK} tickLine={false} axisLine={false} width={34} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} formatter={fmt} cursor={{ stroke: 'rgba(148,180,220,0.35)' }} isAnimationActive={false} />
            <Area yAxisId="h" type="monotone" dataKey="rh" name="습도" stroke="#3b82f6" strokeOpacity={0.55} strokeWidth={1} fill={`url(#${gid})`} dot={false} isAnimationActive={false} />
            <Line yAxisId="c" type="monotone" dataKey="floor" name="바닥 표면 온도" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line yAxisId="c" type="monotone" dataKey="dew" name="이슬점" stroke="#22d3ee" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line yAxisId="c" type="monotone" dataKey="limit" name="결로 경계(이슬점+1℃)" stroke="#ef4444" strokeWidth={1.2} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs" style={{ color: N.sub }}>
        <span className="flex items-center gap-1.5"><i className="inline-block h-0.5 w-3.5 rounded" style={{ background: '#f59e0b' }} />바닥 표면 온도</span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-0.5 w-3.5 rounded" style={{ background: '#22d3ee' }} />이슬점</span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-0.5 w-3.5 rounded" style={{ background: 'repeating-linear-gradient(90deg,#ef4444 0 3px,transparent 3px 5px)' }} />결로 경계</span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-2 w-3.5 rounded-sm" style={{ background: 'rgba(59,130,246,0.35)' }} />데크 습도</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Stat label="바닥 표면" value={last.floor.toFixed(1)} unit="℃" tone="#fcd34d" />
        <Stat label="이슬점" value={last.dew.toFixed(1)} unit="℃" tone="#67e8f9" />
        <Stat label="결로 여유" value={margin.toFixed(1)} unit="℃" tone={LV[lv].text} />
      </div>
      <WeatherWidget w={SCENARIOS[scenario].weather} />
    </Panel>
  );
}

function RiskGauge({ score }) {
  const lv = levelOf(score);
  const cx = 100; const cy = 92; const r = 72; const sw = 13;
  const pt = (v, rr = r) => { const a = Math.PI * (1 - v / 100); return [cx + rr * Math.cos(a), cy - rr * Math.sin(a)]; };
  const arc = (v0, v1) => { const a = pt(v0); const b = pt(v1); return `M${a[0].toFixed(2)} ${a[1].toFixed(2)}A${r} ${r} 0 0 1 ${b[0].toFixed(2)} ${b[1].toFixed(2)}`; };
  const m = pt(score);
  return (
    <svg viewBox="0 0 200 112" className="block w-full" style={{ maxWidth: 230 }} role="img" aria-label={`AI 종합 위험도 ${score}점, ${GRADE[lv]}`}>
      <path d={arc(0, 49.4)} stroke="rgba(34,197,94,0.22)" strokeWidth={sw} fill="none" />
      <path d={arc(50.6, 89.4)} stroke="rgba(245,158,11,0.22)" strokeWidth={sw} fill="none" />
      <path d={arc(90.6, 100)} stroke="rgba(239,68,68,0.25)" strokeWidth={sw} fill="none" />
      <path d={arc(0, Math.max(1, score))} stroke={LV[lv].color} strokeWidth={sw} strokeLinecap="round" fill="none" style={{ filter: `drop-shadow(0 0 6px ${LV[lv].color})` }} />
      <circle cx={m[0]} cy={m[1]} r={sw / 2 + 2.5} fill="#0e1b30" stroke={LV[lv].color} strokeWidth="2.5" />
      {[0, 50, 90, 100].map((v) => {
        const q = pt(v, r + sw / 2 + 9);
        return <text key={v} x={q[0]} y={q[1]} fontSize="9" fill={N.mute} textAnchor="middle" dominantBaseline="central">{v}</text>;
      })}
      <text x={cx} y={cy - 16} textAnchor="middle" fontSize="34" fontWeight="700" fill="#fff" style={{ fontVariantNumeric: 'tabular-nums' }}>{score}</text>
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize="11" fill={N.sub}>/ 100점</text>
    </svg>
  );
}

const RiskPanel = React.memo(function RiskPanel({ scenario }) {
  const S = SCENARIOS[scenario];
  const shown = Math.round(useTween(S.score, 900));
  const lv = levelOf(shown);
  const ck = S.check;
  const tone = CHECK_TONE[ck.tone];
  const CkIcon = ck.icon;
  return (
    <Panel icon={Gauge} title="AI 종합 위험도" hint="0~100점 · 교차 검증" tone={lv === 'safe' ? undefined : LV[lv].color}>
      <div key={scenario} className="st-pop mb-3 flex items-start gap-2.5 rounded-xl border px-3 py-2.5" style={{ background: tone.bg, borderColor: tone.border }}>
        <span className="mt-0.5 shrink-0" style={{ color: tone.fg }}><CkIcon size={18} /></span>
        <div className="min-w-0">
          <div className="text-xs font-semibold" style={{ color: N.sub }}>AI 교차 검증</div>
          <div className="st-keep text-sm font-bold" style={{ color: tone.fg }}>{ck.title}</div>
          <div className="st-keep mt-0.5 text-xs" style={{ color: N.sub }}>{ck.sub}</div>
        </div>
      </div>
      <div className="grid items-center gap-3 sm:grid-cols-2">
        <div className="flex flex-col items-center">
          <RiskGauge score={shown} />
          <div className="mt-1"><StatusChip level={lv} label={`${GRADE[lv]} 단계`} /></div>
        </div>
        <div className="space-y-2">
          {Object.keys(FACTOR_LABEL).map((k) => {
            const v = S.factors[k];
            return (
              <div key={k}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span style={{ color: N.sub }}>{FACTOR_LABEL[k]}</span>
                  <span className="st-num font-semibold text-white">{v}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full" style={{ background: '#13243e' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.max(2, v)}%`, background: LV[levelOf(v)].color, transition: 'width .8s ease, background-color .8s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-3 text-xs" style={{ color: N.mute }}>Rule + ML 하이브리드 · 안전 0~49 · 주의 50~89 · 비상 90 이상</p>
    </Panel>
  );
});

const EventLog = React.memo(function EventLog({ log }) {
  return (
    <Panel icon={Siren} title="긴급 이벤트 로그" hint={`최근 ${log.length}건`}>
      <ul className="st-scroll space-y-0.5 overflow-y-auto pr-1" style={{ maxHeight: 290 }}>
        {log.map((e) => (
          <li key={e.id} className="st-newlog grid items-start gap-x-2 rounded-lg px-1.5 py-1.5" style={{ gridTemplateColumns: 'auto auto minmax(0,1fr)', fontSize: 13 }}>
            <span className="font-semibold" style={{ color: LOG_TAG[e.lv].color }}>[{LOG_TAG[e.lv].label}]</span>
            <span className="st-num" style={{ color: N.mute }}>{hms(e.ts)}</span>
            <span className="st-keep" style={{ color: e.lv === 'alarm' ? '#fecaca' : '#d5e1f0' }}>{e.text}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
});

function AdminSidebar({ scenario, log }) {
  const sim = useSim();
  return (
    <aside className="st-scroll min-h-0 space-y-3 lg:col-span-3 lg:overflow-y-auto lg:pr-1" aria-label="센서 모니터링">
      <RadarPanel data={sim.radar} scenario={scenario} since={sim.since} />
      <SoundPanel data={sim.sound} scenario={scenario} />
      <DewPanel data={sim.dew} scenario={scenario} />
      <RiskPanel scenario={scenario} />
      <EventLog log={log} />
    </aside>
  );
}

function AdminDashboard(props) {
  const { scenario, log } = props;
  return (
    <div className="st-dash grid grid-cols-1 gap-3 p-3 sm:gap-4 sm:p-4 lg:grid-cols-10 lg:grid-rows-1">
      <div className="min-h-0 lg:col-span-7">
        <TwinCard
          view={props.view} setView={props.setView} exploded={props.exploded} setExploded={props.setExploded}
          scenario={scenario} advisory={props.advisory} onAdvisoryDone={props.onAdvisoryDone} report={props.report}
        />
      </div>
      <AdminSidebar scenario={scenario} log={log} />
    </div>
  );
}

/* ════════════════ 10. 모드 B: 청소년·인솔교사용 모바일 대피 앱 ════════════════ */
const FW = 390; // 스마트폰 프레임 가로(px)
const FH = 812;

function PhoneFrame({ children }) {
  const btn = { position: 'absolute', width: 3, borderRadius: 2, background: '#2a2e35' };
  return (
    <div className="relative" style={{ width: FW, height: FH, borderRadius: 58, padding: 10, background: 'linear-gradient(145deg,#3b4048,#16191e 45%,#2b2f36)', boxShadow: '0 40px 80px rgba(15,23,42,0.32), inset 0 0 0 1.5px rgba(255,255,255,0.08)' }}>
      <span style={{ ...btn, left: -3, top: 150, height: 32 }} />
      <span style={{ ...btn, left: -3, top: 200, height: 58 }} />
      <span style={{ ...btn, left: -3, top: 268, height: 58 }} />
      <span style={{ ...btn, right: -3, top: 220, height: 92 }} />
      <div className="relative h-full w-full overflow-hidden bg-white" style={{ borderRadius: 48 }}>{children}</div>
    </div>
  );
}

function StatusBar() {
  const now = useTicker(5000);
  const p = kst(now);
  return (
    <div className="relative flex shrink-0 items-center justify-between px-7 font-semibold text-slate-900" style={{ height: 48, fontSize: 15 }}>
      <span className="st-num">{p.h % 12 || 12}:{pad2(p.mi)}</span>
      <span className="absolute left-1/2 top-2.5 -translate-x-1/2 rounded-full bg-black" style={{ width: 108, height: 30 }} />
      <span className="flex items-center gap-1.5"><Signal size={16} strokeWidth={2.4} /><Wifi size={16} strokeWidth={2.4} /><BatteryFull size={22} /></span>
    </div>
  );
}

function Compass({ theta, k }) {
  const t = (theta * Math.PI) / 180;
  const ang = (Math.atan2(Math.sin(t), Math.cos(t) * k) * 180) / Math.PI;
  return (
    <div className="grid h-11 w-11 place-items-center rounded-full" style={{ background: 'rgba(17,21,27,0.88)', boxShadow: '0 4px 12px rgba(0,0,0,0.35)' }} title="나침반 (빨간 바늘이 북쪽)">
      <svg width="34" height="34" viewBox="-17 -17 34 34" aria-hidden="true">
        <circle r="15" fill="none" stroke="rgba(255,255,255,0.18)" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <line key={a} x1="0" y1="-15" x2="0" y2={a % 90 === 0 ? -12 : -13.5} stroke="rgba(255,255,255,0.45)" transform={`rotate(${a})`} />
        ))}
        <g transform={`rotate(${ang.toFixed(1)})`}>
          <path d="M0 -12 L3.6 0 L-3.6 0Z" fill="#ef4444" />
          <path d="M0 12 L3.6 0 L-3.6 0Z" fill="#e5e7eb" />
          <circle r="1.6" fill="#111827" />
        </g>
      </svg>
    </div>
  );
}

function MapBtn({ label, onClick, active, children }) {
  return (
    <button
      type="button" aria-label={label} title={label} onClick={onClick}
      className="grid h-11 w-11 cursor-pointer place-items-center rounded-full text-slate-900"
      style={{ background: active ? '#fff' : 'rgba(255,255,255,0.82)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
    >
      {children}
    </button>
  );
}

/* 바닥면에 투영한 3D 대피 경로 — 평시: 초록 점선 / 비상: 파란 화살표 리본(흐름·그려지기 애니메이션) */
function RouteLayer({ geo, route, phase }) {
  const fid = useMemo(() => uid('route'), []);
  if (!route || route.pts.length < 2) return null;
  const P = (x, y) => geo.toScreen(x, y, 0.12);
  const poly = (arr) => arr.map(([x, y]) => { const q = P(x, y); return `${q[0].toFixed(1)},${q[1].toFixed(1)}`; }).join(' ');
  const pts = route.pts;
  const scr = pts.map(([x, y]) => P(x, y));
  const d = scr.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('');
  const lenPx = scr.reduce((sum, q, i) => (i ? sum + Math.hypot(q[0] - scr[i - 1][0], q[1] - scr[i - 1][1]) : 0), 0);
  const segs = [];
  for (let i = 1; i < pts.length; i += 1) {
    const a = pts[i - 1]; const b = pts[i];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    segs.push({ a, b, L, u: [(b[0] - a[0]) / L, (b[1] - a[1]) / L] });
  }
  const total = segs.reduce((m, sg) => m + sg.L, 0);
  const at = (t) => {
    let rem = t;
    for (let i = 0; i < segs.length; i += 1) {
      const sg = segs[i];
      if (rem <= sg.L || i === segs.length - 1) {
        const k = Math.min(rem, sg.L);
        return { p: [sg.a[0] + sg.u[0] * k, sg.a[1] + sg.u[1] * k], u: sg.u };
      }
      rem -= sg.L;
    }
    return { p: pts[pts.length - 1], u: [1, 0] };
  };
  const arrow = (p, u, size) => {
    const n = [-u[1], u[0]];
    return poly([
      [p[0] - u[0] * size * 0.55 + n[0] * size, p[1] - u[1] * size * 0.55 + n[1] * size],
      [p[0] + u[0] * size * 0.95, p[1] + u[1] * size * 0.95],
      [p[0] - u[0] * size * 0.55 - n[0] * size, p[1] - u[1] * size * 0.55 - n[1] * size],
      [p[0] - u[0] * size * 0.05, p[1] - u[1] * size * 0.05],
    ]);
  };
  const end = at(total);
  const cls = phase === 'out' ? 'st-route-out' : 'st-route-in';
  if (!route.emergency) {
    return (
      <g pointerEvents="none" className={cls}>
        <path d={d} fill="none" stroke="#22c55e" strokeOpacity="0.24" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} fill="none" stroke="#4ade80" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="0.1 9" />
        <polygon points={arrow(end.p, end.u, 0.62)} fill="#4ade80" stroke="#14532d" strokeWidth="1" />
      </g>
    );
  }
  const W = 0.58; // 화살표 리본 반폭(m)
  const ribbon = segs.map((sg) => {
    const n = [-sg.u[1], sg.u[0]];
    const a = [sg.a[0] - sg.u[0] * W, sg.a[1] - sg.u[1] * W];
    const b = [sg.b[0] + sg.u[0] * W, sg.b[1] + sg.u[1] * W];
    return poly([[a[0] + n[0] * W, a[1] + n[1] * W], [b[0] + n[0] * W, b[1] + n[1] * W], [b[0] - n[0] * W, b[1] - n[1] * W], [a[0] - n[0] * W, a[1] - n[1] * W]]);
  });
  const chevrons = [];
  for (let t = 1.1; t < total - 1.0; t += 1.3) { const q = at(t); chevrons.push(arrow(q.p, q.u, 0.42)); }
  return (
    <g pointerEvents="none" className={cls}>
      <defs><filter id={fid} x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="5" /></filter></defs>
      <g filter={`url(#${fid})`} opacity="0.9">{ribbon.map((pp, i) => <polygon key={`g${i}`} points={pp} fill="#38bdf8" />)}</g>
      <g opacity="0.6">{ribbon.map((pp, i) => <polygon key={`r${i}`} points={pp} fill="#0ea5e9" />)}</g>
      <path d={d} fill="none" stroke="#bae6fd" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 9" className="st-flow" />
      {chevrons.map((pp, i) => <polygon key={`c${i}`} points={pp} fill="#f0f9ff" className="st-chev" style={{ animationDelay: `${(i * 0.09).toFixed(2)}s` }} />)}
      <polygon points={arrow(end.p, end.u, 0.72)} fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.2" />
      {phase !== 'out' && (
        <path
          d={d} fill="none" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={lenPx.toFixed(1)} className="st-draw" style={{ '--len': lenPx.toFixed(1) }}
        />
      )}
    </g>
  );
}

function HazardArea({ geo }) {
  const [x, y, w, h] = HAZARD.area;
  const pts = rectPts(x, y, w, h).map(([px, py]) => { const q = geo.toScreen(px, py, 0.08); return `${q[0].toFixed(1)},${q[1].toFixed(1)}`; }).join(' ');
  return <polygon points={pts} fill="rgba(239,68,68,0.32)" stroke="#f87171" strokeWidth="1.4" strokeDasharray="4 3" className="st-glow-danger" pointerEvents="none" />;
}

function BlockedMark({ at }) {
  const [x, y] = at;
  return (
    <g pointerEvents="none">
      <circle cx={x} cy={y} r="21" fill="rgba(239,68,68,0.3)" className="st-blink" />
      <circle cx={x} cy={y} r="14" fill="#dc2626" stroke="#fff" strokeWidth="2.5" />
      <path d={`M${x - 5} ${y - 5}L${x + 5} ${y + 5}M${x + 5} ${y - 5}L${x - 5} ${y + 5}`} stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

function BlockBadge({ at, boxW }) {
  const x = clamp(at[0], 62, boxW - 62);
  return (
    <div className="pointer-events-none absolute z-10" style={{ left: x, top: at[1] + 20, transform: 'translateX(-50%)' }}>
      <span className="st-pop flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold text-white" style={{ background: '#dc2626', boxShadow: '0 0 0 2px rgba(255,255,255,0.92), 0 6px 14px rgba(0,0,0,0.35)' }}>
        <X size={12} strokeWidth={3} />중앙계단 통제
      </span>
    </div>
  );
}

function PinShape({ color, children }) {
  return (
    <svg width="30" height="38" viewBox="0 0 30 38" aria-hidden="true">
      <path d="M15 37s13-14 13-22.5A13 13 0 0 0 2 14.5C2 23 15 37 15 37z" fill={color} stroke="#fff" strokeWidth="2" />
      {children}
    </svg>
  );
}

function CurrentPin({ at, label, boxW }) {
  const x = clamp(at[0], 46, boxW - 46);
  return (
    <div className="pointer-events-none absolute z-10" style={{ left: x, top: at[1], transform: 'translate(-50%,-100%)' }}>
      <div className="flex flex-col items-center">
        <div className="relative mb-1.5 whitespace-nowrap rounded-xl bg-white px-2.5 py-1 text-center text-xs font-bold leading-tight text-slate-900" style={{ boxShadow: '0 6px 16px rgba(0,0,0,0.35)' }}>
          현재 위치<br /><span className="text-sm">{label}</span>
          <span className="absolute left-1/2 top-full -translate-x-1/2" style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #fff' }} />
        </div>
        <PinShape color="#2563eb"><circle cx="15" cy="14" r="5" fill="#fff" /></PinShape>
      </div>
      <span className="st-ping absolute rounded-full" style={{ left: '50%', bottom: -6, width: 24, height: 12, marginLeft: -12, border: '2px solid #60a5fa' }} />
    </div>
  );
}

function ExitPin({ at, label, color, boxW }) {
  const x = clamp(at[0], 50, boxW - 50);
  return (
    <div className="pointer-events-none absolute z-10" style={{ left: x, top: at[1], transform: 'translate(-50%,-100%)' }}>
      <div className="st-pop flex flex-col items-center">
        <div className="mb-1 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-bold text-white" style={{ background: color, boxShadow: '0 6px 16px rgba(0,0,0,0.35)' }}>{label}</div>
        <PinShape color={color}><g transform="translate(7.5 6.5)"><DoorOpen size={15} color="#fff" strokeWidth={2.4} /></g></PinShape>
      </div>
    </div>
  );
}

function RouteCard({ route }) {
  const em = route.emergency;
  const color = em ? '#0284c7' : '#16a34a';
  const Icon = em ? Navigation : DoorOpen;
  return (
    <div key={route.key} className="st-pop flex items-center gap-3 rounded-2xl bg-white px-3.5 py-2.5" style={{ boxShadow: '0 8px 20px rgba(0,0,0,0.3)', border: `1.5px solid ${em ? '#7dd3fc' : '#bbf7d0'}` }} aria-live="polite">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: em ? '#e0f2fe' : '#dcfce7', color }}><Icon size={20} /></span>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold" style={{ color }}>{em ? '우회 대피 경로' : '가까운 대피로'}</div>
        <div className="truncate text-sm font-bold text-slate-900">{route.target.label}</div>
      </div>
      <div className="flex shrink-0 items-end gap-2.5 text-right">
        <div>
          <div className="text-slate-500" style={{ fontSize: 10.5 }}>남은 거리</div>
          <div className="st-num text-xl font-bold leading-none text-slate-900">{route.dist}<span className="ml-0.5 text-xs font-semibold text-slate-500">m</span></div>
        </div>
        <div className="h-8 w-px bg-slate-200" />
        <div>
          <div className="text-slate-500" style={{ fontSize: 10.5 }}>예상 소요</div>
          <div className="st-num text-xl font-bold leading-none" style={{ color }}>{route.secs}<span className="ml-0.5 text-xs font-semibold text-slate-500">초</span></div>
        </div>
      </div>
    </div>
  );
}

function RouteMap({ mstate, zones, floor, setFloor, route, onCall }) {
  const M = MOBILE_STATES[mstate];
  const [boxRef, size] = useElementSize();
  const [labels, setLabels] = useState(true);
  const [voice, setVoice] = useState(false);
  const [voiceNote, setVoiceNote] = useState(null);
  const here = floor === NAV_FLOOR;
  const geo = useIsoGeometry({
    width: size.width, height: size.height, floorIds: [floor], mode3d: true, theta: MOBILE_VIEW.theta, k: MOBILE_VIEW.k, zs: 0.8,
    theme: 'mobile', statusMap: zones, gap: 0, backH: 1.9, frontH: 0.9, intH: 1.6, furniture: false, labelsTopOnly: false,
    pad: { l: 18, r: 18, t: 54, b: 186 }, labelMin: 10, labelMax: 12, labelK: 0.95, short: true, tags: false,
  });
  const blockedZone = route.blocked ? route.blocked.zone : null;
  const mute = useMemo(() => (here ? [route.target.zone, blockedZone].filter(Boolean) : []), [here, route.target.zone, blockedZone]);
  const layerState = useMemo(() => ({ labels }), [labels]);

  // 경로가 바뀌면 이전 경로는 흐려지며 사라지고 새 경로가 그려짐
  const prevRef = useRef(route);
  const [leaving, setLeaving] = useState(null);
  useEffect(() => {
    const prev = prevRef.current;
    if (prev.key === route.key) return undefined;
    prevRef.current = route;
    setLeaving(prev);
    const t = setTimeout(() => setLeaving(null), 600);
    return () => clearTimeout(t);
  }, [route]);

  useEffect(() => { stopSpeech(); setVoice(false); }, [mstate, floor, route.key]);
  useEffect(() => {
    loadKoVoice();
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    if (synth && synth.addEventListener) synth.addEventListener('voiceschanged', loadKoVoice);
    return () => {
      if (synth && synth.removeEventListener) synth.removeEventListener('voiceschanged', loadKoVoice);
      stopSpeech();
    };
  }, []);

  const toggleVoice = () => {
    if (voice) { stopSpeech(); setVoice(false); return; }
    const res = speakKo(M.voice, () => setVoice(false));
    setVoiceNote(res === 'ok' ? null : res);
    setVoice(true);
  };

  const end = route.pts[route.pts.length - 1];
  const stairs = [24.5, 13];

  return (
    <div ref={boxRef} className="absolute inset-0 overflow-hidden" style={{ background: 'radial-gradient(130% 90% at 50% 35%,#3a414c 0%,#282d35 62%,#1f242b 100%)' }}>
      {geo && (
        <IsoSvg geo={geo} theme="mobile" layers={layerState} mute={mute}>
          {here && route.emergency && <HazardArea geo={geo} />}
          {here && leaving && <RouteLayer key={`${leaving.key}-out`} geo={geo} route={leaving} phase="out" />}
          {here && <RouteLayer key={route.key} geo={geo} route={route} phase="in" />}
          {here && route.blocked && <BlockedMark at={geo.toScreen(stairs[0], stairs[1], 0.2)} />}
        </IsoSvg>
      )}
      {geo && here && route.blocked && <BlockBadge at={geo.toScreen(stairs[0], stairs[1], 0.2)} boxW={size.width} />}
      {geo && here && <ExitPin key={`x-${route.key}`} at={geo.toScreen(end[0], end[1], 0.2)} label={route.target.label} color={route.emergency ? '#16a34a' : '#15803d'} boxW={size.width} />}
      {geo && here && <CurrentPin at={geo.toScreen(route.loc.x, route.loc.y, 0.2)} label={route.loc.short} boxW={size.width} />}

      <div className="absolute inset-x-3 bottom-3 flex flex-col gap-2.5">
        <div className="flex items-end justify-between">
          <Compass theta={MOBILE_VIEW.theta} k={MOBILE_VIEW.k} />
          <div className="flex gap-2">
            <MapBtn label={labels ? '방 번호 숨기기' : '방 번호 보기'} active={labels} onClick={() => setLabels((v) => !v)}><Layers size={20} /></MapBtn>
            <MapBtn label="다른 층 보기" onClick={() => setFloor(nextFloor(floor))}><span className="text-base font-bold">{floor}</span></MapBtn>
          </div>
        </div>
        {voice && (
          <div className="st-pop rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed text-white" style={{ background: 'rgba(15,23,42,0.92)' }} role="status">
            <span className="mb-0.5 flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#7dd3fc' }}><Volume2 size={13} />음성 안내</span>
            {M.voice}
            {voiceNote && (
              <span className="mt-1 block text-xs" style={{ color: '#94a3b8' }}>
                {voiceNote === 'unsupported' ? '이 브라우저는 음성 합성을 지원하지 않아 자막으로 안내합니다.' : '기기에 한국어 음성이 없으면 기본 음성이나 자막으로 안내합니다.'}
              </span>
            )}
          </div>
        )}
        {here ? <RouteCard route={route} /> : (
          <div className="flex items-center gap-3 rounded-2xl bg-white px-3.5 py-2.5" style={{ boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: '#dbeafe', color: '#2563eb' }}><MapPin size={20} /></span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-slate-900">현재 위치는 {FLOOR_KO[NAV_FLOOR]} {route.loc.label}</div>
              <div className="truncate text-xs text-slate-500">{FLOOR_KO[floor]} 비상구와 계단 위치를 보고 있습니다</div>
            </div>
            <button type="button" onClick={() => setFloor(NAV_FLOOR)} className="shrink-0 cursor-pointer rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white">내 위치</button>
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="button" onClick={toggleVoice} aria-pressed={voice}
            className="flex h-12 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white text-base font-bold text-slate-900"
            style={{ boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }}
          >
            {voice ? <span className="st-eq" style={{ color: RED }}><i /><i /><i /><i /></span> : <Mic size={20} />}
            {voice ? '음성 안내 중지' : '음성 안내 시작'}
          </button>
          <button
            type="button" onClick={onCall} aria-label="119 긴급 신고" title="119 긴급 신고"
            className="flex h-12 shrink-0 cursor-pointer items-center gap-1.5 rounded-2xl px-4 text-base font-bold text-white"
            style={{ background: RED, boxShadow: '0 8px 20px rgba(229,34,47,0.4)' }}
          >
            <PhoneCall size={18} />119
          </button>
        </div>
      </div>
    </div>
  );
}

function AedMap() {
  return (
    <svg viewBox="0 0 320 124" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-label="주변 AED 위치 지도">
      <rect width="320" height="124" fill="#eef0ea" />
      <path d="M0 0H92L56 124H0Z" fill="#d6ebcf" />
      <path d="M252 0H320V64Z" fill="#d6ebcf" />
      <g fill="#c6e3bd">
        <circle cx="22" cy="30" r="7" /><circle cx="40" cy="72" r="9" /><circle cx="18" cy="104" r="8" /><circle cx="292" cy="18" r="8" />
      </g>
      <g fill="none" strokeLinecap="round">
        <path d="M-10 96L330 62" stroke="#d6dae0" strokeWidth="15" />
        <path d="M-10 96L330 62" stroke="#fff" strokeWidth="11" />
        <path d="M140 -10L162 134" stroke="#d6dae0" strokeWidth="11" />
        <path d="M140 -10L162 134" stroke="#fff" strokeWidth="7" />
        <path d="M284 -10L312 134" stroke="#e3bd54" strokeWidth="12" />
        <path d="M284 -10L312 134" stroke="#f7da82" strokeWidth="8" />
      </g>
      <g fill="#e1e4e8" stroke="#cfd4da" strokeWidth="1">
        <rect x="66" y="10" width="52" height="26" rx="2" transform="rotate(-6 92 23)" />
        <rect x="80" y="104" width="44" height="18" rx="2" transform="rotate(-6 102 113)" />
        <rect x="236" y="88" width="40" height="24" rx="2" transform="rotate(-6 256 100)" />
      </g>
      <rect x="172" y="16" width="92" height="34" rx="3" fill="#dbe7f8" stroke="#8fb0de" strokeWidth="1.2" transform="rotate(-6 218 33)" />
      <text x="232" y="37" fontSize="9" textAnchor="middle" fill="#3b5b8a" fontWeight="700" transform="rotate(-6 218 33)">숙소동</text>
      <path d="M214 30 L192 40" stroke="#2563eb" strokeWidth="1.6" strokeDasharray="3 3" />
      <circle cx="216" cy="29" r="8" fill="#3b82f6" opacity="0.2" />
      <circle cx="216" cy="29" r="4.2" fill="#2563eb" stroke="#fff" strokeWidth="1.6" />
      <g transform="translate(177 6)">
        <path d="M13 40s12-13 12-21A12 12 0 0 0 1 19c0 8 12 21 12 21z" fill={RED} stroke="#fff" strokeWidth="1.8" />
        <path d="M13 24.5c-3.8-2.8-5.2-4.9-3.5-6.6 1.2-1.2 2.8-.8 3.5.4.7-1.2 2.3-1.6 3.5-.4 1.7 1.7.3 3.8-3.5 6.6z" fill="#fff" />
        <path d="M13.5 17.4l-1.8 3.2h1.6l-.9 2.6 2.2-3.4h-1.6z" fill={RED} />
      </g>
    </svg>
  );
}

function ManualView({ onCall, loc }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="absolute inset-0" style={{ background: '#f2f4f7' }}>
      <div className="st-scroll absolute inset-0 overflow-y-auto px-4 pt-4" style={{ paddingBottom: 92 }}>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">초동대응 매뉴얼</h2>
        <p className="mt-1 text-sm text-slate-500">카드를 누르면 상황별 3단계 행동 요령이 열립니다</p>
        <div className="mt-4 space-y-3">
          {MANUALS.map((m) => {
            const Icon = m.icon;
            const on = open === m.id;
            return (
              <div key={m.id} className="overflow-hidden rounded-2xl bg-white" style={{ boxShadow: CARD_SHADOW }}>
                <button type="button" onClick={() => setOpen(on ? null : m.id)} aria-expanded={on} className="flex w-full cursor-pointer items-center gap-3.5 p-4 text-left">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl" style={{ background: m.tint, color: m.color }}><Icon size={30} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-bold text-slate-900">{m.no}. {m.title}</span>
                    <span className="st-keep mt-0.5 block text-sm text-slate-500">{m.summary}</span>
                  </span>
                  <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform ${on ? 'rotate-180' : ''}`} />
                </button>
                {on && (
                  <ol className="space-y-2.5 border-t border-slate-100 px-4 pb-4 pt-3">
                    {m.steps.map((s, i) => (
                      <li key={s} className="flex gap-2.5 text-sm text-slate-700">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ background: m.color }}>{i + 1}</span>
                        <span className="st-keep pt-0.5 leading-snug">{s}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3 overflow-hidden rounded-2xl bg-white" style={{ boxShadow: CARD_SHADOW }}>
          <div className="flex items-center justify-between px-4 pt-3.5">
            <h3 className="text-base font-bold text-slate-900">주변 AED 위치</h3>
            <span className="text-xs font-semibold" style={{ color: RED }}>가장 가까운 1대</span>
          </div>
          <div className="mx-4 mt-2.5 overflow-hidden rounded-xl" style={{ height: 124 }}><AedMap /></div>
          <div className="flex items-start gap-3 px-4 py-3.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ background: '#fee2e2', color: RED }}><HeartPulse size={18} /></span>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900">1층 로비 안내데스크 옆</div>
              <div className="st-keep text-xs text-slate-500">{loc.label}에서 계단으로 1층 이동 · 1층 보건실에도 1대 비치</div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 px-4 pb-3 pt-6" style={{ background: 'linear-gradient(to top,#f2f4f7 58%,rgba(242,244,247,0))' }}>
        <button
          type="button" onClick={onCall}
          className="flex h-14 w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl text-lg font-bold text-white"
          style={{ background: RED, boxShadow: '0 8px 20px rgba(229,34,47,0.35)' }}
        >
          <PhoneCall size={22} />119 긴급 신고
        </button>
      </div>
    </div>
  );
}

/* 119 신고 접수 시뮬레이션 — 위치 좌표·센서 데이터 전송 확인 */
function ReportModal({ loc, scenario, at, onClose }) {
  const snap = useMemo(() => {
    const r = SIM.radar[SIM.radar.length - 1];
    const peak = SIM.sound.reduce((m, d) => Math.max(m, d.db), 0);
    const still = scenario === 'fire' ? 10 + Math.floor(Math.max(0, at - SIM.since) / 1000) : 0;
    return { alt: r ? r.alt : 1.16, peak, still };
  }, [at, scenario]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const rows = [
    ['위치 좌표', `숙소동 2F · X ${loc.front[0].toFixed(1)}m · Y ${loc.front[1].toFixed(1)}m`],
    ['측위', `${loc.tag} · 오차 ±2m`],
    ['센서 데이터', `레이더 고도 ${snap.alt.toFixed(2)}m · 무동작 ${snap.still}초 · 음향 최대 ${snap.peak}dB`],
    ['전송 시각', `${hms(at)} KST`],
    ['함께 전달', '관제실 · 인솔교사'],
  ];
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.6)' }} onClick={onClose}>
      <div
        className="st-pop w-full rounded-3xl bg-white p-5 text-slate-900" style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}
        onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true" aria-label="119 신고 접수 시뮬레이션"
      >
        <div className="st-check mx-auto grid h-14 w-14 place-items-center rounded-full" style={{ background: '#dcfce7', color: '#16a34a' }}><Check size={30} strokeWidth={3} /></div>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-bold" style={{ color: RED }}><PhoneCall size={13} />119 긴급 신고</div>
        <h3 className="mt-1 text-center text-lg font-bold">신고 접수 시뮬레이션</h3>
        <p className="st-keep mt-2 text-center text-sm leading-relaxed text-slate-600">국립청소년수련원 {loc.report} 사각지대 위치 좌표 및 센서 데이터가 전송되었습니다</p>
        <dl className="mt-4 space-y-1.5 rounded-2xl bg-slate-50 p-3.5 text-xs">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3">
              <dt className="shrink-0 text-slate-500">{k}</dt>
              <dd className="st-keep text-right font-semibold text-slate-900">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-center text-xs text-slate-400">시연용 화면입니다 · 실제 119 전화는 연결되지 않습니다</p>
        <button type="button" onClick={onClose} className="mt-3 h-12 w-full cursor-pointer rounded-xl text-base font-bold text-white" style={{ background: '#0f172a' }}>확인</button>
      </div>
    </div>
  );
}

function MenuSheet({ loc, onClose }) {
  const SrcIcon = loc.src === 'qr' ? QrCode : Bluetooth;
  return (
    <div className="absolute inset-0 z-20" onClick={onClose}>
      <div className="absolute right-3 w-64 rounded-2xl bg-white p-3.5 text-sm text-slate-700 ring-1 ring-black/5" style={{ top: 98, boxShadow: '0 16px 40px rgba(15,23,42,0.25)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-900">내 위치 정보</span>
          <button type="button" aria-label="닫기" onClick={onClose} className="grid h-8 w-8 cursor-pointer place-items-center rounded-full hover:bg-slate-100"><X size={16} /></button>
        </div>
        <div className="mt-2 flex items-start gap-2"><SrcIcon size={16} className="mt-0.5 shrink-0 text-blue-600" /><span className="st-keep">{loc.tag} 인식 · {FLOOR_KO[NAV_FLOOR]} {loc.label} (오차 ±2m)</span></div>
        <div className="mt-2 flex items-start gap-2"><QrCode size={16} className="mt-0.5 shrink-0 text-slate-900" /><span className="st-keep">입소 안내 QR로 실행된 무설치 모바일 웹</span></div>
      </div>
    </div>
  );
}

/* 출발 위치 선택 — BLE 비콘·QR 태그 인식을 흉내 낸 드롭다운 */
function LocationPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const L = LOCATIONS[value];
  const SrcIcon = L.src === 'qr' ? QrCode : Bluetooth;
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); window.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} aria-label={`현재 위치 선택: ${L.label}`}
        className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-1 pl-2 pr-1.5 text-left"
      >
        <SrcIcon size={14} className="shrink-0 text-blue-600" />
        <span className="leading-tight">
          <span className="block text-slate-500" style={{ fontSize: 10 }}>현재 위치</span>
          <span className="block whitespace-nowrap text-xs font-bold text-slate-900">{L.label}</span>
        </span>
        <ChevronDown size={14} className={`shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="menu" className="st-pop absolute right-0 top-full z-40 mt-1.5 w-60 rounded-2xl bg-white p-1.5 ring-1 ring-black/10" style={{ boxShadow: '0 16px 40px rgba(15,23,42,0.25)' }}>
          <div className="px-2.5 pb-1.5 pt-1 text-slate-500" style={{ fontSize: 11 }}>BLE 비콘·QR 태그 위치 시뮬레이션</div>
          {LOC_ORDER.map((id) => {
            const o = LOCATIONS[id];
            const I = o.src === 'qr' ? QrCode : Bluetooth;
            const on = id === value;
            return (
              <button
                key={id} type="button" role="menuitemradio" aria-checked={on} onClick={() => { onChange(id); setOpen(false); }}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-left hover:bg-slate-50" style={on ? { background: '#eff6ff' } : undefined}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: on ? '#2563eb' : '#f1f5f9', color: on ? '#fff' : '#334155' }}><I size={15} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-slate-900">{o.label}</span>
                  <span className="block text-xs text-slate-500">{o.tag}</span>
                </span>
                {on && <Check size={16} className="shrink-0 text-blue-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const MTABS = [
  { id: 'route', icon: Navigation, label: '3D 대피 경로' },
  { id: 'manual', icon: BookOpen, label: '초동대응 매뉴얼' },
];

function MobileApp({ scenario, mstate, zones, tab, setTab, floor, setFloor, loc, setLoc, route, onReport }) {
  const M = MOBILE_STATES[mstate];
  const B = M.banner;
  const BannerIcon = B.icon;
  const L = LOCATIONS[loc];
  const [menu, setMenu] = useState(false);
  const [reportAt, setReportAt] = useState(null);
  const openReport = () => { const now = Date.now(); setReportAt(now); onReport(loc, now); };
  const closeReport = useCallback(() => setReportAt(null), []);
  return (
    <div className="relative flex h-full flex-col bg-white text-slate-900">
      <StatusBar />
      <div className="relative z-30 flex shrink-0 items-center justify-between gap-2 pl-4 pr-2" style={{ height: 50 }}>
        <div className="flex min-w-0 items-center gap-1.5"><LogoMark size={24} tone="red" /><span className="text-lg font-bold tracking-tight">SafeTwin</span></div>
        <div className="flex items-center gap-0.5">
          <LocationPicker value={loc} onChange={setLoc} />
          <button type="button" aria-label="메뉴" onClick={() => setMenu((v) => !v)} className="grid h-10 w-10 cursor-pointer place-items-center rounded-full hover:bg-slate-100"><Menu size={22} /></button>
        </div>
      </div>
      <div key={mstate} className="st-pop flex shrink-0 items-center gap-3 px-4 py-2.5" style={{ background: B.bg, color: B.fg }} role="status" aria-live="polite">
        <BannerIcon size={24} className={mstate === 'emergency' ? 'st-blink shrink-0' : 'shrink-0'} />
        <div className="min-w-0 flex-1">
          <div className="text-lg font-bold leading-tight">{B.title}</div>
          <div className="truncate text-xs" style={{ opacity: 0.88 }}>{B.sub}</div>
        </div>
        <button
          type="button" onClick={() => setFloor(nextFloor(floor))} aria-label="지도 층 바꾸기"
          className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-bold" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
        >
          {FLOOR_KO[floor]} {floor}<ChevronsUpDown size={14} />
        </button>
      </div>
      <div className="relative min-h-0 flex-1">
        {tab === 'route'
          ? <RouteMap mstate={mstate} zones={zones} floor={floor} setFloor={setFloor} route={route} onCall={openReport} />
          : <ManualView onCall={openReport} loc={L} />}
      </div>
      <nav role="tablist" aria-label="앱 화면" className="grid shrink-0 grid-cols-2 border-t border-slate-200 bg-white">
        {MTABS.map((t) => {
          const on = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id} type="button" role="tab" aria-selected={on} onClick={() => setTab(t.id)}
              className="flex h-14 cursor-pointer flex-col items-center justify-center gap-0.5 text-xs font-semibold" style={{ color: on ? RED : '#94a3b8' }}
            >
              <Icon size={21} strokeWidth={on ? 2.4 : 2} />{t.label}
            </button>
          );
        })}
      </nav>
      <div className="flex shrink-0 items-start justify-center bg-white" style={{ height: 22 }}>
        <span style={{ width: 128, height: 5, borderRadius: 3, background: '#111' }} />
      </div>
      {menu && <MenuSheet loc={L} onClose={() => setMenu(false)} />}
      {reportAt && <ReportModal loc={L} scenario={scenario} at={reportAt} onClose={closeReport} />}
    </div>
  );
}

const FEATURES = [
  { icon: QrCode, text: '입소 안내 QR·NFC 스캔으로 3초 안에 실행' },
  { icon: Bluetooth, text: '복도 BLE 비콘으로 현재 위치 자동 인식' },
  { icon: Navigation, text: '통제 구역을 피하는 3D 우회 대피 경로' },
  { icon: BookOpen, text: '화재·낙상·응급 상황별 3단계 행동 카드' },
];

function MobileInfo() {
  return (
    <div className="hidden lg:flex lg:flex-col lg:justify-center">
      <div className="rounded-3xl bg-white/75 p-6 ring-1 ring-slate-900/5" style={{ boxShadow: CARD_SHADOW }}>
        <p className="text-sm font-semibold" style={{ color: RED }}>청소년·인솔교사용</p>
        <h2 className="st-keep mt-1 text-2xl font-bold leading-snug text-slate-900">설치 없이 QR로 여는 모바일 대피 앱</h2>
        <p className="st-keep mt-2 text-sm leading-relaxed text-slate-600">수련원 입소 안내문의 QR을 스캔하면 스마트폰 브라우저에서 바로 실행되는 모바일 웹(PWA)입니다.</p>
        <ul className="mt-5 space-y-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <li key={f.text} className="flex items-start gap-3 text-sm text-slate-700">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-900 text-white"><Icon size={16} /></span>
                <span className="st-keep pt-1.5">{f.text}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function LinkPanel({ scenario, isLg, loc, setLoc, route, report }) {
  const S = SCENARIOS[scenario];
  const M = MOBILE_STATES[S.mobile];
  const Icon = S.icon;
  const L = LOCATIONS[loc];
  return (
    <div className="flex flex-col justify-center" style={{ order: isLg ? 0 : -1 }}>
      <div className="rounded-3xl bg-white/80 p-4 ring-1 ring-slate-900/5 lg:p-5" style={{ boxShadow: CARD_SHADOW }}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900">관제 시스템 연동</h3>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600"><span className="st-blink h-2 w-2 rounded-full bg-green-500" />실시간</span>
        </div>
        <div key={scenario} className="st-pop mt-3 flex items-center gap-3 rounded-2xl border px-3 py-2.5" style={{ borderColor: S.color, background: `${S.color}14` }}>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white" style={{ background: S.color }}><Icon size={18} /></span>
          <div className="min-w-0">
            <div className="text-xs text-slate-500">시나리오 {S.no} 수신</div>
            <div className="truncate text-sm font-bold text-slate-900">{S.title}</div>
          </div>
        </div>
        <div className="mt-4 hidden lg:block">
          <div className="text-xs font-semibold text-slate-500">출발 위치 시뮬레이션 (BLE·QR)</div>
          <div className="mt-2 grid grid-cols-1 gap-1.5">
            {LOC_ORDER.map((id) => {
              const o = LOCATIONS[id];
              const on = id === loc;
              const I = o.src === 'qr' ? QrCode : Bluetooth;
              return (
                <button
                  key={id} type="button" onClick={() => setLoc(id)} aria-pressed={on}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-sm transition-colors"
                  style={{ borderColor: on ? '#2563eb' : '#e2e8f0', background: on ? '#eff6ff' : '#fff' }}
                >
                  <I size={15} color={on ? '#2563eb' : '#64748b'} />
                  <span className="min-w-0 flex-1 truncate font-semibold text-slate-900">{o.label}</span>
                  <span className="shrink-0 text-xs text-slate-400">{o.src === 'qr' ? 'QR' : 'BLE'}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-4 hidden space-y-2 border-t border-slate-200 pt-4 text-sm lg:block">
          <div className="flex justify-between gap-2"><span className="text-slate-500">앱 상태</span><span className="font-semibold text-slate-900">{M.label} 배너</span></div>
          <div className="flex justify-between gap-2"><span className="text-slate-500">대피 목표</span><span className="font-semibold text-slate-900">{route.target.label}</span></div>
          <div className="flex justify-between gap-2"><span className="text-slate-500">남은 거리·시간</span><span className="st-num font-semibold text-slate-900">{route.dist}m · {route.secs}초</span></div>
          <div className="flex justify-between gap-2"><span className="text-slate-500">측위</span><span className="font-semibold text-slate-900">{L.tag}</span></div>
          <div className="flex justify-between gap-2"><span className="text-slate-500">최근 119 신고</span><span className="st-num font-semibold" style={{ color: report ? RED : '#0f172a' }}>{report ? `${hms(report.ts)} 접수` : '없음'}</span></div>
        </div>
        <p className="st-keep mt-3 text-xs text-slate-500">화면 아래 시뮬레이터 버튼을 누르면 이 앱 화면도 함께 바뀝니다.</p>
      </div>
    </div>
  );
}

function MobileStage({ scenario, tab, setTab, floor, setFloor, loc, setLoc, onReport, report }) {
  const isLg = useMedia('(min-width: 1024px)');
  const [cellRef, cell] = useElementSize();
  const S = SCENARIOS[scenario];
  const route = useMemo(() => planRoute(loc, S.mobile), [loc, S.mobile]);
  let scale = 1;
  if (cell.width) scale = Math.min(scale, (cell.width - 4) / FW);
  if (isLg && cell.height) scale = Math.min(scale, (cell.height - 8) / FH);
  scale = clamp(scale, 0.55, 1);
  return (
    <div className="st-stage p-3 sm:p-5" style={{ background: 'radial-gradient(1200px 640px at 50% 0%,#f8fafc 0%,#e7ecf2 55%,#dde3ea 100%)' }}>
      <div className="st-stage-grid">
        <MobileInfo />
        <div ref={cellRef} className="flex min-h-0 items-start justify-center lg:items-center">
          <div style={{ width: FW * scale, height: FH * scale }}>
            <div style={{ width: FW, height: FH, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
              <PhoneFrame>
                <MobileApp
                  scenario={scenario} mstate={S.mobile} zones={S.zones} tab={tab} setTab={setTab} floor={floor} setFloor={setFloor}
                  loc={loc} setLoc={setLoc} route={route} onReport={onReport}
                />
              </PhoneFrame>
            </div>
          </div>
        </div>
        <LinkPanel scenario={scenario} isLg={isLg} loc={loc} setLoc={setLoc} route={route} report={report} />
      </div>
    </div>
  );
}

/* ════════════════ 11. 앱 루트 (모드 전환 · 시나리오 상태) ════════════════ */
const readHash = () => {
  try {
    const h = (window.location.hash || '').replace('#', '');
    return h === 'mobile' || h === 'admin' ? h : null;
  } catch (e) {
    return null;
  }
};

export default function App() {
  const [mode, setModeState] = useState(() => readHash() || 'admin');
  const [scenario, setScenario] = useState('normal');
  const [log, setLog] = useState(seedLog);
  const [advisory, setAdvisory] = useState(false);
  const [alertAck, setAlertAck] = useState(false);
  const [twinView, setTwinView] = useState('all');
  const [exploded, setExploded] = useState(true);
  const [mtab, setMtab] = useState('route');
  const [mfloor, setMfloor] = useState(NAV_FLOOR);
  const [mloc, setMloc] = useState('r203');
  const [report, setReport] = useState(null);

  useEffect(() => {
    const onHash = () => { const h = readHash(); if (h) setModeState(h); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const setMode = (m) => {
    setModeState(m);
    try { if (window.location.hash !== `#${m}`) window.location.hash = m; } catch (e) { /* 무시 */ }
  };
  const pushLog = (entries) => setLog((prev) => [...entries.map(withId), ...prev].slice(0, 40));

  const runScenario = (id, customLogs) => {
    const now = Date.now();
    simSetScenario(id, now);
    setScenario(id);
    setAdvisory(id === 'rain');
    setAlertAck(false);
    setReport(null);
    pushLog(customLogs || scenarioLogs(id, now));
    const inc = INCIDENT[id];
    if (inc && twinView !== 'all' && twinView !== inc.floor) setTwinView('all');
    if (id === 'fire') { setMtab('route'); setMfloor(NAV_FLOOR); }
  };
  const resolveAdvisory = () => {
    const now = Date.now();
    runScenario('normal', [
      { lv: 'ok', ts: now, text: '평시 정상 복구 — 1F 야외 데크 결로 주의 해제' },
      { lv: 'ok', ts: now, text: '지도자 조치 완료 — 미끄럼 방지 매트 설치·실내 활동 전환' },
    ]);
  };
  const onReport = (locId, ts) => {
    const L = LOCATIONS[locId];
    setReport({ loc: locId, ts });
    pushLog([{ lv: 'alarm', ts, text: `모바일 119 신고 접수 — ${L.report} 사각지대 · 위치 좌표·센서 데이터 수신 (${L.tag})` }]);
  };

  const showAlert = scenario === 'fire' && !alertAck;
  const alerts = (showAlert ? 1 : 0) + (advisory ? 1 : 0) + (report ? 1 : 0);
  const admin = mode === 'admin';
  return (
    <div className="st-root st-shell min-h-screen" style={{ background: admin ? N.bg : '#e7ecf2', color: admin ? N.text : '#0f172a' }}>
      <style>{GLOBAL_CSS}</style>
      <TopBar mode={mode} setMode={setMode} alerts={alerts} />
      {showAlert && <EmergencyAlert onLocate={() => { setMode('admin'); setTwinView('2F'); }} onAck={() => setAlertAck(true)} />}
      <main key={mode} className="st-main st-fade">
        {admin ? (
          <AdminDashboard
            view={twinView} setView={setTwinView} exploded={exploded} setExploded={setExploded}
            scenario={scenario} log={log} advisory={advisory} onAdvisoryDone={resolveAdvisory} report={report}
          />
        ) : (
          <MobileStage
            scenario={scenario} tab={mtab} setTab={setMtab} floor={mfloor} setFloor={setMfloor}
            loc={mloc} setLoc={setMloc} onReport={onReport} report={report}
          />
        )}
      </main>
      <SimBar scenario={scenario} onRun={(id) => runScenario(id)} />
    </div>
  );
}
