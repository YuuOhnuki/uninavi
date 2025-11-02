'use client';

import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

import { ChatDrawer } from '@/components/layout/ChatDrawer';
import { SearchFilters, SearchForm } from '@/components/layout/SearchForm';
import { type University, UniversityCard } from '@/components/layout/UniversityCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFavorites } from '@/hooks/use-favorites';

const SKELETON_PLACEHOLDERS = [1, 2, 3];

type ProgressState = {
    stage: string;
    message: string;
    current?: number;
    total?: number;
};

const MOCK_UNIVERSITIES: ReadonlyArray<University> = [
    {
        id: '1',
        name: '東京工業大学',
        officialUrl: 'https://www.titech.ac.jp/',
        faculty: '情報理工学院',
        department: '情報工学系',
        deviationScore: '65-70',
        commonTestScore: '85-90%',
        examType: '一般選抜',
        requiredSubjects: ['数学', '理科', '英語'],
        examDate: '2025年2月25日',
        aiSummary: '情報工学分野で日本トップクラスの研究環境を誇る。AI・機械学習の研究が盛んで、産学連携も充実。',
        sources: ['https://www.titech.ac.jp/', 'https://admissions.titech.ac.jp/'],
        examSchedules: ['願書受付: 2024年12月1日', '出願締切: 2025年1月15日', '試験日: 2025年2月25日'],
        admissionMethods: ['一般選抜: 前期日程 3教科型', '共通テスト利用型: 数学・英語重視'],
        subjectHighlights: ['数学: 200点', '理科: 150点', '英語: 150点'],
        commonTestRatio: '共通テスト60% / 個別試験40%',
        selectionNotes: '共通テスト利用型は英語外部検定換算可',
        applicationDeadline: '2025年1月15日',
    },
    {
        id: '2',
        name: '早稲田大学',
        officialUrl: 'https://www.waseda.jp/',
        faculty: '基幹理工学部',
        department: '情報理工学科',
        deviationScore: '60-65',
        commonTestScore: '80-85%',
        examType: '一般選抜',
        requiredSubjects: ['数学', '理科', '英語'],
        examDate: '2025年2月20日',
        aiSummary: '伝統ある私立大学の理工学部。幅広い分野の研究が可能で、就職実績も良好。国際交流プログラムも充実。',
        sources: ['https://www.waseda.jp/'],
        examSchedules: ['願書受付: 2024年12月15日', '出願締切: 2025年1月25日', '試験日: 2025年2月20日'],
        admissionMethods: ['一般選抜: 3教科型', '共通テスト利用型: ボーダーフリー方式'],
        subjectHighlights: ['数学: 150点', '英語: 150点', '理科: 150点'],
        commonTestRatio: '共通テスト40% / 個別試験60%',
        selectionNotes: '共通テスト利用型はボーダーフリー方式あり',
        applicationDeadline: '2025年1月25日',
    },
    {
        id: '3',
        name: '慶應義塾大学',
        officialUrl: 'https://www.keio.ac.jp/',
        faculty: '理工学部',
        department: '情報工学科',
        deviationScore: '62-67',
        commonTestScore: '82-87%',
        examType: '一般選抜',
        requiredSubjects: ['数学', '理科', '英語'],
        examDate: '2025年2月18日',
        aiSummary: '総合力の高い理工学部。産業界とのつながりが強く、実践的な教育が特徴。キャンパス環境も優れている。',
        sources: ['https://www.keio.ac.jp/'],
        examSchedules: ['願書受付: 2024年12月12日', '出願締切: 2025年1月22日', '試験日: 2025年2月18日'],
        admissionMethods: ['一般選抜: 前期・後期', '共通テスト利用型: 高得点科目重視'],
        subjectHighlights: ['数学: 180点', '英語: 180点', '理科: 140点'],
        commonTestRatio: '共通テスト50% / 個別試験50%',
        selectionNotes: '共通テスト利用型は英語外部試験加点あり',
        applicationDeadline: '2025年1月22日',
    },
];

const PROGRESS_STAGE_LABELS: Record<string, string> = {
    initializing: '準備中',
    query_built: 'クエリ生成',
    searching: '検索中',
    search_complete: '検索完了',
    summarizing: '要約生成中',
    summarize_complete: '要約完了',
    completed: '完了',
};

interface SearchTabsSectionProps {
    isLoading: boolean;
    onSearch: (filters: SearchFilters) => void;
    favorites: ReadonlyArray<University>;
    onToggleFavorite: (university: University) => void;
}

interface FavoritesPanelProps {
    favorites: ReadonlyArray<University>;
    onToggleFavorite: (university: University) => void;
}

interface FavoriteSummaryTableProps {
    summary: Array<[string, number]>;
    total: number;
}

interface SearchStatusSectionProps {
    isLoading: boolean;
    progress: ProgressState | null;
    progressValue: number;
    universitiesCount: number;
    expectedResults: number | null;
}

interface ProgressInsightTableProps {
    progress: ProgressState | null;
    progressValue: number;
    universitiesCount: number;
    expectedResults: number | null;
}

interface ResultsSectionProps {
    universities: ReadonlyArray<University>;
    expectedResults: number | null;
    onToggleFavorite: (university: University) => void;
    isFavorite: (university: University) => boolean;
}

interface EmptyStateSectionProps {
    visible: boolean;
}

interface SearchErrorAlertProps {
    error: string | null;
}

function HeroSection(): ReactElement {
    return (
        <section className="text-center">
            <p className="text-primary/80 text-xs font-medium tracking-[0.3em] uppercase">University Navigator</p>
            <h1 className="text-foreground mt-3 text-4xl font-bold md:text-5xl">UniNavi へようこそ</h1>
            <p className="text-muted-foreground mt-4 text-lg md:text-xl">
                AIが大学情報を検索・要約してお届けします。あなたにぴったりの進路を見つけましょう。
            </p>
        </section>
    );
}

function SearchTabsSection({ isLoading, onSearch, favorites, onToggleFavorite }: SearchTabsSectionProps): ReactElement {
    return (
        <section id="search" className="space-y-6">
            <Tabs defaultValue="search" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="search">検索</TabsTrigger>
                    <TabsTrigger value="favorites">お気に入り</TabsTrigger>
                </TabsList>
                <TabsContent value="search" className="space-y-6">
                    <SearchForm onSearch={onSearch} isLoading={isLoading} />
                </TabsContent>
                <TabsContent value="favorites" className="space-y-6">
                    <FavoritesPanel favorites={favorites} onToggleFavorite={onToggleFavorite} />
                </TabsContent>
            </Tabs>
        </section>
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
        <Card className="shadow-sm">
            <CardHeader className="space-y-2">
                <CardTitle className="text-foreground text-xl font-semibold">お気に入り一覧</CardTitle>
                <CardDescription className="text-muted-foreground text-sm">
                    気になる大学を保存して、あとから一覧で比較できます。
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
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
            </CardContent>
        </Card>
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

function SearchStatusSection({
    isLoading,
    progress,
    progressValue,
    universitiesCount,
    expectedResults,
}: SearchStatusSectionProps): ReactElement | null {
    if (!isLoading && !progress) {
        return null;
    }

    const showSkeletons = isLoading && universitiesCount === 0;

    return (
        <section aria-live="polite" aria-busy={isLoading} className="space-y-4">
            <Card className="border-border/70 mx-auto shadow-sm">
                <CardContent className="space-y-6 p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <p className="text-primary/80 text-sm font-medium">検索ステータス</p>
                            <h2 className="text-foreground text-xl font-semibold">進捗状況</h2>
                        </div>
                        {isLoading ? (
                            <Loader2 className="text-primary h-5 w-5 animate-spin" aria-hidden="true" />
                        ) : null}
                    </div>
                    <div className="space-y-2" aria-live="polite">
                        <Progress value={progressValue} aria-label="検索進捗" />
                        <p className="text-muted-foreground text-sm">
                            {progress?.message ?? '検索ステータスを更新中です...'}
                        </p>
                    </div>
                    <ProgressInsightTable
                        progress={progress}
                        progressValue={progressValue}
                        universitiesCount={universitiesCount}
                        expectedResults={expectedResults}
                    />
                </CardContent>
            </Card>
            {showSkeletons ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {SKELETON_PLACEHOLDERS.map((item) => (
                        <Card key={item} className="shadow-sm">
                            <CardContent className="space-y-4 p-6">
                                <Skeleton className="h-6 w-2/3" />
                                <Skeleton className="h-4 w-1/2" />
                                <Separator className="my-4" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-6 w-20" />
                                    <Skeleton className="h-6 w-16" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : null}
        </section>
    );
}

function ProgressInsightTable({
    progress,
    progressValue,
    universitiesCount,
    expectedResults,
}: ProgressInsightTableProps): ReactElement {
    const stageKey = progress?.stage ?? 'processing';
    const stageLabel = PROGRESS_STAGE_LABELS[stageKey] ?? '処理中';
    const message = progress?.message ?? '検索ステータスを更新中です...';
    const processedLabel =
        progress?.current !== undefined && progress?.total !== undefined
            ? `${progress.current} / ${progress.total}`
            : null;
    const roundedProgress = Math.round(progressValue);

    return (
        <div className="border-border/60 bg-muted/40 rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-1/3">指標</TableHead>
                        <TableHead>内容</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell className="text-foreground text-sm font-medium">ステージ</TableCell>
                        <TableCell>
                            <Badge variant="secondary">{stageLabel}</Badge>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="text-foreground text-sm font-medium">最新メッセージ</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{message}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="text-foreground text-sm font-medium">取得済み件数</TableCell>
                        <TableCell>
                            <Badge variant="outline">{universitiesCount} 件</Badge>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="text-foreground text-sm font-medium">推定件数</TableCell>
                        <TableCell>
                            <Badge variant="outline">{expectedResults ?? '算出中'}</Badge>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="text-foreground text-sm font-medium">進捗率</TableCell>
                        <TableCell>
                            <Badge variant="default">{roundedProgress}%</Badge>
                        </TableCell>
                    </TableRow>
                    {processedLabel ? (
                        <TableRow>
                            <TableCell className="text-foreground text-sm font-medium">処理済/対象</TableCell>
                            <TableCell>
                                <Badge variant="secondary">{processedLabel}</Badge>
                            </TableCell>
                        </TableRow>
                    ) : null}
                </TableBody>
            </Table>
        </div>
    );
}

function ResultsSection({
    universities,
    expectedResults,
    onToggleFavorite,
    isFavorite,
}: ResultsSectionProps): ReactElement | null {
    if (universities.length === 0) {
        return null;
    }

    return (
        <section aria-live="polite" className="space-y-6" id="favorites">
            <header className="space-y-3">
                <p className="text-primary/80 text-sm font-medium">検索結果</p>
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="default">取得済 {universities.length} 件</Badge>
                    {expectedResults !== null ? <Badge variant="secondary">推定 {expectedResults} 件</Badge> : null}
                </div>
                <p className="text-muted-foreground text-sm">
                    各カードから詳細ページや参考リンクにアクセスして最新情報を確認しましょう。
                </p>
            </header>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {universities.map((university) => (
                    <UniversityCard
                        key={`${university.id}-${university.faculty}-${university.examType}`}
                        university={university}
                        favorite={isFavorite(university)}
                        onToggleFavorite={onToggleFavorite}
                    />
                ))}
            </div>
        </section>
    );
}

function EmptyStateSection({ visible }: EmptyStateSectionProps): ReactElement | null {
    if (!visible) {
        return null;
    }

    return (
        <section className="mx-auto text-center">
            <Card className="shadow-sm">
                <CardContent className="space-y-3 p-8">
                    <h2 className="text-foreground text-xl font-semibold">条件を入力して検索を始めましょう</h2>
                    <p className="text-muted-foreground text-sm">
                        地域や学部、共通テスト利用などを組み合わせると、希望に合った大学を絞り込めます。
                    </p>
                </CardContent>
            </Card>
        </section>
    );
}

function SearchErrorAlert({ error }: SearchErrorAlertProps): ReactElement | null {
    if (!error) {
        return null;
    }

    return (
        <Alert variant="destructive" className="mx-auto">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>検索エラー</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
}

export function HomeClient(): React.ReactElement {
    const { favorites, toggleFavorite, isFavorite, syncFavorite } = useFavorites();
    const [universities, setUniversities] = useState<University[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<ProgressState | null>(null);
    const [progressValue, setProgressValue] = useState<number>(0);
    const [expectedResults, setExpectedResults] = useState<number | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const closeActiveStream = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, []);

    async function handleSearch(filters: SearchFilters) {
        closeActiveStream();

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsLoading(true);
        setError(null);
        setProgressValue(0);
        setProgress({ stage: 'initializing', message: '検索の準備をしています...' });
        setExpectedResults(null);
        setUniversities([]);

        const stageProgress: Record<string, number> = {
            initializing: 5,
            query_built: 15,
            searching: 50,
            search_complete: 65,
            summarizing: 80,
            summarize_complete: 90,
            completed: 100,
        };

        function buildProgressMessage(stage: string, payload: Record<string, unknown>): ProgressState {
            switch (stage) {
                case 'initializing':
                    return { stage, message: '検索の準備をしています...' };
                case 'query_built':
                    return {
                        stage,
                        message: '検索クエリを生成しました。信頼できるサイトから結果を取得します。',
                    };
                case 'searching': {
                    const current = Number(payload.current ?? 0);
                    const total = Number(payload.total ?? 0) || 1;
                    const query = typeof payload.query === 'string' ? payload.query : '';
                    return {
                        stage,
                        message: `検索 ${current} / ${total} 件目 (${query})`,
                        current,
                        total,
                    };
                }
                case 'search_complete':
                    return {
                        stage,
                        message: `検索ステップが完了しました。${payload.results ?? 0} 件の情報源を解析します。`,
                    };
                case 'summarizing':
                    return {
                        stage,
                        message: `AIが${payload.sources ?? 0}件の情報を要約しています...`,
                    };
                case 'summarize_complete':
                    return {
                        stage,
                        message: '要約が完了しました。結果を整理しています。',
                    };
                case 'completed':
                    return {
                        stage,
                        message: `検索が完了しました。`,
                    };
                default:
                    return {
                        stage,
                        message: '検索を実行しています...',
                    };
            }
        }

        function updateProgress(stage: string, payload: Record<string, unknown>) {
            const progressState = buildProgressMessage(stage, payload);
            setProgress(progressState);

            if (stage === 'searching') {
                const current = Number(payload.current ?? 0);
                const total = Number(payload.total ?? 0) || 1;
                const value = 15 + Math.min(current / total, 1) * 35;
                setProgressValue((prev) => Math.max(prev, Math.min(95, value)));
                return;
            }

            const mapped = stageProgress[stage] ?? progressValue;
            setProgressValue((prev) => Math.max(prev, mapped));
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'text/event-stream',
                },
                body: JSON.stringify(filters),
                signal: controller.signal,
            });

            if (!response.ok || !response.body) {
                throw new Error('検索APIから正しいレスポンスが得られませんでした。');
            }

            const reader = response.body.getReader();
            const textDecoder = new TextDecoder('utf-8');
            let buffer = '';
            let hasError = false;

            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    break;
                }

                buffer += textDecoder.decode(value, { stream: true });

                let eventBoundary = buffer.indexOf('\n\n');
                while (eventBoundary !== -1) {
                    const rawEvent = buffer.slice(0, eventBoundary);
                    buffer = buffer.slice(eventBoundary + 2);
                    eventBoundary = buffer.indexOf('\n\n');

                    const lines = rawEvent.split('\n');
                    let eventType = 'message';
                    const dataLines: string[] = [];

                    for (const line of lines) {
                        if (line.startsWith('event:')) {
                            eventType = line.replace('event:', '').trim();
                        } else if (line.startsWith('data:')) {
                            dataLines.push(line.replace('data:', '').trim());
                        }
                    }

                    const dataString = dataLines.join('\n');
                    let payload: Record<string, unknown> = {};
                    if (dataString) {
                        try {
                            payload = JSON.parse(dataString);
                        } catch (parseError) {
                            console.error('Failed to parse SSE payload:', parseError, dataString);
                        }
                    }

                    if (eventType === 'progress' && payload.stage) {
                        updateProgress(String(payload.stage), payload);
                    }

                    if (eventType === 'result' && payload.university) {
                        const university = payload.university as University;
                        setExpectedResults(Number(payload.total ?? 0) || null);
                        setUniversities((prev) => {
                            const exists = prev.some(
                                (item) =>
                                    item.id === university.id &&
                                    item.faculty === university.faculty &&
                                    item.examType === university.examType
                            );
                            if (exists) {
                                syncFavorite(university);
                                return prev;
                            }
                            if (isFavorite(university)) {
                                toggleFavorite(university);
                                toggleFavorite(university);
                            }
                            return [...prev, university];
                        });

                        const total = Number(payload.total ?? 0);
                        if (total > 0) {
                            const index = Number(payload.index ?? 0);
                            const streamedProgress = 90 + Math.min(index / total, 1) * 10;
                            setProgressValue((prev) => Math.max(prev, streamedProgress));
                        }
                    }

                    if (eventType === 'complete') {
                        updateProgress('completed', payload);
                        setProgressValue(100);
                    }

                    if (eventType === 'error') {
                        hasError = true;
                        setError(
                            typeof payload.message === 'string' ? payload.message : '検索処理でエラーが発生しました。'
                        );
                    }
                }
            }

            if (buffer.trim().length > 0) {
                console.debug('Unprocessed SSE buffer:', buffer);
            }

            if (hasError && universities.length === 0) {
                setUniversities(MOCK_UNIVERSITIES.slice());
            }
        } catch (err) {
            if ((err as Error).name === 'AbortError') {
                console.debug('Search aborted');
            } else {
                console.error('Search error:', err);
                setError('検索に失敗しました。バックエンドAPIを設定してください。');
                setUniversities(MOCK_UNIVERSITIES.slice());
            }
        } finally {
            setIsLoading(false);
            setProgressValue((prev) => (prev > 0 && prev < 100 ? 100 : prev));
            abortControllerRef.current = null;
        }
    }

    const handleSearchCallback = useCallback(
        (filters: SearchFilters) => {
            void handleSearch(filters);
        },
        [handleSearch]
    );

    useEffect(() => {
        return () => {
            closeActiveStream();
        };
    }, [closeActiveStream]);

    const hasResults = universities.length > 0;

    return (
        <>
            <div className="space-y-12">
                <HeroSection />

                <SearchTabsSection
                    isLoading={isLoading}
                    onSearch={handleSearchCallback}
                    favorites={favorites}
                    onToggleFavorite={toggleFavorite}
                />

                <SearchErrorAlert error={error} />

                <SearchStatusSection
                    isLoading={isLoading}
                    progress={progress}
                    progressValue={progressValue}
                    universitiesCount={universities.length}
                    expectedResults={expectedResults}
                />

                <ResultsSection
                    universities={universities}
                    expectedResults={expectedResults}
                    onToggleFavorite={toggleFavorite}
                    isFavorite={isFavorite}
                />

                <EmptyStateSection visible={!isLoading && !hasResults && !error} />
            </div>

            <ChatDrawer />
        </>
    );
}
