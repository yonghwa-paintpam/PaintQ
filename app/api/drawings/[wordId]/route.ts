import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Mock 단어 데이터
const MOCK_WORDS: Record<string, string> = {
  'w1': '고양이',
  'w2': '강아지',
  'w3': '사자',
  'w4': '코끼리',
  'w5': '기린',
  'w6': '사과',
  'w7': '바나나',
  'w8': '딸기',
  'w9': '포도',
  'w10': '자동차',
  'w11': '비행기',
  'w12': '기차',
  'w13': '배',
  'w14': '자전거',
};

// 빈 Canvas 이미지 (Base64)
const EMPTY_CANVAS_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// GET: 특정 단어에 대한 모든 그림 조회 (같은 주제의 다른 플레이어 그림들)
export async function GET(
  request: NextRequest,
  { params }: { params: { wordId: string } }
) {
  try {
    const drawings = await prisma.drawing.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 데이터베이스에 데이터가 있으면 반환
    if (drawings.length > 0) {
      return NextResponse.json(drawings);
    }

    // 데이터베이스가 비어있으면 빈 배열 반환 (Mock 데이터 없음)
    return NextResponse.json([]);
  } catch (error) {
    console.error('그림 조회 오류:', error);
    
    // 데이터베이스 연결 오류인 경우 빈 배열 반환
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
        // 데이터베이스가 설정되지 않은 경우 빈 배열 반환
        return NextResponse.json([]);
      }
    }
    
    return NextResponse.json(
      { error: '그림을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

