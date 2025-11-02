import type { ReactElement, ReactNode } from 'react';
import { RocketIcon, ShieldCheckIcon, SparklesIcon } from 'lucide-react';

interface FeatureItem {
    title: string;
    description: string;
    icon: ReactNode;
}

const FEATURES: FeatureItem[] = [
    {
        title: 'Modern stack defaults',
        description: 'Next.js 16 App Router with React 19 streaming and server actions enabled out of the box.',
        icon: <RocketIcon className="text-primary size-9" aria-hidden />,
    },
    {
        title: 'Accessible UI primitives',
        description: 'Shadcn UI components powered by Radix primitives for consistent a11y across devices.',
        icon: <SparklesIcon className="text-primary size-9" aria-hidden />,
    },
    {
        title: 'Quality gates included',
        description: 'Strict ESLint, Prettier (Tailwind plugin), and TypeScript checks ready for CI pipelines.',
        icon: <ShieldCheckIcon className="text-primary size-9" aria-hidden />,
    },
];

export function FeaturesSection(): ReactElement {
    return (
        <section id="features" className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
                <p className="text-primary text-sm font-semibold tracking-wider uppercase">Feature Highlights</p>
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Everything you need to ship fast</h2>
                <p className="text-muted-foreground text-base">
                    A curated selection of DX improvements to keep teams focused on building product experiences, not
                    project setup.
                </p>
            </header>
            <div className="grid gap-6 sm:grid-cols-3">
                {FEATURES.map((feature) => (
                    <article
                        key={feature.title}
                        className="bg-card/60 flex flex-col gap-3 rounded-2xl border p-6 shadow-sm"
                    >
                        <div className="bg-primary/10 flex size-12 items-center justify-center rounded-xl">
                            {feature.icon}
                        </div>
                        <h3 className="text-foreground text-xl font-semibold tracking-tight">{feature.title}</h3>
                        <p className="text-muted-foreground text-base">{feature.description}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}
