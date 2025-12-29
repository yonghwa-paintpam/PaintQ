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
    throw new Error('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.');
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
 * @param includeImpressionScore 인상적인 그림 점수도 함께 반환할지 여부 (기본: false)
 * @returns AI 추측 단어와 정답 여부, 선택적으로 인상 점수
 */
export async function analyzeDrawing(
  imageBase64: string,
  correctAnswer: string,
  includeImpressionScore: boolean = false
): Promise<{ aiGuess: string; isCorrect: boolean; impressionScore?: number }> {
  try {
    const modelInstance = initializeGemini();
    
    // includeImpressionScore가 true일 때만 점수 요청 추가
    const prompt = includeImpressionScore ? `
이 그림이 무엇인지 맞춰보고, 그림의 "인상적인 정도"를 평가해주세요.

지침:
1. 그림을 보고 무엇을 그린 것인지 추측해주세요.
2. 손으로 그린 간단한 그림이므로, 대략적인 형태를 보고 추측하면 됩니다.
3. 한 단어로만 답변해주세요. (예: 고양이, 사과, 자동차, 별, 해 등)
4. 그림의 인상적인 정도를 0-100점으로 평가해주세요. (20초 제한 시간 고려)

인상 점수 평가 기준:
- 핵심 특징을 잘 표현했는가? (40%)
- 독특하거나 창의적인 요소가 있는가? (30%)
- 한눈에 무엇인지 알아볼 수 있는가? (30%)

중요:
- 그림이 거의 비어있거나, 점/선 몇 개만 있거나, 낙서 수준이라면 반드시 "알 수 없음"으로 답하고 점수는 0점으로 하세요.
- 의미 있는 형태가 보이지 않으면 "알 수 없음"으로 답하세요.
- 추측에 확신이 없으면 "알 수 없음"으로 답하세요.
- 빈 흰색 캔버스에 아무것도 없으면 "알 수 없음"으로 답하세요.

응답 형식:
{
  "aiGuess": "추측한 단어",
  "impressionScore": 75
}
` : `
이 그림이 무엇인지 맞춰보세요.

지침:
1. 그림을 보고 무엇을 그린 것인지 추측해주세요.
2. 손으로 그린 간단한 그림이므로, 대략적인 형태를 보고 추측하면 됩니다.
3. 한 단어로만 답변해주세요. (예: 고양이, 사과, 자동차, 별, 해 등)

중요:
- 그림이 거의 비어있거나, 점/선 몇 개만 있거나, 낙서 수준이라면 반드시 "알 수 없음"으로 답하세요.
- 의미 있는 형태가 보이지 않으면 "알 수 없음"으로 답하세요.
- 추측에 확신이 없으면 "알 수 없음"으로 답하세요.
- 빈 흰색 캔버스에 아무것도 없으면 "알 수 없음"으로 답하세요.

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
    let impressionScore: number | undefined;
    try {
      // 응답에서 JSON 부분만 추출
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        aiGuess = parsed.aiGuess || '알 수 없음';
        if (includeImpressionScore && typeof parsed.impressionScore === 'number') {
          impressionScore = Math.max(0, Math.min(100, parsed.impressionScore));
        }
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
        impressionScore = 0;
      }
      
      // 너무 짧거나 의미 없는 답변만 필터링
      if (aiGuess.length < 1 || aiGuess === '?' || aiGuess === '??') {
        aiGuess = '알 수 없음';
        impressionScore = 0;
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
        impressionScore: includeImpressionScore ? 0 : undefined,
      };
    }

    // 서버에서 정답 비교 (엄격한 비교)
    const isCorrect = compareAnswers(aiGuess, correctAnswer);

    return {
      aiGuess,
      isCorrect,
      ...(includeImpressionScore && { impressionScore: impressionScore ?? 50 }),
    };
  } catch (error) {
    console.error('Gemini API 오류:', error);
    throw new Error(`그림 분석 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

/**
 * 창의력 리포트 분석 결과 타입
 */
export interface CreativityReport {
  score: number;
  style_title: string;
  style_desc: string;
  strength: string;
  tip: string;
  comment: string;
}

/**
 * 여러 그림을 분석하여 창의력 리포트를 생성
 * @param imagesBase64 Base64 인코딩된 이미지 데이터 배열
 * @returns 창의력 리포트
 */
export async function analyzeCreativity(imagesBase64: string[]): Promise<CreativityReport> {
  try {
    const modelInstance = initializeGemini();

    const prompt = `당신은 아이들의 그림을 분석하는 창의력 분석 전문가입니다.

다음 그림들은 한 사용자가 "20초 제한 시간" 내에 빠르게 그린 것입니다.
(색상/선 굵기 도구 없이 검은색 펜 하나로만 그렸습니다)

그림들을 종합 분석하여 재미있고 긍정적인 "창의력 리포트"를 작성해주세요.

분석 요소:
- 표현 스타일 (과감함/신중함, 심플/디테일)
- 선의 특성 (부드러운 곡선/각진 직선)
- 화면 활용 (크게/작게 그리는지)
- 전체적인 느낌과 개성

반드시 아래 JSON 형식으로만 응답하세요:
{
  "score": 85,
  "style_title": "번개같은 스케처",
  "style_desc": "핵심을 빠르게 포착하는 표현력",
  "strength": "자신감 있는 선과 과감한 구도",
  "tip": "디테일을 조금 더 추가하면 더 멋진 그림이 될 거예요",
  "comment": "자신감 넘치는 아티스트! 빠르고 정확한 표현력이 돋보여요 🌟"
}

주의사항:
- 반드시 긍정적이고 격려하는 톤
- 점수는 70~95 사이로 (너무 낮거나 높지 않게)
- 이모지 적극 활용
- JSON만 응답 (다른 텍스트 없이)`;

    // 이미지들을 컨텐츠로 변환
    const imageParts = imagesBase64.map((imageBase64) => {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      return {
        inlineData: {
          data: base64Data,
          mimeType: 'image/png',
        },
      };
    });

    const result = await modelInstance.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const responseText = response.text();

    // JSON 파싱
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: parsed.score || 80,
        style_title: parsed.style_title || '창의적인 아티스트',
        style_desc: parsed.style_desc || '자신만의 스타일로 표현해요',
        strength: parsed.strength || '독특한 표현력',
        tip: parsed.tip || '계속 그려보세요!',
        comment: parsed.comment || '멋진 그림이에요! 🌟',
      };
    }

    // 파싱 실패 시 기본값
    return {
      score: 80,
      style_title: '창의적인 아티스트',
      style_desc: '자신만의 스타일로 표현해요',
      strength: '독특한 표현력',
      tip: '계속 그려보세요!',
      comment: '멋진 그림이에요! 🌟',
    };
  } catch (error) {
    console.error('창의력 분석 오류:', error);
    throw new Error(`창의력 분석 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}
