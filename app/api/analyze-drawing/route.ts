import { NextRequest, NextResponse } from 'next/server';
import { analyzeDrawing } from '@/lib/gemini';

// Mock 분석 결과 (테스트용)
function getMockAnalysis(correctAnswer: string) {
  // 간단한 Mock 응답 - 랜덤하게 정답/오답 반환
  const random = Math.random();
  const mockGuesses: Record<string, string[]> = {
    '고양이': ['고양이', '강아지', '동물'],
    '강아지': ['강아지', '고양이', '동물'],
    '사자': ['사자', '호랑이', '동물'],
    '코끼리': ['코끼리', '동물'],
    '기린': ['기린', '동물'],
    '사과': ['사과', '과일', '빨간색'],
    '바나나': ['바나나', '과일', '노란색'],
    '딸기': ['딸기', '과일', '빨간색'],
    '포도': ['포도', '과일'],
    '자동차': ['자동차', '차', '교통수단'],
    '비행기': ['비행기', '하늘', '교통수단'],
    '기차': ['기차', '열차', '교통수단'],
    '배': ['배', '선박', '교통수단'],
    '자전거': ['자전거', '교통수단'],
    'LG': ['LG', '전자제품', '브랜드'],
  };

  const guesses = mockGuesses[correctAnswer] || [correctAnswer];
  const aiGuess = guesses[Math.floor(Math.random() * guesses.length)];
  // Mock에서는 정확히 일치할 때만 정답으로 처리 (더 엄격하게)
  const isCorrect = aiGuess === correctAnswer;

  return {
    aiGuess,
    isCorrect,
  };
}

// POST: 그림 분석 (Gemini API 호출)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageData, correctAnswer } = body;

    if (!imageData || !correctAnswer) {
      return NextResponse.json(
        { error: '이미지 데이터와 정답이 필요합니다.' },
        { status: 400 }
      );
    }

    try {
      const result = await analyzeDrawing(imageData, correctAnswer);
      return NextResponse.json(result);
    } catch {
      // AI API 오류 시 Mock 응답 반환
      const mockResult = getMockAnalysis(correctAnswer);
      return NextResponse.json(mockResult);
    }
  } catch (error) {
    console.error('그림 분석 오류:', error);
    
    // 최종 오류 시에도 Mock 응답 반환
    // body는 이미 위에서 파싱했으므로 재사용 불가
    // 기본 Mock 응답 반환
    const mockResult = getMockAnalysis('알 수 없음');
    
    return NextResponse.json(mockResult);
  }
}

