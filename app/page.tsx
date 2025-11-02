import type { Metadata } from 'next';

import { HomeClient } from '@/components/features/home/home-client';

export const metadata: Metadata = {
    title: 'UniNavi | AI大学検索プラットフォーム',
    description:
        'AIが大学情報を検索・要約して届けるUniNavi。地域や学部、入試形態から希望に合った進学先を見つけましょう。',
};

export default function HomePage(): React.ReactElement {
    return (
        <div className="space-y-16">
            <HomeClient />
        </div>
    );
}
