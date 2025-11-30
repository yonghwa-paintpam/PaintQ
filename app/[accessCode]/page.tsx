'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/Loading/LoadingSpinner';

export default function AccessCodePage() {
  const params = useParams();
  const router = useRouter();
  const accessCode = params.accessCode as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accessCodeData, setAccessCodeData] = useState<any>(null);

  useEffect(() => {
    const validateAccessCode = async () => {
      if (!accessCode || !/^\d{4}$/.test(accessCode)) {
        setError('유효하지 않은 접속 코드입니다.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/access-codes/${accessCode}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('존재하지 않는 접속 코드입니다.');
          } else {
            setError('접속 코드를 확인하는 중 오류가 발생했습니다.');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        
        if (!data.isActive) {
          setError('비활성화된 접속 코드입니다.');
          setLoading(false);
          return;
        }

        setAccessCodeData(data);
        setLoading(false);
      } catch (error) {
        console.error('접속 코드 확인 오류:', error);
        setError('접속 코드를 확인하는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };

    validateAccessCode();
  }, [accessCode]);

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <LoadingSpinner size="lg" text="접속 코드 확인 중..." />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
        <div className="text-center space-y-6">
          <p className="text-xl text-red-600 font-semibold">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 sm:p-8">
      <div className="text-center space-y-8 animate-fade-in max-w-2xl mx-auto">
        <div className="animate-scale-in">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-800 mb-4">
            🎨 PaintQ
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-4">
            접속 코드: <span className="font-bold text-blue-600">{accessCode}</span>
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
          <Link
            href={`/${accessCode}/play`}
            className="px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            🎮 플레이 모드
          </Link>
          
          <Link
            href={`/${accessCode}/admin`}
            className="px-8 py-4 bg-purple-600 text-white rounded-lg text-lg font-semibold hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            ⚙️ 관리자 모드
          </Link>
        </div>

        <div className="mt-8">
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-gray-800 underline text-sm"
          >
            다른 접속 코드로 접속하기
          </button>
        </div>
      </div>
    </main>
  );
}

