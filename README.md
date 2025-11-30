# PaintQ - 그림 맞추기 게임

Quick, Draw! 스타일의 그림 맞추기 게임 웹 애플리케이션

## 기술 스택

- **Frontend/Backend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Prisma + PostgreSQL (Vercel Postgres)
- **AI**: Google Vertex AI - Gemini Flash Lite
- **Deployment**: Vercel

## 프로젝트 구조

```
├── app/                    # Next.js App Router
│   ├── admin/             # 관리자 모드
│   ├── play/              # 플레이 모드
│   └── api/               # API Routes
├── components/             # React 컴포넌트
│   ├── Canvas/            # 그림 그리기 컴포넌트
│   └── ...
├── lib/                    # 유틸리티 함수
│   ├── db.ts              # Prisma 클라이언트
│   └── gemini.ts          # Gemini API 래퍼
├── types/                  # TypeScript 타입 정의
└── prisma/                 # Prisma 스키마
```

## 환경 변수 설정

`.env.local` 파일 생성:

```env
# Database
DATABASE_URL="postgresql://..."

# Google Cloud
GOOGLE_CLOUD_PROJECT_ID="your-project-id"
GOOGLE_CLOUD_LOCATION="us-central1"
GOOGLE_APPLICATION_CREDENTIALS="./path/to/service-account-key.json"
```

## 개발 시작

```bash
npm install
npm run dev
```

## 배포

Vercel에 배포하면 자동으로 빌드 및 배포됩니다.

