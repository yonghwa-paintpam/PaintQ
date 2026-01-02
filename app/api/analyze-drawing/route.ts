import { NextRequest, NextResponse } from 'next/server';
import { analyzeDrawing } from '@/lib/gemini';

// POST: 그림 분석 (Gemini API 호출)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageData, correctAnswer, topicName } = body;

    if (!imageData || !correctAnswer) {
      return NextResponse.json(
        { error: '이미지 데이터와 정답이 필요합니다.' },
        { status: 400 }
      );
    }

    // 주제명에서 힌트 추출 (예: "도형 / 난이도 ★★☆☆☆" -> "도형")
    const topicHint = topicName ? extractTopicHint(topicName) : undefined;

    try {
      const result = await analyzeDrawing(imageData, correctAnswer, false, topicHint);
      return NextResponse.json(result);
    } catch (aiError: any) {
      // AI API 오류 시 오답으로 처리
      console.error('Gemini API 오류:', aiError);
      return NextResponse.json({
        aiGuess: 'AI 분석 실패',
        isCorrect: false,
      });
    }
  } catch (error) {
    console.error('그림 분석 오류:', error);
    
    // 최종 오류 시에도 오답 처리
    return NextResponse.json({
      aiGuess: '오류 발생',
      isCorrect: false,
    });
  }
}

/**
 * 주제명에서 핵심 힌트를 추출하는 함수
 * 예: "도형 / 난이도 ★★☆☆☆" -> "도형"
 * 예: "도형&그래프 / ★★★☆☆" -> "도형, 그래프"
 * 예: "수학도구 ★★☆☆☆" -> "수학도구"
 */
function extractTopicHint(topicName: string): string {
  // 난이도 표시 제거 (★, ☆, /, 숫자 등)
  let hint = topicName
    .replace(/[★☆]/g, '')
    .replace(/난이도/g, '')
    .replace(/\s*\/\s*/g, ' ')
    .trim();
  
  // & 를 ', '로 변환
  hint = hint.replace(/&/g, ', ');
  
  // 연속 공백 제거
  hint = hint.replace(/\s+/g, ' ').trim();
  
  return hint || topicName;
}
