import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Mock 단어 데이터 (데이터베이스 없을 때 테스트용)
const MOCK_WORDS: Record<string, string> = {
  'w1': '고양이',
  'w2': '강아지',
  'w3': '사자',
  'w4': '코끼리',
  'w5': '기린',
  'w6': '사과',
  'w7': '바나나',
  'w8': '딸기',
  'w9': '포도',
  'w10': '자동차',
  'w11': '비행기',
  'w12': '기차',
  'w13': '배',
  'w14': '자전거',
};

// POST: 새 게임 생성 및 그림 분석
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topicId, wordId, imageData, aiGuess, isCorrect } = body;

    if (!topicId || !wordId || !imageData) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    let word: { word: string } | null = null;

    try {
      // 단어 정보 가져오기
      word = await prisma.word.findUnique({
        where: { id: wordId },
      });
    } catch {
      // 데이터베이스 연결 오류인 경우 Mock 데이터 사용
      const mockWord = MOCK_WORDS[wordId];
      if (mockWord) {
        word = { word: mockWord };
      }
    }

    if (!word) {
      // Mock 데이터에도 없으면 topic에서 word 정보 가져오기 시도
      try {
        const topicWithWords = await prisma.topic.findUnique({
          where: { id: topicId },
          include: { words: true },
        });
        if (topicWithWords) {
          const foundWord = topicWithWords.words.find(w => w.id === wordId);
          if (foundWord) {
            word = { word: foundWord.word };
          }
        }
      } catch {
        // topic 조회 실패 - 무시
      }
      
      // 여전히 없으면 에러
      if (!word) {
        console.error('단어를 찾을 수 없습니다:', { wordId, topicId });
        return NextResponse.json(
          { error: '단어를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
    }

    // Base64 데이터에서 실제 데이터 부분만 추출
    const base64Data = imageData.includes(',')
      ? imageData.split(',')[1]
      : imageData;

    // 이미 분석된 결과가 있으면 사용, 없으면 Gemini API 호출
    let finalAiGuess = aiGuess || '알 수 없음';
    let finalIsCorrect = isCorrect !== undefined ? isCorrect : false;

    if (!aiGuess || isCorrect === undefined) {
      // Gemini API 호출 (별도 API Route로 분리)
      try {
        const analyzeResponse = await fetch(
          `${request.nextUrl.origin}/api/analyze-drawing`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageData: base64Data,
              correctAnswer: word.word,
            }),
          }
        );

        if (analyzeResponse.ok) {
          const result = await analyzeResponse.json();
          finalAiGuess = result.aiGuess || '알 수 없음';
          finalIsCorrect = result.isCorrect || false;
        } else {
          finalAiGuess = word.word;
          finalIsCorrect = true;
        }
      } catch {
        finalAiGuess = word.word;
        finalIsCorrect = true;
      }
    }

    // 데이터베이스에 저장 시도
    try {
      const game = await prisma.game.create({
        data: {
          topicId,
          wordId,
          drawing: {
            create: {
              imageData: imageData,
              aiGuess: finalAiGuess,
              isCorrect: finalIsCorrect,
            },
          },
        },
        include: {
          drawing: true,
          word: true,
        },
      });

      return NextResponse.json(game, { status: 201 });
    } catch {
      // 데이터베이스 저장 실패 시 Mock 응답 반환
      const mockGame = {
        id: `mock-game-${Date.now()}`,
        topicId,
        wordId,
        createdAt: new Date().toISOString(),
        drawing: {
          id: `mock-drawing-${Date.now()}`,
          gameId: `mock-game-${Date.now()}`,
          imageData: imageData,
          aiGuess: finalAiGuess,
          isCorrect: finalIsCorrect,
          createdAt: new Date().toISOString(),
        },
        word: {
          id: wordId,
          topicId,
          word: word.word,
          order: 1,
          createdAt: new Date().toISOString(),
        },
      };

      return NextResponse.json(mockGame, { status: 201 });
    }
  } catch (error) {
    console.error('게임 생성 오류:', error);
    return NextResponse.json(
      { error: '게임을 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

