
import type { Metadata } from 'next';
import './globals.css';
import MetaConsent from './meta-consent';

export const metadata: Metadata = {
  title: '하이바이크 | 내 바이크 매입 상담',
  description:
    '하이바이크에서 오토바이 매입 상담을 신청하세요. 차량 상태 확인 후 매입 조건을 안내합니다.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {children}
        <MetaConsent />
      </body>
    </html>
  );
}
