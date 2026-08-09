import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CaregiverSidebar from '../components/CaregiverSidebar';
import redEmark from '../assets/redEmark.svg';
import { getPatient } from '../api/patient';
import { getPCode } from '../utils/pcode';

const DESIGN_W = 1920;
const DESIGN_H = 1765;
const CONTENT_LEFT = 636;

const F: React.CSSProperties = {
  fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
};

const DUMMY_PATIENT = {
  name: '-',
  birth_date: '',
  dignosis: '-',
};

const RELATED_DATA = [
  { label: '어제 답변 성공률', value: '45%' },
  { label: '수면 상태 (2일)', value: '수면 부족' },
  { label: '행동 기록',       value: '반복 발화' },
];

const ACTIONS = [
  { title: '보호자 직접 확인 완료', desc: '상태를 인지하고 직접 관찰 중' },
  { title: '가족에게 공유',         desc: '가족 구성원에게 현 상태 공유' },
  { title: '사회복지사 연계 검토',  desc: '지역사회 지원 기관 연계 검토' },
  { title: '이야기/놀이 치료사 연계 검토', desc: '전문 치료 기관 연계 검토' },
];

// top 기준
const TITLE_TOP    = 144;   // 67 + 77
const ALERT_TOP    = 206;   // 144 + 42 + 20 =206
const ALERT_H      = 212;
const REL_LBL_TOP  = ALERT_TOP + ALERT_H + 60;   // 478
const REL_CARD_TOP = REL_LBL_TOP + 34 + 20;       // 480
const REL_CARD_H   = 107;
const ACT_LBL_TOP  = REL_CARD_TOP + REL_CARD_H + 60; // 647
const ACT_BOX_TOP  = ACT_LBL_TOP + 34 + 20;          // 701
const ACT_BOX_H    = 107;
const ACT_GAP      = 20;
const MEMO_LBL_TOP = ACT_BOX_TOP + 4 * (ACT_BOX_H + ACT_GAP) + 60; // 1253
const MEMO_BOX_TOP = MEMO_LBL_TOP + 34 + 20;          // 1307
const SAVE_BTN_TOP = MEMO_BOX_TOP + 110 + 80;         // 1497

export default function S22_CargiverAlerm() {
  const navigate = useNavigate();
  const [scale, setScale] = useState(1);
  const [patient, setPatient] = useState(DUMMY_PATIENT);
  const [selectedActions, setSelectedActions] = useState<Set<number>>(new Set([0]));
  const [actionMemo, setActionMemo] = useState('');
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    const pCode = getPCode();
    if (!pCode) return;
    getPatient(pCode)
      .then(data => setPatient({ name: data.name, birth_date: data.birth_date || '', dignosis: data.diagnosis }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const update = () => setScale(window.innerWidth / DESIGN_W);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100vw', height: DESIGN_H * scale, overflowX: 'hidden', background: 'var(--color-neutral-100)' }}>
      <div
        style={{
          width: DESIGN_W, height: DESIGN_H,
          position: 'absolute', top: 0, left: 0,
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
          background: 'var(--color-neutral-100)',
        }}
      >
        <CaregiverSidebar patient={patient} />

        <div style={{ marginLeft: 348 }}>
          {/* 헤더 */}
          <div style={{ height: 67, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 24, paddingRight: 348 }}>
            <button onClick={() => navigate('/caregiver-home')}
              style={{ ...F, fontSize: 16, fontWeight: 700, color: 'var(--color-neutral-gray)', background: 'none', border: 'none', cursor: 'pointer' }}>홈</button>
            <button onClick={() => navigate('/mypage')}
              style={{ ...F, fontSize: 16, fontWeight: 700, color: 'var(--color-neutral-gray)', background: 'none', border: 'none', cursor: 'pointer' }}>마이페이지</button>
          </div>

          {/* ── 타이틀: 최근 상태 변화 요약 ── */}
          <p style={{
            ...F, position: 'absolute', left: CONTENT_LEFT, top: TITLE_TOP,
            fontSize: 30, fontWeight: 700, lineHeight: '140%', color: 'var(--color-neutural-10)', margin: 0,
          }}>
            최근 상태 변화 요약
          </p>

          {/* ── 확인 필요 알림 박스 ── */}
          <div style={{
            position: 'absolute', left: CONTENT_LEFT, top: ALERT_TOP,
            width: 936, height: ALERT_H,
            borderRadius: 10,
            border: '1px solid #E53134',
            background: 'linear-gradient(180deg, rgba(223,223,135,0.20) 0%, rgba(248,249,250,0.20) 100%), rgba(65,136,237,0.05)',
            boxShadow: '0 0 4px 0 #E53134',
            boxSizing: 'border-box',
            padding: '24px 32px',
            display: 'flex', gap:21,  alignItems: 'flex-start',
          }}>
            <div style={{
              width: 62, height: 62, borderRadius: 60, marginTop:21,
              border: '2px solid #EF4452',
              background:'var(--color-neutral-100)',
              boxShadow: '0 0 4 0 #DFDF87',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
            {/* 경고 아이콘 */}
            <img src={redEmark} alt="경고" style={{ width: 44, height: 44, flexShrink: 0, aspectRatio: 1/1 }} />
            </div>
            {/* 텍스트 */}
            <div>
              <p style={{ ...F, margin: '4px 0 0', fontSize: 30, fontWeight: 700, lineHeight: '140%',color: '#E53134' }}>확인 필요 알림</p>
              <p style={{ ...F, margin: '6px 0 0', fontSize: 22, fontWeight: 400, lineHeight: '155%',color: 'var(--color-neutral-10)' }}>
                최근 수면 부족과 답변 어려움이 함께 기록되었습니다.<br />
                반복 발화와 불안 반응이 기록되었습니다. 보호자 확인이 필요합니다.
              </p>
              <p style={{ ...F,marginTop: 10, fontSize: 22, fontWeight: 400, lineHeight: '155%',color: 'var(-color-neutral-gray)' }}>
                2026. 05. 25 ~ 2026. 05. 26
              </p>
            </div>
          </div>

          {/* ── 관련 데이터 레이블 ── */}
          <p style={{
            ...F, position: 'absolute', left: CONTENT_LEFT, top: REL_LBL_TOP,
            fontSize: 22, fontWeight: 700, lineHeight: '155%', color: 'var(--color-neutral-10)', margin: 0,
          }}>관련 데이터</p>

          {/* ── 관련 데이터 카드 3개 ── */}
          {RELATED_DATA.map((item, i) => (
            <div key={item.label} style={{
              position: 'absolute',
              left: CONTENT_LEFT + i * (296 + 24),
              top: REL_CARD_TOP,
              width: 296,
              display: 'inline-flex',
              padding: '19px 20px 20px 29px',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              gap: 2,
              borderRadius: 10,
              border: '1px solid #8E8E98',
              background: 'linear-gradient(180deg, rgba(223,223,135,0.20) 0%, rgba(248,249,250,0.20) 100%), rgba(65,136,237,0.05)',
              boxShadow: '0 0 4px 0 #4188ED',
              boxSizing: 'border-box',
            }}>
              <p style={{ ...F, margin: 0, fontSize: 22, fontWeight: 400, lineHeight: '155%', color: 'var(--color-neutral-10' }}>{item.label}</p>
              <p style={{ ...F, margin: 0, fontSize: 36, fontWeight: 700, lineHeight: '135%', color: 'var(--color-neutral-10)' }}>{item.value}</p>
            </div>
          ))}

          {/* ── 조치 선택 레이블 ── */}
          <p style={{
            ...F, position: 'absolute', left: CONTENT_LEFT, top: ACT_LBL_TOP,
            fontSize: 22, fontWeight: 700, lineHeight: '155%', color: '#0D0D0D', margin: 0,
          }}>조치 선택</p>

          {/* ── 조치 박스 4개 ── */}
          {ACTIONS.map((action, i) => {
            const isSelected = selectedActions.has(i);
            return (
              <div key={action.title}
                onClick={() => setSelectedActions(prev => {
                    const next = new Set(prev);
                    next.has(i) ? next.delete(i) : next.add(i);
                    return next;
                  })}
                style={{
                  position: 'absolute',
                  left: CONTENT_LEFT,
                  top: ACT_BOX_TOP + i * (ACT_BOX_H + ACT_GAP),
                  display: 'flex',
                  width: 936, height: ACT_BOX_H,
                  padding: '20px 29px 19px 29px',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  borderRadius: 10,
                  border: selectedActions.has(i) ? '1px solid #DFDF87' : '1px solid #8E8E98',
                  background: selectedActions.has(i) ? '#0F66E2' : '#F8F9FA',
                  boxShadow: selectedActions.has(i) ? '0 0 4px 0 #4188ED' : '0 0 4px 0 #797980',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  transition: 'background 0.15s, box-shadow 0.15s',
                }}
              >
                <p style={{ ...F, margin: 0, fontSize: 22, fontWeight: 700, lineHeight: '155%', color: isSelected ? 'var(--color-neutral-100)' : 'var(--color-neutral-10)' }}>
                  {action.title}
                </p>
                <p style={{ ...F, margin: 0, fontSize: 22, fontWeight: 400, lineHeight: '155%', color: isSelected ? 'var(--color-neutral-100)' : 'var(--color-neutral-gray)' }}>
                  {action.desc}
                </p>
              </div>
            );
          })}

          {/* ── 조치 메모 레이블 ── */}
          <p style={{
            ...F, position: 'absolute', left: CONTENT_LEFT, top: MEMO_LBL_TOP,
            fontSize: 22, fontWeight: 700, lineHeight: '155%', color: '#0D0D0D', margin: 0,
          }}>조치 메모</p>

          {/* ── 메모 textarea ── */}
          <textarea
            value={actionMemo}
            onChange={e => setActionMemo(e.target.value)}
            style={{
              position: 'absolute',
              left: CONTENT_LEFT,
              top: MEMO_BOX_TOP,
              width: 936, height: 110,
              padding: '23px 29px',
              boxSizing: 'border-box',
              borderRadius: 10,
              border: '1px solid #8E8E98',
              background: 'rgba(65,136,237,0.05)',
              boxShadow: '0 0 4px 0 #4188ED',
              fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
              fontSize: 22, fontWeight: 400, color: '#0D0D0D',
              resize: 'none', outline: 'none',
            }}
          />

          {/* ── 저장 버튼 ── */}
          <div style={{ position: 'absolute', left: 348+CONTENT_LEFT+505, top: SAVE_BTN_TOP, display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => { setSavedMsg(true); setTimeout(() => setSavedMsg(false), 2000); }}
              style={{
                ...F,
                display: 'inline-flex', height: 59, padding: '24px 22px',
                justifyContent: 'center', alignItems: 'center', gap: 10,
                borderRadius: 50, background: 'var(--color-primary)', border: 'none',
                boxShadow: '0 0 4px 0 var(--color-primary)', cursor: 'pointer',
                fontSize: 22, fontWeight: 700, lineHeight: '155%', color: 'var(--color-neutral-100)',
              }}
            >저장</button>
            {savedMsg && (
              <span style={{ ...F, fontSize: 18, fontWeight: 700, color: '#4188ED' }}>저장되었습니다</span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
