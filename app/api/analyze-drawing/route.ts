import { NextRequest, NextResponse } from 'next/server';
import { analyzeDrawing } from '@/lib/gemini';

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
    } catch (aiError: any) {
      // AI API 오류 시 에러 메시지 포함하여 반환
      console.error('Gemini API 오류:', aiError);
      const errorMessage = aiError?.message || '알 수 없는 오류';
      return NextResponse.json({
        aiGuess: `오류: ${errorMessage.substring(0, 50)}`,
        isCorrect: false,
        error: errorMessage,
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
