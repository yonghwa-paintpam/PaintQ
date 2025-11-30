import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * 접속 코드 생성 (순차 할당)
 * GET: 접속 코드 목록 조회
 * POST: 새 접속 코드 생성
 */
export async function GET() {
  try {
    const accessCodes = await prisma.accessCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            topics: true,
            games: true,
          },
        },
      },
    });

    return NextResponse.json(accessCodes);
  } catch (error) {
    console.error('접속 코드 조회 오류:', error);
    return NextResponse.json(
      { error: '접속 코드를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // 순차 할당: 모든 접속 코드를 가져와서 숫자 코드 중 가장 큰 값 찾기
    const allAccessCodes = await prisma.accessCode.findMany({
      orderBy: { code: 'desc' },
    });

    // 4자리 숫자 코드만 필터링
    const numericCodes = allAccessCodes
      .map(ac => {
        const num = parseInt(ac.code, 10);
        return isNaN(num) ? null : num;
      })
      .filter((num): num is number => num !== null && num >= 0 && num <= 9999)
      .sort((a, b) => b - a);

    let nextCode: string;
    if (numericCodes.length > 0) {
      const lastCodeNum = numericCodes[0];
      if (lastCodeNum >= 9999) {
        throw new Error('접속 코드를 더 이상 생성할 수 없습니다. (9999 초과)');
      }
      nextCode = (lastCodeNum + 1).toString().padStart(4, '0');
    } else {
      // 첫 번째 접속 코드
      nextCode = '0000';
    }

    // 중복 확인 (DB UNIQUE 제약으로도 방지되지만, 명시적으로 확인)
    const existingCode = await prisma.accessCode.findUnique({
      where: { code: nextCode },
    });

    if (existingCode) {
      // 코드가 이미 존재하면 다음 번호 시도
      const existingCodeNum = parseInt(existingCode.code, 10);
      if (!isNaN(existingCodeNum) && existingCodeNum < 9999) {
        nextCode = (existingCodeNum + 1).toString().padStart(4, '0');
      } else {
        throw new Error('접속 코드를 생성할 수 없습니다. (사용 가능한 코드 없음)');
      }
    }

    const accessCode = await prisma.accessCode.create({
      data: {
        code: nextCode,
        isActive: true,
      },
    });

    return NextResponse.json(accessCode, { status: 201 });
  } catch (error: any) {
    console.error('접속 코드 생성 오류:', error);
    
    // UNIQUE 제약 위반 시 재시도
    if (error.code === 'P2002' && error.meta?.target?.includes('code')) {
      // 재시도 로직 (최대 10번)
      for (let i = 0; i < 10; i++) {
        try {
          const allAccessCodes = await prisma.accessCode.findMany({
            orderBy: { code: 'desc' },
          });
          
          const numericCodes = allAccessCodes
            .map(ac => {
              const num = parseInt(ac.code, 10);
              return isNaN(num) ? null : num;
            })
            .filter((num): num is number => num !== null && num >= 0 && num <= 9999)
            .sort((a, b) => b - a);
          
          const lastCodeNum = numericCodes.length > 0 ? numericCodes[0] : -1;
          const nextCode = (lastCodeNum + 1).toString().padStart(4, '0');
          
          const accessCode = await prisma.accessCode.create({
            data: {
              code: nextCode,
              isActive: true,
            },
          });
          
          return NextResponse.json(accessCode, { status: 201 });
        } catch (retryError: any) {
          if (retryError.code !== 'P2002' || i === 9) {
            throw retryError;
          }
        }
      }
    }

    return NextResponse.json(
      { error: error.message || '접속 코드를 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

