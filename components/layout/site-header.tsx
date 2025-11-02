import type { ReactElement } from 'react';
import Link from 'next/link';

interface NavItem {
    href: string;
    label: string;
}

const NAV_ITEMS: NavItem[] = [
    {
        href: '#getting-started',
        label: 'Getting Started',
    },
    {
        href: '#features',
        label: 'Features',
    },
    {
        href: '#tech-stack',
        label: 'Tech Stack',
    },
    {
        href: '#tooling',
        label: 'Tooling',
    },
];

export function SiteHeader(): ReactElement {
    return (
        <header className="bg-background/95 supports-[backdrop-filter]:bg-background/75 sticky top-0 z-50 border-b backdrop-blur">
            <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
                <Link href="/" className="text-base font-semibold tracking-tight">
                    Nextjs Starter
                </Link>
                <nav aria-label="Primary" className="hidden gap-6 text-sm font-medium md:flex">
                    {NAV_ITEMS.map((item) => (
                        <Link key={item.href} href={item.href} className="hover:text-primary transition-colors">
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <Link
                    href="https://github.com/YuuOhnuki/nextjs-startar"
                    className="hover:bg-muted rounded-md border px-3 py-1.5 text-sm font-medium transition"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    GitHub
                </Link>
            </div>
        </header>
    );
}
