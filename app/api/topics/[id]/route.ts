import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { findMockTopic, updateMockTopic, deleteMockTopic, getMockStorage } from '@/lib/mockTopicsStorage';

// GET: 특정 주제 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Mock 데이터인지 확인
    if (params.id.startsWith('mock-')) {
      const mockTopic = findMockTopic(params.id);
      if (mockTopic) {
        return NextResponse.json(mockTopic);
      }
      return NextResponse.json(
        { error: '주제를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 데이터베이스에서 조회
    const topic = await prisma.topic.findUnique({
      where: { id: params.id },
      include: {
        words: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!topic) {
      return NextResponse.json(
        { error: '주제를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(topic);
  } catch (error) {
    console.error('주제 조회 오류:', error);
    // 데이터베이스 오류 시 Mock 데이터 확인
    if (params.id.startsWith('mock-')) {
      const mockTopic = findMockTopic(params.id);
      if (mockTopic) {
        return NextResponse.json(mockTopic);
      }
    }
    return NextResponse.json(
      { error: '주제를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 주제 및 단어 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Mock 데이터인지 확인
    if (params.id.startsWith('mock-')) {
      const mockTopic = findMockTopic(params.id);
      if (!mockTopic) {
        return NextResponse.json(
          { error: '주제를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      const updatedTopic = {
        ...mockTopic,
        name,
        updatedAt: new Date().toISOString(),
        words: validWords.map((word: string, index: number) => ({
          id: `w${params.id}-${index}`,
          topicId: params.id,
          word: word.trim(),
          order: index + 1,
          createdAt: new Date().toISOString(),
        })),
      };

      updateMockTopic(params.id, updatedTopic);
      return NextResponse.json(updatedTopic);
    }

    // 데이터베이스 수정 시도
    try {
      // 기존 단어 삭제 후 새로 생성
      await prisma.word.deleteMany({
        where: { topicId: params.id },
      });

      const topic = await prisma.topic.update({
        where: { id: params.id },
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

      return NextResponse.json(topic);
    } catch (dbError) {
      console.error('데이터베이스 수정 오류:', dbError);
      // 데이터베이스 오류 시 Mock 모드로 동작
      const mockTopic = findMockTopic(params.id);
      if (mockTopic) {
        const updatedTopic = {
          ...mockTopic,
          name,
          updatedAt: new Date().toISOString(),
          words: validWords.map((word: string, index: number) => ({
            id: `w${params.id}-${index}`,
            topicId: params.id,
            word: word.trim(),
            order: index + 1,
            createdAt: new Date().toISOString(),
          })),
        };
        updateMockTopic(params.id, updatedTopic);
        return NextResponse.json(updatedTopic);
      }
      throw dbError;
    }
  } catch (error) {
    console.error('주제 수정 오류:', error);
    return NextResponse.json(
      { error: '주제를 수정하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 주제 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Mock 데이터인지 확인
    if (params.id.startsWith('mock-')) {
      const mockTopic = findMockTopic(params.id);
      if (!mockTopic) {
        return NextResponse.json(
          { error: '주제를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
      deleteMockTopic(params.id);
      return NextResponse.json({ message: '주제가 삭제되었습니다.' });
    }

    // 데이터베이스 삭제 시도
    try {
      await prisma.topic.delete({
        where: { id: params.id },
      });

      return NextResponse.json({ message: '주제가 삭제되었습니다.' });
    } catch (dbError) {
      console.error('데이터베이스 삭제 오류:', dbError);
      // 데이터베이스 오류 시 Mock 데이터 확인
      const mockTopic = findMockTopic(params.id);
      if (mockTopic) {
        deleteMockTopic(params.id);
        return NextResponse.json({ message: '주제가 삭제되었습니다.' });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('주제 삭제 오류:', error);
    return NextResponse.json(
      { error: '주제를 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

