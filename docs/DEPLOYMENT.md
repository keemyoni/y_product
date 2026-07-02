# Server Deployment Guide

이 앱은 실제 회원에게 전달 가능한 예약 링크를 만들기 위해 PostgreSQL 저장소를 사용하도록 준비되어 있다.

## 배포 구조

- App: Next.js 15
- Runtime: Node.js
- Database: PostgreSQL
- ORM: Prisma
- Public booking link: `https://YOUR_DOMAIN/booking/{memberToken}`

## 필수 환경변수

```bash
NEXT_PUBLIC_APP_URL="https://your-domain.example.com"
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
STORAGE_DRIVER="postgres"
DEFAULT_TENANT_ID="tenant_default"
DEFAULT_TENANT_NAME="Studio Balance"
```

## Vercel 배포

1. GitHub에 프로젝트를 올린다.
2. Vercel에서 Import Project를 선택한다.
3. 위 환경변수를 Vercel Project Settings에 입력한다.
4. 배포 전 한 번 DB 스키마를 반영한다.

```bash
npm run db:deploy
```

5. 배포 후 관리자 회원관리 화면에서 회원별 링크를 복사한다.

예:

```text
https://your-domain.example.com/booking/mock-token
```

## Render 배포

`render.yaml`을 포함해두었으므로 Blueprint로 배포할 수 있다.

1. Render에서 New Blueprint를 선택한다.
2. GitHub 저장소를 연결한다.
3. `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`을 입력한다.
4. PostgreSQL DB를 먼저 만든 뒤 `npm run db:deploy`를 실행한다.

## 초기 데이터

`STORAGE_DRIVER=postgres` 상태에서 첫 화면을 읽으면 기본 테넌트와 샘플 데이터가 자동으로 생성된다.

운영 데이터로 전환할 때는:

- 회원 목록에서 새 회원을 등록하는 API를 다음 단계에서 추가한다.
- 기존 샘플 회원의 예약 링크는 테스트용으로만 사용한다.

## 중요한 운영 주의사항

- 파일 저장소는 로컬 개발용이다. 실제 배포에서는 반드시 `STORAGE_DRIVER=postgres`를 사용한다.
- 예약 중복 방지는 앱 레이어와 DB unique constraint를 함께 사용한다.
- 실제 공개 전 `NEXT_PUBLIC_APP_URL`이 정확한 도메인인지 확인한다.
- 회원 링크는 로그인 없는 접근이므로 토큰을 외부에 공개 게시하지 않는다.
