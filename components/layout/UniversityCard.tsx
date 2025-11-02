'use client';

import { useMemo } from 'react';
import { Bookmark, BookmarkCheck, ExternalLink, Info, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AddScheduleDialog } from '@/components/layout/AddScheduleDialog';
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
    examSchedules?: string[];
    admissionMethods?: string[];
    subjectHighlights?: string[];
    commonTestRatio?: string;
    selectionNotes?: string;
    applicationDeadline?: string;
    institutionType?: string; // 国立/公立/私立
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

    const {
        requiredSubjectChips,
        optionalSubjectChips,
        commonTestDetails,
        secondaryExamDetails,
        externalExamDetails,
    } = useMemo(() => {
        const normalize = (value: string) => value.trim();

        const requiredSubjectChips = (university.requiredSubjects ?? []).map((subject, index) => ({
            id: `${subject}-${index}`,
            label: normalize(subject),
            type: 'required' as const,
        }));

        const optionalCandidates = (university.subjectHighlights ?? []).filter((entry) =>
            /選択|or|または|から選択|選択科目/i.test(entry)
        );
        const optionalSubjectChips = optionalCandidates.map((entry, index) => ({
            id: `${entry}-${index}`,
            label: normalize(entry),
            type: 'optional' as const,
        }));

        const extractByKeyword = (entries: string[] | undefined, regex: RegExp) =>
            (entries ?? []).filter((entry) => regex.test(entry));

        const commonTestDetails = extractByKeyword(
            [...(university.subjectHighlights ?? []), ...(university.admissionMethods ?? [])],
            /(共通テスト|共テ)/
        );

        const secondaryExamDetails = extractByKeyword(
            [...(university.subjectHighlights ?? []), ...(university.admissionMethods ?? [])],
            /(二次|個別試験|筆記|面接|小論文)/
        );

        const externalExamDetails = extractByKeyword(
            [...(university.subjectHighlights ?? []), university.selectionNotes ?? ''],
            /(英検|TOEIC|TOEFL|IELTS|TEAP|GTEC|外部試験|外部英語)/
        );

        return {
            requiredSubjectChips,
            optionalSubjectChips,
            commonTestDetails,
            secondaryExamDetails,
            externalExamDetails,
        };
    }, [university]);

    return (
        <Card className="border-border/70 h-full shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-xl leading-tight font-semibold">
                            {university.officialUrl ? (
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
                            ) : (
                                <span className="text-foreground flex items-center gap-2" title={university.name}>
                                    {university.name}
                                </span>
                            )}
                        </CardTitle>
                        {university.institutionType && (
                            <Badge 
                                variant="outline" 
                                className={`text-xs font-medium ${
                                    university.institutionType === '国立' 
                                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                        : university.institutionType === '公立' 
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : 'bg-orange-50 text-orange-700 border-orange-200'
                                }`}
                            >
                                {university.institutionType}
                            </Badge>
                        )}
                    </div>
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
                    className="shrink-0 transition-transform hover:scale-110"
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
                            {university.requiredSubjects.map((subject, index) => (
                                <Badge key={`${subject}-${index}`} variant="outline" className="text-xs">
                                    {subject}
                                </Badge>
                            ))}
                        </div>
                    </div>
                ) : null}

                <div className="text-muted-foreground space-y-1 text-sm">
                    {university.examDate ? (
                        <p>
                            <span className="text-foreground font-semibold">試験日:</span> {university.examDate}
                        </p>
                    ) : null}
                    {university.applicationDeadline ? (
                        <p>
                            <span className="text-foreground font-semibold">出願締切:</span>{' '}
                            {university.applicationDeadline}
                        </p>
                    ) : null}
                    {university.commonTestRatio ? (
                        <p>
                            <span className="text-foreground font-semibold">共テ比率:</span>{' '}
                            {university.commonTestRatio}
                        </p>
                    ) : null}
                    {university.selectionNotes ? (
                        <p>
                            <span className="text-foreground font-semibold">特記事項:</span> {university.selectionNotes}
                        </p>
                    ) : null}
                </div>

                {(university.examSchedules?.length ?? 0) > 0 && (
                    <div className="space-y-2">
                        <p className="text-foreground/80 text-sm font-medium">入試スケジュール</p>
                        <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
                            {university.examSchedules!.map((item, index) => (
                                <li key={`${item}-${index}`}>{item}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {(university.admissionMethods?.length ?? 0) > 0 && (
                    <div className="space-y-2">
                        <p className="text-foreground/80 text-sm font-medium">入試方式</p>
                        <div className="space-y-2">
                            {university.admissionMethods!.map((method, index) => {
                                const isCommonTest = /共通テスト|共テ/.test(method);
                                return (
                                    <div key={`${method}-${index}`} className="flex items-start gap-2">
                                        {isCommonTest && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {university.requiredSubjects?.map((subject, subjIndex) => (
                                                    <Badge 
                                                        key={`${subject}-${subjIndex}`} 
                                                        variant="outline" 
                                                        className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                                    >
                                                        {subject}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-muted-foreground text-sm leading-relaxed">{method}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {(university.subjectHighlights?.length ?? 0) > 0 && (
                    <div className="space-y-2">
                        <p className="text-foreground/80 text-sm font-medium">科目・配点のポイント</p>
                        <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
                            {university.subjectHighlights!.map((item, index) => (
                                <li key={`${item}-${index}`}>{item}</li>
                            ))}
                        </ul>
                    </div>
                )}

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
                    <UniversityDetailDialog
                        university={university}
                        requiredSubjectChips={requiredSubjectChips}
                        optionalSubjectChips={optionalSubjectChips}
                        commonTestDetails={commonTestDetails}
                        secondaryExamDetails={secondaryExamDetails}
                        externalExamDetails={externalExamDetails}
                    />
                </CardFooter>
            ) : null}
        </Card>
    );
}

interface SubjectChip {
    id: string;
    label: string;
    type: 'required' | 'optional';
}

interface UniversityDetailDialogProps {
    university: University;
    requiredSubjectChips: SubjectChip[];
    optionalSubjectChips: SubjectChip[];
    commonTestDetails: string[];
    secondaryExamDetails: string[];
    externalExamDetails: string[];
}

function UniversityDetailDialog({
    university,
    requiredSubjectChips,
    optionalSubjectChips,
    commonTestDetails,
    secondaryExamDetails,
    externalExamDetails,
}: UniversityDetailDialogProps) {
    const hasDetailedInfo =
        requiredSubjectChips.length > 0 ||
        optionalSubjectChips.length > 0 ||
        commonTestDetails.length > 0 ||
        secondaryExamDetails.length > 0 ||
        externalExamDetails.length > 0 ||
        Boolean(university.selectionNotes);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="gap-2">
                    <Info className="size-4" aria-hidden="true" />
                    詳細を見る
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{university.name}</DialogTitle>
                    <DialogDescription>
                        {university.faculty}
                        {university.department ? ` / ${university.department}` : ''}
                    </DialogDescription>
                </DialogHeader>

                <section className="space-y-4">
                    <DetailSection title="科目構成">
                        {requiredSubjectChips.length > 0 ? (
                            <div>
                                <p className="text-muted-foreground mb-2 text-sm">必須科目</p>
                                <div className="flex flex-wrap gap-2">
                                    {requiredSubjectChips.map((chip) => (
                                        <Badge key={chip.id} className="bg-primary/10 text-primary" variant="secondary">
                                            {chip.label}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">必須科目情報は未入力です。</p>
                        )}

                        {optionalSubjectChips.length > 0 ? (
                            <div className="pt-3">
                                <p className="text-muted-foreground mb-2 text-sm">選択科目・選択条件</p>
                                <ul className="text-sm leading-relaxed text-foreground/80 space-y-1">
                                    {optionalSubjectChips.map((chip) => (
                                        <li key={chip.id}>{chip.label}</li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}
                    </DetailSection>

                    <DetailSection title="共通テストで必要な科目">
                        {commonTestDetails.length > 0 ? (
                            <ul className="text-sm leading-relaxed text-foreground/80 space-y-1">
                                {commonTestDetails.map((item, index) => (
                                    <li key={`${item}-${index}`}>{item}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground text-sm">共通テストに関する詳細は未記載です。</p>
                        )}
                    </DetailSection>

                    <DetailSection title="二次試験・個別試験">
                        {secondaryExamDetails.length > 0 ? (
                            <ul className="text-sm leading-relaxed text-foreground/80 space-y-1">
                                {secondaryExamDetails.map((item, index) => (
                                    <li key={`${item}-${index}`}>{item}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground text-sm">二次試験に関する詳細は未記載です。</p>
                        )}
                    </DetailSection>

                    <DetailSection title="入試方式の特徴">
                        {university.admissionMethods?.length ? (
                            <ul className="text-sm leading-relaxed text-foreground/80 space-y-1">
                                {university.admissionMethods.map((item, index) => (
                                    <li key={`${item}-${index}`}>{item}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground text-sm">入試方式に関する詳細は未記載です。</p>
                        )}
                    </DetailSection>

                    <DetailSection title="外部検定の利用">
                        {externalExamDetails.length > 0 ? (
                            <ul className="text-sm leading-relaxed text-foreground/80 space-y-1">
                                {externalExamDetails.map((item, index) => (
                                    <li key={`${item}-${index}`}>{item}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground text-sm">外部検定の利用情報は確認できませんでした。</p>
                        )}
                    </DetailSection>

                    {university.commonTestRatio ? (
                        <DetailSection title="配点比率">
                            <p className="text-sm text-foreground/80">{university.commonTestRatio}</p>
                        </DetailSection>
                    ) : null}

                    {university.selectionNotes ? (
                        <DetailSection title="特記事項">
                            <p className="text-sm leading-relaxed text-foreground/80">{university.selectionNotes}</p>
                        </DetailSection>
                    ) : null}

                    {!hasDetailedInfo ? (
                        <p className="text-muted-foreground text-sm">
                            入試科目や方式に関する詳細情報は現在取得できませんでした。公式サイトのリンクをご確認ください。
                        </p>
                    ) : null}
                </section>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <div className="flex gap-2 w-full sm:w-auto">
                        <AddScheduleDialog
                            university={university}
                            trigger={
                                <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    カレンダーに追加
                                </Button>
                            }
                        />
                        <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-none">
                            <a href={university.officialUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                公式サイト
                            </a>
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface DetailSectionProps {
    title: string;
    children: React.ReactNode;
}

function DetailSection({ title, children }: DetailSectionProps) {
    return (
        <section className="space-y-2">
            <h3 className="text-foreground text-sm font-semibold tracking-wide">{title}</h3>
            {children}
        </section>
    );
}
