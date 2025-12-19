'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/Loading/LoadingSpinner';

interface AccessCode {
  id: string;
  code: string;
  name: string | null; // 사용자/고객 이름
  createdAt: string;
  lastUsedAt: string | null;
  isActive: boolean;
  deactivatedAt: string | null;
  _count?: {
    topics: number;
    games: number;
  };
}

interface Topic {
  id: string;
  name: string;
  words: Array<{
    id: string;
    word: string;
    order: number;
  }>;
}

interface Drawing {
  id: string;
  imageData: string;
}

function SuperAdminContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    const key = searchParams.get('key');

    if (!key) {
      router.push('/');
      return;
    }

    validateAuth(key);
  }, [searchParams, router]);

  const validateAuth = async (key: string) => {
    try {
      const response = await fetch(`/api/super-admin/auth?key=${encodeURIComponent(key)}`);
      if (response.ok) {
        setAuthenticated(true);
        fetchAccessCodes();
      } else {
        router.push('/');
      }
    } catch {
      router.push('/');
    }
  };

  const fetchAccessCodes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/access-codes');
      if (response.ok) {
        const data = await response.json();
        setAccessCodes(data);
      }
    } catch {
      // 오류 무시
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccessCode = async () => {
    if (!newName.trim()) {
      alert('사용자 이름을 입력해주세요.');
      return;
    }
    
    setCreating(true);
    try {
      const response = await fetch('/api/access-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName.trim(),
        }),
      });
      if (response.ok) {
        await fetchAccessCodes();
        setNewName('');
        setShowCreateForm(false);
      } else {
        alert('접속 코드 생성에 실패했습니다.');
      }
    } catch {
      alert('접속 코드 생성에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateName = async (code: string) => {
    try {
      const response = await fetch(`/api/access-codes/${code}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName.trim() || null,
        }),
      });
      if (response.ok) {
        await fetchAccessCodes();
        setEditingCode(null);
        setEditName('');
      } else {
        alert('이름 변경에 실패했습니다.');
      }
    } catch {
      alert('이름 변경에 실패했습니다.');
    }
  };

  const handleToggleActive = async (code: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/access-codes/${code}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentActive,
        }),
      });
      if (response.ok) {
        await fetchAccessCodes();
        if (selectedCode === code) {
          setSelectedCode(null);
          setTopics([]);
          setSelectedTopic(null);
          setDrawings([]);
        }
      } else {
        alert('상태 변경에 실패했습니다.');
      }
    } catch {
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleSelectCode = async (code: string) => {
    setSelectedCode(code);
    setSelectedTopic(null);
    setDrawings([]);
    setLoading(true);
    try {
      const response = await fetch(`/api/access-codes/${code}/topics`);
      if (response.ok) {
        const data = await response.json();
        setTopics(data);
      }
    } catch {
      // 오류 무시
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTopic = async (topic: Topic) => {
    setSelectedTopic(topic);
    setDrawings([]);
    setLoading(true);
    try {
      const allDrawings: Drawing[] = [];
      for (const word of topic.words) {
        const response = await fetch(`/api/access-codes/${selectedCode}/drawings/${word.id}`);
        if (response.ok) {
          const data = await response.json();
          allDrawings.push(...data);
        }
      }
      setDrawings(allDrawings);
    } catch {
      // 오류 무시
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <LoadingSpinner />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">슈퍼 관리자</h1>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            홈으로
          </Link>
        </div>

        <div className="mb-6">
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              + 새 접속 코드 생성
            </button>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
              <h3 className="text-lg font-bold mb-4 text-gray-800">새 접속 코드 생성</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    사용자/고객 이름 *
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 삼성전자, 김철수"
                    disabled={creating}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateAccessCode}
                    disabled={creating || !newName.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? '생성 중...' : '생성'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewName('');
                    }}
                    disabled={creating}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-colors disabled:opacity-50"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {loading && !selectedCode ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 접속 코드 목록 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">접속 코드 목록</h2>
              <div className="space-y-2">
                {accessCodes.length === 0 ? (
                  <p className="text-gray-600">접속 코드가 없습니다.</p>
                ) : (
                  accessCodes.map((ac) => (
                    <div
                      key={ac.id}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedCode === ac.code
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleSelectCode(ac.code)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {editingCode === ac.code ? (
                            <div className="flex items-center gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                                placeholder="이름 입력"
                                autoFocus
                              />
                              <button
                                onClick={() => handleUpdateName(ac.code)}
                                className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                              >
                                저장
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCode(null);
                                  setEditName('');
                                }}
                                className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-lg text-gray-900">
                                {ac.name || '(이름 없음)'} 
                                <span className="text-blue-600 ml-2">({ac.code})</span>
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingCode(ac.code);
                                  setEditName(ac.name || '');
                                }}
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                ✏️
                              </button>
                            </div>
                          )}
                          <p className="text-sm text-gray-700 font-medium">
                            주제: {ac._count?.topics || 0}개, 게임: {ac._count?.games || 0}개
                          </p>
                          <p className="text-xs text-gray-600">
                            생성: {new Date(ac.createdAt).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              ac.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {ac.isActive ? '활성' : '비활성'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleActive(ac.code, ac.isActive);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            {ac.isActive ? '비활성화' : '활성화'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 주제 목록 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                주제 목록 {selectedCode && `(${selectedCode})`}
              </h2>
              {!selectedCode ? (
                <p className="text-gray-600">접속 코드를 선택해주세요.</p>
              ) : loading ? (
                <LoadingSpinner />
              ) : topics.length === 0 ? (
                <p className="text-gray-600">주제가 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {topics.map((topic) => (
                    <div
                      key={topic.id}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedTopic?.id === topic.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleSelectTopic(topic)}
                    >
                      <p className="font-semibold text-gray-900">{topic.name}</p>
                      <p className="text-sm text-gray-700 font-medium">
                        문제: {topic.words.length}개
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {topic.words
                          .sort((a, b) => a.order - b.order)
                          .map((w) => w.word)
                          .join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 그림 데이터 목록 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                그림 데이터 {selectedTopic && `(${selectedTopic.name})`}
              </h2>
              {!selectedTopic ? (
                <p className="text-gray-600">주제를 선택해주세요.</p>
              ) : loading ? (
                <LoadingSpinner />
              ) : drawings.length === 0 ? (
                <p className="text-gray-600">그림 데이터가 없습니다.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {drawings.map((drawing) => (
                    <div key={drawing.id} className="border rounded-lg p-2">
                      <img
                        src={drawing.imageData}
                        alt="그림"
                        className="w-full h-24 object-contain rounded"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function SuperAdminPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <LoadingSpinner />
      </main>
    }>
      <SuperAdminContent />
    </Suspense>
  );
}
