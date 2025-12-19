import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * 접속 코드별 주제 조회 및 생성
 */
export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    // 접속 코드 확인
    let accessCode = await prisma.accessCode.findUnique({
      where: { code },
    });

    // 접속 코드가 없고, 코드가 "0000"이면 기본 접속 코드 생성
    if (!accessCode && code === '0000') {
      try {
        accessCode = await prisma.accessCode.create({
          data: {
            code: '0000',
            isActive: true,
          },
        });
      } catch (createError: any) {
        // 이미 존재하는 경우 다시 조회
        if (createError.code === 'P2002') {
          accessCode = await prisma.accessCode.findUnique({
            where: { code: '0000' },
          });
        } else {
          console.error('기본 접속 코드 생성 오류:', createError);
          throw createError;
        }
      }
    }

    if (!accessCode) {
      return NextResponse.json(
        { error: '접속 코드를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (!accessCode.isActive) {
      return NextResponse.json(
        { error: '비활성화된 접속 코드입니다.' },
        { status: 403 }
      );
    }

    // 해당 접속 코드의 주제 조회
    const topics = await prisma.topic.findMany({
      where: {
        accessCodeId: accessCode.id,
      },
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

    return NextResponse.json(topics);
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

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
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
    let accessCode;
    try {
      accessCode = await prisma.accessCode.findUnique({
        where: { code },
      });

      // 접속 코드가 없고, 코드가 "0000"이면 기본 접속 코드 생성
      if (!accessCode && code === '0000') {
        try {
          accessCode = await prisma.accessCode.create({
            data: {
              code: '0000',
              isActive: true,
            },
          });
        } catch (createError: any) {
          // 이미 존재하는 경우 다시 조회
          if (createError.code === 'P2002') {
            accessCode = await prisma.accessCode.findUnique({
              where: { code: '0000' },
            });
          } else {
            console.error('기본 접속 코드 생성 오류:', createError);
            throw createError;
          }
        }
      }
    } catch (dbError: any) {
      console.error('데이터베이스 연결 오류:', dbError);
      throw dbError;
    }

    if (!accessCode) {
      return NextResponse.json(
        { error: '접속 코드를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (!accessCode.isActive) {
      return NextResponse.json(
        { error: '비활성화된 접속 코드입니다.' },
        { status: 403 }
      );
    }

    // 주제 생성
    try {
      const topic = await prisma.topic.create({
        data: {
          accessCodeId: accessCode.id,
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

      return NextResponse.json(topic, { status: 201 });
    } catch (createError: any) {
      console.error('주제 생성 오류:', createError);
      
      // 데이터베이스 연결 실패 시 명확한 에러 메시지
      if (createError.message?.includes('DATABASE_URL') || createError.message?.includes('Environment variable')) {
        return NextResponse.json(
          { error: '데이터베이스가 설정되지 않았습니다. DATABASE_URL 환경 변수를 설정해주세요.' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: createError.message || '주제를 생성하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('주제 생성 오류:', error);
    return NextResponse.json(
      { error: error.message || '주제를 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

