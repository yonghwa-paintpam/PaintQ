import { NextResponse } from 'next/server';
import { analyzeCreativity } from '@/lib/gemini';

/**
 * 창의력 리포트 분석 API
 * POST: 여러 그림을 분석하여 창의력 리포트 생성
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { images } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: '분석할 그림이 필요합니다.' },
        { status: 400 }
      );
    }

    if (images.length > 10) {
      return NextResponse.json(
        { error: '최대 10개의 그림만 분석할 수 있습니다.' },
        { status: 400 }
      );
    }

    const report = await analyzeCreativity(images);

    return NextResponse.json(report);
  } catch (error) {
    console.error('창의력 분석 API 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '창의력 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
