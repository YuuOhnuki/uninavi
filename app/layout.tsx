import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ChatDrawer } from '@/components/layout/ChatDrawer';
import { FavoritesProvider } from '@/hooks/use-favorites';

import './globals.css';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin', 'latin-ext'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'UniNavi | AI大学ナビゲーション',
    description:
        'AIが入試スケジュールや配点情報をまとめて提案。大学選びと受験対策をサポートするUniNaviの公式サイトです。',
    metadataBase: new URL('https://uninavi.jp'),
    openGraph: {
        title: 'UniNavi | AI大学ナビゲーション',
        description:
            'AIが入試スケジュールや配点情報をまとめて提案。大学選びと受験対策をサポートするUniNaviの公式サイトです。',
        type: 'website',
        url: 'https://uninavi.jp',
        siteName: 'UniNavi',
        locale: 'ja_JP',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'UniNavi | AI大学ナビゲーション',
        description:
            'AIが入試スケジュールや配点情報をまとめて提案。大学選びと受験対策をサポートするUniNaviの公式サイトです。',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>): React.ReactElement {
    return (
        <html lang="ja" suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} bg-muted/20 min-h-screen font-sans antialiased`}
            >
                <FavoritesProvider>
                    <a
                        href="#main-content"
                        className="focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:px-4 focus:py-2"
                    >
                        メインコンテンツへスキップ
                    </a>
                    <Header />
                    <main id="main-content" className="mx-auto w-full max-w-6xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
                        {children}
                    </main>
                    <Footer />
                    <ChatDrawer />
                </FavoritesProvider>
            </body>
        </html>
    );
}
