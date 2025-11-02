import type { ReactElement } from 'react';

interface TechItem {
    category: string;
    items: string[];
}

const TECH_STACK: TechItem[] = [
    {
        category: 'Framework',
        items: ['Next.js 16 (App Router)', 'React 19'],
    },
    {
        category: 'Language',
        items: ['TypeScript 5', 'ESNext targeting'],
    },
    {
        category: 'Styling',
        items: ['Tailwind CSS v4', 'Geist Sans Typography'],
    },
    {
        category: 'UI Layer',
        items: ['Shadcn UI', 'Radix Primitives', 'Lucide Icons'],
    },
];

export function TechStackSection(): ReactElement {
    return (
        <section id="tech-stack" className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
                <p className="text-primary text-sm font-semibold tracking-wider uppercase">Tech Stack</p>
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Best-in-class defaults</h2>
                <p className="text-muted-foreground text-base">
                    Preconfigured dependencies chosen for developer velocity, accessible interfaces, and production
                    readiness.
                </p>
            </header>
            <div className="grid gap-4 sm:grid-cols-2">
                {TECH_STACK.map((tech) => (
                    <article
                        key={tech.category}
                        className="bg-card/60 flex flex-col gap-3 rounded-2xl border p-6 shadow-sm"
                    >
                        <h3 className="text-foreground text-lg font-semibold">{tech.category}</h3>
                        <ul className="text-muted-foreground space-y-2 text-sm">
                            {tech.items.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </article>
                ))}
            </div>
        </section>
    );
}
