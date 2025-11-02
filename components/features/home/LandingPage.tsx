'use client';

import { type ReactElement, useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Search,
    Heart,
    Calendar,
    Sparkles,
    Users,
    BookOpen,
    Clock,
    TrendingUp,
    CheckCircle,
    ArrowRight,
    Star,
    GraduationCap,
    Target,
    Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StatsData {
    totalUniversities: number;
    totalFaculties: number;
    totalSchedules: number;
    searchCount: number;
}

function HeroSection(): ReactElement {
    return (
        <section className="text-center">
            <div className="mx-auto max-w-4xl">
                <p className="text-primary/80 text-xs font-medium tracking-[0.3em] uppercase">
                    AI POWERED UNIVERSITY SEARCH
                </p>
                <h1 className="text-foreground mt-4 text-5xl font-bold md:text-6xl lg:text-7xl">
                    あなたにぴったりの
                    <span className="text-primary">大学</span>
                    を見つけよう
                </h1>
                <p className="text-muted-foreground mt-6 text-xl md:text-2xl">
                    AIが全国の大学情報を瞬時に検索・分析。偏差値、学部、入試形態から最適な進路を提案します。
                </p>
                <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
                    <Button asChild size="lg" className="px-8 py-6 text-lg">
                        <Link href="/search">
                            <Search className="mr-2 h-5 w-5" />
                            無料で大学検索を始める
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="px-8 py-6 text-lg">
                        <Link href="/schedule">
                            <Calendar className="mr-2 h-5 w-5" />
                            スケジュール管理
                        </Link>
                    </Button>
                </div>
                <p className="text-muted-foreground/70 mt-6 text-sm">会員登録不要・完全無料でご利用いただけます</p>
            </div>
        </section>
    );
}

function FeaturesSection(): ReactElement {
    const features = [
        {
            icon: Sparkles,
            title: 'AIによる高度な分析',
            description: '最新のAI技術で大学情報を自動分析。偏差値、就職実績、入試難易度を総合的に評価します。',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
        {
            icon: Search,
            title: '高速・正確な検索',
            description:
                '全国800以上の大学から、条件に合った大学を瞬時に検索。地域、学部、偏差値など多様な条件に対応。',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            icon: Heart,
            title: 'お気に入り管理',
            description: '気になる大学を保存して比較検討。進路選択の重要な判断材料として活用できます。',
            color: 'text-red-600',
            bgColor: 'bg-red-50',
        },
        {
            icon: Calendar,
            title: 'スケジュール管理',
            description: '入試日程、合格発表、説明会などの重要スケジュールを一元管理。忘れずに受験対策が可能です。',
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            icon: TrendingUp,
            title: 'データ駆動型の提案',
            description: '過去の合格者データや進路実績に基づいたリアルなアドバイスを提供します。',
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
        },
        {
            icon: Target,
            title: '志望校合格への道筋',
            description: 'あなたの学力や希望に合わせた具体的な進路プランを提案。合格までのロードマップを作成。',
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
        },
    ];

    return (
        <section className="py-20">
            <div className="mx-auto max-w-6xl px-4">
                <div className="mb-16 text-center">
                    <h2 className="text-3xl font-bold md:text-4xl">UniNaviの特徴</h2>
                    <p className="text-muted-foreground mt-4 text-lg">
                        最新テクノロジーと豊富なデータで、あなたの進路選択をサポートします
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, index) => (
                        <Card key={index} className="border-0 shadow-lg transition-shadow hover:shadow-xl">
                            <CardHeader className="pb-4">
                                <div
                                    className={`h-12 w-12 rounded-lg ${feature.bgColor} mb-4 flex items-center justify-center`}
                                >
                                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                                </div>
                                <CardTitle className="text-xl">{feature.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-base leading-relaxed">
                                    {feature.description}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
function HowItWorksSection(): ReactElement {
    const steps = [
        {
            step: 1,
            icon: Search,
            title: '条件を入力',
            description: '地域、学部、偏差値などの希望条件を入力してください。',
        },
        {
            step: 2,
            icon: Zap,
            title: 'AIが分析',
            description: 'AIが条件に合った大学を瞬時に検索・分析します。',
        },
        {
            step: 3,
            icon: Target,
            title: '最適な選択肢',
            description: 'あなたにぴったりの大学をランキング形式で提案します。',
        },
        {
            step: 4,
            icon: Heart,
            title: '比較・保存',
            description: '気になる大学をお気に入りに保存して比較検討できます。',
        },
    ];

    return (
        <section className="py-20">
            <div className="mx-auto max-w-6xl px-4">
                <div className="mb-16 text-center">
                    <h2 className="text-3xl font-bold md:text-4xl">使い方はシンプル</h2>
                    <p className="text-muted-foreground mt-4 text-lg">4ステップであなたに最適な大学が見つかります</p>
                </div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {steps.map((step, index) => (
                        <div key={index} className="text-center">
                            <div className="relative">
                                <div className="bg-primary mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full">
                                    <step.icon className="text-primary-foreground h-10 w-10" />
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className="bg-primary/30 absolute top-10 left-full hidden h-0.5 w-full -translate-y-1/2 transform lg:block"
                                        style={{ width: 'calc(100vw / 4 - 5rem)' }}
                                    />
                                )}
                            </div>
                            <div className="bg-muted/50 rounded-lg p-6">
                                <div className="text-primary mb-2 text-sm font-semibold">STEP {step.step}</div>
                                <h3 className="mb-3 text-xl font-bold">{step.title}</h3>
                                <p className="text-muted-foreground">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function CTASection(): ReactElement {
    return (
        <section className="py-20">
            <div className="mx-auto max-w-4xl px-4 text-center">
                <h2 className="mb-6 text-3xl font-bold md:text-4xl">いますぐに検索してみましょう</h2>
                <p className="text-muted-foreground mb-8 text-lg">
                    会員登録不要・完全無料で、全国の大学情報を検索できます。
                    あなたの未来を決める大切な選択を、UniNaviがサポートします。
                </p>
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                    <Button asChild size="lg" className="px-8 py-6 text-lg">
                        <Link href="/search">
                            <Search className="mr-2 h-5 w-5" />
                            今すぐ大学検索を始める
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>
                <div className="text-muted-foreground mt-8 flex items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        完全無料
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        登録不要
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        いつでも利用可能
                    </div>
                </div>
            </div>
        </section>
    );
}

export function LandingPage(): ReactElement {
    return (
        <div className="min-h-screen">
            <HeroSection />
            <FeaturesSection />
            <HowItWorksSection />
            <CTASection />
        </div>
    );
}
