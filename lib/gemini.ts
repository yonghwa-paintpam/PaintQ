import { VertexAI } from '@google-cloud/vertexai';

/**
 * 정답 비교 함수 (엄격한 정답 체크)
 * - 정확히 일치하는 경우만 인정
 * - 명시적으로 정의된 유사 단어 매핑만 인정
 * - 포함 관계는 인정하지 않음 (예: "바오밥나무"와 "나무"는 다른 것으로 간주)
 */
function compareAnswers(aiGuess: string, correctAnswer: string): boolean {
  if (!aiGuess || !correctAnswer) {
    return false;
  }
  
  // 정규화: 소문자 변환, 공백 제거, 특수문자 제거
  const normalize = (str: string) => 
    str.toLowerCase().trim().replace(/[\s\-_\.]/g, '');
  
  const normalizedGuess = normalize(aiGuess);
  const normalizedAnswer = normalize(correctAnswer);
  
  // 1. 정확히 일치하는 경우
  if (normalizedGuess === normalizedAnswer) {
    return true;
  }
  
  // 2. 원본 문자열도 직접 비교 (대소문자 구분 없이, 공백 제거)
  const originalGuess = aiGuess.toLowerCase().trim().replace(/\s+/g, '');
  const originalAnswer = correctAnswer.toLowerCase().trim().replace(/\s+/g, '');
  if (originalGuess === originalAnswer) {
    return true;
  }
  
  // 3. 명시적으로 정의된 유사 단어 매핑만 인정
  // 주의: 포함 관계는 인정하지 않음 (예: "바오밥나무"와 "나무"는 다른 것으로 간주)
  const similarWords: Record<string, string[]> = {
    '자동차': ['차', '자동차', '오토', 'car', 'automobile'],
    '고양이': ['고양이', '냥이', '고양', 'cat', '고양'],
    '강아지': ['강아지', '개', '멍멍이', 'dog', 'puppy'],
    '바나나': ['바나나', '바나', 'banana'],
    '사과': ['사과', 'apple'],
    '비행기': ['비행기', '항공기', '비행', 'airplane', 'plane'],
    '기차': ['기차', '열차', '기차', 'train'],
    '자전거': ['자전거', '자전', 'bicycle', 'bike'],
    '배': ['배', '선박', 'ship', 'boat'],
    'LG': ['LG', 'lg', '엘지', '엘지', 'L.G'],
  };
  
  // 정답의 유사 단어 목록 확인
  const similarToAnswer = similarWords[correctAnswer] || [correctAnswer];
  const normalizedSimilar = similarToAnswer.map(normalize);
  
  // AI 추측이 정답의 유사 단어 중 하나와 일치하는지 확인
  if (normalizedSimilar.includes(normalizedGuess)) {
    return true;
  }
  
  // 4. 한국어 특수 케이스: "엘지"와 "LG" 같은 경우
  const koreanVariants: Record<string, string[]> = {
    'lg': ['엘지', 'lg', 'l.g', '엘지'],
    '엘지': ['lg', '엘지', 'l.g'],
  };
  
  const guessLower = originalGuess.toLowerCase();
  const answerLower = originalAnswer.toLowerCase();
  
  if (koreanVariants[guessLower]?.includes(answerLower) || koreanVariants[answerLower]?.includes(guessLower)) {
    return true;
  }
  
  return false;
}

// Vertex AI 초기화 (lazy initialization)
let vertexAI: VertexAI | null = null;
let model: any = null;

function initializeVertexAI() {
  if (vertexAI && model) {
    return model;
  }

  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!projectId) {
    throw new Error('GOOGLE_CLOUD_PROJECT_ID 환경 변수가 설정되지 않았습니다.');
  }

  const vertexAIConfig: any = {
    project: projectId,
    location: location,
  };

  // Vercel 환경에서는 환경 변수에 JSON 문자열이 들어있을 수 있음
  // 로컬 개발 환경에서는 파일 경로를 사용 (SDK가 자동으로 파일을 읽음)
  if (credentialsJson && credentialsJson.startsWith('{')) {
    // JSON 문자열인 경우 파싱하여 credentials로 설정
    try {
      vertexAIConfig.credentials = JSON.parse(credentialsJson);
    } catch (error) {
      console.error('GOOGLE_APPLICATION_CREDENTIALS JSON 파싱 오류:', error);
      // 파싱 실패 시 파일 경로로 간주하고 SDK가 자동으로 읽도록 함
    }
  }
  // 파일 경로인 경우 (로컬 개발 환경) SDK가 GOOGLE_APPLICATION_CREDENTIALS 환경 변수를 자동으로 읽음

  vertexAI = new VertexAI(vertexAIConfig);
  model = vertexAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
  });

  return model;
}

/**
 * 그림을 분석하여 AI 추측과 정답 여부를 반환
 * @param imageBase64 Base64 인코딩된 이미지 데이터
 * @param correctAnswer 정답 단어
 * @returns AI 추측 단어와 정답 여부
 */
export async function analyzeDrawing(
  imageBase64: string,
  correctAnswer: string
): Promise<{ aiGuess: string; isCorrect: boolean }> {
  try {
    const modelInstance = initializeVertexAI();
    
    const prompt = `
이 그림을 분석해주세요.

요청사항:
1. 이 그림이 무엇처럼 보이는지 한 단어로 답변해주세요.
2. 정답은 "${correctAnswer}"입니다. 추측한 단어가 정답과 의미상 일치하는지 확인해주세요.
   - 정확히 일치하거나 의미상 동일하면 true
   - 예: "자동차"와 "차", "고양이"와 "고양이"는 모두 true
   - 완전히 다른 것이면 false

응답 형식은 반드시 다음 JSON 형식으로 해주세요:
{
  "aiGuess": "추측한 단어",
  "isCorrect": true 또는 false
}
`;

    const request = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: prompt,
            },
            {
              inlineData: {
                mimeType: 'image/png',
                data: imageBase64,
              },
            },
          ],
        },
      ],
    };

    const response = await modelInstance.generateContent(request);
    const responseText = response.response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error('AI 응답을 받지 못했습니다.');
    }

    // JSON 파싱 시도
    let result;
    try {
      // 응답에서 JSON 부분만 추출
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON 형식을 찾을 수 없습니다.');
      }
    } catch (parseError) {
      // JSON 파싱 실패 시 기본값 반환
      console.error('JSON 파싱 실패:', parseError);
      const aiGuessText = responseText.trim().split('\n')[0] || '알 수 없음';
      result = {
        aiGuess: aiGuessText,
        isCorrect: false, // 파싱 실패 시 서버에서 비교하도록 false 반환
      };
    }

    // AI 추측 단어 추출
    const aiGuess = result.aiGuess || '알 수 없음';
    
    // 서버에서 정답 비교 (AI의 isCorrect보다 더 정확함)
    const isCorrect = compareAnswers(aiGuess, correctAnswer);

    return {
      aiGuess,
      isCorrect, // 서버에서 비교한 결과 사용
    };
  } catch (error) {
    console.error('Gemini API 오류:', error);
    throw new Error(`그림 분석 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}


