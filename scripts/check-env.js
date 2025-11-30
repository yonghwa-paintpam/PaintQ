#!/usr/bin/env node

/**
 * 환경 변수 확인 스크립트
 * 설정이 올바른지 확인하는 데 사용
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'GOOGLE_CLOUD_PROJECT_ID',
  'GOOGLE_CLOUD_LOCATION',
];

const optionalEnvVars = [
  'GOOGLE_APPLICATION_CREDENTIALS',
];

console.log('🔍 환경 변수 확인 중...\n');

let allSet = true;

// 필수 환경 변수 확인
requiredEnvVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: 설정됨`);
  } else {
    console.log(`❌ ${varName}: 설정되지 않음`);
    allSet = false;
  }
});

// 선택적 환경 변수 확인
optionalEnvVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    if (value.startsWith('{')) {
      console.log(`✅ ${varName}: JSON 문자열로 설정됨 (Vercel 환경)`);
    } else {
      console.log(`✅ ${varName}: 파일 경로로 설정됨 (로컬 환경)`);
    }
  } else {
    console.log(`⚠️  ${varName}: 설정되지 않음 (로컬 개발 시 필요)`);
  }
});

console.log('\n' + '='.repeat(50));

if (allSet) {
  console.log('✅ 모든 필수 환경 변수가 설정되었습니다!');
  process.exit(0);
} else {
  console.log('❌ 일부 필수 환경 변수가 설정되지 않았습니다.');
  console.log('\n📖 설정 가이드: SETUP_GUIDE.md를 참고하세요.');
  process.exit(1);
}

