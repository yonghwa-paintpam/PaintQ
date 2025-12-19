import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * 접속 코드별 주제 수정 및 삭제
 */
export async function GET(
  request: Request,
  { params }: { params: { code: string; topicId: string } }
) {
  try {
    const { code, topicId } = params;

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

    // 주제 조회
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
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

    // 접속 코드 일치 확인
    if (topic.accessCodeId !== accessCode.id) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    return NextResponse.json(topic);
  } catch (error: any) {
    console.error('주제 조회 오류:', error);
    
    // 데이터베이스 연결 실패 시 명확한 에러 메시지
    if (error.message?.includes('DATABASE_URL') || error.message?.includes('Environment variable')) {
      return NextResponse.json(
        { error: '데이터베이스가 설정되지 않았습니다. DATABASE_URL 환경 변수를 설정해주세요.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: '주제를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { code: string; topicId: string } }
) {
  try {
    const { code, topicId } = params;
    const body = await request.json();
    const { name, words, questionCount } = body;

    if (!name || !words || !Array.isArray(words) || words.length === 0) {
      return NextResponse.json(
        { error: '주제 이름과 최소 1개 이상의 문제 단어가 필요합니다.' },
        { status: 400 }
      );
    }

    if (words.length > 10) {
      return NextResponse.json(
        { error: '문제 단어는 최대 10개까지 가능합니다.' },
        { status: 400 }
      );
    }

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

    // 주제 확인
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      return NextResponse.json(
        { error: '주제를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 접속 코드 일치 확인
    if (topic.accessCodeId !== accessCode.id) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 기존 단어 삭제 후 새로 생성
    await prisma.word.deleteMany({
      where: { topicId },
    });

    // 주제 수정
    const updatedTopic = await prisma.topic.update({
      where: { id: topicId },
      data: {
        name: name.trim(),
        questionCount: questionCount || null, // 출제 문제 수 (null이면 전체 출제)
        words: {
          create: words
            .filter((word: string) => word.trim() !== '')
            .map((word: string, index: number) => ({
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

    return NextResponse.json(updatedTopic);
  } catch (error: any) {
    console.error('주제 수정 오류:', error);
    
    // 데이터베이스 연결 실패 시 명확한 에러 메시지
    if (error.message?.includes('DATABASE_URL') || error.message?.includes('Environment variable')) {
      return NextResponse.json(
        { error: '데이터베이스가 설정되지 않았습니다. DATABASE_URL 환경 변수를 설정해주세요.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || '주제를 수정하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { code: string; topicId: string } }
) {
  try {
    const { code, topicId } = params;

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

    // 주제 확인
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      return NextResponse.json(
        { error: '주제를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 접속 코드 일치 확인
    if (topic.accessCodeId !== accessCode.id) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 주제 삭제 (CASCADE로 관련 단어와 게임도 삭제됨)
    await prisma.topic.delete({
      where: { id: topicId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('주제 삭제 오류:', error);
    
    // 데이터베이스 연결 실패 시 명확한 에러 메시지
    if (error.message?.includes('DATABASE_URL') || error.message?.includes('Environment variable')) {
      return NextResponse.json(
        { error: '데이터베이스가 설정되지 않았습니다. DATABASE_URL 환경 변수를 설정해주세요.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || '주제를 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

