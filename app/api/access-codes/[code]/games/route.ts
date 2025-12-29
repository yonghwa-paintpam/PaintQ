import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { analyzeDrawing } from '@/lib/gemini';

// POST: 새 게임 생성 및 그림 분석
export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    const body = await request.json();
    const { topicId, wordId, imageData, aiGuess, isCorrect } = body;

    if (!topicId || !wordId || !imageData) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 접속 코드 확인
    let accessCode = await prisma.accessCode.findUnique({
      where: { code },
    });

    // 접속 코드가 없고, 코드가 "0000"이면 기본 접속 코드 생성
    if (!accessCode && code === '0000') {
      try {
        accessCode = await prisma.accessCode.create({
          data: {
            code: '0000',
            isActive: true,
          },
        });
      } catch (createError: any) {
        // 이미 존재하는 경우 다시 조회
        if (createError.code === 'P2002') {
          accessCode = await prisma.accessCode.findUnique({
            where: { code: '0000' },
          });
        } else {
          console.error('기본 접속 코드 생성 오류:', createError);
          return NextResponse.json(
            { error: '접속 코드를 생성할 수 없습니다.' },
            { status: 500 }
          );
        }
      }
    }

    if (!accessCode) {
      return NextResponse.json(
        { error: '접속 코드를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (!accessCode.isActive) {
      return NextResponse.json(
        { error: '비활성화된 접속 코드입니다.' },
        { status: 403 }
      );
    }

    // 주제 확인 (접속 코드 일치 확인)
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      return NextResponse.json(
        { error: '주제를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (topic.accessCodeId !== accessCode.id) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    let word: { word: string } | null = null;

    try {
      // 단어 정보 가져오기
      word = await prisma.word.findUnique({
        where: { id: wordId },
      });
    } catch (dbError: any) {
      // 데이터베이스 연결 실패 시 에러 반환
      console.error('단어 조회 오류:', dbError);
      throw dbError;
    }

    if (!word) {
      // Mock 데이터에도 없으면 에러
      return NextResponse.json(
        { error: '단어를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // AI 분석 (이미 분석된 결과가 있으면 사용, 없으면 새로 분석)
    // 저장 시에는 항상 impressionScore를 포함한 분석 수행
    let finalAiGuess: string;
    let finalIsCorrect: boolean;
    let finalImpressionScore: number | undefined;

    const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;

    if (aiGuess !== undefined && isCorrect !== undefined) {
      // 이미 분석된 결과가 있으면 aiGuess, isCorrect는 그대로 사용
      finalAiGuess = aiGuess;
      finalIsCorrect = isCorrect;
      
      // impressionScore만 별도로 계산 (저장 시에만)
      try {
        const scoreResult = await analyzeDrawing(base64Data, word.word, true);
        finalImpressionScore = scoreResult.impressionScore;
      } catch (scoreError) {
        console.error('인상 점수 분석 오류:', scoreError);
        finalImpressionScore = undefined;
      }
    } else {
      // AI 분석 수행 (impressionScore 포함)
      try {
        const analysisResult = await analyzeDrawing(base64Data, word.word, true);
        finalAiGuess = analysisResult.aiGuess;
        finalIsCorrect = analysisResult.isCorrect;
        finalImpressionScore = analysisResult.impressionScore;
      } catch (aiError) {
        console.error('AI 분석 오류:', aiError);
        // AI 분석 실패 시 오답으로 처리
        finalAiGuess = 'AI 분석 실패';
        finalIsCorrect = false;
        finalImpressionScore = undefined;
      }
    }

    // 게임 및 그림 데이터 저장
    try {
      const game = await prisma.game.create({
        data: {
          accessCodeId: accessCode.id,
          topicId: topic.id,
          wordId: wordId,
          drawing: {
            create: {
              imageData: imageData,
              aiGuess: finalAiGuess,
              isCorrect: finalIsCorrect,
              impressionScore: finalImpressionScore,
            },
          },
        },
        include: {
          drawing: true,
          topic: true,
          word: true,
        },
      });

      return NextResponse.json(game);
    } catch (dbError: any) {
      console.error('게임 저장 오류:', dbError);
      
      // 데이터베이스 연결 실패 시 명확한 에러 메시지
      if (dbError.message?.includes('DATABASE_URL') || dbError.message?.includes('Environment variable')) {
        return NextResponse.json(
          { error: '데이터베이스가 설정되지 않았습니다. DATABASE_URL 환경 변수를 설정해주세요.' },
          { status: 500 }
        );
      }
      
      throw dbError;
    }
  } catch (error: any) {
    console.error('게임 생성 오류:', error);
    return NextResponse.json(
      { error: error.message || '게임을 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

