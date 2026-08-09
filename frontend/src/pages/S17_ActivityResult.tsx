import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/patientHeader';
import { 
  getPatientMe, 
  getQuizResults, 
  getDailyStatus, 
  type PatientMeResponse, 
  type DailyStatusResponse 
} from '../api/patientApi';

const getTodayKST = (): string => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' });
  return formatter.format(now);
};

function CelebrationIcon() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_83_395)">
        <path d="M12.3257 74.2881L58.9517 57.5301L20.4957 19.2061L3.81567 65.7881C1.92167 71.0801 7.03767 76.1881 12.3257 74.2881Z" fill="#EF4452"/>
        <path d="M20.7116 9.32405C22.7749 9.32405 24.4476 7.65139 24.4476 5.58805C24.4476 3.52471 22.7749 1.85205 20.7116 1.85205C18.6483 1.85205 16.9756 3.52471 16.9756 5.58805C16.9756 7.65139 18.6483 9.32405 20.7116 9.32405Z" fill="#EDCCF8"/>
        <path d="M60.6583 56.5137C64.6651 52.5069 59.1572 40.5027 48.3561 29.7016C37.5549 18.9005 25.5508 13.3926 21.544 17.3994C17.5372 21.4062 23.0451 33.4103 33.8462 44.2115C44.6473 55.0126 56.6515 60.5205 60.6583 56.5137Z" fill="#A41926"/>
        <path d="M34.1257 27.6141C33.8997 27.6141 33.6677 27.5821 33.4377 27.5181C32.1097 27.1401 31.3417 25.7561 31.7197 24.4281C32.9117 20.2541 32.8477 15.8461 31.5337 11.6801C31.1177 10.3621 31.8497 8.96008 33.1657 8.54408C34.4817 8.12808 35.8857 8.85808 36.3017 10.1761C37.9117 15.2781 37.9897 20.6821 36.5277 25.8001C36.2137 26.8981 35.2157 27.6141 34.1257 27.6141Z" fill="#B44BD7"/>
        <path d="M58.7379 34.9139C57.9639 34.9139 57.1999 34.5559 56.7119 33.8799C55.9019 32.7619 56.1519 31.1999 57.2699 30.3879C62.5579 26.5559 68.8199 24.3779 75.3799 24.0919C76.7699 24.0779 77.9259 25.1019 77.9879 26.4799C78.0479 27.8599 76.9779 29.0259 75.5999 29.0879C70.0199 29.3319 64.6979 31.1819 60.2039 34.4379C59.7599 34.7599 59.2479 34.9139 58.7399 34.9139H58.7379Z" fill="#EF4452"/>
        <path d="M68.7597 47.532C68.4417 47.532 68.1177 47.47 67.8037 47.34C66.1237 46.644 64.3717 46.108 62.5957 45.746C57.0497 44.614 51.3397 45.164 46.0837 47.34C44.8017 47.866 43.3437 47.262 42.8177 45.988C42.2897 44.712 42.8957 43.25 44.1697 42.722C50.3517 40.162 57.0717 39.514 63.5957 40.848C65.6837 41.274 67.7437 41.904 69.7177 42.722C70.9937 43.25 71.5997 44.712 71.0717 45.988C70.6737 46.95 69.7397 47.532 68.7597 47.532Z" fill="#7896FF"/>
        <path d="M42.7134 35.1399C41.9634 35.1399 41.2194 34.8039 40.7274 34.1619C39.8874 33.0679 40.0934 31.4979 41.1894 30.6579C47.2034 26.0439 51.0594 19.3639 52.0494 11.8479C52.2294 10.4799 53.4874 9.51386 54.8534 9.69586C56.2234 9.87586 57.1874 11.1319 57.0054 12.4999C55.8414 21.3399 51.3054 29.1959 44.2314 34.6239C43.7774 34.9719 43.2454 35.1399 42.7134 35.1399Z" fill="#4A81EC"/>
        <path d="M31.4607 39.4737L31.4616 35.7197C31.4618 34.9387 30.8288 34.3055 30.0479 34.3053L26.2939 34.3044C25.513 34.3042 24.8798 34.9371 24.8796 35.7181L24.8787 39.4721C24.8785 40.253 25.5114 40.8862 26.2923 40.8864L30.0463 40.8873C30.8272 40.8875 31.4605 40.2546 31.4607 39.4737Z" fill="white"/>
        <path d="M47.2294 1.1097L43.8008 2.83903C43.0878 3.19868 42.8013 4.06826 43.161 4.7813L44.8903 8.20986C45.25 8.92289 46.1195 9.20937 46.8326 8.84972L50.2611 7.12038C50.9742 6.76073 51.2606 5.89115 50.901 5.17812L49.1717 1.74956C48.812 1.03652 47.9424 0.750047 47.2294 1.1097Z" fill="#7896FF"/>
        <path d="M74.6682 58.8047L75.8315 55.1451C76.0734 54.3841 75.6526 53.571 74.8915 53.329L71.2319 52.1658C70.4708 51.9238 69.6577 52.3447 69.4158 53.1058L68.2525 56.7653C68.0106 57.5264 68.4315 58.3395 69.1926 58.5814L72.8521 59.7447C73.6132 59.9866 74.4263 59.5658 74.6682 58.8047Z" fill="#A8BFFF"/>
        <path d="M67.0676 21.0282C68.7288 21.0282 70.0756 19.6815 70.0756 18.0202C70.0756 16.3589 68.7288 15.0122 67.0676 15.0122C65.4063 15.0122 64.0596 16.3589 64.0596 18.0202C64.0596 19.6815 65.4063 21.0282 67.0676 21.0282Z" fill="#FFC84D"/>
        <path d="M7.008 34.0702C8.66927 34.0702 10.016 32.7235 10.016 31.0622C10.016 29.4009 8.66927 28.0542 7.008 28.0542C5.34673 28.0542 4 29.4009 4 31.0622C4 32.7235 5.34673 34.0702 7.008 34.0702Z" fill="#A8BFFF"/>
        <path d="M49.1272 73.2959C51.0657 73.2959 52.6372 71.7244 52.6372 69.7859C52.6372 67.8474 51.0657 66.2759 49.1272 66.2759C47.1887 66.2759 45.6172 67.8474 45.6172 69.7859C45.6172 71.7244 47.1887 73.2959 49.1272 73.2959Z" fill="#FFC84D"/>
      </g>
      <defs>
        <clipPath id="clip0_83_395">
          <rect width="80" height="80" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  );
}

export default function S17_ActivityReport() {
  const navigate = useNavigate();
  const location = useLocation();
  const todayStr = getTodayKST();

  const queryParams = new URLSearchParams(location.search);
  const targetDateParam = queryParams.get('date');

  const [completedCount, setCompletedCount] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [hintCount, setHintCount] = useState<number>(0);
  const [retryCount, setRetryCount] = useState<number>(0);

  const [conditionStatus, setConditionStatus] = useState('좋음');
  const [sleepStatus, setSleepStatus] = useState('잘 잤음');
  const [moodStatus, setMoodStatus] = useState('편안함');

  const updateCompletedState = (count: number, pCode?: string) => {
    const prefix = pCode ? `${pCode}_` : '';
    const countStr = String(count);

    sessionStorage.setItem(`activityCompleted_${prefix}${todayStr}`, 'true');
    sessionStorage.setItem(`todayActivityCompleted_${prefix}${todayStr}`, 'true');
    sessionStorage.setItem(`completedActivityCount_${prefix}${todayStr}`, countStr);
    
    sessionStorage.setItem('completedActivityCount', countStr);
    sessionStorage.setItem('totalActivityCount', countStr);
    sessionStorage.setItem('lastActivityDate', todayStr);
    sessionStorage.setItem(`${prefix}lastActivityDate`, todayStr);
    sessionStorage.setItem('todayActivityCompleted', 'true');
  };

  useEffect(() => {
    const preventGoBack = () => {
      window.history.pushState(null, '', window.location.href);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', preventGoBack);

    return () => {
      window.removeEventListener('popstate', preventGoBack);
    };
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      let internalCode: number | string | undefined = sessionStorage.getItem('internalCode') || undefined;
      let pCode: string | undefined = sessionStorage.getItem('p_code') || sessionStorage.getItem('pCode') || undefined;

      // retry 횟수는 sessionStorage에서 직접 조회
      const savedRetry = sessionStorage.getItem('retryCount');
      if (savedRetry !== null) {
        setRetryCount(Number(savedRetry));
      }

      try {
        const meRes: PatientMeResponse = await getPatientMe();
        if (meRes) {
          internalCode = meRes.internal_code ?? meRes.internalCode ?? internalCode;
          pCode = meRes.p_code ?? meRes.pCode ?? pCode;

          if (internalCode) sessionStorage.setItem('internalCode', String(internalCode));
          if (pCode) sessionStorage.setItem('p_code', pCode);
        }
      } catch (err) {
        console.warn('getPatientMe() 조회 실패:', err);
      }

      if (!pCode) {
        console.warn('환자 p_code를 찾을 수 없습니다.');
        return;
      }

      const currentFetchDate = targetDateParam || todayStr;
      let quizData: any = null;

      try {
        quizData = await getQuizResults(pCode, currentFetchDate);
      } catch (err) {
        console.warn(`${currentFetchDate} 퀴즈 결과 조회 실패:`, err);
      }

      if (quizData) {
        const actualCount = typeof quizData.total_count === 'number' ? quizData.total_count : 0;
        
        setCompletedCount(actualCount);

        if (typeof quizData.correct_count === 'number') {
          setCorrectCount(quizData.correct_count);
        }
        if (typeof quizData.hint === 'number') {
          setHintCount(quizData.hint);
        }

        const fetchedSetId = quizData?.set_id ?? quizData?.setId;
        if (fetchedSetId !== undefined && fetchedSetId !== null) {
          sessionStorage.setItem('set_id', String(fetchedSetId));
        }

        if (currentFetchDate === todayStr) {
          updateCompletedState(actualCount, pCode);
        }
      }

      // 건강 상태 데이터 조회
      const targetPatientId = internalCode || pCode;
      if (targetPatientId) {
        try {
          const statusData: DailyStatusResponse = await getDailyStatus(targetPatientId, currentFetchDate);

          if (statusData) {
            if (statusData.health_condition) setConditionStatus(statusData.health_condition);
            if (statusData.sleep_status) setSleepStatus(statusData.sleep_status);
            if (statusData.mood_status) setMoodStatus(statusData.mood_status);
          }
        } catch (err) {
          console.warn('건강 상태 조회 실패:', err);
        }
      }
    };

    fetchAllData();
  }, [todayStr, targetDateParam]);

  const feedbackText = `총 ${completedCount} 문제 중 ${correctCount} 개 맞추셨습니다. 수고하셨습니다!`;

  const handlePlayTTS = () => {
    if (!('speechSynthesis' in window)) {
      alert('현재 브라우저에서는 음성 재생을 지원하지 않습니다.');
      return;
    }

    window.speechSynthesis.cancel();
    const textToSpeak = `오늘도 끝까지 잘해주셨어요. ${feedbackText}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9;

    window.speechSynthesis.speak(utterance);
  };

  const handleGoHome = () => {
    window.speechSynthesis.cancel();
    navigate('/patient-home');
  };

  const summaryBoxStyle = {
    width: '193px',
    height: '124px',
    borderRadius: '10px',
    background: '#4188ED0D',
    border: '1px solid #8E8E98',
    boxShadow: '0px 0px 4px 0px #4188ED',
    padding: '16px 20px',
    boxSizing: 'border-box' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between' as const,
    textAlign: 'left' as const
  };

  const tagStyle = {
    height: '46px',
    borderRadius: '10px',
    background: '#4188ED',
    border: '1px solid #4188ED',
    boxShadow: '0px 0px 4px 0px #4188ED',
    padding: '6px 19px',
    boxSizing: 'border-box' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    fontSize: '16px',
    fontWeight: 700
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: '#F8F9FA',
      fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxSizing: 'border-box',
      paddingBottom: '120px'
    }}>
      <Header />
      <div style={{ width: '805px', display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translateX(6px)' }}>

        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '60px',
          background: 'linear-gradient(0deg, rgba(65, 136, 237, 0.05), rgba(65, 136, 237, 0.05)), linear-gradient(180deg, rgba(32, 115, 232, 0.2) 0%, rgba(223, 223, 135, 0.2) 100%)',
          border: '2px solid #0F66E2',
          boxShadow: '0px 0px 4px 0px #0F66E2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '17px',
          gap: '10px',
          boxSizing: 'border-box',
          marginBottom: '35px',
          marginTop: '60px'
        }}>
          <CelebrationIcon />
        </div>

        <h1 style={{
          width: '500px',
          fontSize: '36px',
          fontWeight: 700,
          color: '#0D0D0D',
          lineHeight: '135%',
          textAlign: 'center',
          margin: '0 0 16px 0'
        }}>
          오늘도 끝까지 잘해주셨어요!
        </h1>

        <p style={{
          width: '800px',
          fontSize: '22px',
          fontWeight: 400,
          color: '#797980',
          lineHeight: '155%',
          textAlign: 'center',
          margin: '0 0 23px 0'
        }}>
          {feedbackText}
        </p>

        <button 
          onClick={handlePlayTTS}
          style={{
            width: '154px',
            height: '46px',
            borderRadius: '10px',
            background: '#4188ED0D',
            border: '1px solid #0F66E2',
            boxShadow: '0px 0px 4px 0px #4188ED',
            padding: '6px 19px',
            gap: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#0F66E2',
            fontSize: '16px',
            fontWeight: 700,
            marginBottom: '80px'
          }}
        >
          ▶ 결과 듣기
        </button>

        <div style={{ width: '100%', textAlign: 'left', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '30px', fontWeight: 700, color: '#0D0D0D', lineHeight: '140%', margin: 0 }}>
            오늘 활동 요약
          </h2>
        </div>

        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '80px' }}>
          <div style={summaryBoxStyle}>
            <span style={{ fontSize: '16px', fontWeight: 500, color: '#797980' }}>수행 활동</span>
            <p style={{ fontSize: '28px', fontWeight: 700, color: '#0D0D0D', margin: 0 }}>{completedCount}개</p>
          </div>
          <div style={summaryBoxStyle}>
            <span style={{ fontSize: '16px', fontWeight: 500, color: '#797980' }}>회상 성공</span>
            <p style={{ fontSize: '28px', fontWeight: 700, color: '#0D0D0D', margin: 0 }}>{correctCount}회</p>
          </div>
          <div style={summaryBoxStyle}>
            <span style={{ fontSize: '16px', fontWeight: 500, color: '#797980' }}>힌트 사용</span>
            <p style={{ fontSize: '28px', fontWeight: 500, color: '#0D0D0D', margin: 0 }}>{hintCount}회</p>
          </div>
          <div style={summaryBoxStyle}>
            <span style={{ fontSize: '16px', fontWeight: 500, color: '#797980' }}>다시 말하기</span>
            <p style={{ fontSize: '28px', fontWeight: 700, color: '#0D0D0D', margin: 0 }}>{retryCount}회</p>
          </div>
        </div>

        <div style={{ width: '100%', textAlign: 'left', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '30px', fontWeight: 700, color: '#0D0D0D', lineHeight: '140%', margin: 0 }}>
            오늘 건강 상태 요약
          </h2>
        </div>

        <div style={{ width: '100%', display: 'flex', gap: '16px', marginBottom: '80px' }}>
          <div style={{ ...tagStyle, minWidth: '160px' }}>건강 상태 : {conditionStatus}</div>
          <div style={{ ...tagStyle, minWidth: '130px' }}>수면 : {sleepStatus}</div>
          <div style={{ ...tagStyle, minWidth: '140px' }}>기분 : {moodStatus}</div>
        </div>

        <button 
          onClick={handleGoHome}
          style={{
            width: '805px',
            height: '81px',
            borderRadius: '50px',
            background: '#0D0D0D',
            boxShadow: '0px 0px 4px 0px #4188ED',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '20px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          홈으로 돌아가기
        </button>

      </div>
    </div>
  );
}
