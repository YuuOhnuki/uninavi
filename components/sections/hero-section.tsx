import type { ReactElement } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function HeroSection(): ReactElement {
    return (
        <section
            id="hero"
            className="from-primary/5 via-background to-secondary/30 flex flex-col gap-8 rounded-3xl border bg-gradient-to-r px-6 py-14 shadow-xl sm:px-12"
        >
            <div className="flex flex-col gap-4">
                <Badge className="border-primary/10 bg-primary/10 text-primary w-fit">
                    Next.js 16 + React 19 Ready
                </Badge>
                <h1 className="text-foreground max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                    Build production-grade dashboards faster with Uvinavi Starter.
                </h1>
                <p className="text-muted-foreground max-w-2xl text-lg">
                    Opinionated Next.js template featuring App Router, Shadcn UI components, Tailwind CSS v4, and fully
                    configured linting, formatting, and type-safety defaults.
                </p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:flex-row">
                <Button asChild size="lg">
                    <Link href="https://github.com/" target="_blank" rel="noreferrer">
                        View GitHub Repository
                    </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                    <Link href="#getting-started">Explore Template</Link>
                </Button>
            </div>
        </section>
    );
}
