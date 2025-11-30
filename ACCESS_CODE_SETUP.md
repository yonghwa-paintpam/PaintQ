# 접속 코드 시스템 설정 가이드

## 1. 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 추가하세요:

```bash
# 슈퍼 관리자 인증 키
SUPER_ADMIN_SECRET_KEY="1035074bfaf6ce2fe03994cbd459aff43722fa88796d427dc529eb152de6a7ee"

# 데이터베이스 연결 URL (필수)
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
```

### DATABASE_URL 설정 방법

**로컬 개발 환경:**

1. **Neon 사용 (권장)**
   - [Neon Console](https://console.neon.tech)에서 프로젝트 생성
   - Connection String 복사
   - `.env.local`에 `DATABASE_URL` 추가
   - 예: `postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require`

2. **로컬 PostgreSQL 사용**
   - PostgreSQL 설치 후 데이터베이스 생성
   - `.env.local`에 `DATABASE_URL` 추가
   - 예: `postgresql://postgres:password@localhost:5432/paintq`

**주의**: 
- `SUPER_ADMIN_SECRET_KEY`는 충분히 길고 복잡한 랜덤 문자열로 설정하세요.
- 예: `openssl rand -hex 32` 명령어로 생성 가능
- **DATABASE_URL이 없으면 애플리케이션이 동작하지 않습니다.** (Mock 데이터 처리 로직 제거됨)

## 2. 데이터베이스 마이그레이션

### 로컬 개발 환경

**⚠️ 중요**: `DATABASE_URL` 환경 변수가 설정되어 있어야 합니다.
설정하지 않으면 애플리케이션이 동작하지 않습니다.

로컬에서 마이그레이션을 실행하려면:

```bash
# Prisma 클라이언트 생성 (✅ 완료)
npx prisma generate

# 마이그레이션 실행 (DATABASE_URL 필요)
npx prisma migrate deploy
```

또는

```bash
# 개발 모드로 마이그레이션 (마이그레이션 히스토리 관리)
npx prisma migrate dev
```

**✅ 완료**: Prisma 클라이언트가 생성되었습니다.

### Vercel 배포 시

Vercel은 자동으로 `prisma migrate deploy`를 실행합니다.
단, `package.json`에 다음 스크립트가 있어야 합니다:

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

## 3. 슈퍼 관리자 접근 방법

1. 환경 변수에 설정한 `SUPER_ADMIN_SECRET_KEY` 값을 확인
2. 브라우저에서 다음 URL로 접근:
   ```
   http://localhost:3000/super-admin?key={SUPER_ADMIN_SECRET_KEY}
   ```
3. 예시:
   ```
   http://localhost:3000/super-admin?key=abc123xyz789
   ```

## 4. 테스트 시나리오

### 기본 테스트

1. **홈 페이지 접속**
   - `http://localhost:3000` 접속
   - 접속 코드 입력 화면 확인

2. **기본 접속 코드 (0000) 사용**
   - 접속 코드 `0000` 입력
   - 관리자/플레이 모드 선택 화면 확인

3. **슈퍼 관리자 페이지**
   - `/super-admin?key={SUPER_ADMIN_SECRET_KEY}` 접속
   - 접속 코드 목록 확인
   - 새 접속 코드 생성 테스트

4. **관리자 모드**
   - `/{accessCode}/admin` 접속
   - 주제 생성/수정/삭제 테스트

5. **플레이 모드**
   - `/{accessCode}/play` 접속
   - 주제 선택 및 게임 플레이 테스트

## 5. 문제 해결

### 마이그레이션 오류

만약 마이그레이션 실행 중 오류가 발생하면:

```bash
# 마이그레이션 상태 확인
npx prisma migrate status

# 마이그레이션 리셋 (주의: 데이터 삭제됨)
npx prisma migrate reset

# 다시 마이그레이션 실행
npx prisma migrate deploy
```

### 접속 코드 생성 오류

- 데이터베이스 연결 확인
- Prisma 클라이언트 재생성: `npx prisma generate`

