import { useState, useEffect, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/patientHeader';
import { 
  getPatientMe, 
  getDailyStatus, 
  type PatientMeResponse, 
  type DailyStatusResponse 
} from '../api/patientApi';
import { api } from '../api/client';

const F: CSSProperties = {
  fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
};

interface UserInfoResponse {
  name?: string;
  patientCode?: string;
  p_code?: string;
  user_email?: string;
  role?: string;
}

interface ExtendedDailyStatusResponse extends DailyStatusResponse {
  is_completed?: boolean;
  isCompleted?: boolean;
  completed_count?: number;
  completedCount?: number;
  total_count?: number;
  totalCount?: number;
}

function todayStr() {
  return new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });
}

function getTodayIsoString() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' });
  return formatter.format(now);
}

const formatHealthStatus = (status: string | null | undefined) => {
  if (!status || status === '-') return '-';
  const trimmed = String(status).trim();
  if (trimmed === 'good') return '좋음';
  if (trimmed === 'normal') return '보통';
  if (trimmed === 'bad') return '좋지 않음';
  return trimmed;
};

const clearSessionQuizData = () => {
  const quizKeys = [
    'quizList',
    'currentQuizIndex',
    'totalHintCount',
    'retryCount',
    'speakRetryCount',
    'todayActivityQuit',
    'correctQuizCount',
    'currentQuizElapsedTime',
    'conditionStatus',
    'sleepStatus',
    'moodStatus',
    'recallScore',
    'musicScore',
    'drawingScore',
  ];
  quizKeys.forEach((key) => sessionStorage.removeItem(key));
};

export default function S09_PatientHome() {
  const navigate = useNavigate();
  const todayIso = getTodayIsoString();

  const [isCompleted, setIsCompleted] = useState(false);
  const [completedCount, setCompletedCount] = useState<number | null>(null); // 초기값을 null로 설정하여 결과 존재 여부 판별
  const [isCodeClicked, setIsCodeClicked] = useState(false);
  const [healthStatusValue, setHealthStatusValue] = useState<string>('-');

  const [hasOngoingQuiz, setHasOngoingQuiz] = useState<boolean>(() => {
    return !!sessionStorage.getItem('quizList');
  });

  const [patientName, setPatientName] = useState<string>(() => {
    return sessionStorage.getItem('name') || sessionStorage.getItem('patientName') || '환자';
  });

  const [pairCode, setPairCode] = useState<string>(() => {
    return sessionStorage.getItem('p_code') || sessionStorage.getItem('pCode') || '-------';
  });

  const syncStorageState = useCallback((currentPCode?: string) => {
    if (!currentPCode) {
      setIsCompleted(false);
      setCompletedCount(null);
      setHealthStatusValue('-');
      return;
    }

    const prefix = `${currentPCode}_`;

    const todayDoneKey = `activityCompleted_${prefix}${todayIso}`;
    const todayDoneKeyAlt = `todayActivityCompleted_${prefix}${todayIso}`;
    
    const isTodayDone = 
      sessionStorage.getItem(todayDoneKey) === 'true' ||
      sessionStorage.getItem(todayDoneKeyAlt) === 'true';

    let count: number | null = null;
    const savedPatientCount = 
      sessionStorage.getItem(`completedActivityCount_${prefix}${todayIso}`) ||
      sessionStorage.getItem('completedActivityCount') ||
      sessionStorage.getItem('currentQuizIndex'); 

    if (savedPatientCount !== null) {
      count = parseInt(savedPatientCount, 10);
      if (isNaN(count)) count = null;
    }

    const savedHealth = 
      sessionStorage.getItem(`todayHealthCondition_${prefix}${todayIso}`) ||
      sessionStorage.getItem('conditionStatus');

    setHealthStatusValue(formatHealthStatus(savedHealth));
    setCompletedCount(count);
    setIsCompleted(isTodayDone);
    
    setHasOngoingQuiz(!!sessionStorage.getItem('quizList'));
  }, [todayIso]);

  useEffect(() => {
    const fetchInitialData = async () => {
      let internalCode: number | string | undefined = sessionStorage.getItem('internalCode') || undefined;
      let pCode: string | undefined = sessionStorage.getItem('p_code') || sessionStorage.getItem('pCode') || undefined;
      const lastSavedDate = sessionStorage.getItem('lastActivityDate');

      if (lastSavedDate !== todayIso) {
        clearSessionQuizData();
        sessionStorage.setItem('lastActivityDate', todayIso);
      }

      try {
        const userData = await api.get<UserInfoResponse>('/auth/me');
        if (userData?.name) {
          setPatientName(userData.name);
          sessionStorage.setItem('name', userData.name);
        }
      } catch (err) {
        console.warn('사용자 프로필 조회 실패:', err);
      }

      try {
        const meRes: PatientMeResponse = await getPatientMe();
        if (meRes) {
          const fetchedInternalCode = meRes.internal_code ?? meRes.internalCode;
          const fetchedPCode = meRes.p_code ?? meRes.pCode;

          if (fetchedPCode && pCode && fetchedPCode !== pCode) {
            clearSessionQuizData();
            sessionStorage.removeItem('todayActivityCompleted');
            sessionStorage.removeItem('completedActivityCount');
          }

          internalCode = fetchedInternalCode ?? internalCode;
          pCode = fetchedPCode ?? pCode;

          if (internalCode) sessionStorage.setItem('internalCode', String(internalCode));
          if (pCode) {
            setPairCode(pCode);
            sessionStorage.setItem('p_code', pCode);
          }
        }
      } catch (err) {
        console.warn('getPatientMe() 조회 실패:', err);
      }

      if (pCode) {
        syncStorageState(pCode);
      }

      const targetPatientId = internalCode || pCode;
      if (targetPatientId && pCode) {
        const prefix = `${pCode}_`;
        try {
          const dailyData: ExtendedDailyStatusResponse = await getDailyStatus(targetPatientId, todayIso);

          if (dailyData) {
            if (dailyData.health_condition) {
              const formatted = formatHealthStatus(dailyData.health_condition);
              setHealthStatusValue(formatted);
              sessionStorage.setItem(`todayHealthCondition_${prefix}${todayIso}`, dailyData.health_condition);
            }

            const serverCompleted = dailyData.is_completed ?? dailyData.isCompleted;
            if (typeof serverCompleted === 'boolean') {
              setIsCompleted(serverCompleted);
              sessionStorage.setItem(`activityCompleted_${prefix}${todayIso}`, String(serverCompleted));
            }

            const serverCompletedCount = dailyData.completed_count ?? dailyData.completedCount;
           
            if (typeof serverCompletedCount === 'number' && !sessionStorage.getItem('quizList')) {
              setCompletedCount(serverCompletedCount);
              sessionStorage.setItem(`completedActivityCount_${prefix}${todayIso}`, String(serverCompletedCount));
            }
          }
        } catch (err) {
          console.warn('Daily status 조회 실패:', err);
        }
      }
    };

    fetchInitialData();
  }, [syncStorageState, todayIso]);

  const handleStartActivity = () => {
    const currentPCode = sessionStorage.getItem('p_code') || sessionStorage.getItem('pCode');
    const prefix = currentPCode ? `${currentPCode}_` : '';

    const lastDate = sessionStorage.getItem(`${prefix}lastActivityDate`) || sessionStorage.getItem('lastActivityDate');

    if (lastDate !== todayIso) {
      clearSessionQuizData();
      sessionStorage.setItem(`${prefix}lastActivityDate`, todayIso);
      sessionStorage.setItem('lastActivityDate', todayIso);
    }

    const quizListStr = sessionStorage.getItem('quizList');

    if (quizListStr) {
      try {
        const quizList = JSON.parse(quizListStr);
        
        if (Array.isArray(quizList) && quizList.length > 0) {
          let currentIndex = Number(sessionStorage.getItem('currentQuizIndex') || '0');
          
          if (isNaN(currentIndex) || currentIndex < 0 || currentIndex >= quizList.length) {
            currentIndex = 0;
            sessionStorage.setItem('currentQuizIndex', '0');
          }

          const currentQuiz = quizList[currentIndex];

          const rawCategory = 
            currentQuiz?.quizCategory || 
            currentQuiz?.quiz_category || 
            currentQuiz?.category || 
            currentQuiz?.type || 
            'choice';

          const category = String(rawCategory).toLowerCase().trim();

          let targetRoute = '/patient-voicechat'; 

          if (category.includes('photo') || category.includes('picture') || category.includes('image')) {
            targetRoute = '/patient-photo';
          } else if (category.includes('text') || category.includes('voice') || category.includes('subjective')) {
            targetRoute = '/patient-voicequiz';
          } else if (category.includes('choice') || category.includes('multiple')) {
            targetRoute = '/patient-voicechat';
          }

          navigate(targetRoute);
          return;
        }
      } catch (e) {
        console.error('퀴즈 데이터 파싱 실패:', e);
        clearSessionQuizData();
      }
    }

    clearSessionQuizData();
    navigate('/patient-check');
  };

  const handleViewResults = () => {
    if (hasOngoingQuiz) {
      alert('현재 진행 중인 활동이 있습니다. 활동을 먼저 마치거나 초기화 후 이용해 주세요.');
      return;
    }

    let targetDate = todayIso;

    if (!isCompleted) {
      const prevDate = new Date();
      prevDate.setDate(prevDate.getDate() - 1);
      const year = prevDate.getFullYear();
      const month = String(prevDate.getMonth() + 1).padStart(2, '0');
      const day = String(prevDate.getDate()).padStart(2, '0');
      targetDate = `${year}-${month}-${day}`;
    }

    navigate(`/patient-result?date=${targetDate}`);
  };

  const currentCount = completedCount ?? 0;
  const successRate = `${Math.round((currentCount / 7) * 100)}%`;

  // 결과 수치가 존재하는지 체크 (completedCount가 null이 아니거나 활동 완료 상태)
  const hasResult = completedCount !== null || isCompleted;

  return (
    <div
      style={{
        ...F,
        width: '100vw',
        minHeight: '100vh',
        backgroundColor: '#F8F9FA',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxSizing: 'border-box',
        paddingBottom: '80px',
        overflowX: 'hidden',
      }}
    >
      <Header />

      <main
        style={{
          ...F,
          width: '100%',
          maxWidth: '700px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          marginTop: '30px',
          padding: '0 20px',
          boxSizing: 'border-box',
        }}
      >
        <section
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            marginBottom: '36px',
          }}
        >
          <p
            style={{
              ...F,
              margin: 0,
              fontSize: '28px',
              fontWeight: 700,
              lineHeight: '1.3',
              color: '#0d0d0d',
              whiteSpace: 'nowrap',
            }}
          >
            안녕하세요, {patientName}님!🖐️
          </p>
          <p
            style={{
              ...F,
              margin: '8px 0 0',
              fontSize: '16px',
              fontWeight: 500,
              lineHeight: '1.4',
              color: '#4188ed',
              whiteSpace: 'nowrap',
            }}
          >
            오늘도 천천히 듣고 말하면서 기억을 떠올려볼까요?
          </p>
          <p
            style={{
              ...F,
              margin: '8px 0 0',
              fontSize: '15px',
              fontWeight: 400,
              lineHeight: '1.4',
              color: '#797980',
              whiteSpace: 'nowrap',
            }}
          >
            {todayStr()}
          </p>
        </section>

        <h2
          style={{
            ...F,
            margin: '0 0 14px 0',
            fontSize: '27px',
            fontWeight: 700,
            lineHeight: '1.3',
            color: '#0d0d0d',
          }}
        >
          오늘의 두뇌 활동
        </h2>

        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '200px',
            border: '1px solid #4188ed',
            borderRadius: '16px',
            boxShadow: '0px 0px 6px 0px #4188ED',
            padding: '24px 26px',
            boxSizing: 'border-box',
            background:
              'linear-gradient(0deg, rgba(65, 136, 237, 0.05), rgba(65, 136, 237, 0.05)), linear-gradient(180deg, rgba(32, 115, 232, 0.2) 0%, rgba(223, 223, 135, 0.2) 100%)',
            marginBottom: '50px',
          }}
        >
          <p
            style={{
              ...F,
              margin: 0,
              fontSize: '23px',
              fontWeight: 700,
              lineHeight: '1.3',
              color: '#0d0d0d',
            }}
          >
            {hasOngoingQuiz ? '이어서 두뇌 활동 진행하기' : '오늘의 인지 자극 활동 시작하기'}
          </p>
          <p
            style={{
              ...F,
              margin: '8px 0 0',
              fontSize: '14px',
              fontWeight: 400,
              lineHeight: '1.3',
              color: '#797980',
            }}
          >
            건강 체크 → 음성 퀴즈 → 회상 활동 → 그림/노래 활동
          </p>

          <button
            type="button"
            onClick={() => navigate('/mypage')}
            style={{
              ...F,
              position: 'absolute',
              top: '22px',
              right: '26px',
              width: '58px',
              height: '58px',
              borderRadius: '50%',
              background: isCompleted ? '#DFDF87' : '#D9D9D9',
              border: isCompleted
                ? '1.5px solid #0F66E2'
                : '1.2px dashed #8E8E98',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 700,
              color: isCompleted ? '#0F66E2' : '#8E8E98',
              boxShadow: isCompleted ? '0px 0px 4px 0px #0F66E2' : 'none',
            }}
          >
            {isCompleted ? '완료' : '미완료'}
          </button>

          <button
            type="button"
            disabled={isCompleted}
            onClick={handleStartActivity}
            style={{
              ...F,
              position: 'absolute',
              left: '26px',
              bottom: '18px',
              width: 'calc(100% - 52px)',
              height: '60px',
              borderRadius: '50px',
              cursor: isCompleted ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: isCompleted ? '1px solid #0D0D0D' : 'none',
              boxShadow: isCompleted
                ? '0px 0px 4px 0px #0D0D0D'
                : '0px 0px 4px 0px #4188ED',
              background: isCompleted ? '#0D0D0D' : '#0f66e2',
            }}
          >
            <span
              style={{
                ...F,
                fontSize: '17px',
                fontWeight: 500,
                lineHeight: '1.3',
                color: '#f8f9fa',
              }}
            >
              {isCompleted ? '오늘 활동 완료' : hasOngoingQuiz ? '이어서 하기' : '활동 시작하기'}
            </span>
          </button>
        </div>

        <h2
          style={{
            ...F,
            margin: '0 0 16px 0',
            fontSize: '22px',
            fontWeight: 700,
            lineHeight: '1.3',
            color: '#0d0d0d',
          }}
        >
          오늘 이만큼 했어요
        </h2>

        <div
          style={{
            display: 'flex',
            width: '100%',
            gap: '16px',
            marginBottom: '30px',
          }}
        >
          {[
            {
              label: healthStatusValue !== '-' ? '오늘의 건강 상태' : '건강 상태',
              value: healthStatusValue,
              isActive: healthStatusValue !== '-',
            },
            {
              label: '진행한 활동',
              value: `${currentCount} / 7`,
              isActive: hasResult,
            },
            {
              label: '달성률',
              value: successRate,
              isActive: hasResult,
            },
          ].map((stat, idx) => {
            const isBlue = stat.isActive;

            return (
              <div
                key={idx}
                style={{
                  flex: 1,
                  height: '108px',
                  background: isBlue
                    ? '#4188ED0D'
                    : 'rgba(217, 217, 217, 0.2)',
                  border: isBlue ? '1px solid #4188ED' : '1px solid #8E8E98',
                  boxShadow: isBlue
                    ? '0px 0px 4px 0px #4188ED'
                    : '0px 0px 4px 0px #797980',
                  borderRadius: '12px',
                  boxSizing: 'border-box',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  gap: '6px',
                }}
              >
                <p
                  style={{
                    ...F,
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: 500,
                    lineHeight: '1.2',
                    color: isBlue ? '#0D0D0D' : '#797980',
                  }}
                >
                  {stat.label}
                </p>
                <p
                  style={{
                    ...F,
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: 700,
                    lineHeight: '1.2',
                    color: isBlue ? '#0D0D0D' : '#797980',
                  }}
                >
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            gap: '16px',
            marginBottom: '40px',
          }}
        >
          {/* 퀴즈 진행 중일 때는 비활성화 색상 및 클릭 제어 적용 */}
          <button
            type="button"
            onClick={handleViewResults}
            disabled={hasOngoingQuiz}
            style={{
              ...F,
              flex: 1,
              height: '50px',
              background: hasOngoingQuiz ? '#E5E5E5' : '#ffffff',
              border: hasOngoingQuiz ? '1px solid #C4C4C4' : '1px solid #797980',
              boxShadow: hasOngoingQuiz ? 'none' : '0px 0px 4px 0px #797980',
              borderRadius: '50px',
              cursor: hasOngoingQuiz ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                ...F,
                fontSize: '17px',
                fontWeight: 700,
                lineHeight: '1.3',
                color: hasOngoingQuiz ? '#A0A0A0' : '#0d0d0d',
              }}
            >
              이전 결과 보기
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsCodeClicked(!isCodeClicked)}
            style={{
              ...F,
              flex: 1,
              height: '50px',
              background: isCodeClicked ? '#4188ED0D' : '#0D0D0D',
              border: isCodeClicked ? '1px solid #8E8E98' : 'none',
              boxShadow: '0px 0px 4px 0px #4188ED',
              borderRadius: '50px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <span
              style={{
                ...F,
                fontSize: isCodeClicked ? '19px' : '17px',
                fontWeight: 700,
                lineHeight: '1.3',
                letterSpacing: isCodeClicked ? '2px' : 'normal',
                color: isCodeClicked ? '#0D0D0D' : '#f8f9fa',
              }}
            >
              {isCodeClicked ? pairCode : '내 연동 코드 보기'}
            </span>
          </button>
        </div>
      </main>
    </div>
  );
}
