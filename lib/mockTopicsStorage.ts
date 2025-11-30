// Mock 주제 저장소 (메모리 기반, 서버 재시작 시 초기화됨)
// 여러 API 라우트에서 공유하기 위한 중앙 저장소

// Mock 데이터 (데이터베이스 없을 때 테스트용)
// 기본 주제는 제거됨 - 필요시 관리자 모드에서 새로 생성 가능
const MOCK_TOPICS: any[] = [];

let mockTopicsStorage: any[] = [];

export function initializeMockStorage() {
  if (mockTopicsStorage.length === 0) {
    mockTopicsStorage = JSON.parse(JSON.stringify(MOCK_TOPICS)); // 깊은 복사
  }
}

export function getMockStorage(): any[] {
  initializeMockStorage();
  return mockTopicsStorage;
}

export function setMockStorage(storage: any[]) {
  mockTopicsStorage = storage;
}

export function addMockTopic(topic: any) {
  initializeMockStorage();
  mockTopicsStorage.push(topic);
}

export function updateMockTopic(topicId: string, updatedTopic: any) {
  initializeMockStorage();
  const index = mockTopicsStorage.findIndex((t) => t.id === topicId);
  if (index !== -1) {
    mockTopicsStorage[index] = updatedTopic;
  }
}

export function deleteMockTopic(topicId: string) {
  initializeMockStorage();
  mockTopicsStorage = mockTopicsStorage.filter((t) => t.id !== topicId);
}

export function findMockTopic(topicId: string): any | null {
  initializeMockStorage();
  return mockTopicsStorage.find((t) => t.id === topicId) || null;
}

