'use client';

import { type ReactElement } from 'react';

import { type University, UniversityCard } from '@/components/layout/UniversityCard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFavorites } from '@/hooks/use-favorites';

interface FavoritesPanelProps {
    favorites: ReadonlyArray<University>;
    onToggleFavorite: (university: University) => void;
}

interface FavoriteSummaryTableProps {
    summary: Array<[string, number]>;
    total: number;
}

function HeroSection(): ReactElement {
    return (
        <section className="text-center">
            <p className="text-primary/80 text-xs font-medium tracking-[0.3em] uppercase">Favorite Universities</p>
            <h1 className="text-foreground mt-3 text-4xl font-bold md:text-5xl">お気に入り大学</h1>
            <p className="text-muted-foreground mt-4 text-lg md:text-xl">
                気になる大学を保存して、あとから一覧で比較できます。
            </p>
        </section>
    );
}

function FavoriteSummaryTable({ summary, total }: FavoriteSummaryTableProps): ReactElement | null {
    if (summary.length === 0) {
        return null;
    }

    return (
        <div className="border-border/60 bg-muted/40 rounded-lg border">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
                <p className="text-foreground text-sm font-medium">お気に入り内訳</p>
                <Badge variant="secondary">合計 {total} 件</Badge>
            </div>
            <Separator />
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-2/3">入試形態</TableHead>
                        <TableHead className="w-1/3 text-right">件数</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {summary.map(([examType, count]) => (
                        <TableRow key={examType}>
                            <TableCell className="text-foreground text-sm">{examType}</TableCell>
                            <TableCell className="text-right">
                                <Badge variant="outline">{count} 件</Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

function FavoritesEmptyState(): ReactElement {
    return (
        <div className="border-border/70 bg-muted/30 text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
            <p className="text-foreground font-medium">お気に入りに登録した大学はありません。</p>
            <p className="text-muted-foreground/80 mt-2 text-xs">
                検索結果から「ブックマーク」アイコンを押すと、この一覧に追加されます。
            </p>
        </div>
    );
}

function FavoritesPanel({ favorites, onToggleFavorite }: FavoritesPanelProps): ReactElement {
    const examTypeSummary = favorites.reduce<Record<string, number>>((accumulator, university) => {
        const type = university.examType.trim() || '未設定';
        accumulator[type] = (accumulator[type] ?? 0) + 1;
        return accumulator;
    }, {});
    const summaryEntries = Object.entries(examTypeSummary).sort(([, a], [, b]) => b - a);

    return (
        <section className="space-y-6">
            {favorites.length === 0 ? (
                <FavoritesEmptyState />
            ) : (
                <>
                    <FavoriteSummaryTable summary={summaryEntries} total={favorites.length} />
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {favorites.map((university) => (
                            <UniversityCard
                                key={`${university.id}-${university.faculty}-${university.examType}-favorite`}
                                university={university}
                                favorite
                                onToggleFavorite={onToggleFavorite}
                            />
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}

export function FavoritesClient(): ReactElement {
    const { favorites, toggleFavorite } = useFavorites();

    return (
        <div className="space-y-12">
            <HeroSection />
            <FavoritesPanel favorites={favorites} onToggleFavorite={toggleFavorite} />
        </div>
    );
}
