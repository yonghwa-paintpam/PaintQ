import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * 접속 코드별 단어의 그림 데이터 조회
 * 
 * Query Parameters:
 * - limit: 가져올 그림 수 (기본값: 4, 'all'이면 전체)
 * - best: 'true'면 impressionScore 기준 정렬 (기본값: true)
 */
export async function GET(
  request: Request,
  { params }: { params: { code: string; wordId: string } }
) {
  try {
    const { code, wordId } = params;
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit') || '4';
    const bestParam = searchParams.get('best') !== 'false'; // 기본값 true

    // 접속 코드 확인
    const accessCode = await prisma.accessCode.findUnique({
      where: { code },
    });

    if (!accessCode) {
      return NextResponse.json(
        { error: '접속 코드를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 해당 접속 코드의 게임 중 해당 wordId를 가진 게임의 그림 데이터 조회
    const games = await prisma.game.findMany({
      where: {
        accessCodeId: accessCode.id,
        wordId: wordId,
      },
      include: {
        drawing: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    let drawings = games
      .filter((game) => game.drawing !== null)
      .map((game) => game.drawing);

    const totalCount = drawings.length;

    // 사용자 화면과 동일한 정렬: impressionScore → isCorrect → createdAt
    if (bestParam) {
      drawings = drawings.sort((a, b) => {
        // 1. impressionScore 높은 순
        const scoreA = a?.impressionScore ?? 0;
        const scoreB = b?.impressionScore ?? 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        
        // 2. 정답 우선
        const correctA = a?.isCorrect ? 1 : 0;
        const correctB = b?.isCorrect ? 1 : 0;
        if (correctB !== correctA) return correctB - correctA;
        
        // 3. 최신순
        const dateA = new Date(a?.createdAt || 0).getTime();
        const dateB = new Date(b?.createdAt || 0).getTime();
        return dateB - dateA;
      });
    }

    // limit 적용
    if (limitParam !== 'all') {
      const limit = parseInt(limitParam, 10) || 4;
      drawings = drawings.slice(0, limit);
    }

    // 전체 개수와 함께 반환
    return NextResponse.json({
      drawings,
      totalCount,
      isLimited: limitParam !== 'all' && totalCount > drawings.length,
    });
  } catch (error) {
    console.error('그림 데이터 조회 오류:', error);
    return NextResponse.json(
      { error: '그림 데이터를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

