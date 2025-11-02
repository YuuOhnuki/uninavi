'use client';

import { useMemo, useState } from 'react';
import { Loader2, Search } from 'lucide-react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface SearchFormProps {
    onSearch: (filters: SearchFilters) => void;
    isLoading: boolean;
}

export interface SearchFilters {
    region: string;
    prefecture: string;
    faculty: string;
    examType: string;
    useCommonTest: string;
    deviationScore: string;
    institutionType: string;
    nameKeyword: string;
    commonTestScore: string;
    externalEnglish: string;
    requiredSubjects: string;
    tuitionMax: string;
    scholarship: string;
    qualification: string;
    examSchedule: string;
}

const REGIONS = ['全国', '北海道', '東北', '関東', '中部', '近畿', '中国', '四国', '九州・沖縄'];
const EXAM_TYPES = ['すべて', '一般選抜', '学校推薦型', '総合型選抜'];
const COMMON_TEST_OPTIONS = ['指定なし', 'あり', 'なし'];
const INSTITUTION_TYPES = ['指定なし', '国公立', '私立'];
const EXTERNAL_ENGLISH_OPTIONS = ['指定なし', 'あり', '不要'];
const PREFECTURES = [
    '指定なし',
    '北海道',
    '青森県',
    '岩手県',
    '宮城県',
    '秋田県',
    '山形県',
    '福島県',
    '茨城県',
    '栃木県',
    '群馬県',
    '埼玉県',
    '千葉県',
    '東京都',
    '神奈川県',
    '新潟県',
    '富山県',
    '石川県',
    '福井県',
    '山梨県',
    '長野県',
    '岐阜県',
    '静岡県',
    '愛知県',
    '三重県',
    '滋賀県',
    '京都府',
    '大阪府',
    '兵庫県',
    '奈良県',
    '和歌山県',
    '鳥取県',
    '島根県',
    '岡山県',
    '広島県',
    '山口県',
    '徳島県',
    '香川県',
    '愛媛県',
    '高知県',
    '福岡県',
    '佐賀県',
    '長崎県',
    '熊本県',
    '大分県',
    '宮崎県',
    '鹿児島県',
    '沖縄県',
];
const SUBJECT_OPTIONS = ['数学', '理科', '英語', '地歴', '公民', '小論文', '面接', '実技'];
const MATH_REQUIREMENTS = ['指定しない', 'Ⅰ', 'Ⅰ・A', 'Ⅰ・Ⅱ・A', 'Ⅰ・Ⅱ・A・B', 'Ⅰ・Ⅱ・A・B・C', 'Ⅰ・Ⅱ・Ⅲ・A・B・C'];
const JAPANESE_REQUIREMENTS = ['指定しない', '現代文のみ', '現代文・古文のみ'];
const MONTH_OPTIONS = ['9月', '10月', '11月', '12月', '1月', '2月', '3月'];
const DEFAULT_DEVIATION_RANGE: [number, number] = [35, 75];
const DEFAULT_COMMON_TEST_RANGE: [number, number] = [50, 100];
const DEFAULT_EXAM_DAY_RANGE: [number, number] = [1, 31];
const DEFAULT_TUITION_MAX = 150;

interface FormState {
    region: string;
    prefecture: string;
    faculty: string;
    examType: string;
    useCommonTest: string;
    institutionType: string;
    nameKeyword: string;
    qualification: string;
    deviationScoreRange: [number, number];
    commonTestScoreRange: [number, number];
    tuitionMax: number;
    externalEnglish: string;
    scholarship: boolean;
    mathRequirement: string;
    japaneseRequirement: string;
    additionalSubjects: string[];
    examMonths: string[];
    examDayRange: [number, number];
}

/**
 * University search form component leveraging shadcn/ui primitives.
 * Provides responsive, accessible controls for filtering university queries.
 */
export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
    const [formState, setFormState] = useState<FormState>({
        region: 'all',
        prefecture: '指定なし',
        faculty: '',
        examType: 'all',
        useCommonTest: 'any',
        institutionType: '指定なし',
        nameKeyword: '',
        qualification: '',
        deviationScoreRange: DEFAULT_DEVIATION_RANGE,
        commonTestScoreRange: DEFAULT_COMMON_TEST_RANGE,
        tuitionMax: DEFAULT_TUITION_MAX,
        externalEnglish: '指定なし',
        scholarship: false,
        mathRequirement: '指定しない',
        japaneseRequirement: '指定しない',
        additionalSubjects: [],
        examMonths: [],
        examDayRange: DEFAULT_EXAM_DAY_RANGE,
    });

    const regionItems = useMemo(
        () =>
            REGIONS.map((region) => ({
                value: region === '全国' ? 'all' : region,
                label: region,
            })),
        []
    );

    const examTypeItems = useMemo(
        () =>
            EXAM_TYPES.map((type) => ({
                value: type === 'すべて' ? 'all' : type,
                label: type,
            })),
        []
    );

    const commonTestItems = useMemo(
        () =>
            COMMON_TEST_OPTIONS.map((option) => ({
                value: option === '指定なし' ? 'any' : option,
                label: option,
            })),
        []
    );

    function updateFormState<K extends keyof FormState>(key: K, value: FormState[K]) {
        setFormState((prev) => ({ ...prev, [key]: value }));
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const payload: SearchFilters = {
            region: formState.region === 'all' ? '' : formState.region,
            prefecture: formState.prefecture === '指定なし' ? '' : formState.prefecture,
            faculty: formState.faculty.trim(),
            examType: formState.examType === 'all' ? '' : formState.examType,
            useCommonTest: formState.useCommonTest === 'any' ? '' : formState.useCommonTest,
            deviationScore: formatDeviationRange(formState.deviationScoreRange),
            institutionType: formState.institutionType === '指定なし' ? '' : formState.institutionType,
            nameKeyword: formState.nameKeyword.trim(),
            commonTestScore: formatCommonTestRange(formState.commonTestScoreRange),
            externalEnglish: formState.externalEnglish === '指定なし' ? '' : formState.externalEnglish,
            requiredSubjects: formatRequiredSubjects(
                formState.mathRequirement,
                formState.japaneseRequirement,
                formState.additionalSubjects
            ),
            tuitionMax: formState.tuitionMax >= DEFAULT_TUITION_MAX ? '' : `${formState.tuitionMax}万円以内`,
            scholarship: formState.scholarship ? 'あり' : '',
            qualification: formState.qualification.trim(),
            examSchedule: formatExamSchedule(formState.examMonths, formState.examDayRange),
        };

        onSearch(payload);
    }

    function handleTextInput(event: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;
        updateFormState(name as keyof FormState, value as FormState[keyof FormState]);
    }

    return (
        <form onSubmit={handleSubmit} aria-label="大学検索フォーム">
            <Card className="border-border/60 shadow-sm">
                <CardHeader className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
                        <Search className="text-primary size-5" aria-hidden="true" />
                        大学検索
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-base">
                        地域や学部、共通テストの有無などを組み合わせて、進学先を絞り込みましょう。
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <fieldset className="grid grid-cols-1 gap-6 md:grid-cols-2" aria-describedby="search-hint">
                        <legend className="sr-only">検索条件</legend>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="region">地域</Label>
                            <Select
                                value={formState.region}
                                onValueChange={(value) => updateFormState('region', value as FormState['region'])}
                            >
                                <SelectTrigger id="region" aria-describedby="search-hint" className="w-full">
                                    <SelectValue placeholder="全国" />
                                </SelectTrigger>
                                <SelectContent>
                                    {regionItems.map(({ value, label }) => (
                                        <SelectItem key={label} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="faculty">学部</Label>
                            <Input
                                id="faculty"
                                name="faculty"
                                type="text"
                                placeholder="例: 工学部、経済学部"
                                autoComplete="organization"
                                value={formState.faculty}
                                onChange={handleTextInput}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="examType">入試形態</Label>
                            <Select
                                value={formState.examType}
                                onValueChange={(value) => updateFormState('examType', value as FormState['examType'])}
                            >
                                <SelectTrigger id="examType" aria-describedby="search-hint" className="w-full">
                                    <SelectValue placeholder="すべて" />
                                </SelectTrigger>
                                <SelectContent>
                                    {examTypeItems.map(({ value, label }) => (
                                        <SelectItem key={label} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="useCommonTest">共通テスト利用</Label>
                            <Select
                                value={formState.useCommonTest}
                                onValueChange={(value) =>
                                    updateFormState('useCommonTest', value as FormState['useCommonTest'])
                                }
                            >
                                <SelectTrigger id="useCommonTest" aria-describedby="search-hint" className="w-full">
                                    <SelectValue placeholder="指定なし" />
                                </SelectTrigger>
                                <SelectContent>
                                    {commonTestItems.map(({ value, label }) => (
                                        <SelectItem key={label} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="md:col-span-2">
                            <Label htmlFor="nameKeyword">大学名・キーワード</Label>
                            <Input
                                id="nameKeyword"
                                name="nameKeyword"
                                type="text"
                                placeholder="例: 情報学 AI"
                                autoComplete="off"
                                value={formState.nameKeyword}
                                onChange={handleTextInput}
                            />
                            <p id="search-hint" className="text-muted-foreground text-sm">
                                入試種別や選抜方式で選択肢が変わる場合は、まず地域から選択するのがおすすめです。
                            </p>
                        </div>
                    </fieldset>
                </CardContent>

                <CardContent className="pt-0">
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="advanced">
                            <AccordionTrigger className="text-base">詳細検索条件</AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-8">
                                    <section aria-labelledby="difficulty-label" className="space-y-4">
                                        <div className="flex flex-col gap-2">
                                            <Label id="difficulty-label">検索入試難易度（ボーダーライン）</Label>
                                            <Slider
                                                value={formState.deviationScoreRange}
                                                min={35}
                                                max={75}
                                                step={2.5}
                                                onValueChange={(value) =>
                                                    updateFormState(
                                                        'deviationScoreRange',
                                                        value as FormState['deviationScoreRange']
                                                    )
                                                }
                                                aria-labelledby="difficulty-label"
                                                aria-valuetext={`${formState.deviationScoreRange[0]}〜${formState.deviationScoreRange[1]}`}
                                            />
                                            <div
                                                className="text-muted-foreground flex justify-between text-sm"
                                                aria-live="polite"
                                            >
                                                <span>{formState.deviationScoreRange[0].toFixed(1)}</span>
                                                <span>{formState.deviationScoreRange[1].toFixed(1)}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Label id="common-test-label">共通テスト得点率</Label>
                                            <Slider
                                                value={formState.commonTestScoreRange}
                                                min={50}
                                                max={100}
                                                step={5}
                                                onValueChange={(value) =>
                                                    updateFormState(
                                                        'commonTestScoreRange',
                                                        value as FormState['commonTestScoreRange']
                                                    )
                                                }
                                                aria-labelledby="common-test-label"
                                                aria-valuetext={`${formState.commonTestScoreRange[0]}〜${formState.commonTestScoreRange[1]}%`}
                                            />
                                            <div
                                                className="text-muted-foreground flex justify-between text-sm"
                                                aria-live="polite"
                                            >
                                                <span>{formState.commonTestScoreRange[0]}%</span>
                                                <span>{formState.commonTestScoreRange[1]}%</span>
                                            </div>
                                        </div>
                                    </section>

                                    <section
                                        className="grid grid-cols-1 gap-6 md:grid-cols-2"
                                        aria-labelledby="location-label"
                                    >
                                        <div className="flex flex-col gap-2">
                                            <Label id="prefecture-label" htmlFor="prefecture">
                                                都道府県
                                            </Label>
                                            <Select
                                                value={formState.prefecture}
                                                onValueChange={(value) =>
                                                    updateFormState('prefecture', value as FormState['prefecture'])
                                                }
                                            >
                                                <SelectTrigger id="prefecture" className="w-full">
                                                    <SelectValue placeholder="指定なし" />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-72">
                                                    {PREFECTURES.map((prefecture) => (
                                                        <SelectItem key={prefecture} value={prefecture}>
                                                            {prefecture}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="institutionType">学校種別</Label>
                                            <Select
                                                value={formState.institutionType}
                                                onValueChange={(value) =>
                                                    updateFormState(
                                                        'institutionType',
                                                        value as FormState['institutionType']
                                                    )
                                                }
                                            >
                                                <SelectTrigger id="institutionType" className="w-full">
                                                    <SelectValue placeholder="指定なし" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {INSTITUTION_TYPES.map((type) => (
                                                        <SelectItem key={type} value={type}>
                                                            {type}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="externalEnglish">外部英語資格</Label>
                                            <Select
                                                value={formState.externalEnglish}
                                                onValueChange={(value) =>
                                                    updateFormState(
                                                        'externalEnglish',
                                                        value as FormState['externalEnglish']
                                                    )
                                                }
                                            >
                                                <SelectTrigger id="externalEnglish" className="w-full">
                                                    <SelectValue placeholder="指定なし" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {EXTERNAL_ENGLISH_OPTIONS.map((option) => (
                                                        <SelectItem key={option} value={option}>
                                                            {option}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="qualification">取得可能資格（例: 教員免許）</Label>
                                            <Input
                                                id="qualification"
                                                name="qualification"
                                                type="text"
                                                autoComplete="off"
                                                placeholder="例: 教員免許"
                                                value={formState.qualification}
                                                onChange={handleTextInput}
                                            />
                                        </div>
                                    </section>

                                    <section className="space-y-6" aria-labelledby="subjects-label">
                                        <div className="space-y-3">
                                            <Label id="subjects-label">入試科目・配点</Label>
                                            <div className="space-y-2">
                                                <p className="text-muted-foreground text-sm">数学</p>
                                                <ToggleGroup
                                                    type="single"
                                                    value={formState.mathRequirement}
                                                    onValueChange={(value) =>
                                                        updateFormState(
                                                            'mathRequirement',
                                                            (value || '指定しない') as FormState['mathRequirement']
                                                        )
                                                    }
                                                    aria-label="数学の出題範囲"
                                                >
                                                    {MATH_REQUIREMENTS.map((requirement) => (
                                                        <ToggleGroupItem key={requirement} value={requirement}>
                                                            {requirement}
                                                        </ToggleGroupItem>
                                                    ))}
                                                </ToggleGroup>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-muted-foreground text-sm">国語</p>
                                                <ToggleGroup
                                                    type="single"
                                                    value={formState.japaneseRequirement}
                                                    onValueChange={(value) =>
                                                        updateFormState(
                                                            'japaneseRequirement',
                                                            (value || '指定しない') as FormState['japaneseRequirement']
                                                        )
                                                    }
                                                    aria-label="国語の出題範囲"
                                                >
                                                    {JAPANESE_REQUIREMENTS.map((requirement) => (
                                                        <ToggleGroupItem key={requirement} value={requirement}>
                                                            {requirement}
                                                        </ToggleGroupItem>
                                                    ))}
                                                </ToggleGroup>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-muted-foreground text-sm">追加科目</p>
                                                <ToggleGroup
                                                    type="multiple"
                                                    value={formState.additionalSubjects}
                                                    onValueChange={(value) =>
                                                        updateFormState(
                                                            'additionalSubjects',
                                                            value as FormState['additionalSubjects']
                                                        )
                                                    }
                                                    aria-label="追加科目の選択"
                                                >
                                                    {SUBJECT_OPTIONS.map((subject) => (
                                                        <ToggleGroupItem key={subject} value={subject}>
                                                            {subject}
                                                        </ToggleGroupItem>
                                                    ))}
                                                </ToggleGroup>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Label id="tuition-label">学費上限（万円）</Label>
                                            <Slider
                                                value={[formState.tuitionMax]}
                                                min={50}
                                                max={DEFAULT_TUITION_MAX}
                                                step={5}
                                                onValueChange={(value) =>
                                                    updateFormState(
                                                        'tuitionMax',
                                                        (value[0] ?? DEFAULT_TUITION_MAX) as number
                                                    )
                                                }
                                                aria-labelledby="tuition-label"
                                                aria-valuetext={`上限 ${formState.tuitionMax}万円`}
                                            />
                                            <div
                                                className="text-muted-foreground flex justify-between text-sm"
                                                aria-live="polite"
                                            >
                                                <span>50万円</span>
                                                <span>{formState.tuitionMax}万円以内</span>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="space-y-4" aria-labelledby="schedule-label">
                                        <Label id="schedule-label">入試日程・方式</Label>
                                        <div className="space-y-3">
                                            <p className="text-muted-foreground text-sm">実施月</p>
                                            <ToggleGroup
                                                type="multiple"
                                                value={formState.examMonths}
                                                onValueChange={(value) =>
                                                    updateFormState('examMonths', value as FormState['examMonths'])
                                                }
                                                aria-label="入試実施月の選択"
                                            >
                                                {MONTH_OPTIONS.map((month) => (
                                                    <ToggleGroupItem key={month} value={month}>
                                                        {month}
                                                    </ToggleGroupItem>
                                                ))}
                                            </ToggleGroup>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-muted-foreground text-sm" id="exam-day-label">
                                                実施日（範囲指定）
                                            </p>
                                            <Slider
                                                value={formState.examDayRange}
                                                min={1}
                                                max={31}
                                                step={1}
                                                onValueChange={(value) =>
                                                    updateFormState('examDayRange', value as FormState['examDayRange'])
                                                }
                                                aria-labelledby="exam-day-label"
                                                aria-valuetext={`${formState.examDayRange[0]}日〜${formState.examDayRange[1]}日`}
                                            />
                                            <div
                                                className="text-muted-foreground flex justify-between text-sm"
                                                aria-live="polite"
                                            >
                                                <span>{formState.examDayRange[0]}日</span>
                                                <span>{formState.examDayRange[1]}日</span>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="flex flex-col gap-4" aria-labelledby="support-label">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <Label id="scholarship-label" htmlFor="scholarship-switch">
                                                    奨学金ありの学校のみ
                                                </Label>
                                                <p className="text-muted-foreground text-sm">
                                                    募集要項に奨学金制度が明記されている大学を優先します。
                                                </p>
                                            </div>
                                            <Switch
                                                id="scholarship-switch"
                                                aria-labelledby="scholarship-label"
                                                checked={formState.scholarship}
                                                onCheckedChange={(checked) => updateFormState('scholarship', checked)}
                                            />
                                        </div>
                                    </section>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-muted-foreground text-sm">
                        入力内容に応じてAIが関連する大学情報を検索し、要約を表示します。
                    </p>
                    <Button type="submit" className="w-full sm:w-auto" disabled={isLoading} aria-busy={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                                検索中...
                            </>
                        ) : (
                            <>
                                <Search className="mr-2 size-4" aria-hidden="true" />
                                検索する
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}

function formatDeviationRange(range: [number, number]): string {
    if (range[0] <= DEFAULT_DEVIATION_RANGE[0] && range[1] >= DEFAULT_DEVIATION_RANGE[1]) {
        return '';
    }

    return `${range[0].toFixed(1)}-${range[1].toFixed(1)}`;
}

function formatCommonTestRange(range: [number, number]): string {
    if (range[0] === DEFAULT_COMMON_TEST_RANGE[0] && range[1] === DEFAULT_COMMON_TEST_RANGE[1]) {
        return '';
    }

    return `${range[0]}-${range[1]}%`;
}

function formatRequiredSubjects(
    mathRequirement: string,
    japaneseRequirement: string,
    additionalSubjects: string[]
): string {
    const segments: string[] = [];

    if (mathRequirement !== '指定しない') {
        segments.push(`数学: ${mathRequirement}`);
    }

    if (japaneseRequirement !== '指定しない') {
        segments.push(`国語: ${japaneseRequirement}`);
    }

    if (additionalSubjects.length > 0) {
        segments.push(`その他: ${additionalSubjects.join('・')}`);
    }

    return segments.join(' / ');
}

function formatExamSchedule(months: string[], dayRange: [number, number]): string {
    const hasMonthFilter = months.length > 0;
    const hasDayFilter = dayRange[0] > DEFAULT_EXAM_DAY_RANGE[0] || dayRange[1] < DEFAULT_EXAM_DAY_RANGE[1];

    if (!hasMonthFilter && !hasDayFilter) {
        return '';
    }

    const parts: string[] = [];

    if (hasMonthFilter) {
        parts.push(`実施月: ${months.join('・')}`);
    }

    if (hasDayFilter) {
        parts.push(`実施日: ${dayRange[0]}日〜${dayRange[1]}日`);
    }

    return parts.join(' / ');
}
