import type { ReactElement } from 'react';

export function GettingStartedSection(): ReactElement {
    return (
        <section id="getting-started" className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
                <p className="text-primary text-sm font-semibold tracking-wider uppercase">Getting Started</p>
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Spin up your project in minutes</h2>
                <p className="text-muted-foreground text-base">
                    Clone the repository, install dependencies, and launch the development server. Preconfigured scripts
                    keep formatting, linting, and type checks consistent across your team.
                </p>
            </header>
            <ol className="bg-card/50 text-muted-foreground grid gap-4 rounded-2xl border p-6 text-base sm:grid-cols-2">
                <li className="bg-background flex flex-col gap-2 rounded-xl p-4 shadow-sm">
                    <span className="text-primary text-sm font-semibold tracking-wide uppercase">1. Clone</span>
                    <code className="bg-muted text-foreground rounded-md px-3 py-2 font-mono text-sm">
                        git clone https://github.com/YuuOhnuki/nextjs-startar
                    </code>
                </li>
                <li className="bg-background flex flex-col gap-2 rounded-xl p-4 shadow-sm">
                    <span className="text-primary text-sm font-semibold tracking-wide uppercase">2. Install</span>
                    <code className="bg-muted text-foreground rounded-md px-3 py-2 font-mono text-sm">bun install</code>
                </li>
                <li className="bg-background flex flex-col gap-2 rounded-xl p-4 shadow-sm">
                    <span className="text-primary text-sm font-semibold tracking-wide uppercase">3. Start</span>
                    <code className="bg-muted text-foreground rounded-md px-3 py-2 font-mono text-sm">bun dev</code>
                </li>
                <li className="bg-background flex flex-col gap-2 rounded-xl p-4 shadow-sm">
                    <span className="text-primary text-sm font-semibold tracking-wide uppercase">
                        4. Enforce Quality
                    </span>
                    <div className="grid gap-1">
                        <code className="bg-muted text-foreground rounded-md px-3 py-2 font-mono text-sm">
                            bun run lint
                        </code>
                        <code className="bg-muted text-foreground rounded-md px-3 py-2 font-mono text-sm">
                            bun run format
                        </code>
                        <code className="bg-muted text-foreground rounded-md px-3 py-2 font-mono text-sm">
                            bun run typecheck
                        </code>
                    </div>
                </li>
            </ol>
        </section>
    );
}
