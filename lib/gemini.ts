import { GoogleGenerativeAI } from '@google/generative-ai';

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
  
  // 3. 명시적으로 정의된 유사 단어 매핑만 인정 (엄격하게)
  const similarWords: Record<string, string[]> = {
    '자동차': ['자동차', '차', 'car'],
    '고양이': ['고양이', '냥이', 'cat'],
    '강아지': ['강아지', '개', '멍멍이', 'dog', 'puppy'],
    '바나나': ['바나나', 'banana'],
    '사과': ['사과', 'apple'],
    '비행기': ['비행기', '항공기', 'airplane', 'plane'],
    '기차': ['기차', '열차', 'train'],
    '자전거': ['자전거', 'bicycle', 'bike'],
    '배': ['배', '선박', 'ship', 'boat'],
    '별': ['별', 'star', '스타'],
    '해': ['해', '태양', 'sun'],
    '달': ['달', 'moon'],
    '구름': ['구름', 'cloud'],
    '나무': ['나무', 'tree'],
    '꽃': ['꽃', 'flower'],
    '집': ['집', 'house', '하우스'],
    '사람': ['사람', 'person', 'human'],
    'LG': ['LG', 'lg', '엘지', 'L.G'],
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

// Gemini AI 초기화
let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

function initializeGemini() {
  if (genAI && model) {
    return model;
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // 디버깅: 환경 변수 목록 확인
    const envKeys = Object.keys(process.env).filter(k => k.includes('GEMINI') || k.includes('GOOGLE'));
    throw new Error(`GEMINI_API_KEY 환경 변수가 설정되지 않았습니다. 관련 환경변수: ${envKeys.join(', ') || '없음'}`);
  }

  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({
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
    const modelInstance = initializeGemini();
    
    const prompt = `
이 그림이 무엇인지 맞춰보세요.

지침:
1. 그림을 보고 무엇을 그린 것인지 추측해주세요.
2. 손으로 그린 간단한 그림이므로, 대략적인 형태를 보고 추측하면 됩니다.
3. 한 단어로만 답변해주세요. (예: 고양이, 사과, 자동차, 별, 해 등)

응답 형식:
{
  "aiGuess": "추측한 단어"
}
`;

    const result = await modelInstance.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/png',
          data: imageBase64,
        },
      },
    ]);

    const responseText = result.response.text();

    if (!responseText) {
      throw new Error('AI 응답을 받지 못했습니다.');
    }

    // JSON 파싱 시도
    let aiGuess: string;
    try {
      // 응답에서 JSON 부분만 추출
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        aiGuess = parsed.aiGuess || '알 수 없음';
      } else {
        // JSON이 없으면 첫 번째 줄을 추측으로 사용
        aiGuess = responseText.trim().split('\n')[0] || '알 수 없음';
      }
      
      // 명확히 불확실한 표현만 필터링 (너무 엄격하지 않게)
      const lowerGuess = aiGuess.toLowerCase().trim();
      const uncertainKeywords = [
        '알 수 없', '모르겠', '불확실', 'unknown', 'unclear', 'cannot'
      ];
      
      if (uncertainKeywords.some(keyword => lowerGuess.includes(keyword))) {
        aiGuess = '알 수 없음';
      }
      
      // 너무 짧거나 의미 없는 답변만 필터링
      if (aiGuess.length < 1 || aiGuess === '?' || aiGuess === '??') {
        aiGuess = '알 수 없음';
      }
    } catch (parseError) {
      // JSON 파싱 실패 시 텍스트에서 추측 추출
      aiGuess = responseText.trim().split('\n')[0] || '알 수 없음';
    }

    // "알 수 없음"이면 무조건 오답
    if (aiGuess === '알 수 없음' || !aiGuess || aiGuess.trim() === '') {
      return {
        aiGuess: '알 수 없음',
        isCorrect: false,
      };
    }

    // 서버에서 정답 비교 (엄격한 비교)
    const isCorrect = compareAnswers(aiGuess, correctAnswer);

    return {
      aiGuess,
      isCorrect,
    };
  } catch (error) {
    console.error('Gemini API 오류:', error);
    throw new Error(`그림 분석 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}
