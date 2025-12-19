'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/Loading/LoadingSpinner';

export default function HomePage() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedCode = sessionStorage.getItem('paintq_access_code');
    if (!storedCode || !/^\d{4}$/.test(storedCode)) {
      router.push('/');
      return;
    }
    setAccessCode(storedCode);
    
    // 사용자 이름 가져오기
    const fetchUserName = async () => {
      try {
        const response = await fetch(`/api/access-codes/${storedCode}`);
        if (response.ok) {
          const data = await response.json();
          setUserName(data.name || '');
        }
      } catch {
        // 오류 무시
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserName();
  }, [router]);

  if (loading || !accessCode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <LoadingSpinner size="lg" text="로딩 중..." />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 sm:p-8">
      <div className="text-center space-y-8 animate-fade-in max-w-2xl mx-auto">
        <div className="animate-scale-in">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-800 mb-4">
            🎨 PaintQ
          </h1>
          {userName ? (
            <p className="text-lg sm:text-xl text-gray-600 mb-4">
              <span className="font-bold text-blue-600">{userName}</span>님 환영합니다!
            </p>
          ) : (
            <p className="text-lg sm:text-xl text-gray-600 mb-4">
              접속 코드: <span className="font-bold text-blue-600">{accessCode}</span>
            </p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
          <Link
            href="/play"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            🎮 플레이 모드
          </Link>
          
          <Link
            href="/admin"
            className="px-8 py-4 bg-purple-600 text-white rounded-lg text-lg font-semibold hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            ⚙️ 관리자 모드
          </Link>
        </div>

        <div className="mt-8">
          <button
            onClick={() => {
              sessionStorage.removeItem('paintq_access_code');
              router.push('/');
            }}
            className="text-gray-600 hover:text-gray-800 underline text-sm"
          >
            다른 접속 코드로 접속하기
          </button>
        </div>
      </div>
    </main>
  );
}
