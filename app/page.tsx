'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/Loading/LoadingSpinner';

export default function Home() {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 4자리 숫자 검증
    if (!/^\d{4}$/.test(accessCode)) {
      setError('4자리 숫자를 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      // 접속 코드 유효성 확인
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
      
      // 비활성화된 접속 코드 확인
      if (!data.isActive) {
        setError('비활성화된 접속 코드입니다.');
        setLoading(false);
        return;
      }

      // 접속 코드 사용 시간 업데이트 (백그라운드)
      fetch(`/api/access-codes/${accessCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastUsedAt: new Date().toISOString() }),
      }).catch(() => {
        // 실패해도 계속 진행
      });

      // 접속 코드가 유효하면 선택 화면으로 이동
      router.push(`/${accessCode}`);
    } catch {
      setError('접속 코드를 확인하는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 sm:p-8">
      <div className="text-center space-y-8 animate-fade-in max-w-2xl mx-auto w-full">
        <div className="animate-scale-in">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-800 mb-4">
            🎨 PaintQ
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-12">
            접속 코드를 입력해주세요
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6 flex flex-col items-center">
          <div className="flex flex-col items-center gap-4 w-full">
            <input
              type="text"
              value={accessCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                setAccessCode(value);
                setError('');
              }}
              placeholder="0000"
              className="w-full max-w-xs px-6 py-4 text-3xl text-center font-bold border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={4}
              disabled={loading}
              autoFocus
            />
            {error && (
              <p className="text-red-600 text-sm font-semibold">{error}</p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={loading || accessCode.length !== 4}
            className="px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none inline-flex items-center justify-center gap-2 min-w-[140px]"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>확인 중...</span>
              </>
            ) : (
              '접속하기'
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
