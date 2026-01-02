/**
 * Gemini API를 사용한 수학 관련 주제 테스트
 * 간단한 도형 이미지를 생성하여 AI가 잘 추측하는지 테스트
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// .env.local 로드
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim();
  }
});

// 환경변수 로드 후에 @google/generative-ai import
const { GoogleGenerativeAI } = await import('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY가 설정되지 않았습니다.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

/**
 * 주제 힌트가 있는 프롬프트와 없는 프롬프트 비교 테스트
 */
async function testWithAndWithoutHint(imageDescription, topicHint, expectedAnswer) {
  // 실제 이미지 대신 설명으로 테스트 (이미지 생성 없이)
  console.log(`\n📝 테스트: "${expectedAnswer}" (${imageDescription})`);
  console.log(`   주제 힌트: "${topicHint}"`);
  
  // 힌트 없는 프롬프트
  const promptWithoutHint = `
이 그림이 무엇인지 맞춰보세요.

지침:
1. 그림을 보고 무엇을 그린 것인지 추측해주세요.
2. 손으로 그린 간단한 그림이므로, 대략적인 형태를 보고 추측하면 됩니다.
3. 한 단어로만 답변해주세요.

그림 설명: ${imageDescription}

응답 형식:
{
  "aiGuess": "추측한 단어"
}
`;

  // 힌트 있는 프롬프트
  const promptWithHint = `
이 그림이 무엇인지 맞춰보세요.

힌트: 이 그림은 "${topicHint}" 관련 그림입니다. 해당 주제에 맞는 용어로 답변해주세요.

지침:
1. 그림을 보고 무엇을 그린 것인지 추측해주세요.
2. 손으로 그린 간단한 그림이므로, 대략적인 형태를 보고 추측하면 됩니다.
3. 한 단어로만 답변해주세요.

그림 설명: ${imageDescription}

응답 형식:
{
  "aiGuess": "추측한 단어"
}
`;

  try {
    // 힌트 없이 테스트
    const resultWithoutHint = await model.generateContent(promptWithoutHint);
    const textWithoutHint = resultWithoutHint.response.text();
    const jsonMatchWithout = textWithoutHint.match(/\{[\s\S]*\}/);
    const guessWithout = jsonMatchWithout ? JSON.parse(jsonMatchWithout[0]).aiGuess : textWithoutHint.trim();
    
    // 힌트 있이 테스트
    const resultWithHint = await model.generateContent(promptWithHint);
    const textWithHint = resultWithHint.response.text();
    const jsonMatchWith = textWithHint.match(/\{[\s\S]*\}/);
    const guessWith = jsonMatchWith ? JSON.parse(jsonMatchWith[0]).aiGuess : textWithHint.trim();
    
    console.log(`   힌트 없음: "${guessWithout}"`);
    console.log(`   힌트 있음: "${guessWith}"`);
    console.log(`   정답: "${expectedAnswer}"`);
    
    return { guessWithout, guessWith };
  } catch (error) {
    console.error(`   ❌ 오류: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('🤖 Gemini API 수학 관련 주제 테스트');
  console.log('='.repeat(60));
  console.log('\n주제 힌트가 AI 추측에 미치는 영향을 테스트합니다.\n');

  const testCases = [
    {
      imageDescription: '세 개의 선이 닫힌 도형을 이루고 있음. 한 쪽 각이 90도로 보임.',
      topicHint: '도형',
      expectedAnswer: '직각삼각형',
    },
    {
      imageDescription: '여러 개의 세로 막대가 나란히 그려져 있고, 각 막대의 높이가 다름.',
      topicHint: '도형, 그래프',
      expectedAnswer: '막대그래프',
    },
    {
      imageDescription: '원이 여러 조각으로 나뉘어져 있고, 각 조각의 크기가 다름.',
      topicHint: '도형, 그래프',
      expectedAnswer: '원그래프',
    },
    {
      imageDescription: '상자 모양의 3D 도형. 정면, 측면, 윗면이 보임.',
      topicHint: '도형, 그래프',
      expectedAnswer: '정육면체',
    },
    {
      imageDescription: '반원 모양에 눈금이 그려져 있음.',
      topicHint: '수학도구',
      expectedAnswer: '각도기',
    },
    {
      imageDescription: '둥근 머리 두 개와 연결된 두 개의 다리가 있는 도구.',
      topicHint: '수학도구',
      expectedAnswer: '콤파스',
    },
  ];

  for (const testCase of testCases) {
    await testWithAndWithoutHint(
      testCase.imageDescription,
      testCase.topicHint,
      testCase.expectedAnswer
    );
    // API 호출 간 딜레이
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 테스트 완료!');
  console.log('='.repeat(60));
}

main().catch(console.error);

