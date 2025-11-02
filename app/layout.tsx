import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
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
    title: 'UniNavi Next.js Starter',
    description: 'Production-ready template featuring Shadcn UI and Tailwind CSS tooling.',
    metadataBase: new URL('https://github.com/YuuOhnuki/nextjs-startar'),
    openGraph: {
        title: 'UniNavi Next.js Starter',
        description: 'Production-ready template featuring Shadcn UI and Tailwind CSS tooling.',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'UniNavi Next.js Starter',
        description: 'Production-ready template featuring Shadcn UI and Tailwind CSS tooling.',
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
                </FavoritesProvider>
            </body>
        </html>
    );
}
