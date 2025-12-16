'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { TopicWithWords } from '@/types';
import Toast from '@/components/Toast/Toast';
import LoadingSpinner from '@/components/Loading/LoadingSpinner';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function AdminPage() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState<string>('');
  const [topics, setTopics] = useState<TopicWithWords[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newWords, setNewWords] = useState<string[]>(Array(10).fill(''));
  const [editingTopic, setEditingTopic] = useState<TopicWithWords | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [deletingTopicId, setDeletingTopicId] = useState<string | null>(null);
  const [accessCodeValid, setAccessCodeValid] = useState(false);

  // sessionStorage에서 접속 코드 읽기
  useEffect(() => {
    const storedCode = sessionStorage.getItem('paintq_access_code');
    if (!storedCode || !/^\d{4}$/.test(storedCode)) {
      router.push('/');
      return;
    }
    setAccessCode(storedCode);
  }, [router]);

  // 접속 코드가 설정되면 유효성 검사
  useEffect(() => {
    if (!accessCode) return;
    validateAccessCode();
  }, [accessCode]);

  const validateAccessCode = async () => {
    try {
      const response = await fetch(`/api/access-codes/${accessCode}`);
      if (!response.ok || !(await response.json()).isActive) {
        router.push('/');
        return;
      }
      setAccessCodeValid(true);
      fetchTopics();
    } catch (error) {
      console.error('접속 코드 확인 오류:', error);
      router.push('/');
    }
  };

  const fetchTopics = async () => {
    setFetching(true);
    try {
      const response = await fetch(`/api/access-codes/${accessCode}/topics`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setTopics(data);
      } else if (data.error) {
        console.error('주제 조회 오류:', data.error);
        setTopics([]);
        if (!data.error.includes('데이터베이스')) {
          setToast({ message: '주제를 불러오는 중 오류가 발생했습니다: ' + data.error, type: 'error' });
        }
      } else {
        console.error('예상치 못한 응답 형태:', data);
        setTopics([]);
      }
    } catch (error) {
      console.error('주제 조회 오류:', error);
      setTopics([]);
      if (error instanceof Error && !error.message.includes('fetch')) {
        setToast({ message: '주제를 불러오는 중 오류가 발생했습니다.', type: 'error' });
      }
    } finally {
      setFetching(false);
    }
  };

  const handleCreateTopic = async () => {
    if (!newTopicName.trim()) {
      setToast({ message: '주제 이름을 입력해주세요.', type: 'error' });
      return;
    }

    const validWords = newWords.filter((word) => word.trim() !== '');
    if (validWords.length === 0) {
      setToast({ message: '최소 1개 이상의 문제 단어를 입력해주세요.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/access-codes/${accessCode}/topics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTopicName,
          words: validWords,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || '주제 생성에 실패했습니다.');
      }

      await fetchTopics();
      setShowCreateForm(false);
      setNewTopicName('');
      setNewWords(Array(10).fill(''));
      setToast({ message: '주제가 생성되었습니다!', type: 'success' });
    } catch (error) {
      console.error('주제 생성 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      setToast({ message: `주제 생성 중 오류가 발생했습니다: ${errorMessage}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTopic = async (topicId: string, updatedName: string, updatedWords: string[]) => {
    const validWords = updatedWords.filter((word) => word.trim() !== '');
    if (validWords.length === 0) {
      setToast({ message: '최소 1개 이상의 문제 단어를 입력해주세요.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/access-codes/${accessCode}/topics/${topicId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: updatedName,
          words: validWords,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || '주제 수정에 실패했습니다.');
      }

      await fetchTopics();
      setEditingTopic(null);
      setToast({ message: '주제가 수정되었습니다!', type: 'success' });
    } catch (error) {
      console.error('주제 수정 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      setToast({ message: `주제 수정 중 오류가 발생했습니다: ${errorMessage}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('정말로 이 주제를 삭제하시겠습니까? 모든 문제와 게임 기록이 함께 삭제됩니다.')) {
      return;
    }

    setDeletingTopicId(topicId);
    try {
      const response = await fetch(`/api/access-codes/${accessCode}/topics/${topicId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '주제 삭제에 실패했습니다.');
      }

      await fetchTopics();
      setToast({ message: '주제가 삭제되었습니다!', type: 'success' });
    } catch (error) {
      console.error('주제 삭제 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      setToast({ message: `주제 삭제 중 오류가 발생했습니다: ${errorMessage}`, type: 'error' });
    } finally {
      setDeletingTopicId(null);
    }
  };

  // accessCode가 아직 로드되지 않았으면 로딩 표시
  if (!accessCode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <LoadingSpinner size="lg" text="로딩 중..." />
      </div>
    );
  }

  if (!accessCodeValid) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <LoadingSpinner />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
              관리자 모드
            </h1>
            <p className="text-gray-600">
              접속 코드: <span className="font-semibold text-blue-600">{accessCode}</span>
            </p>
          </div>
          <Link
            href="/play"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ← 돌아가기
          </Link>
        </div>

        {fetching ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <div className="mb-6">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
              >
                {showCreateForm ? '취소' : '+ 새 주제 만들기'}
              </button>
            </div>

            {showCreateForm && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">새 주제 만들기</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      주제 이름
                    </label>
                    <input
                      type="text"
                      value={newTopicName}
                      onChange={(e) => setNewTopicName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="예: 동물, 과일, 교통수단"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      문제 단어 (최대 10개)
                    </label>
                    {newWords.map((word, index) => (
                      <input
                        key={index}
                        type="text"
                        value={word}
                        onChange={(e) => {
                          const updated = [...newWords];
                          updated[index] = e.target.value;
                          setNewWords(updated);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                        placeholder={`문제 ${index + 1}`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleCreateTopic}
                    disabled={loading}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '생성 중...' : '주제 생성'}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {topics.length === 0 ? (
                <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                  <p className="text-gray-600 text-lg">아직 생성된 주제가 없습니다.</p>
                  <p className="text-gray-500 text-sm mt-2">위의 &quot;새 주제 만들기&quot; 버튼을 클릭하여 주제를 만들어보세요!</p>
                </div>
              ) : (
                topics.map((topic) => (
                  <div key={topic.id} className="bg-white rounded-lg shadow-lg p-6">
                    {editingTopic?.id === topic.id ? (
                      <EditTopicForm
                        topic={editingTopic}
                        onSave={(name, words) => handleUpdateTopic(topic.id, name, words)}
                        onCancel={() => setEditingTopic(null)}
                        loading={loading}
                      />
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">{topic.name}</h3>
                            <p className="text-gray-600">
                              문제 개수: {topic.words.length}개
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingTopic(topic)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteTopic(topic.id)}
                              disabled={deletingTopicId === topic.id}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletingTopicId === topic.id ? '삭제 중...' : '삭제'}
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                          {topic.words.map((word, index) => (
                            <div
                              key={word.id}
                              className="bg-gray-50 p-3 rounded-lg text-center font-semibold text-gray-800"
                            >
                              {index + 1}. {word.word}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </main>
  );
}

function EditTopicForm({
  topic,
  onSave,
  onCancel,
  loading,
}: {
  topic: TopicWithWords;
  onSave: (name: string, words: string[]) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [name, setName] = useState(topic.name);
  const [words, setWords] = useState<string[]>(
    Array.from({ length: 10 }, (_, i) => topic.words[i]?.word || '')
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">주제 이름</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">문제 단어</label>
        {words.map((word, index) => (
          <input
            key={index}
            type="text"
            value={word}
            onChange={(e) => {
              const updated = [...words];
              updated[index] = e.target.value;
              setWords(updated);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
            placeholder={`문제 ${index + 1}`}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave(name, words)}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '저장 중...' : '저장'}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          취소
        </button>
      </div>
    </div>
  );
}
