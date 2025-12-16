'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// 기존 URL 호환성을 위한 리다이렉트 페이지
// /[accessCode]/admin → sessionStorage에 저장 후 /admin으로 이동
export default function LegacyAdminPage() {
  const params = useParams();
  const router = useRouter();
  const accessCode = params.accessCode as string;

  useEffect(() => {
    // 접속 코드를 sessionStorage에 저장하고 /admin으로 리다이렉트
    if (accessCode && /^\d{4}$/.test(accessCode)) {
      sessionStorage.setItem('paintq_access_code', accessCode);
      router.replace('/admin');
    } else {
      router.replace('/');
    }
  }, [accessCode, router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="text-center">
        <p className="text-xl text-gray-600">리다이렉트 중...</p>
      </div>
    </main>
  );
}
