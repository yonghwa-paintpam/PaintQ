'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { TopicWithWords } from '@/types';
import Timer from '@/components/Timer/Timer';
import DrawingCanvas from '@/components/Canvas/DrawingCanvas';
import LoadingSpinner from '@/components/Loading/LoadingSpinner';

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const accessCode = params.accessCode as string;
  const [topics, setTopics] = useState<TopicWithWords[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<TopicWithWords | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [accessCodeValid, setAccessCodeValid] = useState(false);

  useEffect(() => {
    if (!accessCode || !/^\d{4}$/.test(accessCode)) {
      router.push('/');
      return;
    }
    validateAccessCode();
  }, [accessCode, router]);

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
      
      // 응답이 배열인지 확인
      if (Array.isArray(data)) {
        setTopics(data);
      } else if (data.error) {
        // 에러 응답인 경우
        console.error('주제 조회 오류:', data.error);
        setTopics([]); // 빈 배열로 설정
        // 데이터베이스가 설정되지 않은 경우 조용히 처리
        if (!data.error.includes('데이터베이스')) {
          console.error('주제를 불러오는 중 오류가 발생했습니다: ' + data.error);
        }
      } else {
        // 예상치 못한 응답 형태
        console.error('예상치 못한 응답 형태:', data);
        setTopics([]);
      }
    } catch (error) {
      console.error('주제 조회 오류:', error);
      setTopics([]); // 에러 시 빈 배열로 설정
    } finally {
      setFetching(false);
    }
  };

  const handleSelectTopic = (topic: TopicWithWords) => {
    if (!topic.words || topic.words.length === 0) {
      alert('이 주제에는 문제가 없습니다. 관리자 모드에서 문제를 추가해주세요.');
      return;
    }
    
    // words 배열이 제대로 있는지 확인
    if (!Array.isArray(topic.words)) {
      alert('주제 데이터에 오류가 있습니다. 다시 시도해주세요.');
      return;
    }
    
    setSelectedTopic(topic);
  };

  if (selectedTopic) {
    return (
      <GamePage
        accessCode={accessCode}
        topic={selectedTopic}
        onBack={() => setSelectedTopic(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">🎮 플레이 모드</h1>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md hover:shadow-lg"
          >
            홈으로
          </Link>
        </div>

        <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-gray-700">
          주제를 선택하세요
        </h2>

        {fetching ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" text="주제를 불러오는 중..." />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.isArray(topics) && topics.map((topic, index) => (
                <button
                  key={topic.id}
                  onClick={() => handleSelectTopic(topic)}
                  disabled={topic.words.length === 0}
                  className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all text-left animate-fade-in transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {topic.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {topic.words.length > 0 ? `${topic.words.length}개의 문제` : '문제 없음'}
                  </p>
                </button>
              ))}
            </div>

            {topics.length === 0 && (
              <div className="text-center py-20 animate-fade-in">
                <div className="text-6xl mb-4">🎯</div>
                <p className="text-xl text-gray-600 mb-2">아직 생성된 주제가 없습니다</p>
                <p className="text-gray-500">관리자 모드에서 주제를 생성해주세요</p>
                <Link
                  href={`/${accessCode}/admin`}
                  className="inline-block mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg"
                >
                  관리자 모드로 이동
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// 게임 진행 페이지
function GamePage({
  accessCode,
  topic,
  onBack,
}: {
  accessCode: string;
  topic: TopicWithWords;
  onBack: () => void;
}) {
  // topic prop 유효성 검사
  useEffect(() => {
    // 유효성 검사 (로그 제거)
  }, [topic]);

  // 게임 중 body 스크롤 방지 (모바일/iPad)
  useEffect(() => {
    // html과 body에 game-active 클래스 추가
    document.documentElement.classList.add('game-active');
    document.body.classList.add('game-active');
    
    // 터치 이동 방지 (캔버스 제외)
    const preventTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      // 캔버스에서의 터치는 허용
      if (target?.tagName === 'CANVAS') {
        return;
      }
      // 버튼 클릭은 허용
      if (target?.tagName === 'BUTTON' || target?.closest('button')) {
        return;
      }
      e.preventDefault();
    };
    
    // 스크롤 이벤트도 방지
    const preventScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target?.tagName !== 'CANVAS') {
        e.preventDefault();
      }
    };
    
    document.addEventListener('touchmove', preventTouchMove, { passive: false });
    document.addEventListener('scroll', preventScroll, { passive: false });
    window.addEventListener('scroll', preventScroll, { passive: false });
    
    return () => {
      // 컴포넌트 언마운트 시 복원
      document.documentElement.classList.remove('game-active');
      document.body.classList.remove('game-active');
      document.removeEventListener('touchmove', preventTouchMove);
      document.removeEventListener('scroll', preventScroll);
      window.removeEventListener('scroll', preventScroll);
    };
  }, []);

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [gameResults, setGameResults] = useState<any[]>([]);
  const [showProblemScreen, setShowProblemScreen] = useState(true); // 문제 제시 화면 표시 여부
  const [isPlaying, setIsPlaying] = useState(false); // 캔버스 화면 시작 여부
  const [canvasImageData, setCanvasImageData] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  
  // submitting 변경 시 ref 업데이트
  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);
  const [aiGuess, setAiGuess] = useState<string>(''); // 실시간 AI 추측
  const [aiGuessHistory, setAiGuessHistory] = useState<string[]>([]); // AI 추측 히스토리
  const [isAnalyzing, setIsAnalyzing] = useState(false); // AI 분석 중
  const [showResult, setShowResult] = useState<{ isCorrect: boolean; aiGuess: string } | null>(null); // 정답/오답 표시
  
  // showResult 변경 시 ref 업데이트
  useEffect(() => {
    showResultRef.current = showResult;
  }, [showResult]);
  const [isErasing, setIsErasing] = useState(false); // 지우개 모드
  const [lastAnalysisResult, setLastAnalysisResult] = useState<{ aiGuess: string; isCorrect: boolean } | null>(null); // 마지막 AI 분석 결과
  const isTransitioningRef = useRef(false); // 문제 전환 중인지 추적 (showResult를 null로 설정한 후 currentWordIndex 변경 전까지)
  const showResultRef = useRef<{ isCorrect: boolean; aiGuess: string } | null>(null); // showResult의 최신 값 추적
  const submittingRef = useRef(false); // submitting의 최신 값 추적
  const currentWordIndexRef = useRef(0); // currentWordIndex의 최신 값 추적
  const gameResultsLengthRef = useRef(0); // gameResults.length의 최신 값 추적
  const lastInitializedIndexRef = useRef(-1); // 마지막으로 초기화된 문제 인덱스
  
  // currentWordIndex 변경 시 ref 업데이트
  useEffect(() => {
    currentWordIndexRef.current = currentWordIndex;
  }, [currentWordIndex]);
  
  // gameResults.length 변경 시 ref 업데이트
  useEffect(() => {
    gameResultsLengthRef.current = gameResults.length;
  }, [gameResults.length]);

  // topic.words가 비어있거나 currentWordIndex가 범위를 벗어났는지 확인
  const wordsLength = topic?.words?.length || 0;
  const isValidIndex = currentWordIndex >= 0 && currentWordIndex < wordsLength;
  const currentWord = isValidIndex ? topic.words?.[currentWordIndex] : null;
  const isLastWord = currentWordIndex === wordsLength - 1 && wordsLength > 0;
  

  // 첫 문제 초기화 (게임 시작 시에만 실행)
  useEffect(() => {
    if (currentWordIndex === 0 && gameResults.length === 0 && !isTransitioningRef.current) {
      lastInitializedIndexRef.current = 0;
      setShowProblemScreen(true);
      setCanvasImageData('');
      setAiGuess('');
      setAiGuessHistory([]);
      setShowResult(null);
      setIsPlaying(false);
      setIsAnalyzing(false);
      setSubmitting(false);
      setLastAnalysisResult(null);
    }
  }, [topic?.id]);
  
  // 다음 문제 초기화 함수 (handleSubmit에서 호출)
  const initializeNextProblem = useCallback((nextIndex: number) => {
    lastInitializedIndexRef.current = nextIndex;
    setCurrentWordIndex(nextIndex);
    setShowProblemScreen(true);
    setCanvasImageData('');
    setAiGuess('');
    setAiGuessHistory([]);
    setShowResult(null);
    setIsPlaying(false);
    setIsAnalyzing(false);
    setSubmitting(false);
    setLastAnalysisResult(null);
    
    // 초기화 완료 후 전환 플래그 해제
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 100);
  }, []);

  // gameResults가 업데이트될 때마다 결과 페이지 전환 체크
  useEffect(() => {
    // 결과 페이지 전환 체크 (로그 제거)
  }, [gameResults, topic?.words?.length]);

  // 문제 제시 화면에서 "알겠어요!" 클릭 시 캔버스 화면으로 이동
  const handleStartDrawing = useCallback(() => {
    setShowProblemScreen(false);
    setIsPlaying(true);
    // 타이머 시작을 위해 초기화
    setCanvasImageData('');
    setAiGuess('');
    setShowResult(null);
    setSubmitting(false);
  }, []);

  const handleSubmit = useCallback(async (autoSubmit = false, preAnalyzedResult?: { aiGuess: string; isCorrect: boolean }) => {
    const submittedWordIndex = currentWordIndex;
    const totalWords = topic.words.length;
    
    if (submitting) return;
    if (isTransitioningRef.current) return;
    if (!currentWord || !currentWord.word) return;
    
    const isTimeUp = autoSubmit && !preAnalyzedResult;
    const isCorrectAnswer = preAnalyzedResult?.isCorrect === true;
    const isIncorrectAnswer = preAnalyzedResult !== undefined && preAnalyzedResult.isCorrect === false;
    const lastResultIsIncorrect = lastAnalysisResult !== null && lastAnalysisResult.isCorrect === false;
    
    if ((isIncorrectAnswer || lastResultIsIncorrect) && !isTimeUp) return;
    if (!isTimeUp && !isCorrectAnswer && !autoSubmit) return;
    
    // 정답일 때는 즉시 메시지 표시 (API 호출 전에)
    if (isCorrectAnswer && preAnalyzedResult) {
      isTransitioningRef.current = true;
      setShowResult({ isCorrect: true, aiGuess: preAnalyzedResult.aiGuess });
      setTimeout(() => {
        setIsPlaying(false);
      }, 200);
    }
    
    // 시간 초과일 때 즉시 오답 메시지 표시 (API 호출 전에)
    if (isTimeUp) {
      const currentAiGuess = aiGuess || lastAnalysisResult?.aiGuess || '시간 초과';
      isTransitioningRef.current = true;
      setShowResult({ isCorrect: false, aiGuess: currentAiGuess });
      setIsPlaying(false);
    }
    
    setSubmitting(true);

    // 빈 그림인 경우 기본 흰색 이미지 생성
    let imageDataToSubmit = canvasImageData;
    if (!imageDataToSubmit) {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 800, 600);
        imageDataToSubmit = canvas.toDataURL('image/png');
      }
    }

    try {
      let result;
      
      // 시간 초과 시에도 이미 알고 있는 aiGuess를 서버에 전달 (AI 분석 건너뛰기)
      const timeUpAiGuess = aiGuess || lastAnalysisResult?.aiGuess || '시간 초과';
      
      if (preAnalyzedResult || isTimeUp) {
        const submitAiGuess = preAnalyzedResult?.aiGuess || timeUpAiGuess;
        const submitIsCorrect = preAnalyzedResult?.isCorrect ?? false;
        
        const response = await fetch(`/api/access-codes/${accessCode}/games`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topicId: topic.id,
            wordId: currentWord.id,
            imageData: imageDataToSubmit,
            aiGuess: submitAiGuess,
            isCorrect: submitIsCorrect,
          }),
        });

        if (!response.ok) {
          throw new Error('제출에 실패했습니다.');
        }

        result = await response.json();
        // 전달한 정보를 result에 추가
        if (result.drawing) {
          result.drawing.aiGuess = submitAiGuess;
          result.drawing.isCorrect = submitIsCorrect;
        }
      } else {
        // 분석이 안 된 경우 API 호출 (서버에서 분석)
        const response = await fetch(`/api/access-codes/${accessCode}/games`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topicId: topic.id,
            wordId: currentWord.id,
            imageData: imageDataToSubmit,
          }),
        });

        if (!response.ok) {
          throw new Error('제출에 실패했습니다.');
        }

        result = await response.json();
      }

      // 정답/오답 표시 (시간 초과 시에도 표시)
      // 시간 초과 시에는 항상 오답으로 표시
      // preAnalyzedResult가 있으면 그 값을 우선 사용
      let isCorrect: boolean;
      if (isTimeUp) {
        isCorrect = false; // 시간 초과는 항상 오답
      } else if (preAnalyzedResult !== undefined) {
        isCorrect = preAnalyzedResult.isCorrect; // preAnalyzedResult의 값을 사용
      } else {
        isCorrect = result.drawing?.isCorrect || false; // 서버 응답의 값을 사용
      }
      
      // aiGuess 우선순위: result.drawing.aiGuess > preAnalyzedResult.aiGuess > aiGuess 상태
      let finalAiGuess: string;
      if (result.drawing?.aiGuess) {
        finalAiGuess = result.drawing.aiGuess;
      } else if (preAnalyzedResult?.aiGuess) {
        finalAiGuess = preAnalyzedResult.aiGuess;
      } else {
        finalAiGuess = aiGuess || '알 수 없음';
      }
      
      // result.drawing에 최종 값 저장
      if (result.drawing) {
        result.drawing.aiGuess = finalAiGuess;
        result.drawing.isCorrect = isCorrect;
      }
      
      // 중요: 결과 메시지 표시 전에 isTransitioningRef를 true로 설정
      // 이렇게 하면 useEffect가 문제 초기화를 건너뜀
      isTransitioningRef.current = true;
      
      // 결과 메시지 표시 (정답일 때는 AI 말풍선이 표시되도록 isPlaying을 유지)
      setShowResult({ isCorrect, aiGuess: finalAiGuess });
      
      // 정답 메시지가 표시된 후에 isPlaying을 false로 설정 (AI 말풍선 숨김)
      // 정답일 때는 메시지가 표시될 때까지 AI 말풍선을 유지
      if (isCorrect && !isTimeUp) {
        // 정답일 때는 메시지가 표시된 후에 AI 말풍선 숨김 (약간의 지연)
        setTimeout(() => {
          setIsPlaying(false);
        }, 200);
      } else {
        // 오답/시간 초과일 때는 즉시 AI 말풍선 숨김
        setIsPlaying(false);
      }
      
      // gameResults 업데이트 (최종 값 포함)
      const updatedResults = [...gameResults, result];
      setGameResults(updatedResults);
      
      // 정답/오답 모두 1초 후 다음 문제로 이동 (메시지가 충분히 표시되도록)
      const delayBeforeNext = 1000;
      
      const nextIndex = submittedWordIndex + 1;
      
      setTimeout(() => {
        if (nextIndex >= totalWords) {
          setShowResult(null);
          setSubmitting(false);
          setTimeout(() => {
            isTransitioningRef.current = false;
          }, 200);
        } else {
          initializeNextProblem(nextIndex);
        }
      }, delayBeforeNext);
    } catch (error) {
      // 제출 실패 시에도 preAnalyzedResult의 정답/오답 정보 사용
      let finalIsCorrect: boolean;
      let finalAiGuess: string;
      
      if (preAnalyzedResult !== undefined) {
        finalIsCorrect = preAnalyzedResult.isCorrect;
        finalAiGuess = preAnalyzedResult.aiGuess;
      } else if (lastAnalysisResult !== null) {
        finalIsCorrect = lastAnalysisResult.isCorrect;
        finalAiGuess = lastAnalysisResult.aiGuess;
      } else {
        finalIsCorrect = false;
        finalAiGuess = aiGuess || '알 수 없음';
      }
      
      // 시간 초과 시에도 오답 문구 표시
      if (isTimeUp) {
        setIsPlaying(false);
        setShowResult({ isCorrect: false, aiGuess: finalAiGuess });
        
        // 빈 결과를 gameResults에 추가 (시간 초과)
        const timeUpResult = {
          id: `timeup-${Date.now()}`,
          topicId: topic.id,
          wordId: currentWord.id,
          createdAt: new Date().toISOString(),
          drawing: {
            id: `timeup-drawing-${Date.now()}`,
            gameId: `timeup-${Date.now()}`,
            imageData: canvasImageData || '',
            aiGuess: finalAiGuess,
            isCorrect: false,
            createdAt: new Date().toISOString(),
          },
          word: {
            id: currentWord.id,
            topicId: topic.id,
            word: currentWord.word,
            order: currentWordIndex + 1,
            createdAt: new Date().toISOString(),
          },
        };
        
        // 중요: gameResults 업데이트 전에 isTransitioningRef를 true로 설정
        isTransitioningRef.current = true;
        
        // gameResults 업데이트
        const updatedResults = [...gameResults, timeUpResult];
        setGameResults(updatedResults);
        
        const nextIndex = submittedWordIndex + 1;
        
        setTimeout(() => {
          if (nextIndex >= totalWords) {
            setShowResult(null);
            setSubmitting(false);
            setTimeout(() => {
              isTransitioningRef.current = false;
            }, 200);
          } else {
            initializeNextProblem(nextIndex);
          }
        }, 1000);
      } else {
        // 제출 실패 시에도 정답/오답을 올바르게 표시
        // 정답이면 메시지를 표시하고 2초 후 다음 문제로 이동
        // 오답이면 메시지를 표시하지 않고 타이머가 끝날 때까지 대기 (이미 handleSubmit에서 체크됨)
        
        // Mock 결과 생성 (gameResults 업데이트는 메시지 표시 후에)
        const mockResult = {
          id: `mock-${Date.now()}`,
          topicId: topic.id,
          wordId: currentWord.id,
          createdAt: new Date().toISOString(),
          drawing: {
            id: `mock-drawing-${Date.now()}`,
            gameId: `mock-${Date.now()}`,
            imageData: canvasImageData || '',
            aiGuess: finalAiGuess,
            isCorrect: finalIsCorrect,
            createdAt: new Date().toISOString(),
          },
          word: {
            id: currentWord.id,
            topicId: topic.id,
            word: currentWord.word,
            order: currentWordIndex + 1,
            createdAt: new Date().toISOString(),
          },
        };
        
        // 정답인 경우에만 메시지 표시
        if (finalIsCorrect) {
          setIsPlaying(false);
          setShowResult({ isCorrect: finalIsCorrect, aiGuess: finalAiGuess });
          isTransitioningRef.current = true;
          
          const updatedResults = [...gameResults, mockResult];
          setGameResults(updatedResults);
          
          const nextIndex = submittedWordIndex + 1;
          
          setTimeout(() => {
            if (nextIndex >= totalWords) {
              setShowResult(null);
              setSubmitting(false);
              setTimeout(() => {
                isTransitioningRef.current = false;
              }, 200);
            } else {
              initializeNextProblem(nextIndex);
            }
          }, 1000);
        } else {
          isTransitioningRef.current = true;
          const updatedResults = [...gameResults, mockResult];
          setGameResults(updatedResults);
          setTimeout(() => {
            isTransitioningRef.current = false;
          }, 100);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }, [canvasImageData, currentWord, topic.id, isLastWord, aiGuess, gameResults, submitting, showResult, currentWordIndex, lastAnalysisResult, initializeNextProblem]);

  const handleTimeUp = useCallback(async () => {
    if (isPlaying && !submitting && !showResult && !isTransitioningRef.current) {
      setIsPlaying(false);
      await handleSubmit(true);
    }
  }, [isPlaying, submitting, showResult, handleSubmit]);

  // 실시간 AI 분석 (throttle - 그림을 그리는 동안에도 주기적으로 분석)
  useEffect(() => {
    if (!isPlaying || submitting || showResult) {
      // 제출 중이거나 결과 표시 중이면 분석하지 않음
      return;
    }

    // currentWord가 없으면 분석하지 않음
    if (!currentWord || !currentWord.word) {
      return;
    }

    // 그림 데이터가 없거나 너무 작으면 분석하지 않음
    if (!canvasImageData) {
      return;
    }

    const base64Data = canvasImageData.includes(',') ? canvasImageData.split(',')[1] : canvasImageData;
    // 최소 크기 체크 완화 (빈 캔버스는 대략 500바이트 정도, 그림이 있으면 더 큼)
    if (!base64Data || base64Data.length < 300) {
      return;
    }

    // throttle: 마지막 분석 후 일정 시간이 지나면 분석 실행
    const timeoutId = setTimeout(async () => {
      // 다시 한번 상태 확인 (타이머 동안 상태가 변경되었을 수 있음)
      if (!isPlaying || submitting || showResult) {
        return;
      }

      // 현재 canvasImageData를 다시 확인 (최신 데이터 사용)
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      let currentBase64Data: string;
      
      if (canvas) {
        // 캔버스에서 직접 최신 이미지 데이터 가져오기
        const latestImageData = canvas.toDataURL('image/png');
        currentBase64Data = latestImageData.includes(',') 
          ? latestImageData.split(',')[1] 
          : latestImageData;
      } else {
        currentBase64Data = canvasImageData.includes(',')
          ? canvasImageData.split(',')[1]
          : canvasImageData;
      }

      if (!currentBase64Data || currentBase64Data.length < 300) {
        return;
      }

      setIsAnalyzing(true);
      try {
        const response = await fetch('/api/analyze-drawing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData: currentBase64Data,
            correctAnswer: currentWord.word,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          // 항상 AI 추측을 표시 (정답이든 오답이든)
          if (result.aiGuess) {
            const newGuess = result.aiGuess;
            setAiGuess(newGuess);
            
            // 히스토리에 추가 (중복 제거, 최대 5개까지)
            setAiGuessHistory((prev) => {
              const filtered = prev.filter((g) => g !== newGuess);
              const updated = [...filtered, newGuess];
              return updated.slice(-5); // 최근 5개만 유지
            });
          }
          
          // 마지막 분석 결과 저장 (오답 체크용)
          setLastAnalysisResult(result);
          
          // 정답이면 자동으로 제출
          if (result.isCorrect && isPlaying && !submitting && !showResult) {
            await handleSubmit(true, result);
          }
        }
      } catch (error) {
        // 에러 발생 시에도 이전 추측 유지
      } finally {
        setIsAnalyzing(false);
      }
    }, 500); // 0.5초 throttle (그림을 그리는 동안에도 주기적으로 분석)

    return () => clearTimeout(timeoutId);
  }, [canvasImageData, currentWord?.word, isPlaying, submitting, showResult, handleSubmit]);

  // currentWord가 없으면 렌더링하지 않음 (모든 hooks 이후에 체크)
  if (!currentWord) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">문제를 불러오는 중 오류가 발생했습니다.</p>
          <p className="text-sm text-gray-500 mb-4">
            {wordsLength === 0 
              ? '이 주제에는 문제가 없습니다.' 
              : `현재 인덱스: ${currentWordIndex}, 문제 개수: ${wordsLength}`}
          </p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            주제 선택으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 모든 문제 완료 시 결과 화면 표시
  const totalWordsCount = topic?.words?.length || 0;
  const resultsCount = gameResults.length;
  const shouldShowResult = resultsCount >= totalWordsCount && totalWordsCount > 0;
  
  if (shouldShowResult) {
    return (
      <ResultPage
        topic={topic}
        results={gameResults}
        onBack={onBack}
      />
    );
  }

  // 문제 제시 화면 (오렌지 배경 스타일)
  if (showProblemScreen) {
    return (
      <div className="min-h-screen bg-orange-500 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* 장식 요소 - 페인트 캔 */}
        <div className="absolute top-20 right-20 opacity-30">
          <svg width="80" height="100" viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 20 L60 20 L65 30 L65 80 L15 80 L15 30 Z" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M25 20 L55 20 L55 25 L25 25 Z" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M30 30 L50 30 L50 35 L30 35 Z" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M35 40 L45 40 L45 45 L35 45 Z" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M30 50 L50 50 L50 55 L30 55 Z" stroke="white" strokeWidth="2" fill="none"/>
            {/* 오렌지 페인트 드립 */}
            <path d="M35 20 L35 15 L40 15 L40 20" stroke="orange" strokeWidth="3" fill="orange"/>
            <path d="M40 20 L40 10 L45 10 L45 20" stroke="orange" strokeWidth="3" fill="orange"/>
          </svg>
        </div>
        <div className="absolute bottom-20 left-20 opacity-30">
          <svg width="80" height="100" viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 20 L60 20 L65 30 L65 80 L15 80 L15 30 Z" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M25 20 L55 20 L55 25 L25 25 Z" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M30 30 L50 30 L50 35 L30 35 Z" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M35 40 L45 40 L45 45 L35 45 Z" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M30 50 L50 50 L50 55 L30 55 Z" stroke="white" strokeWidth="2" fill="none"/>
            {/* 오렌지 페인트 드립 */}
            <path d="M35 20 L35 15 L40 15 L40 20" stroke="orange" strokeWidth="3" fill="orange"/>
            <path d="M40 20 L40 10 L45 10 L45 20" stroke="orange" strokeWidth="3" fill="orange"/>
          </svg>
        </div>

        {/* 장식 요소 - 페인트 브러시 */}
        <div className="absolute top-32 right-32 opacity-30">
          <svg width="60" height="80" viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="25" y="10" width="10" height="50" stroke="white" strokeWidth="2" fill="none"/>
            <rect x="20" y="60" width="20" height="15" stroke="white" strokeWidth="2" fill="none"/>
            {/* 오렌지 페인트 */}
            <rect x="22" y="62" width="16" height="11" fill="orange" opacity="0.8"/>
          </svg>
        </div>
        <div className="absolute bottom-32 right-20 opacity-30">
          <svg width="60" height="80" viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="25" y="10" width="10" height="50" stroke="white" strokeWidth="2" fill="none"/>
            <rect x="20" y="60" width="20" height="15" stroke="white" strokeWidth="2" fill="none"/>
            {/* 오렌지 페인트 */}
            <rect x="22" y="62" width="16" height="11" fill="orange" opacity="0.8"/>
          </svg>
        </div>

        {/* 장식 요소 - 페인트 스플래터 */}
        <div className="absolute top-16 left-16 w-8 h-8 bg-orange-400 rounded-full opacity-40"></div>
        <div className="absolute top-24 left-32 w-6 h-6 bg-orange-400 rounded-full opacity-40"></div>
        <div className="absolute bottom-24 right-16 w-7 h-7 bg-orange-400 rounded-full opacity-40"></div>
        <div className="absolute bottom-16 right-32 w-5 h-5 bg-orange-400 rounded-full opacity-40"></div>

        {/* 반짝이는 아이콘 */}
        <div className="absolute bottom-8 right-8 opacity-50">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2 L13.5 8.5 L20 10 L13.5 11.5 L12 18 L10.5 11.5 L4 10 L10.5 8.5 Z"/>
          </svg>
        </div>

        <div className="text-center space-y-8 z-10">
          {/* 진행 상황 */}
          <p className="text-2xl font-bold text-orange-200">
            그림 {currentWordIndex + 1} / {topic.words.length}
          </p>

          {/* 문제 제시 */}
          <div className="space-y-4">
            <p className="text-xl text-orange-200">다음을 그리세요</p>
            <p className="text-7xl font-bold text-white">{currentWord.word}</p>
            <p className="text-lg text-orange-200">20초 이내</p>
          </div>

          {/* 알겠어요 버튼 */}
          <button
            onClick={handleStartDrawing}
            className="px-16 py-3 bg-orange-600 text-white text-xl font-semibold rounded-lg shadow-lg hover:bg-orange-700 transition-all transform hover:scale-105 relative"
            style={{
              background: 'linear-gradient(to right, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.2))',
              backdropFilter: 'blur(10px)',
            }}
          >
            알겠어요!
          </button>
        </div>
      </div>
    );
  }

  // 캔버스 화면 (첫 번째 이미지 스타일)
  return (
    <div 
      className="h-screen bg-white overflow-hidden fixed inset-0"
      style={{ touchAction: 'none' }}
    >
      {/* 노란색 상단 바 */}
      <div className="bg-yellow-400 w-full px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md" style={{ touchAction: 'auto' }}>
        {/* 왼쪽: 문제 텍스트 */}
        <div className="flex-1 w-full sm:w-auto text-center sm:text-left">
          <p className="text-lg sm:text-xl font-semibold text-gray-900">
            {currentWord.word} 그리기
          </p>
        </div>

        {/* 중앙: 타이머 */}
        <div className="flex-1 flex justify-center">
          {!showProblemScreen && !showResult && (
            <Timer
              key={`timer-${currentWordIndex}`}
              initialSeconds={20}
              onTimeUp={handleTimeUp}
              isRunning={isPlaying && !submitting && !showResult}
            />
          )}
        </div>

        {/* 오른쪽: 도구 버튼들 */}
        <div className="flex-1 w-full sm:w-auto flex justify-center sm:justify-end gap-2">
          {/* 그리기/지우개 토글 버튼 */}
          <button
            onClick={() => setIsErasing(!isErasing)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              !isErasing 
                ? 'bg-gray-300' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
            title={isErasing ? "그리기" : "지우개"}
          >
            {isErasing ? (
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            )}
          </button>
          {/* 리셋 버튼 */}
          <button
            onClick={() => {
              const canvas = document.querySelector('canvas') as HTMLCanvasElement;
              if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.fillStyle = 'white';
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  setCanvasImageData(canvas.toDataURL('image/png'));
                }
              }
            }}
            className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors"
            title="리셋"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          {/* 다음 버튼 - 오답일 때는 작동하지 않음 (타이머가 끝날 때까지 대기) */}
          <button
            onClick={() => {
              if (isPlaying && !submitting && !showResult) {
                if (lastAnalysisResult && !lastAnalysisResult.isCorrect) {
                  return;
                }
                handleSubmit(false);
              }
            }}
            disabled={Boolean(submitting || showResult || (lastAnalysisResult !== null && lastAnalysisResult.isCorrect === false))}
            className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors"
            title="다음"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
          {/* 닫기 버튼 */}
          <button
            onClick={onBack}
            className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors"
            title="닫기"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 캔버스 영역 - 흰색 배경 전체 */}
      <div 
        className="relative w-full h-[calc(100vh-80px)] bg-white overflow-hidden"
        style={{ touchAction: 'none' }}
      >
        {/* 정답/오답 표시 - currentWord가 있을 때만 표시 */}
        {showResult && currentWord && (
          <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-10 p-4 sm:p-6 rounded-lg text-center w-full max-w-2xl animate-scale-in pointer-events-none ${
            showResult.isCorrect 
              ? 'bg-green-100 border-2 border-green-500' 
              : 'bg-red-100 border-2 border-red-500'
          }`}>
            <p className="text-xl sm:text-2xl font-bold mb-2">
              {showResult.isCorrect ? '✅ 정답!' : '❌ 오답'}
            </p>
            <p className="text-base sm:text-lg text-gray-700">
              AI 추측: {showResult.aiGuess}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              다음 문제로 이동합니다...
            </p>
          </div>
        )}

        {/* 캔버스 - 화면 전체 */}
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          <div className="w-full h-full pointer-events-auto">
            <DrawingCanvas
              width={typeof window !== 'undefined' ? window.innerWidth : 1920}
              height={typeof window !== 'undefined' ? window.innerHeight - 80 : 1080}
              onDrawingChange={setCanvasImageData}
              isErasing={isErasing}
              onErasingChange={setIsErasing}
            />
          </div>

          {/* AI 말풍선 (하단 중앙) - 작은 회색 말풍선 */}
          {/* showResult가 설정되기 전까지는 말풍선을 표시 (정답 메시지가 표시되면 사라짐) */}
          {/* 정답일 때는 showResult가 설정되어도 AI 말풍선을 유지 (정답 메시지와 함께 표시) */}
          {isPlaying && !submitting && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-200 rounded-lg shadow-sm p-3 min-w-[120px] max-w-[300px] pointer-events-none">
              <div className="flex flex-col items-center justify-center gap-1">
                {aiGuessHistory.length === 0 ? (
                  // 첫 추측 전: "..."
                  <span className="text-gray-600 text-lg font-semibold">...</span>
                ) : aiGuessHistory.length === 1 ? (
                  // 첫 추측: "AI는 000으로 보고 있어요"
                  <p className="text-gray-700 text-sm font-medium text-center">
                    AI는 <span className="font-bold">{aiGuessHistory[0]}</span>으로 보고 있어요
                  </p>
                ) : (
                  // 여러 추측: "000(연하게), 000(현재 그림 진하게)"
                  <p className="text-gray-700 text-sm font-medium text-center">
                    {aiGuessHistory.slice(0, -1).map((guess, index) => (
                      <span key={index} className="text-gray-400">
                        {guess}
                        {index < aiGuessHistory.length - 2 && ', '}
                      </span>
                    ))}
                    {aiGuessHistory.length > 1 && ', '}
                    <span className="font-bold text-gray-800">{aiGuessHistory[aiGuessHistory.length - 1]}</span>
                  </p>
                )}
              </div>
              {/* 말풍선 꼬리 */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gray-200 rotate-45"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 결과 화면
function ResultPage({
  topic,
  results,
  onBack,
}: {
  topic: TopicWithWords;
  results: any[];
  onBack: () => void;
}) {
  const [otherDrawingsMap, setOtherDrawingsMap] = useState<{ [wordId: string]: any[] }>({});
  const [loadingDrawings, setLoadingDrawings] = useState(false);

  useEffect(() => {
    // 모든 문제에 대한 다른 플레이어 그림 불러오기
    const fetchAllDrawings = async () => {
      setLoadingDrawings(true);
      const drawingsMap: { [wordId: string]: any[] } = {};
      
      try {
        await Promise.all(
          results.map(async (result) => {
            try {
              const response = await fetch(`/api/drawings/${result.wordId}`);
              const data = await response.json();
              drawingsMap[result.wordId] = data || [];
            } catch {
              drawingsMap[result.wordId] = [];
            }
          })
        );
        setOtherDrawingsMap(drawingsMap);
      } catch {
        // 오류 무시
      } finally {
        setLoadingDrawings(false);
      }
    };

    fetchAllDrawings();
  }, [results]);

  const correctCount = results.filter(
    (r) => r.drawing?.isCorrect === true
  ).length;
  const totalCount = results.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-gray-800">
            게임 결과
          </h1>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-semibold text-gray-700">
              정답률: {correctCount} / {totalCount}
            </p>
            <p className="text-base sm:text-lg text-gray-600 mt-2">
              ({Math.round((correctCount / totalCount) * 100)}%)
            </p>
          </div>
        </div>

        {/* 그리드 형태 결과 표시 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {results.map((result, index) => {
            if (!result.wordId) return null;
            
            const word = topic.words.find((w) => w.id === result.wordId);
            if (!word) return null;
            
            const otherDrawings = otherDrawingsMap[result.wordId] || [];
            const filteredOtherDrawings = otherDrawings.filter(
              (d) => d.id !== result.drawing?.id
            );

            return (
              <div key={result.id} className="bg-white rounded-lg shadow-lg p-4 sm:p-6 flex flex-col">
                {/* 문제 제목 */}
                <h2 className="text-lg sm:text-xl font-bold mb-3 text-gray-800 text-center">
                  문제 {index + 1}. &quot;{word?.word}&quot;
                </h2>

                {/* 내 그림 */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2 text-gray-700 text-center">내 그림</h3>
                  <div className="flex flex-col items-center">
                    <img
                      src={result.drawing?.imageData}
                      alt="내 그림"
                      className="border-2 border-blue-500 rounded-lg w-full h-auto object-contain mb-2"
                      style={{ maxHeight: '180px' }}
                    />
                    <p className="text-xs sm:text-sm font-semibold text-gray-800 text-center">
                      AI 추측: {result.drawing?.aiGuess || '없음'}
                    </p>
                    <p className={`text-xs sm:text-sm font-bold ${result.drawing?.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {result.drawing?.isCorrect ? '✅ 정답' : '❌ 오답'}
                    </p>
                  </div>
                </div>

                {/* 다른 플레이어들의 그림 */}
                <div className="mt-auto">
                  <h3 className="text-sm font-semibold mb-2 text-gray-700 text-center">
                    다른 플레이어 ({filteredOtherDrawings.length}개)
                  </h3>
                  {loadingDrawings ? (
                    <div className="text-center py-2 text-gray-500 text-xs">
                      로딩 중...
                    </div>
                  ) : filteredOtherDrawings.length === 0 ? (
                    <div className="text-center py-2 text-gray-500 text-xs">
                      아직 다른 플레이어의 그림이 없습니다.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {filteredOtherDrawings.slice(0, 4).map((drawing) => (
                        <div
                          key={drawing.id}
                          className="border rounded-lg p-1 bg-gray-50 flex flex-col items-center text-center"
                        >
                          <img
                            src={drawing.imageData}
                            alt="다른 플레이어 그림"
                            className="w-full h-16 sm:h-20 object-contain rounded mb-1"
                          />
                          <p className="text-xs text-gray-600 truncate w-full">
                            {drawing.aiGuess || '없음'}
                          </p>
                          <p className={`text-xs font-bold ${drawing.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            {drawing.isCorrect ? '✅' : '❌'}
                          </p>
                        </div>
                      ))}
                      {filteredOtherDrawings.length > 4 && (
                        <div className="border rounded-lg p-1 bg-gray-50 flex items-center justify-center text-xs text-gray-500">
                          +{filteredOtherDrawings.length - 4}개
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 하단 버튼 */}
        <div className="text-center mt-6 sm:mt-8">
          <button
            onClick={onBack}
            className="px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 text-white rounded-lg text-base sm:text-lg font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            다른 주제 선택
          </button>
        </div>
      </div>
    </div>
  );
}

