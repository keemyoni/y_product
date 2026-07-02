# Production Readiness Checklist

## Runtime

- `NEXT_PUBLIC_APP_URL`을 실제 도메인으로 설정한다.
- `DATABASE_URL`을 운영 PostgreSQL로 설정한다.
- 파일 저장소 어댑터를 Prisma 저장소 어댑터로 교체한다.
- 서버 액션은 현재 Zod 검증과 일관된 `ActionResult`를 사용한다.

## Data

- 예약 중복 방지는 DB unique constraint와 transaction으로 보강한다.
- 회원 토큰은 재발급 시 이전 토큰이 즉시 무효화되어야 한다.
- 수업 완료, 노쇼, 관리자 취소는 감사 로그로 남긴다.
- 정산 데이터는 완료 수업 기준으로 재계산 가능해야 한다.

## UX

- 모든 주요 액션은 pending 상태와 실패 메시지를 표시한다.
- 모바일 하단 네비게이션이 관리자 주요 화면을 모두 연결한다.
- `Tab`, `Shift+Tab`, `Enter`, `Esc` 흐름을 QA한다.
- 회원 예약 화면은 카카오톡 인앱 브라우저에서 확인한다.

## Accessibility

- 현재 페이지 메뉴에는 `aria-current="page"`를 유지한다.
- 아이콘 전용 버튼에는 반드시 `aria-label`을 둔다.
- 검색 입력에는 명시적 `aria-label`을 둔다.
- 상태 배지는 텍스트 라벨을 함께 노출한다.

## SEO

- 관리자 경로는 `robots.ts`에서 검색 제외한다.
- 회원 예약 링크는 외부 검색 노출 정책을 운영 전 결정한다.
- Open Graph 제목과 설명을 실제 브랜드에 맞게 바꾼다.

## Performance

- 차트, 캘린더 같은 무거운 클라이언트 컴포넌트는 필요한 페이지에서만 로드한다.
- 서버 데이터 페이지는 정적 빌드에 고정되지 않도록 동적 데이터로 처리한다.
- 모바일에서 테이블 가로 넘침과 하단 네비게이션 겹침을 확인한다.
