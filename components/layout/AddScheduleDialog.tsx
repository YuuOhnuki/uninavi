'use client';

import * as React from 'react';
import { Calendar, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { createScheduleFromUniversityAction } from '@/lib/actions/schedule';
import { University } from '@/components/layout/UniversityCard';

interface ScheduleOption {
    id: string;
    title: string;
    date: string;
    type: 'exam' | 'application_deadline' | 'announcement' | 'other';
    description: string;
}

interface AddScheduleDialogProps {
    university: University;
    trigger?: React.ReactNode;
    onScheduleAdded?: () => void;
}

export function AddScheduleDialog({ university, trigger, onScheduleAdded }: AddScheduleDialogProps) {
    const [open, setOpen] = React.useState(false);
    const [selectedSchedules, setSelectedSchedules] = React.useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = React.useState(false);

    // 大学のスケジュールを解析してオプションを作成
    const scheduleOptions = React.useMemo((): ScheduleOption[] => {
        const options: ScheduleOption[] = [];

        // examSchedulesからスケジュールを解析
        if (university.examSchedules) {
            university.examSchedules.forEach((scheduleText, index) => {
                const option = parseScheduleText(scheduleText, university, index);
                if (option) {
                    options.push(option);
                }
            });
        }

        // applicationDeadlineを追加
        if (university.applicationDeadline) {
            const date = parseJapaneseDate(university.applicationDeadline);
            if (date) {
                options.push({
                    id: `deadline-${university.id}`,
                    title: `${university.name} ${university.faculty} 願書締切`,
                    date: date.toISOString(),
                    type: 'application_deadline',
                    description: `願書締切: ${university.applicationDeadline}`,
                });
            }
        }

        // examDateを追加
        if (university.examDate) {
            const date = parseJapaneseDate(university.examDate);
            if (date) {
                options.push({
                    id: `exam-${university.id}`,
                    title: `${university.name} ${university.faculty} 入試試験`,
                    date: date.toISOString(),
                    type: 'exam',
                    description: `入試試験日: ${university.examDate}`,
                });
            }
        }

        return options;
    }, [university]);

    const handleScheduleToggle = (scheduleId: string, checked: boolean) => {
        const newSelected = new Set(selectedSchedules);
        if (checked) {
            newSelected.add(scheduleId);
        } else {
            newSelected.delete(scheduleId);
        }
        setSelectedSchedules(newSelected);
    };

    const handleSelectAll = () => {
        const allIds = new Set(scheduleOptions.map(opt => opt.id));
        setSelectedSchedules(allIds);
    };

    const handleDeselectAll = () => {
        setSelectedSchedules(new Set());
    };

    const handleAddSchedules = async () => {
        if (selectedSchedules.size === 0) return;

        setIsLoading(true);
        try {
            // 選択されたスケジュールのみを含む大学データを作成
            const selectedOptions = scheduleOptions.filter(opt => selectedSchedules.has(opt.id));

            // スケジュールを追加するロジック
            for (const option of selectedOptions) {
                // ここでは個別にスケジュールを作成
                // TODO: より効率的な一括作成を実装
                await createScheduleFromUniversityAction({
                    id: university.id,
                    name: university.name,
                    faculty: university.faculty,
                    department: university.department,
                    examType: university.examType,
                    examSchedules: [option.description], // 個別に作成するために1つずつ
                });
            }

            setOpen(false);
            setSelectedSchedules(new Set());
            onScheduleAdded?.();
        } catch (error) {
            console.error('Failed to add schedules:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const defaultTrigger = (
        <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            カレンダーに追加
        </Button>
    );

    if (scheduleOptions.length === 0) {
        return null; // スケジュールがない場合は何も表示しない
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || defaultTrigger}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        スケジュールをカレンダーに追加
                    </DialogTitle>
                    <DialogDescription>
                        {university.name} {university.faculty} の入試関連スケジュールを選択してカレンダーに追加します。
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleSelectAll}>
                                すべて選択
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                                すべて解除
                            </Button>
                        </div>
                        <Badge variant="secondary">
                            {selectedSchedules.size} / {scheduleOptions.length} 選択中
                        </Badge>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {scheduleOptions.map((option) => (
                            <div key={option.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                                <Checkbox
                                    id={option.id}
                                    checked={selectedSchedules.has(option.id)}
                                    onCheckedChange={(checked) =>
                                        handleScheduleToggle(option.id, checked as boolean)
                                    }
                                />
                                <div className="flex-1 space-y-2">
                                    <Label
                                        htmlFor={option.id}
                                        className="text-sm font-medium cursor-pointer"
                                    >
                                        {option.title}
                                    </Label>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Badge variant="outline" className="text-xs">
                                            {getScheduleTypeLabel(option.type)}
                                        </Badge>
                                        <span>{formatDate(option.date)}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {option.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                        キャンセル
                    </Button>
                    <Button
                        onClick={handleAddSchedules}
                        disabled={selectedSchedules.size === 0 || isLoading}
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                追加中...
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4 mr-2" />
                                {selectedSchedules.size}件を追加
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// スケジュールタイプのラベルを取得
function getScheduleTypeLabel(type: ScheduleOption['type']): string {
    const labels = {
        exam: '入試試験',
        application_deadline: '願書締切',
        announcement: '合格発表',
        other: 'その他',
    };
    return labels[type] || type;
}

// 日付をフォーマット
function formatDate(dateString: string): string {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short',
        });
    } catch {
        return dateString;
    }
}

// スケジュールテキストを解析
function parseScheduleText(text: string, university: University, index: number): ScheduleOption | null {
    // 例: "願書受付: 2024年12月1日" や "試験日: 2025年2月25日"
    const match = text.match(/(.+?):\s*(.+)/);
    if (!match) return null;

    const [, label, dateStr] = match;
    const date = parseJapaneseDate(dateStr);
    if (!date) return null;

    let type: ScheduleOption['type'] = 'other';
    let title = `${university.name} ${university.faculty}`;

    if (label.includes('願書') || label.includes('締切') || label.includes('受付')) {
        type = 'application_deadline';
        title += ' 願書締切';
    } else if (label.includes('試験') || label.includes('入試')) {
        type = 'exam';
        title += ' 入試試験';
    } else if (label.includes('発表') || label.includes('合格')) {
        type = 'announcement';
        title += ' 合格発表';
    }

    return {
        id: `schedule-${university.id}-${index}`,
        title,
        date: date.toISOString(),
        type,
        description: text,
    };
}

// 日本語の日付をパース
function parseJapaneseDate(dateStr: string): Date | null {
    // 例: "2025年2月25日"
    const match = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (!match) return null;

    const [, year, month, day] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return isNaN(date.getTime()) ? null : date;
}
