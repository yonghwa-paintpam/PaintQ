import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * 접속 코드 조회 및 업데이트
 * GET: 접속 코드 정보 조회
 * PATCH: 접속 코드 활성화/비활성화
 * DELETE: 접속 코드 삭제 (비활성화)
 */
export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    let accessCode = await prisma.accessCode.findUnique({
      where: { code },
      include: {
        _count: {
          select: {
            topics: true,
            games: true,
          },
        },
      },
    });

    // 접속 코드가 없고, 코드가 "0000"이면 기본 접속 코드 생성
    if (!accessCode && code === '0000') {
      try {
        // 기본 접속 코드 생성 시도
        accessCode = await prisma.accessCode.create({
          data: {
            code: '0000',
            isActive: true,
          },
          include: {
            _count: {
              select: {
                topics: true,
                games: true,
              },
            },
          },
        });
      } catch (createError: any) {
        // 이미 존재하는 경우 다시 조회
        if (createError.code === 'P2002') {
          accessCode = await prisma.accessCode.findUnique({
            where: { code: '0000' },
            include: {
              _count: {
                select: {
                  topics: true,
                  games: true,
                },
              },
            },
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

    return NextResponse.json(accessCode);
  } catch (error: any) {
    console.error('접속 코드 조회 오류:', error);
    
    // 데이터베이스 연결 실패 시 명확한 에러 메시지
    if (error.message?.includes('DATABASE_URL') || error.message?.includes('Environment variable')) {
      return NextResponse.json(
        { error: '데이터베이스가 설정되지 않았습니다. DATABASE_URL 환경 변수를 설정해주세요.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: '접속 코드를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    const body = await request.json();
    const { isActive } = body;

    const accessCode = await prisma.accessCode.findUnique({
      where: { code },
    });

    if (!accessCode) {
      return NextResponse.json(
        { error: '접속 코드를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const updatedAccessCode = await prisma.accessCode.update({
      where: { code },
      data: {
        isActive: isActive !== undefined ? isActive : accessCode.isActive,
        deactivatedAt: isActive === false ? new Date() : null,
      },
    });

    return NextResponse.json(updatedAccessCode);
  } catch (error) {
    console.error('접속 코드 업데이트 오류:', error);
    return NextResponse.json(
      { error: '접속 코드를 업데이트하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    // 삭제 대신 비활성화
    const accessCode = await prisma.accessCode.findUnique({
      where: { code },
    });

    if (!accessCode) {
      return NextResponse.json(
        { error: '접속 코드를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const updatedAccessCode = await prisma.accessCode.update({
      where: { code },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedAccessCode);
  } catch (error) {
    console.error('접속 코드 삭제 오류:', error);
    return NextResponse.json(
      { error: '접속 코드를 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

