import type { Metadata } from 'next';

import Footer from '@/components/layout/Footer';
import { LandingPage } from '@/components/features/home/LandingPage';

export const metadata: Metadata = {
    title: 'UniNavi | AI大学検索プラットフォーム',
    description:
        'AIが大学情報を検索・要約して届けるUniNavi。地域や学部、入試形態から希望に合った進学先を見つけましょう。',
};

export default function HomePage(): React.ReactElement {
    return (
        <div className="flex min-h-screen flex-col">
            <main className="flex-1">
                <LandingPage />
            </main>
        </div>
    );
}
