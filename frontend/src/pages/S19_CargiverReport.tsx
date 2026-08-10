import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CaregiverSidebar from '../components/CaregiverSidebar';
import checkboxB from '../assets/checkboxB.svg';
import checkboxG from '../assets/checkboxG.svg';
import checkboxY from '../assets/checkboxY.svg';
import checkemty from '../assets/checkemty.svg';
import polygon from '../assets/Polygon 2.svg';
import { getGuardianTrend } from '../api/guardian';
import { getPatient, getQuizResults } from '../api/patient';
import { getPCode } from '../utils/pcode';

const DESIGN_W = 1920;
const DESIGN_H = 1419;
const CONTENT_LEFT = 636;

const F: React.CSSProperties = {
  fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
};

const SECTION_TITLE: React.CSSProperties = {
  ...F,
  fontSize: 30,
  fontWeight: 700,
  lineHeight: '140%',
  color: '#0D0D0D',
  margin: 0,
};

const DUMMY_PATIENT = {
  name: '-',
  birth_date: '',
  dignosis: '-',
};

const INDICATORS = [
  { key: '답변 성공률', checkImg: checkboxB, color: '#4188ED' },
  { key: '힌트 사용', checkImg: checkboxG, color: '#27AE60' },
];

const DATES_DEFAULT: string[] = [];

const LINE_DATA_DEFAULT: Record<string, number[]> = {
  '답변 성공률': [],
  '힌트 사용': [],
};

const PERIOD_OPTIONS = ['최근 7일', '최근 30일', '직접 선택'];

const STATS_DEFAULT = [
  { label: '7일 평균 성공률', value: '-' },
  { label: '일평균 힌트 사용', value: '-' },
];

const DAILY_SUMMARY_DEFAULT: { date: string; desc: string; isToday: boolean; tags: string[] }[] = [];


const RECT_W = 612;
const RECT_H = 360;
const Y_LABEL_SPACE = 44;
const X_LABEL_SPACE = 30;
const SVG_W = RECT_W + Y_LABEL_SPACE; 
const SVG_H = RECT_H + X_LABEL_SPACE; 

const PAD = 12;
const PLOT_X = Y_LABEL_SPACE;
const PLOT_Y = PAD;
const PLOT_W = RECT_W - PAD * 2;
const PLOT_H = RECT_H - PAD * 2;


function getXPos(index: number, totalCount: number): number {
  if (totalCount <= 1) {
    return PLOT_X + PAD + PLOT_W / 2; 
  }
  return PLOT_X + PAD + (index / (totalCount - 1)) * PLOT_W;
}

function makeLine(values: number[], maxVal: number = 100): string {
  if (!values || values.length === 0) return '';
  
 
  if (values.length === 1) {
    const x = getXPos(0, 1);
    const y = PLOT_Y + PLOT_H * (1 - Math.min(values[0], maxVal) / maxVal);
    return `${x},${y} ${x},${y}`;
  }

  return values
    .map((v, i) => {
      const x = getXPos(i, values.length);
      const y = PLOT_Y + PLOT_H * (1 - Math.min(v, maxVal) / maxVal);
      return `${x},${y}`;
    })
    .join(' ');
}

export default function S19_CargiverReport() {
  const navigate = useNavigate();
  const [scale, setScale] = useState(1);
  const [patient, setPatient] = useState(DUMMY_PATIENT);
  const [dates, setDates] = useState(DATES_DEFAULT);
  const [lineData, setLineData] = useState(LINE_DATA_DEFAULT);
  const [stats, setStats] = useState(STATS_DEFAULT);
  const [dailySummary, setDailySummary] = useState(DAILY_SUMMARY_DEFAULT);
  const [period, setPeriod] = useState('최근 7일');
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [activeLines, setActiveLines] = useState<Set<string>>(
    new Set(['답변 성공률'])
  );

  useEffect(() => {
    const update = () => setScale(window.innerWidth / DESIGN_W);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

 
  useEffect(() => {
    const pCode = getPCode();
    if (!pCode) return;
    
    getPatient(pCode)
      .then(data => setPatient({ name: data.name, birth_date: data.birth_date || '', dignosis: data.diagnosis }))
      .catch(() => {});

    
    getGuardianTrend(pCode, period === '최근 7일' ? 'week' : period === '최근 30일' ? 'month' : 'week')
      .then(data => {
        if (data.labels && data.labels.length > 0) {
          setDates(data.labels);
          setLineData(prev => ({ ...prev, '답변 성공률': data.scores }));
        }
      })
      .catch(() => {});

    
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - 7);
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    getQuizResults(pCode, fmt(from), fmt(today))
      .then(results => {
        if (results && results.length > 0) {
          
          const fetchedDates = results.map(r => r.date.slice(5).replace('-', '.'));
          const successScores = results.map(r => Math.round((r.correct_count / (r.total_count || 1)) * 100));
          const hintCounts = results.map(r => Number(r.hint) || 0);

          setDates(fetchedDates);
          setLineData(prev => ({
            ...prev,
            '답변 성공률': successScores,
            '힌트 사용': hintCounts,
          }));

          
          const avgScore = Math.round(successScores.reduce((a, b) => a + b, 0) / results.length);
          const avgHint = (hintCounts.reduce((a, b) => a + b, 0) / results.length).toFixed(1);
          
          setStats([
            { label: '7일 평균 성공률', value: `${avgScore}%` },
            { label: '일평균 힌트 사용', value: `${avgHint}회` },
          ]);

          
          const recent = results.slice(-2).reverse();
          setDailySummary(recent.map((r, i) => ({
            date: r.date.replace(/-/g, '. ') + (i === 0 ? ' (오늘)' : ''),
            desc: `답변 성공률 ${Math.round((r.correct_count / (r.total_count || 1)) * 100)}% · 힌트 ${r.hint || 0}회`,
            isToday: i === 0,
            tags: i === 0 ? [] : ['기록 있음'],
          })));
        }
      })
      .catch(() => {});
  }, [period]);

  const toggleLine = (key: string) => {
    setActiveLines(new Set([key]));
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: DESIGN_H * scale,
        overflowX: 'hidden',
        background: 'var(--color-neutral-100)',
      }}
    >
      <div
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          position: 'absolute',
          top: 0,
          left: 0,
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
          background: 'var(--color-neutral-100)',
        }}
      >
        <CaregiverSidebar patient={patient} />

        <div style={{ marginLeft: 348 }}>

          {/* 헤더 */}
          <div
            style={{
              fontSize: 16, fontWeight: 700, height: 67,
              display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
              gap: 24, paddingRight: 348,
            }}
          >
            <button onClick={() => navigate('/caregiver-home')}
              style={{ ...F, color: 'var(--color-neutral-gray)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>
              홈
            </button>
            <button onClick={() => navigate('/mypage')}
              style={{ ...F, color: 'var(--color-neutral-gray)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>
              마이페이지
            </button>
          </div>

          {/* ── 섹션 1: 환자의 변화 추이 ── */}
          <p style={{ ...SECTION_TITLE, position: 'absolute', left: CONTENT_LEFT, top: 144 }}>
            {patient.name}님의 변화 추이
          </p>

          {/* 그래프 박스 */}
          <div
            style={{
              position: 'absolute',
              left: CONTENT_LEFT,
              top: 206,
              width: 936,
              height: 551,
              borderRadius: 10,
              border: '1px solid var(--color-neutral-gray)',
              background:
                'linear-gradient(180deg, rgba(223,223,135,0.20) 0%, rgba(248,249,250,0.20) 100%), rgba(65,136,237,0.05)',
              boxShadow: '0 0 4px 0 #4188ED',
              boxSizing: 'border-box',
              display: 'flex',
            }}
          >
            {/* ── 왼쪽 패널: 기간 선택 + 지표 ── */}
            <div
              style={{
                width: 180,
                padding: '24px 20px',
                borderRight: '1px solid rgba(142,142,152,0.3)',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <p style={{ ...F, margin: '0 0 9px', fontSize: 22, fontWeight: 700, color: 'var(--color-neutral-10)' }}>기간 선택</p>
              <div style={{ position: 'relative', marginBottom: 26 }}>
                <button
                  onClick={() => setShowPeriodMenu(v => !v)}
                  style={{
                    ...F, width: '100%', padding: '6px 19px', borderRadius: 10,
                    border: '1px solid #8E8E98', background: '#F8F9FA', fontSize: 14,
                    cursor: 'pointer', textAlign: 'left', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  {period}
                  <img src={polygon} alt="▼" style={{ width: 10, height: 10 }} />
                </button>
                {showPeriodMenu && (
                  <div style={{
                    position: 'absolute', top: '110%', left: 0, width: '100%',
                    background: '#fff', border: '1px solid #8E8E98', borderRadius: 6,
                    zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  }}>
                    {PERIOD_OPTIONS.filter(opt => opt !== period).map(opt => (
                      <div key={opt}
                        onClick={() => { setPeriod(opt); setShowPeriodMenu(false); }}
                        style={{
                          ...F, padding: '8px 12px', fontSize: 14, cursor: 'pointer',
                          background: 'transparent',
                          color: '#0D0D0D',
                        }}
                      >{opt}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* 직접 선택 시 날짜 입력 */}
              {period === '직접 선택' && (
                <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ ...F, fontSize: 13, color: '#0D0D0D' }}>
                    시작
                    <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                      style={{ ...F, display: 'block', width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #8E8E98', fontSize: 13, marginTop: 4 }} />
                  </label>
                  <label style={{ ...F, fontSize: 13, color: '#0D0D0D' }}>
                    종료
                    <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                      style={{ ...F, display: 'block', width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #8E8E98', fontSize: 13, marginTop: 4 }} />
                  </label>
                </div>
              )}

              <p style={{ ...F, margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#0D0D0D' }}>지표</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {INDICATORS.map(({ key, checkImg }) => {
                  const isChecked = activeLines.has(key);
                  return (
                    <div key={key} onClick={() => toggleLine(key)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                      <img src={isChecked ? checkImg : checkemty} alt=""
                        style={{ width: 20, height: 20, flexShrink: 0 }} />
                      <span style={{ ...F, fontSize: 15, fontWeight: 400, color: '#0D0D0D' }}>{key}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── 오른쪽: 범례 + SVG 차트 ── */}
            <div style={{ flex: 1, padding: '24px 20px 16px', display: 'flex', flexDirection: 'column' }}>

              {/* 범례 */}
              <div style={{ display: 'flex', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
                {INDICATORS.filter(ind => activeLines.has(ind.key)).map(({ key, color }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 24, height: 3, background: color, strokeWidth: 5, borderRadius: 2 }} />
                    <span style={{ ...F, fontSize: 13, color: '#0D0D0D' }}>{key}</span>
                  </div>
                ))}
              </div>

              {/* SVG 차트 */}
              <svg
                width={SVG_W}
                height={SVG_H}
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                style={{ position: 'absolute', top: 102, left: 210, display: 'block', overflow: 'visible' }}
              >
                {/* 플롯 영역 배경 */}
                <rect
                  x={Y_LABEL_SPACE}
                  y={0}
                  width={RECT_W}
                  height={RECT_H}
                  fill="var(--color-neutral-100, #F8F9FA)"
                />

                {/* Y축 라벨 + 가로 그리드 점선 */}
                {(() => {
                  const activeKey = Array.from(activeLines)[0] || '답변 성공률';
                  const isPercent = activeKey === '답변 성공률';
                  const unit = isPercent ? '%' : activeKey === '힌트 사용' ? '회' : '초';
                  const maxVal = isPercent ? 100 : activeKey === '힌트 사용' ? 10 : 120;
                  const ticks = isPercent ? [0, 25, 50, 75, 100] : activeKey === '힌트 사용' ? [0, 2, 4, 6, 8, 10] : [0, 30, 60, 90, 120];
                  return ticks.map(v => {
                    const y = PAD + PLOT_H * (1 - v / maxVal);
                    return (
                      <g key={v}>
                        <line
                          x1={Y_LABEL_SPACE} y1={y} x2={Y_LABEL_SPACE + RECT_W} y2={y}
                          stroke="#4188ED" strokeWidth="1"
                          strokeDasharray="4 3"
                          opacity="0.4"
                        />
                        <text
                          x={Y_LABEL_SPACE - 8} y={y + 5}
                          textAnchor="end" fontSize="14" fill="#797980"
                        >{v}{unit}</text>
                      </g>
                    );
                  });
                })()}

                {/* Y축 선 */}
                <line
                  x1={Y_LABEL_SPACE} y1={0}
                  x2={Y_LABEL_SPACE} y2={RECT_H}
                  stroke="#4188ED" strokeWidth="1.5"
                />

                {/* X축 선 */}
                <line
                  x1={Y_LABEL_SPACE} y1={RECT_H}
                  x2={Y_LABEL_SPACE + RECT_W} y2={RECT_H}
                  stroke="#4188ED" strokeWidth="1.5"
                />

                {/* 데이터 라인들 */}
                {INDICATORS.filter(ind => activeLines.has(ind.key)).map(({ key, color }) => {
                  const maxVal = key === '답변 성공률' ? 100 : key === '힌트 사용' ? 10 : 120;
                  // 데이터가 1개 이상이면 렌더링되도록 방어 로직 적용
                  if (!lineData[key] || lineData[key].length < 1) return null;
                  return (
                    <polyline
                      key={key}
                      points={makeLine(lineData[key], maxVal)}
                      fill="none"
                      stroke={color}
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  );
                })}

                {/* X축 날짜 (rect 아래) */}
                {dates.map((d, i) => {
                  const x = getXPos(i, dates.length); 
                  return (
                    <text key={`${d}-${i}`} x={x} y={RECT_H + 22}
                      textAnchor="middle" fontSize="14" fill="#797980">{d}</text>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* ── 통계 카드 3개 ── */}
          {stats.map((stat, i) => (
            <div key={stat.label}
              style={{
                position: 'absolute',
                left: CONTENT_LEFT + i * (308 + 6),
                top: 783,
                width: 308, height: 100,
                borderRadius: 10,
                border: '1px solid #8E8E98',
                background: 'rgba(65,136,237,0.05)',
                boxShadow: '0 0 4px 0 rgba(65,136,237,0.35)',
                boxSizing: 'border-box',
                padding: '16px 24px',
              }}
            >
              <p style={{ ...F, margin: 0, fontSize: 16, fontWeight: 400, color: '#797980' }}>{stat.label}</p>
              <p style={{ ...F, margin: '6px 0 0', fontSize: 30, fontWeight: 700, color: '#0D0D0D' }}>{stat.value}</p>
            </div>
          ))}

          {/* ── 섹션 2: 날짜별 상세 요약 ── */}
          <p style={{ ...SECTION_TITLE, position: 'absolute', left: CONTENT_LEFT, top: 963 }}>
            날짜별 상세 요약
          </p>

          {dailySummary.map((day, i) => (
            <div key={day.date}
              style={{
                position: 'absolute',
                left: CONTENT_LEFT,
                top: 1025 + i * (90 + 16),
                width: 936, height: 90,
                borderRadius: 10,
                border: day.isToday ? '1px solid #4188ED' : '1px solid #8E8E98',
                background: day.isToday ? '#4188ED' : 'rgba(65,136,237,0.05)',
                boxShadow: '0 0 4px 0 rgba(65,136,237,0.35)',
                boxSizing: 'border-box',
                padding: '16px 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <div>
                <p style={{ ...F, margin: 0, fontSize: 18, fontWeight: 700, color: day.isToday ? '#F8F9FA' : '#0D0D0D' }}>
                  {day.date}
                </p>
                <p style={{ ...F, margin: '4px 0 0', fontSize: 14, fontWeight: 400, color: day.isToday ? 'rgba(248,249,250,0.8)' : '#797980' }}>
                  {day.desc}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {day.isToday ? (
                  <div style={{ padding: '6px 20px', borderRadius: 6, background: '#F8F9FA', border: '1px solid #4188ED' }}>
                    <span style={{ ...F, fontSize: 14, fontWeight: 700, color: '#4188ED' }}>오늘</span>
                  </div>
                ) : (
                  day.tags.map(tag => (
                    <div key={tag}
                      style={{
                        padding: '6px 16px', borderRadius: 10,
                        border: '1px solid #0F66E2', background: '#DFDF87',
                        boxShadow: '0 0 4px 0 rgba(65,136,237,0.35)',
                      }}
                    >
                      <span style={{ ...F, fontSize: 14, fontWeight: 600, color: '#0D0D0D' }}>{tag}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}