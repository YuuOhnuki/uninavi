import type { ReactElement } from 'react';
import { Code2Icon, PackageIcon, WorkflowIcon } from 'lucide-react';

interface ToolingItem {
    title: string;
    description: string;
    command: string;
    icon: ReactElement;
}

const TOOLING: ToolingItem[] = [
    {
        title: 'Formatting',
        description: 'Prettier with Tailwind CSS plugin ensures predictable class sorting and style.',
        command: 'bun run format',
        icon: <WorkflowIcon className="text-primary size-7" aria-hidden />,
    },
    {
        title: 'Linting',
        description: 'ESLint (Core Web Vitals) keeps Next.js best practices enforced in CI.',
        command: 'bun run lint',
        icon: <Code2Icon className="text-primary size-7" aria-hidden />,
    },
    {
        title: 'Type Safety',
        description: 'TypeScript strict mode is enabled for early feedback on API regressions.',
        command: 'bun run typecheck',
        icon: <PackageIcon className="text-primary size-7" aria-hidden />,
    },
];

export function ToolingSection(): ReactElement {
    return (
        <section id="tooling" className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
                <p className="text-primary text-sm font-semibold tracking-wider uppercase">Tooling</p>
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Quality gates on autopilot</h2>
                <p className="text-muted-foreground text-base">
                    Run linting, formatting, and type checks through single commands locally or in continuous
                    integration workflows.
                </p>
            </header>
            <div className="grid gap-4 sm:grid-cols-3">
                {TOOLING.map((item) => (
                    <article
                        key={item.title}
                        className="bg-card/60 flex flex-col gap-3 rounded-2xl border p-6 shadow-sm"
                    >
                        <div className="bg-primary/10 flex size-12 items-center justify-center rounded-xl">
                            {item.icon}
                        </div>
                        <div className="flex flex-col gap-2">
                            <h3 className="text-foreground text-lg font-semibold">{item.title}</h3>
                            <p className="text-muted-foreground text-sm">{item.description}</p>
                            <code className="bg-muted text-foreground w-fit rounded-md px-3 py-1.5 font-mono text-xs">
                                {item.command}
                            </code>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
