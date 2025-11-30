// 공통 타입 정의

export interface Topic {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Word {
  id: string;
  topicId: string;
  word: string;
  order: number;
  createdAt: Date;
}

export interface Game {
  id: string;
  topicId: string;
  wordId: string;
  createdAt: Date;
}

export interface Drawing {
  id: string;
  gameId: string;
  imageData: string;
  aiGuess: string | null;
  isCorrect: boolean | null;
  createdAt: Date;
}

export interface TopicWithWords extends Topic {
  words: Word[];
}

export interface GameWithDrawing extends Game {
  drawing: Drawing | null;
  word: Word;
}

export interface DrawingWithGame extends Drawing {
  game: GameWithDrawing;
}

// API 응답 타입
export interface AnalyzeDrawingResponse {
  aiGuess: string;
  isCorrect: boolean;
}

export interface CreateTopicRequest {
  name: string;
  words: string[]; // 최대 10개
}

