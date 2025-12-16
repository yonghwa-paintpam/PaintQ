'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function LegacyPlayPage() {
  const params = useParams();
  const router = useRouter();
  const accessCode = params.accessCode as string;

  useEffect(() => {
    // 접속 코드를 sessionStorage에 저장하고 /play로 리다이렉트
    if (accessCode && /^\d{4}$/.test(accessCode)) {
      sessionStorage.setItem('paintq_access_code', accessCode);
      router.replace('/play');
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
