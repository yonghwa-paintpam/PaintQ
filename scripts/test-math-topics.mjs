/**
 * 수학 관련 주제 개선 테스트 스크립트
 * 1. 유사 단어 매핑 테스트
 * 2. 주제 힌트 추출 테스트
 * 3. (선택) Gemini API 호출 테스트
 */

// 유사 단어 매핑 (gemini.ts에서 복사)
const similarWords = {
  // 일반 단어
  '자동차': ['자동차', '차', 'car'],
  '별': ['별', 'star', '스타', '오각별'],
  
  // === 도형 관련 ===
  '동그라미': ['동그라미', '원', '원형', 'circle', 'O', '○'],
  '세모': ['세모', '삼각형', 'triangle', '△'],
  '삼각형': ['삼각형', '세모', 'triangle', '△'],
  '사각형': ['사각형', '네모', '정사각형', '직사각형', 'square', 'rectangle', '□'],
  '네모': ['네모', '사각형', '정사각형', 'square', '□'],
  '마름모': ['마름모', '다이아몬드', 'diamond', 'rhombus', '◇'],
  '오각형': ['오각형', '펜타곤', 'pentagon', '오각별'],
  '육각형': ['육각형', '헥사곤', 'hexagon', '벌집'],
  '직각삼각형': ['직각삼각형', '삼각형', 'right triangle', '세모'],
  '이등변삼각형': ['이등변삼각형', '삼각형', 'isosceles triangle', '세모'],
  '평행선': ['평행선', '평행', 'parallel lines', '두 줄', '직선'],
  
  // === 3D 도형 ===
  '정육면체': ['정육면체', '큐브', '상자', 'cube', 'box', '육면체', '주사위'],
  '원기둥': ['원기둥', '실린더', 'cylinder', '기둥', '원통'],
  '원뿔': ['원뿔', '콘', 'cone', '뿔'],
  '정사면체': ['정사면체', '피라미드', 'tetrahedron', '사면체', '삼각뿔'],
  '사각뿔': ['사각뿔', '피라미드', 'pyramid', '뿔'],
  
  // === 그래프 관련 ===
  '막대그래프': ['막대그래프', '바차트', 'bar chart', 'bar graph', '막대 차트', '막대', '그래프'],
  '원그래프': ['원그래프', '파이차트', 'pie chart', 'pie graph', '파이 그래프', '원형 그래프'],
  '꺾은선그래프': ['꺾은선그래프', '선그래프', 'line chart', 'line graph', '라인 그래프', '선 그래프', '그래프'],
  '방사형그래프': ['방사형그래프', '레이더차트', 'radar chart', '거미줄 그래프', '방사형 차트', '거미줄'],
  
  // === 수학 도구 ===
  '자': ['자', '눈금자', 'ruler', '직자'],
  '줄자': ['줄자', '측정 테이프', 'tape measure', '메저'],
  '콤파스': ['콤파스', '컴퍼스', 'compass', '원 그리는 도구'],
  '삼각자': ['삼각자', '삼각 자', 'set square', 'triangle ruler'],
  '각도기': ['각도기', '분도기', 'protractor', '반원 자'],
  '연필': ['연필', 'pencil', '펜슬'],
  '지우개': ['지우개', 'eraser', '지우개'],
  '계산기': ['계산기', 'calculator', '전자 계산기'],
  '주판': ['주판', '산판', 'abacus', '셈판'],
  '저울': ['저울', '천칭', 'scale', 'balance', '무게 저울'],
};

// 정규화 함수
function normalize(str) {
  return str.toLowerCase().trim().replace(/[\s\-_\.]/g, '');
}

// 정답 비교 함수
function compareAnswers(aiGuess, correctAnswer) {
  if (!aiGuess || !correctAnswer) return false;
  
  const normalizedGuess = normalize(aiGuess);
  const normalizedAnswer = normalize(correctAnswer);
  
  // 1. 정확히 일치
  if (normalizedGuess === normalizedAnswer) return true;
  
  // 2. 유사 단어 매핑 체크
  const similarToAnswer = similarWords[correctAnswer] || [correctAnswer];
  const normalizedSimilar = similarToAnswer.map(normalize);
  
  if (normalizedSimilar.includes(normalizedGuess)) return true;
  
  return false;
}

// 주제 힌트 추출 함수
function extractTopicHint(topicName) {
  let hint = topicName
    .replace(/[★☆]/g, '')
    .replace(/난이도/g, '')
    .replace(/\s*\/\s*/g, ' ')
    .trim();
  hint = hint.replace(/&/g, ', ');
  hint = hint.replace(/\s+/g, ' ').trim();
  return hint || topicName;
}

console.log('='.repeat(60));
console.log('📐 수학 관련 주제 개선 테스트');
console.log('='.repeat(60));

// 테스트 1: 유사 단어 매핑 테스트
console.log('\n✅ 테스트 1: 유사 단어 매핑 테스트\n');

const testCases = [
  // [AI 추측, 정답, 예상 결과]
  ['원', '동그라미', true],
  ['circle', '동그라미', true],
  ['삼각형', '세모', true],
  ['삼각형', '직각삼각형', true],
  ['세모', '이등변삼각형', true],
  ['큐브', '정육면체', true],
  ['box', '정육면체', true],
  ['피라미드', '사각뿔', true],
  ['피라미드', '정사면체', true],
  ['bar chart', '막대그래프', true],
  ['파이차트', '원그래프', true],
  ['컴퍼스', '콤파스', true],
  ['분도기', '각도기', true],
  ['ruler', '자', true],
  ['abacus', '주판', true],
  // 오답 케이스
  ['고양이', '동그라미', false],
  ['사과', '삼각형', false],
];

let passed = 0;
let failed = 0;

testCases.forEach(([aiGuess, correctAnswer, expected]) => {
  const result = compareAnswers(aiGuess, correctAnswer);
  const status = result === expected ? '✓' : '✗';
  const color = result === expected ? '\x1b[32m' : '\x1b[31m';
  
  if (result === expected) {
    passed++;
  } else {
    failed++;
  }
  
  console.log(`${color}${status}\x1b[0m AI: "${aiGuess}" vs 정답: "${correctAnswer}" → ${result ? '정답' : '오답'} (예상: ${expected ? '정답' : '오답'})`);
});

console.log(`\n결과: ${passed}/${testCases.length} 통과`);

// 테스트 2: 주제 힌트 추출 테스트
console.log('\n' + '='.repeat(60));
console.log('✅ 테스트 2: 주제 힌트 추출 테스트\n');

const topicTestCases = [
  ['도형 / 난이도 ★★☆☆☆', '도형'],
  ['도형&그래프 / ★★★☆☆', '도형, 그래프'],
  ['수학도구 ★★☆☆☆', '수학도구'],
  ['동물 / 쉬움', '동물 쉬움'],
];

topicTestCases.forEach(([input, expected]) => {
  const result = extractTopicHint(input);
  const status = result === expected ? '✓' : '✗';
  const color = result === expected ? '\x1b[32m' : '\x1b[31m';
  console.log(`${color}${status}\x1b[0m "${input}" → "${result}" (예상: "${expected}")`);
});

console.log('\n' + '='.repeat(60));
console.log('📊 테스트 완료!');
console.log('='.repeat(60));

// 실패한 테스트가 있으면 exit code 1
if (failed > 0) {
  console.log(`\n⚠️  ${failed}개 테스트 실패`);
  process.exit(1);
} else {
  console.log('\n✅ 모든 테스트 통과!');
}

