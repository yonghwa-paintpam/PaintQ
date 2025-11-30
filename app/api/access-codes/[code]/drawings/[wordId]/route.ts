import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * 접속 코드별 단어의 그림 데이터 조회
 */
export async function GET(
  request: Request,
  { params }: { params: { code: string; wordId: string } }
) {
  try {
    const { code, wordId } = params;

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

    const drawings = games
      .filter((game) => game.drawing !== null)
      .map((game) => game.drawing);

    return NextResponse.json(drawings);
  } catch (error) {
    console.error('그림 데이터 조회 오류:', error);
    return NextResponse.json(
      { error: '그림 데이터를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

