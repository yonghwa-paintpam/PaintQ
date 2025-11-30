import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { initializeMockStorage, getMockStorage, addMockTopic, setMockStorage } from '@/lib/mockTopicsStorage';

// GET: 모든 주제 조회
export async function GET() {
  initializeMockStorage();
  
  try {
    const topics = await prisma.topic.findMany({
      include: {
        words: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 데이터베이스에 데이터가 있으면 반환
    if (topics.length > 0) {
      return NextResponse.json(topics);
    }

    // 데이터베이스가 비어있으면 빈 배열 반환 (Mock 데이터는 데이터베이스 연결 실패 시에만 사용)
    return NextResponse.json([]);
  } catch (error) {
    console.error('주제 조회 오류:', error);
    
    // 데이터베이스 연결 오류인 경우 Mock 데이터 반환 (테스트용)
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
        initializeMockStorage();
        return NextResponse.json(getMockStorage());
      }
    }
    
    // 기타 오류는 에러 메시지와 함께 반환
    return NextResponse.json(
      { error: '주제를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새 주제 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, words } = body;

    if (!name || !Array.isArray(words)) {
      return NextResponse.json(
        { error: '주제 이름과 단어 배열이 필요합니다.' },
        { status: 400 }
      );
    }

    if (words.length > 10) {
      return NextResponse.json(
        { error: '최대 10개의 단어만 입력할 수 있습니다.' },
        { status: 400 }
      );
    }

    const validWords = words.filter((word: string) => word.trim() !== '');
    if (validWords.length === 0) {
      return NextResponse.json(
        { error: '최소 1개 이상의 문제 단어를 입력해주세요.' },
        { status: 400 }
      );
    }

    try {
      // 데이터베이스에 저장 시도
      const topic = await prisma.topic.create({
        data: {
          name,
          words: {
            create: validWords.map((word: string, index: number) => ({
              word: word.trim(),
              order: index + 1,
            })),
          },
        },
        include: {
          words: {
            orderBy: {
              order: 'asc',
            },
          },
        },
      });

      return NextResponse.json(topic, { status: 201 });
    } catch {
      // 데이터베이스 오류 시 Mock 모드로 동작
      initializeMockStorage();
      
      const topicId = `mock-${Date.now()}`;
      const newTopic = {
        id: topicId,
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        words: validWords.map((word: string, index: number) => ({
          id: `w${topicId}-${index}`,
          topicId: topicId,
          word: word.trim(),
          order: index + 1,
          createdAt: new Date().toISOString(),
        })),
      };

      addMockTopic(newTopic);
      
      return NextResponse.json(newTopic, { status: 201 });
    }
  } catch (error) {
    console.error('주제 생성 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json(
      { 
        error: '주제를 생성하는 중 오류가 발생했습니다.',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

