# HIGH BIKE — Supabase 견적 신청 연동 버전

기존 메인 홈페이지 디자인과 섹션은 유지하고 견적 신청 UI, `/api/inquiries` 서버 API, 사진 저장, 개인정보 안내 페이지를 추가했습니다.

## 준비 사항
- Supabase `public.purchase_inquiries` 테이블 및 비공개 `motorcycle-photos` 버킷 생성
- Vercel Production 환경변수: `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (기존 등록 완료)
- **추가 필요:** Cloudflare Turnstile 등록 후 `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- **추가 필요:** `PRIVACY_OPERATOR`, `PRIVACY_CONTACT` (실제 운영자/개인정보 문의처)
- **활성화:** 모든 준비 및 개인정보 안내 검토 완료 후 `NEXT_PUBLIC_INQUIRIES_ENABLED=true`

현재는 `NEXT_PUBLIC_INQUIRIES_ENABLED`가 없거나 false면 폼이 비활성화됩니다. 고객 데이터가 접수되었다고 오인하지 않도록 설계했습니다.

## 배포
1. ZIP 압축 해제
2. GitHub `highbike-web` 저장소 루트에 파일과 폴더 업로드 (기존 동일 파일은 교체)
3. GitHub commit 후 Vercel 자동 배포 확인
4. Vercel 환경변수 추가, Production 재배포
5. 테스트용 가짜 데이터로 DB와 사진 저장 확인

## 보안
- Secret key는 서버 라우트에서만 사용합니다. 브라우저에는 노출하지 않습니다.
- Turnstile 서버 검증 필수, 이미지 확장자 대신 MIME 및 파일 서명 검증, 장당 10MB/총 25MB/5장 제한.
- 사진은 비공개 버킷에 저장. 고객 직접 접근 정책은 생성하지 않습니다.
- `purchase_inquiries`에 RLS 활성화 및 `anon`, `authenticated` 직접 접근 차단.
- 관리자 화면 및 관리자 인증은 아직 포함되지 않습니다. Supabase Table Editor에서 운영자만 확인할 수 있습니다.
- 개인정보 안내의 보유 기간 등은 운영자의 실제 정책과 법적 요구사항에 맞춰 검토해야 합니다.

## 주의
- 서버가 사진을 업로드한 후 DB 저장에 실패하면 업로드한 사진을 삭제하려고 시도합니다. 네트워크 장애 등 예외 상황에서 잔여 파일은 수동 정리할 수 있습니다.
- 이 버전은 일반 공개 전 검수용입니다. 스팸 방지 및 운영 정책을 확인하고 활성화하세요.
