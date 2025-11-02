import type { Metadata } from 'next';
import { Suspense } from 'react';

import Footer from '@/components/layout/Footer';
import { SearchClient } from '@/components/features/search/SearchClient';

export const metadata: Metadata = {
    title: '大学検索 | UniNavi',
    description:
        'AIが大学情報を検索・要約してお届けします。地域や学部、入試形態から希望に合った進学先を見つけましょう。',
};

export default function SearchPage(): React.ReactElement {
    return (
        <div className="flex min-h-screen flex-col">
            <main className="flex-1 space-y-16">
                <Suspense fallback={<div>読み込み中...</div>}>
                    <SearchClient />
                </Suspense>
            </main>
        </div>
    );
}
