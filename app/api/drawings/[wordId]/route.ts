import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET: 특정 단어에 대한 베스트 그림 4개 + 전체 참여자 수 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { wordId: string } }
) {
  try {
    // 1. 전체 참여자 수 조회 (이미지 데이터 없이 count만)
    const totalParticipants = await prisma.drawing.count({
      where: {
        game: {
          wordId: params.wordId,
        },
      },
    });

    // 2. 베스트 그림 4개 조회 (impressionScore 높은 순, 없으면 정답 우선 + 최신순)
    const bestDrawings = await prisma.drawing.findMany({
      where: {
        game: {
          wordId: params.wordId,
        },
      },
      include: {
        game: {
          include: {
            word: true,
            topic: true,
          },
        },
      },
      orderBy: [
        { impressionScore: 'desc' },  // 인상 점수 높은 순
        { isCorrect: 'desc' },         // 정답 우선
        { createdAt: 'desc' },         // 최신순
      ],
      take: 4,  // 최대 4개만
    });

    // 응답 형식 변경: bestDrawings + totalParticipants
    return NextResponse.json({
      bestDrawings,
      totalParticipants,
    });
  } catch (error) {
    console.error('그림 조회 오류:', error);
    
    // 데이터베이스 연결 오류인 경우 빈 결과 반환
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (
        errorMessage.includes('can\'t reach database') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('database') ||
        errorMessage.includes('prisma') ||
        errorMessage.includes('env') ||
        errorMessage.includes('invalid url')
      ) {
        return NextResponse.json({
          bestDrawings: [],
          totalParticipants: 0,
        });
      }
    }
    
    return NextResponse.json(
      { error: '그림을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

