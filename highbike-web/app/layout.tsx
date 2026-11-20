
import type { Metadata } from 'next';
import './globals.css';
import MetaConsent from './meta-consent';

const siteUrl = 'https://heybike.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: 'HEYBIKE | 오토바이 매입 전문',
    template: '%s | HEYBIKE',
  },

  description:
    '헤이바이크(HEYBIKE)에서 간편하게 오토바이 매입 견적을 상담하세요. 혼다, 야마하 등 다양한 이륜차의 매입 조건을 차량 확인 후 안내합니다.',

  applicationName: 'HEYBIKE',

  keywords: [
    '헤이바이크',
    'HEYBIKE',
    '오토바이 매입',
    '중고 오토바이 매입',
    '바이크 매입',
    '오토바이 판매',
    '오토바이 견적',
    '이륜차 매입',
    'PCX 매입',
    'NMAX 매입',
  ],

  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: siteUrl,
    siteName: 'HEYBIKE',
    title: 'HEYBIKE | 오토바이 매입 전문',
    description:
      '내 바이크의 가치를 확인하는 간편한 방법. HEYBIKE 오토바이 매입 상담 서비스.',
  },

  twitter: {
    card: 'summary',
    title: 'HEYBIKE | 오토바이 매입 전문',
    description:
      '헤이바이크 오토바이 매입 견적 상담 서비스.',
  },

  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        {children}
        <MetaConsent />
      </body>
    </html>
  );
}
