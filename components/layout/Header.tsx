import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAVIGATION_LINKS = [
    { href: '#search', label: '検索' },
    { href: '#favorites', label: 'お気に入り' },
];

const Header = (): React.ReactElement => {
    return (
        <header className="border-border bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
                <Link
                    href="/"
                    className="text-foreground hover:text-primary flex items-center gap-2 text-lg font-semibold transition md:text-xl"
                    aria-label="UniNavi ホームに移動"
                >
                    <span aria-hidden="true" className="text-primary text-2xl">
                        🎓
                    </span>
                    UniNavi
                </Link>

                <nav aria-label="メインナビゲーション" className="md:ml-auto">
                    <ul className="flex flex-wrap items-center gap-2 md:gap-3">
                        {NAVIGATION_LINKS.map(({ href, label }) => (
                            <li key={href}>
                                <Link
                                    href={href}
                                    className={cn(
                                        buttonVariants({ variant: 'ghost', size: 'sm' }),
                                        'justify-start px-3 py-2 text-sm font-medium md:justify-center'
                                    )}
                                >
                                    {label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default Header;
