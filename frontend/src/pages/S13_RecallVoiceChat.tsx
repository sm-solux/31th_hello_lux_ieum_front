import { useState, useRef, useEffect } from 'react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/patientHeader';
import QuizResultCard from '../components/quizResultCard';

import { submitQuizAnswer, submitQuizResult, type QuizItem, type QuizResultPayload } from '../api/patientApi';
import { getToken } from '../utils/auth';

export default function S13_RecallVoiceChat() {
  const navigate = useNavigate();

  const [quizList, setQuizList] = useState<QuizItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);


  const clearQuizSessionData = () => {
    const keysToRemove = [
      'quizList',
      'currentQuizIndex',
      'currentQuizElapsedTime',
      'completedActivityCount',
      'correctQuizCount',
      'totalHintCount',
      'totalHintId',
      'tempQuizHintStep',
    ];
    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
  };

 
  const getSafePCode = (quizItem?: QuizItem) => {
    const sessionPCode = sessionStorage.getItem('p_code');
    if (sessionPCode && isNaN(Number(sessionPCode))) {
      return sessionPCode;
    }
    if (quizItem?.p_code && isNaN(Number(quizItem.p_code))) {
      return String(quizItem.p_code);
    }
    if (quizItem?.pCode && isNaN(Number(quizItem.pCode))) {
      return String(quizItem.pCode);
    }
    return sessionPCode || quizItem?.p_code || quizItem?.pCode || 'HH5N7S';
  };

  
  const getNumericPCode = (quizItem?: QuizItem): number => {
    if (quizItem?.p_code !== undefined && !isNaN(Number(quizItem.p_code))) {
      return Number(quizItem.p_code);
    }
    if (quizItem?.pCode !== undefined && !isNaN(Number(quizItem.pCode))) {
      return Number(quizItem.pCode);
    }

    const sessionNum = sessionStorage.getItem('p_code_num') || sessionStorage.getItem('internal_code');
    if (sessionNum && !isNaN(Number(sessionNum))) {
      return Number(sessionNum);
    }

    const sessionPCode = sessionStorage.getItem('p_code');
    if (sessionPCode && !isNaN(Number(sessionPCode))) {
      return Number(sessionPCode);
    }

    return 1;
  };

  useEffect(() => {
    const loadQuizData = () => {
      setIsLoading(true);
      try {
        
        const token = getToken();
        if (!token) {
          console.warn('인증 토큰이 없습니다. 로그인 페이지로 이동합니다.');
          navigate('/login', { replace: true });
          return;
        }

        const rawStored = sessionStorage.getItem('quizList');
        let parsedData = rawStored ? JSON.parse(rawStored) : [];

        let storedQuizzes: QuizItem[] = Array.isArray(parsedData)
          ? parsedData
          : (parsedData?.data || parsedData?.quizzes || []);

        let storedIndex = parseInt(sessionStorage.getItem('currentQuizIndex') || '0', 10);
        if (isNaN(storedIndex) || storedIndex < 0) {
          storedIndex = 0;
        }

        if (storedQuizzes.length > 0 && storedIndex >= storedQuizzes.length) {
          storedIndex = storedQuizzes.length - 1;
        }

        
        if (storedQuizzes.length > 0 && storedQuizzes[storedIndex]) {
          const currentQuizData = storedQuizzes[storedIndex] as any;
          const rawCategory = currentQuizData?.quizCategory ?? currentQuizData?.quiz_category ?? currentQuizData?.category ?? currentQuizData?.level ?? '';
          const cat = String(rawCategory).toLowerCase().trim();
          const hasPhoto = Boolean(currentQuizData?.quiz_photo || currentQuizData?.quizPhoto);

          const isChoiceCategory = cat.includes('choice') || cat === '1' || cat.includes('객관식');

          if (!isChoiceCategory) {
            if (cat.includes('photo') || cat === '2' || cat.includes('사진') || hasPhoto) {
              navigate('/patient-photo', { replace: true });
              return;
            } else if (cat.includes('text') || cat === '3' || cat.includes('단답') || cat.includes('주관식')) {
              navigate('/patient-voicequiz', { replace: true });
              return;
            }
          }
        }

        setQuizList(storedQuizzes);
        setCurrentIndex(storedIndex);
      } catch (e) {
        console.error('퀴즈 데이터 로딩 실패:', e);
        setQuizList([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuizData();
  }, [navigate]);

  const currentQuiz = quizList[currentIndex];

  const currentQuestionText = 
    currentQuiz?.quiz_comment || 
    currentQuiz?.quizComment || 
    currentQuiz?.question || 
    (isLoading ? '퀴즈를 불러오는 중입니다...' : '등록된 퀴즈가 없습니다.');

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const isSubmittedRef = useRef<boolean>(false);

  const [elapsedTime, setElapsedTime] = useState<string>('0.0');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('잘 하셨어요!');
  
  const [thisQuizIsCorrect, setThisQuizIsCorrect] = useState<boolean | undefined>(undefined);

  const [totalSolvedCount, setTotalSolvedCount] = useState<number>(() => {
    const saved = sessionStorage.getItem('completedActivityCount');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [correctCount, setCorrectCount] = useState<number>(() => {
    const saved = sessionStorage.getItem('correctQuizCount');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [totalHintCount] = useState<number>(() => {
    const savedHints = sessionStorage.getItem('totalHintCount');
    return savedHints ? parseInt(savedHints, 10) : 0;
  });

  const startTimeRef = useRef<number>(Date.now());
  const initialAccumulatedTimeRef = useRef<number>(0);

 
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
    setSelectedOption(null);
    setIsSubmitted(false);
    isSubmittedRef.current = false;
    setElapsedTime('0.0');
    setFeedbackMessage('잘 하셨어요!');
    setThisQuizIsCorrect(undefined);

    const savedAccumulated = parseFloat(sessionStorage.getItem('currentQuizElapsedTime') || '0');
    initialAccumulatedTimeRef.current = savedAccumulated;
    startTimeRef.current = Date.now();
  }, [currentIndex]);

  const optionsList: string[] = currentQuiz?.options || [];

  const handleSubmit = async () => {
    if (!currentQuiz) {
      alert('제출할 퀴즈 정보가 없습니다.');
      return;
    }

    if (selectedOption === null) {
      alert('정답을 선택해 주세요!');
      return;
    }

    if (isSubmittedRef.current) return;

    setIsSubmitted(true);
    isSubmittedRef.current = true;

    const sessionSpent = (Date.now() - startTimeRef.current) / 1000;
    const totalSpentSeconds = (initialAccumulatedTimeRef.current + sessionSpent).toFixed(1);

    setElapsedTime(totalSpentSeconds);
    sessionStorage.removeItem('currentQuizElapsedTime');

    const selectedAnswerText = optionsList[selectedOption];
    
    const pCode = getSafePCode(currentQuiz);
    const setId = Number(currentQuiz?.set_id || currentQuiz?.setId || 1);
    const quizNum = Number(currentQuiz?.quiz_num || currentQuiz?.quizNum || 1);

    const payloadData = {
      pCode,
      setId,
      quizNum,
      userAnswer: selectedAnswerText,
    };

    let isCorrect = false;

    try {
      const res = await submitQuizAnswer(payloadData);

      if (res?.feedback) {
        setFeedbackMessage(res.feedback);
      }

      const rawCorrect = res?.correct ?? res?.isCorrect ?? res?.is_correct;
      isCorrect = rawCorrect === true || String(rawCorrect).toLowerCase() === 'true';

      setThisQuizIsCorrect(isCorrect);
    } catch (error) {
      console.error('객관식 답안 제출 API 오류:', error);
      setThisQuizIsCorrect(false);
    }

    const nextSolvedCount = totalSolvedCount + 1;
    setTotalSolvedCount(nextSolvedCount);
    sessionStorage.setItem('completedActivityCount', String(nextSolvedCount));

    let nextCorrectCount = correctCount;
    if (isCorrect) {
      nextCorrectCount = correctCount + 1;
      setCorrectCount(nextCorrectCount);
      sessionStorage.setItem('correctQuizCount', String(nextCorrectCount));
    }
  };

  const handleNextPage = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) e.preventDefault();

    if (!isSubmittedRef.current && currentQuiz) {
      const pCode = getSafePCode(currentQuiz);
      const setId = Number(currentQuiz?.set_id || currentQuiz?.setId || 1);
      const quizNum = Number(currentQuiz?.quiz_num || currentQuiz?.quizNum || 1);

      const payloadData = {
        pCode,
        setId,
        quizNum,
        userAnswer: '',
      };

      try {
        await submitQuizAnswer(payloadData);
      } catch (error) {
        console.error('스킵 답안 제출 API 오류:', error);
      }
    }

    sessionStorage.removeItem('currentQuizElapsedTime');

    const nextIndex = currentIndex + 1;

   
    if (nextIndex >= quizList.length) {
      try {
        const numericPCode = getNumericPCode(currentQuiz);
        const finalSetId = Number(currentQuiz?.set_id || currentQuiz?.setId || 1);
        
        const validSolvedCount = Number(sessionStorage.getItem('completedActivityCount') || totalSolvedCount);
        const validCorrectCount = Number(sessionStorage.getItem('correctQuizCount') || correctCount);
        const totalHint = parseInt(sessionStorage.getItem('totalHintId') || sessionStorage.getItem('totalHintCount') || '0', 10);

        const finalPayload: QuizResultPayload = {
          setId: finalSetId,
          pCode: numericPCode,
          totalCount: validSolvedCount,
          correctCount: validCorrectCount,
          hint: totalHint,
          caculate: "0",
          feedbackContent: "오늘도 퀴즈를 잘 마쳤습니다!"
        };

        await submitQuizResult(finalPayload);
      } catch (err) {
        console.error('전체 퀴즈 결과 제출 실패:', err);
      }

      sessionStorage.setItem('todayActivityCompleted', 'true');
      clearQuizSessionData();

      navigate('/patient-result');
      return;
    }

    sessionStorage.setItem('currentQuizIndex', String(nextIndex));

    const nextQuiz = quizList[nextIndex];
    const rawCategory = nextQuiz?.quizCategory ?? nextQuiz?.quiz_category ?? nextQuiz?.category ?? 'choice';
    const category = String(rawCategory).toLowerCase().trim();

    if (category.includes('choice') || category === '1' || category.includes('객관식')) {
      setCurrentIndex(nextIndex);
      window.scrollTo(0, 0);
    } else if (category.includes('photo') || category === '2' || category.includes('사진')) {
      navigate('/patient-photo');
    } else if (category.includes('text') || category === '3' || category.includes('단답형') || category.includes('주관식')) {
      navigate('/patient-voicequiz');
    } else {
      setCurrentIndex(nextIndex);
      window.scrollTo(0, 0);
    }
  };

  const handleQuit = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) e.preventDefault();

    const targetIndex = isSubmittedRef.current ? currentIndex + 1 : currentIndex;

    if (!isSubmittedRef.current) {
      const sessionSpent = (Date.now() - startTimeRef.current) / 1000;
      const totalAccumulated = initialAccumulatedTimeRef.current + sessionSpent;
      sessionStorage.setItem('currentQuizElapsedTime', String(totalAccumulated));
    } else {
      sessionStorage.removeItem('currentQuizElapsedTime');
    }

    sessionStorage.setItem('todayActivityQuit', 'true');
    sessionStorage.setItem('currentQuizIndex', String(targetIndex));
    sessionStorage.setItem('completedActivityCount', String(totalSolvedCount));

    navigate('/patient-home');
  };

  if (!isLoading && quizList.length === 0) {
    return (
      <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#F8F9FA', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
        <h2>진행 가능한 퀴즈가 없습니다.</h2>
        <button 
          onClick={() => {
            clearQuizSessionData();
            navigate('/patient-home');
          }} 
          style={{ padding: '10px 20px', borderRadius: '20px', backgroundColor: '#4188ED', color: '#FFF', border: 'none', cursor: 'pointer' }}
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100vw',
        minHeight: '1172px',
        backgroundColor: '#F8F9FA',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingBottom: '100px',
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
    >
      <Header />

      <main
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: '68px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ width: '648px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          
          <div
            style={{
              width: '200px',
              height: '42px',
              borderRadius: '50px',
              background: '#4188ED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              marginBottom: '26px',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '20px', color: '#F8F9FA' }}>
              Q{currentIndex + 1}. 객관식 퀴즈
            </span>
          </div>

          <h1
            style={{
              width: '100%',
              margin: '0 0 9px 0',
              fontWeight: 700,
              fontSize: '30px',
              lineHeight: '140%',
              color: '#0D0D0D',
              textAlign: 'left',
            }}
          >
            {currentQuestionText}
          </h1>

          <p
            style={{
              width: '100%',
              margin: '0 0 26px 0',
              fontWeight: 500,
              fontSize: '19px',
              lineHeight: '155%',
              color: '#797980',
              textAlign: 'left',
            }}
          >
            생각나시는 대로 편하게 선택해 주세요.
          </p>

          <div key={currentIndex} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {optionsList.length > 0 ? (
              optionsList.map((optionText, idx) => {
                const isSelected = selectedOption === idx;
                return (
                  <button
                    key={idx}
                    disabled={isSubmitted}
                    onClick={() => setSelectedOption(idx)}
                    style={{
                      width: '648px',
                      height: '86px',
                      borderRadius: '10px',
                      border: isSelected ? '1px solid #DFDF87' : '1px solid #8E8E98',
                      backgroundColor: isSelected ? '#1566E0' : '#F8F9FA',
                      color: isSelected ? '#FFFFFF' : '#0D0D0D',
                      fontWeight: 400,
                      fontSize: '22px',
                      textAlign: 'left',
                      padding: '22px 32px',
                      boxSizing: 'border-box',
                      cursor: isSubmitted ? 'default' : 'pointer',
                      opacity: isSubmitted && !isSelected ? 0.5 : 1,
                      boxShadow: isSelected ? '0px 0px 4px 0px #2073E8' : '0px 0px 4px 0px #797980',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {`${idx + 1}번  ${optionText}`}
                  </button>
                );
              })
            ) : (
              !isLoading && (
                <div style={{ padding: '20px', color: '#8E8E98', fontSize: '18px' }}>
                  선택할 수 있는 보기가 없습니다.
                </div>
              )
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '60px', marginBottom: '20px' }}>
            <button
              onClick={handleSubmit}
              disabled={isSubmitted || optionsList.length === 0}
              style={{
                width: '139px',
                height: '46px',
                borderRadius: '10px',
                backgroundColor: isSubmitted || optionsList.length === 0 ? '#8E8E98' : '#0F66E2',
                border: '1px solid #DFDF87',
                boxShadow: '0px 0px 4px 0px #4188ED',
                fontWeight: 700,
                fontSize: '18px',
                color: '#FFFFFF',
                cursor: isSubmitted || optionsList.length === 0 ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              ✓ 제출하기
            </button>
          </div>

          {isSubmitted && (
            <div style={{ marginTop: '20px', marginBottom: '20px', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <QuizResultCard
                duration={elapsedTime}
                hintCount={totalHintCount}
                feedback={feedbackMessage}
                isCorrect={thisQuizIsCorrect}
                resultDescription={`지금까지 총 ${totalSolvedCount}문제를 완료하셨어요! 고생하셨습니다.`}
                showHintCount={true}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', width: '648px', marginTop: '20px' }}>
            <button
              onClick={handleQuit}
              style={{
                width: '121px',
                height: '59px',
                borderRadius: '50px',
                backgroundColor: '#0D0D0D',
                border: 'none',
                boxShadow: '0px 0px 4px 0px #4188ED',
                fontWeight: 700,
                fontSize: '18px',
                color: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              그만하기
            </button>

            <button
              onClick={handleNextPage}
              style={{
                width: '151px',
                height: '59px',
                borderRadius: '50px',
                backgroundColor: '#4188ED',
                border: 'none',
                boxShadow: '0px 0px 4px 0px #4188ED',
                fontWeight: 700,
                fontSize: '18px',
                color: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              다음 활동 →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
