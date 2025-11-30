#!/usr/bin/env node

/**
 * Gemini API 테스트 스크립트
 * Google Cloud 설정이 제대로 되어 있는지 확인
 */

const fs = require('fs');
const path = require('path');

// .env.local 파일 읽기
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)="?(.+?)"?$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const { VertexAI } = require('@google-cloud/vertexai');

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS;

console.log('🔍 Gemini API 테스트 시작...\n');

// 환경 변수 확인
console.log('📋 환경 변수 확인:');
console.log(`  GOOGLE_CLOUD_PROJECT_ID: ${projectId ? '✅ 설정됨' : '❌ 설정되지 않음'}`);
console.log(`  GOOGLE_CLOUD_LOCATION: ${location}`);
console.log(`  GOOGLE_APPLICATION_CREDENTIALS: ${credentialsJson ? '✅ 설정됨' : '❌ 설정되지 않음'}\n`);

if (!projectId) {
  console.error('❌ GOOGLE_CLOUD_PROJECT_ID가 설정되지 않았습니다.');
  process.exit(1);
}

// 서비스 계정 키 파일 확인

let credentials = undefined;
if (credentialsJson) {
  if (credentialsJson.startsWith('{')) {
    // JSON 문자열인 경우
    try {
      credentials = JSON.parse(credentialsJson);
      console.log('✅ 서비스 계정 키: JSON 문자열로 설정됨\n');
    } catch (error) {
      console.error('❌ 서비스 계정 키 JSON 파싱 오류:', error.message);
      process.exit(1);
    }
  } else {
    // 파일 경로인 경우
    const keyPath = path.resolve(process.cwd(), credentialsJson);
    if (fs.existsSync(keyPath)) {
      try {
        const keyContent = fs.readFileSync(keyPath, 'utf8');
        credentials = JSON.parse(keyContent);
        console.log(`✅ 서비스 계정 키 파일: ${keyPath}\n`);
      } catch (error) {
        console.error('❌ 서비스 계정 키 파일 읽기 오류:', error.message);
        process.exit(1);
      }
    } else {
      console.error(`❌ 서비스 계정 키 파일을 찾을 수 없습니다: ${keyPath}`);
      process.exit(1);
    }
  }
} else {
  console.error('❌ GOOGLE_APPLICATION_CREDENTIALS가 설정되지 않았습니다.');
  process.exit(1);
}

// Vertex AI 초기화
const vertexAIConfig = {
  project: projectId,
  location: location,
};

if (credentials) {
  vertexAIConfig.credentials = credentials;
}

let vertexAI;
try {
  vertexAI = new VertexAI(vertexAIConfig);
  console.log('✅ Vertex AI 초기화 성공\n');
} catch (error) {
  console.error('❌ Vertex AI 초기화 실패:', error.message);
  process.exit(1);
}

// 모델 가져오기
const model = vertexAI.getGenerativeModel({
  model: 'gemini-2.5-flash-lite',
});

console.log('📤 API 호출 테스트 시작...\n');

// 간단한 텍스트 요청으로 테스트
async function testTextRequest() {
  try {
    console.log('테스트 1: 텍스트 요청 (간단한 질문)...');
    const request = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: '안녕하세요. 간단히 인사만 해주세요.',
            },
          ],
        },
      ],
    };

    const response = await model.generateContent(request);
    const responseText = response.response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (responseText) {
      console.log('✅ 텍스트 요청 성공!');
      console.log(`응답: ${responseText.substring(0, 100)}...\n`);
      return true;
    } else {
      console.log('⚠️  응답은 받았지만 내용이 없습니다.\n');
      return false;
    }
  } catch (error) {
    console.error('❌ 텍스트 요청 실패:', error.message);
    console.error('상세 오류:', error);
    return false;
  }
}

// 이미지 분석 테스트 (빈 이미지)
async function testImageAnalysis() {
  try {
    console.log('테스트 2: 이미지 분석 요청 (빈 이미지)...');
    
    // 작은 빈 PNG 이미지 (1x1 픽셀, 투명)
    const emptyImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const request = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: '이 그림이 무엇인지 한 단어로 답변해주세요.',
            },
            {
              inlineData: {
                mimeType: 'image/png',
                data: emptyImageBase64,
              },
            },
          ],
        },
      ],
    };

    const response = await model.generateContent(request);
    const responseText = response.response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (responseText) {
      console.log('✅ 이미지 분석 요청 성공!');
      console.log(`응답: ${responseText.substring(0, 100)}...\n`);
      return true;
    } else {
      console.log('⚠️  응답은 받았지만 내용이 없습니다.\n');
      return false;
    }
  } catch (error) {
    console.error('❌ 이미지 분석 요청 실패:', error.message);
    console.error('상세 오류:', error);
    return false;
  }
}

// 메인 테스트 실행
async function runTests() {
  console.log('='.repeat(50));
  console.log('Google Cloud Gemini API 테스트');
  console.log('='.repeat(50));
  console.log('');

  const textResult = await testTextRequest();
  const imageResult = await testImageAnalysis();

  console.log('='.repeat(50));
  console.log('테스트 결과 요약');
  console.log('='.repeat(50));
  console.log(`텍스트 요청: ${textResult ? '✅ 성공' : '❌ 실패'}`);
  console.log(`이미지 분석: ${imageResult ? '✅ 성공' : '❌ 실패'}`);
  console.log('');

  if (textResult && imageResult) {
    console.log('🎉 모든 테스트 통과! Gemini API가 정상적으로 작동합니다.');
    console.log('✅ 실제 플레이 모드에서도 AI 분석이 작동할 것입니다.');
    process.exit(0);
  } else if (textResult || imageResult) {
    console.log('⚠️  일부 테스트만 성공했습니다. 설정을 확인해주세요.');
    process.exit(1);
  } else {
    console.log('❌ 모든 테스트 실패. Google Cloud 설정을 확인해주세요.');
    console.log('');
    console.log('확인 사항:');
    console.log('1. Google Cloud 프로젝트 ID가 올바른지 확인');
    console.log('2. Vertex AI API가 활성화되어 있는지 확인');
    console.log('3. 서비스 계정에 "Vertex AI User" 역할이 부여되었는지 확인');
    console.log('4. 서비스 계정 키 파일이 올바른지 확인');
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error('예상치 못한 오류:', error);
  process.exit(1);
});

