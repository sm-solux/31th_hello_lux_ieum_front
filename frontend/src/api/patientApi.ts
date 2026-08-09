import { api } from './client';

const USE_MOCK = false;


export interface PatientMeResponse {
  internal_code: number;
  p_code: string;
  name?: string;
  gender?: string;
  diagnosis?: string;
  personality?: string | null;
  speech_style?: string | null;
  cognitive_support_level?: string;
  guardian_companion?: boolean;
  patient_status?: string | null;

  internalCode?: number;
  pCode?: string;
}

export interface PatientCodeResponse {
  p_code: string;
}

export interface QuizItem {
  set_id?: number;
  setId?: number;
  quiz_id?: number;
  quizId?: number | null;
  quiz_num?: number;
  quizNum?: number;
  p_code?: string | number;
  pCode?: string | number;
  level?: number;
  
  quiz_category?: 'choice' | 'photo' | 'text' | string;
  quizCategory?: 'choice' | 'photo' | 'text' | string;
  category?: string;

  quiz_comment?: string;
  quizComment?: string;
  question?: string;

  quiz_photo?: string | null;
  quizPhoto?: string | null;

  answer?: string;
  options?: string[];
  hints?: string[];
}

export interface QuizAnswerPayload {
  pCode: string | number;
  setId: number;
  quizNum: number;
  userAnswer: string;
}

export interface QuizAnswerResponse {
  feedback: string;
  correct?: boolean;     
  isCorrect?: boolean;    
  is_correct?: boolean;   
}

export interface QuizResultPayload {
  setId: number;
  pCode: number | string;
  p_code?: number | string;
  totalCount: number;
  correctCount: number;
  hint: number;
  caculate: string;      
  avg_response_time?: number; 
  avgResponseTime?: number; 
  feedbackContent: string;
}

export interface QuizResultResponse {
  message: string;
  [key: string]: any;
}


export interface QuizResultDetailResponse {
  result_id?: number;
  set_id?: number;         
  setId?: number;          
  p_code?: number | string;
  date: string;
  total_count: number;
  correct_count: number;
  hint: number;
  caculate?: string;      
  calculate?: string;      
  avg_response_time?: number;
  avgResponseTime?: number;
  emotion_status?: string;
  health_status?: string;
  sleep_status?: string;
  success_rate?: number;
}

export interface QuizFeedbackItem {
  feedback_id: number;
  set_id: number;
  feedback_content: string;
  created_at: string;
}

export interface DailyStatusPayload {
  health_condition: string;
  sleep_status: string;
  meal_status: string;
  pain_status: string;
  mood_status: string;
  cognitive_changes: string[];
  memo?: string;
}

export interface DailyStatusResponse {
  status_id?: number;
  p_code?: string;
  record_date?: string;
  health_condition?: string;
  sleep_status?: string;
  meal_status?: string;
  pain_status?: string;
  mood_status?: string;
  cognitive_changes?: string[];
  [key: string]: any;
}

export const getPatientMe = async (): Promise<PatientMeResponse> => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          internal_code: 1001,
          p_code: 'HH5N7S',
          name: '홍길동',
        });
      }, 200);
    });
  }

  return api.get<PatientMeResponse>('/patient/me');
};

export const getPatientCode = async (pCode: string): Promise<PatientCodeResponse> => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ p_code: pCode }), 200);
    });
  }
  return api.get<PatientCodeResponse>(`/patient/${pCode}/code`);
};

export const getTodayQuizzes = async (pCode: string): Promise<QuizItem[]> => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            set_id: 1,
            quizNum: 1,
            pCode: pCode,
            level: 1,
            quizCategory: 'choice',
            quizComment: '어르신이 가장 좋아하시는 음식은 무엇인가요?',
            quizPhoto: null,
            answer: '돈까스',
            options: ['돈까스', '김치찌개', '비빔밥', '국밥'],
            hints: [],
          },
        ]);
      }, 400);
    });
  }
  return api.get<QuizItem[]>(`/quiz/${pCode}/today`);
};

export const submitQuizAnswer = async ({
  pCode,
  setId,
  quizNum,
  userAnswer,
}: QuizAnswerPayload): Promise<QuizAnswerResponse> => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          correct: userAnswer.trim() !== '',
          feedback: `잘 하셨어요!`,
        });
      }, 200);
    });
  }

  return api.post<QuizAnswerResponse>(
    `/quiz/${pCode}/${setId}/${quizNum}/answer`,
    {
      quiz_num: quizNum,
      answer: userAnswer,
    }
  );
};

export const submitQuizResult = async (
  payload: QuizResultPayload
): Promise<QuizResultResponse> => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          message: '퀴즈 결과가 성공적으로 저장되었습니다.',
        });
      }, 300);
    });
  }

  const numericPCode = !isNaN(Number(payload.pCode)) ? Number(payload.pCode) : payload.pCode;

  const formattedPayload = {
    ...payload,
    p_code: numericPCode,
  };

  return api.post<QuizResultResponse>('/quiz/result', formattedPayload);
};

export const getQuizResults = async (
  pCode: string,
  date: string
): Promise<QuizResultDetailResponse> => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          set_id: 11,
          date: date,
          total_count: 5,
          correct_count: 4,
          hint: 1,
          caculate: '최근 7일간 정답률이 안정적이며 학습 상태가 우수합니다.',
        });
      }, 300);
    });
  }

  return api.get<QuizResultDetailResponse>(`/patients/${pCode}/results/${date}`);
};

export const getQuizFeedbacks = async (
  patientCode: string,
  setId: string
): Promise<QuizFeedbackItem[]> => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            feedback_id: 1,
            set_id: Number(setId),
            feedback_content: '오늘도 집중해서 활동을 잘 완료하셨습니다!',
            created_at: new Date().toISOString(),
          },
        ]);
      }, 300);
    });
  }

  return api.get<QuizFeedbackItem[]>(
    `/patients/${patientCode}/quizSet/${setId}/feedbacks`
  );
};

export const postDailyStatus = async (
  pCode: string | number,
  payload: DailyStatusPayload
): Promise<DailyStatusResponse> => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status_id: 5,
          p_code: String(pCode),
          record_date: new Date().toISOString().split('T')[0],
          health_condition: payload.health_condition,
          sleep_status: payload.sleep_status,
          meal_status: payload.meal_status,
          pain_status: payload.pain_status,
          mood_status: payload.mood_status,
          cognitive_changes: payload.cognitive_changes,
        });
      }, 300);
    });
  }

  return api.post<DailyStatusResponse>(
    `/patient/${pCode}/daily-status`,
    payload
  );
};

export const getDailyStatus = async (
  pCode: string | number,
  date: string
): Promise<DailyStatusResponse> => {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status_id: 1,
          p_code: String(pCode),
          record_date: date,
          health_condition: '양호',
          sleep_status: '6-8시간',
          meal_status: '보통',
          pain_status: '없음',
          mood_status: '평온함',
          cognitive_changes: [],
        });
      }, 200);
    });
  }

  return api.get<DailyStatusResponse>(
    `/patient/${pCode}/daily-status?date=${date}`
  );
};