import { NextRequest, NextResponse } from 'next/server';

// 동적 라우트로 강제 설정
export const dynamic = 'force-dynamic';

/**
 * 슈퍼 관리자 인증 확인
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');
    const superAdminKey = process.env.SUPER_ADMIN_SECRET_KEY;

    if (!superAdminKey) {
      return NextResponse.json(
        { error: '슈퍼 관리자 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    if (!key || key !== superAdminKey) {
      return NextResponse.json(
        { error: '인증에 실패했습니다.' },
        { status: 401 }
      );
    }

    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.error('인증 확인 오류:', error);
    return NextResponse.json(
      { error: '인증 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

