'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { TopicWithWords } from '@/types';
import Toast from '@/components/Toast/Toast';
import LoadingSpinner from '@/components/Loading/LoadingSpinner';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function AdminPage() {
  const [topics, setTopics] = useState<TopicWithWords[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newWords, setNewWords] = useState<string[]>(Array(10).fill(''));
  const [editingTopic, setEditingTopic] = useState<TopicWithWords | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [deletingTopicId, setDeletingTopicId] = useState<string | null>(null);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    setFetching(true);
    try {
      const response = await fetch('/api/topics');
      const data = await response.json();
      
      // 응답이 배열인지 확인
      if (Array.isArray(data)) {
        setTopics(data);
      } else if (data.error) {
        // 에러 응답인 경우
        console.error('주제 조회 오류:', data.error);
        setTopics([]); // 빈 배열로 설정
        // 데이터베이스가 설정되지 않은 경우 조용히 처리
        if (!data.error.includes('데이터베이스')) {
          setToast({ message: '주제를 불러오는 중 오류가 발생했습니다: ' + data.error, type: 'error' });
        }
      } else {
        // 예상치 못한 응답 형태
        console.error('예상치 못한 응답 형태:', data);
        setTopics([]);
      }
    } catch (error) {
      console.error('주제 조회 오류:', error);
      setTopics([]); // 에러 시 빈 배열로 설정
      // 네트워크 오류 등만 알림 표시
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
      const response = await fetch('/api/topics', {
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

  const handleUpdateTopic = async () => {
    if (!editingTopic) return;

    if (!editingTopic.name.trim()) {
      setToast({ message: '주제 이름을 입력해주세요.', type: 'error' });
      return;
    }

    const validWords = editingTopic.words
      .map((w) => w.word)
      .filter((word) => word.trim() !== '');
    if (validWords.length === 0) {
      setToast({ message: '최소 1개 이상의 문제 단어를 입력해주세요.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/topics/${editingTopic.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingTopic.name,
          words: validWords,
        }),
      });

      if (!response.ok) {
        throw new Error('주제 수정에 실패했습니다.');
      }

      await fetchTopics();
      setEditingTopic(null);
      setToast({ message: '주제가 수정되었습니다!', type: 'success' });
    } catch (error) {
      console.error('주제 수정 오류:', error);
      setToast({ message: '주제 수정 중 오류가 발생했습니다.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('정말 이 주제를 삭제하시겠습니까?')) return;

    setDeletingTopicId(topicId);
    try {
      const response = await fetch(`/api/topics/${topicId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('주제 삭제에 실패했습니다.');
      }

      await fetchTopics();
      setToast({ message: '주제가 삭제되었습니다.', type: 'success' });
    } catch (error) {
      console.error('주제 삭제 오류:', error);
      setToast({ message: '주제 삭제 중 오류가 발생했습니다.', type: 'error' });
    } finally {
      setDeletingTopicId(null);
    }
  };

  const handleEditClick = (topic: TopicWithWords) => {
    setEditingTopic({ ...topic });
    setShowCreateForm(false);
  };

  const updateEditingWord = (index: number, value: string) => {
    if (!editingTopic) return;
    const newWords = [...editingTopic.words];
    if (newWords[index]) {
      newWords[index].word = value;
    } else {
      // 새 단어 추가
      newWords.push({
        id: '',
        topicId: editingTopic.id,
        word: value,
        order: index + 1,
        createdAt: new Date(),
      });
    }
    setEditingTopic({ ...editingTopic, words: newWords });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">⚙️ 관리자 모드</h1>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md hover:shadow-lg"
          >
            홈으로
          </Link>
        </div>

        {/* 주제 생성 폼 */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6 animate-scale-in">
            <h2 className="text-2xl font-semibold mb-4">새 주제 생성</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
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
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                문제 단어 (최대 10개)
              </label>
              {Array.from({ length: 10 }).map((_, index) => (
                <input
                  key={index}
                  type="text"
                  value={newWords[index] || ''}
                  onChange={(e) => {
                    const updated = [...newWords];
                    updated[index] = e.target.value;
                    setNewWords(updated);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`문제 ${index + 1}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateTopic}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
              >
                {loading && <LoadingSpinner size="sm" />}
                {loading ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewTopicName('');
                  setNewWords(Array(10).fill(''));
                }}
                className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 주제 수정 폼 */}
        {editingTopic && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6 animate-scale-in">
            <h2 className="text-2xl font-semibold mb-4">주제 수정</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                주제 이름
              </label>
              <input
                type="text"
                value={editingTopic.name}
                onChange={(e) =>
                  setEditingTopic({ ...editingTopic, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                문제 단어 (최대 10개)
              </label>
              {Array.from({ length: 10 }).map((_, index) => (
                <input
                  key={index}
                  type="text"
                  value={editingTopic.words[index]?.word || ''}
                  onChange={(e) => updateEditingWord(index, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`문제 ${index + 1}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleUpdateTopic}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
              >
                {loading && <LoadingSpinner size="sm" />}
                {loading ? '수정 중...' : '수정 완료'}
              </button>
              <button
                onClick={() => setEditingTopic(null)}
                className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 주제 목록 */}
        {!showCreateForm && !editingTopic && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="mb-6 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition-all shadow-md hover:shadow-lg transform hover:scale-105"
          >
            + 새 주제 생성
          </button>
        )}

        {fetching ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" text="주제를 불러오는 중..." />
          </div>
        ) : (
          <div className="space-y-4">
            {Array.isArray(topics) && topics.map((topic, index) => (
              <div
                key={topic.id}
                className="bg-white rounded-lg shadow-lg p-4 sm:p-6 animate-fade-in transition-all hover:shadow-xl"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-semibold text-gray-800">
                      {topic.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {topic.words.length}개의 문제
                    </p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleEditClick(topic)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteTopic(topic.id)}
                      disabled={deletingTopicId === topic.id}
                      className="flex-1 sm:flex-none px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors shadow-md hover:shadow-lg"
                    >
                      {deletingTopicId === topic.id ? '삭제 중...' : '삭제'}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {topic.words.map((word) => (
                    <div
                      key={word.id}
                      className="px-3 py-2 bg-gray-100 rounded-lg text-center text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      {word.word}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!fetching && topics.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-xl text-gray-600 mb-2">아직 생성된 주제가 없습니다</p>
            <p className="text-gray-500">새 주제를 생성해보세요!</p>
          </div>
        )}
      </div>
    </div>
  );
}

