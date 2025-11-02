import { type ReactElement } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

function HeroSection(): ReactElement {
    return (
        <section className="text-center">
            <p className="text-primary/80 text-xs font-medium tracking-[0.3em] uppercase">University Navigator</p>
            <h1 className="text-foreground mt-3 text-4xl font-bold md:text-5xl">UniNavi へようこそ</h1>
            <p className="text-muted-foreground mt-4 text-lg md:text-xl">
                AIが大学情報を検索・要約してお届けします。あなたにぴったりの進路を見つけましょう。
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button asChild size="lg" className="text-base">
                    <Link href="/search">大学検索を始める</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base">
                    <Link href="/schedule">スケジュール管理</Link>
                </Button>
            </div>
        </section>
    );
}

export function HomeHero(): ReactElement {
    return <HeroSection />;
}
