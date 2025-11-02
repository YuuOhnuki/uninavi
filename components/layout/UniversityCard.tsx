'use client';

import { Bookmark, BookmarkCheck, ExternalLink, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

export interface University {
    id: string;
    name: string;
    officialUrl: string;
    faculty: string;
    department: string;
    deviationScore: string;
    commonTestScore: string;
    examType: string;
    requiredSubjects: string[];
    examDate: string;
    aiSummary: string;
    sources: string[];
}

interface UniversityCardProps {
    university: University;
    favorite?: boolean;
    onToggleFavorite?: (university: University) => void;
}

/**
 * University information card component with favorite toggle support.
 */
export function UniversityCard({ university, favorite = false, onToggleFavorite }: UniversityCardProps) {
    function handleToggleFavorite() {
        if (!onToggleFavorite) {
            return;
        }
        onToggleFavorite(university);
    }

    return (
        <Card className="border-border/70 h-full shadow-sm transition-all duration-200 hover:shadow-md">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-1">
                    <CardTitle className="text-xl leading-tight font-semibold">
                        <Link
                            href={university.officialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground hover:text-primary flex items-center gap-2 transition"
                        >
                            <span className="truncate" title={university.name}>
                                {university.name}
                            </span>
                            <ExternalLink className="size-4" aria-hidden="true" />
                            <span className="sr-only">公式サイトを新しいタブで開く</span>
                        </Link>
                    </CardTitle>
                    <p className="text-muted-foreground text-sm">
                        {university.faculty}
                        {university.department ? ` / ${university.department}` : ''}
                    </p>
                </div>

                <Button
                    type="button"
                    variant={favorite ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={handleToggleFavorite}
                    aria-pressed={favorite}
                    aria-label={
                        favorite ? `${university.name}をお気に入りから削除` : `${university.name}をお気に入りに追加`
                    }
                    className="shrink-0"
                    disabled={!onToggleFavorite}
                >
                    {favorite ? <BookmarkCheck className="size-5" /> : <Bookmark className="size-5" />}
                </Button>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                    {university.deviationScore && (
                        <Badge className="bg-primary/10 text-primary" variant="secondary">
                            偏差値: {university.deviationScore}
                        </Badge>
                    )}
                    {university.commonTestScore && (
                        <Badge className="bg-secondary/10 text-secondary-foreground" variant="secondary">
                            共テ: {university.commonTestScore}
                        </Badge>
                    )}
                    <Badge variant="outline">{university.examType}</Badge>
                </div>

                {university.requiredSubjects?.length ? (
                    <div className="space-y-2">
                        <p className="text-foreground/80 text-sm font-medium">必要科目</p>
                        <div className="flex flex-wrap gap-1.5">
                            {university.requiredSubjects.map((subject) => (
                                <Badge key={subject} variant="outline" className="text-xs">
                                    {subject}
                                </Badge>
                            ))}
                        </div>
                    </div>
                ) : null}

                {university.examDate ? (
                    <p className="text-muted-foreground text-sm">
                        <span className="text-foreground font-semibold">試験日:</span> {university.examDate}
                    </p>
                ) : null}

                <Separator />

                <div className="border-border/60 bg-muted/30 space-y-2 rounded-lg border p-3">
                    <p className="text-foreground flex items-center gap-2 text-sm font-medium">
                        <Sparkles className="text-primary size-4" aria-hidden="true" />
                        AI要約
                    </p>
                    <p className="text-muted-foreground text-sm leading-relaxed">{university.aiSummary}</p>
                </div>
            </CardContent>

            {university.sources?.length ? (
                <CardFooter className="text-muted-foreground flex flex-wrap gap-2 text-xs">
                    {university.sources.map((source, index) => (
                        <a
                            key={source}
                            href={source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border-border/60 hover:border-primary hover:text-primary rounded-full border px-3 py-1 transition"
                        >
                            出典 {index + 1}
                            <span className="sr-only">(新しいタブで開きます)</span>
                        </a>
                    ))}
                </CardFooter>
            ) : null}
        </Card>
    );
}
