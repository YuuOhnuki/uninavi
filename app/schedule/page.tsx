import { ScheduleClient } from '@/components/features/schedule/ScheduleClient';
import type { Metadata } from 'next';
import { Suspense } from 'react';

import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
    title: 'スケジュール管理 | UniNavi',
    description: '入試スケジュールや合格発表などの重要な日程を管理できます。カレンダー形式で視覚的に確認できます。',
};

export default function SchedulePage(): React.ReactElement {
    return (
        <div className="flex min-h-screen flex-col">
            <main className="flex-1 space-y-16">
                <Suspense fallback={<div>読み込み中...</div>}>
                    <ScheduleClient />
                </Suspense>
            </main>
        </div>
    );
}
