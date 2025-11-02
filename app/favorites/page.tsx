import type { Metadata } from 'next';
import { Suspense } from 'react';

import Footer from '@/components/layout/Footer';
import { FavoritesClient } from '@/components/features/favorites/FavoritesClient';

export const metadata: Metadata = {
    title: 'お気に入り大学 | UniNavi',
    description: '気になる大学を保存して、あとから一覧で比較できます。',
};

export default function FavoritesPage(): React.ReactElement {
    return (
        <div className="flex min-h-screen flex-col">
            <main className="flex-1 space-y-16">
                <Suspense fallback={<div>読み込み中...</div>}>
                    <FavoritesClient />
                </Suspense>
            </main>
        </div>
    );
}
