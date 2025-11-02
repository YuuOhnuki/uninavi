import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { SiteHeader } from '@/components/layout/site-header';

import './globals.css';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Uvinavi Next.js Starter',
    description: 'Production-ready template featuring Shadcn UI and Tailwind CSS tooling.',
    metadataBase: new URL('https://github.com/YuuOhnuki/nextjs-startar'),
    openGraph: {
        title: 'Uvinavi Next.js Starter',
        description: 'Production-ready template featuring Shadcn UI and Tailwind CSS tooling.',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Uvinavi Next.js Starter',
        description: 'Production-ready template featuring Shadcn UI and Tailwind CSS tooling.',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>): React.ReactElement {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} bg-background min-h-screen font-sans antialiased`}
            >
                <SiteHeader />
                <main className="mx-auto w-full max-w-6xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">{children}</main>
            </body>
        </html>
    );
}
