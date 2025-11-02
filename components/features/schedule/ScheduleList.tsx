'use client';

import * as React from 'react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
    GraduationCap,
    FileText,
    Megaphone,
    Users,
    MessageSquare,
    MoreHorizontal,
    Edit,
    Trash2,
    ExternalLink,
    MapPin,
    Calendar,
    Clock
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ScheduleEvent, ScheduleEventType } from '@/types/schedule';

const EVENT_TYPE_CONFIGS: Record<ScheduleEventType, {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    color: string;
    bgColor: string;
}> = {
    exam: {
        icon: GraduationCap,
        label: '入試試験',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 border-blue-200',
    },
    application_deadline: {
        icon: FileText,
        label: '願書締切',
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200',
    },
    announcement: {
        icon: Megaphone,
        label: '合格発表',
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200',
    },
    orientation: {
        icon: Users,
        label: '説明会',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 border-purple-200',
    },
    interview: {
        icon: MessageSquare,
        label: '面接・小論文',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 border-orange-200',
    },
    other: {
        icon: MoreHorizontal,
        label: 'その他',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50 border-gray-200',
    },
};

interface ScheduleListProps {
    schedules: ScheduleEvent[];
    onEdit?: (schedule: ScheduleEvent) => void;
    onDelete?: (schedule: ScheduleEvent) => void;
    showActions?: boolean;
    className?: string;
}

interface ScheduleRowProps {
    schedule: ScheduleEvent;
    onEdit?: (schedule: ScheduleEvent) => void;
    onDelete?: (schedule: ScheduleEvent) => void;
    showActions?: boolean;
}

function ScheduleRow({ schedule, onEdit, onDelete, showActions = true }: ScheduleRowProps) {
    const config = EVENT_TYPE_CONFIGS[schedule.type];
    const Icon = config.icon;
    const eventDate = new Date(schedule.date);
    const isEventPast = isPast(eventDate);
    const isEventToday = isToday(eventDate);
    const isEventTomorrow = isTomorrow(eventDate);

    const getDateDisplay = () => {
        if (isEventToday) return '今日';
        if (isEventTomorrow) return '明日';
        return format(eventDate, 'MM/dd (E)', { locale: ja });
    };

    const getTimeDisplay = () => {
        return format(eventDate, 'HH:mm');
    };

    return (
        <TableRow className={isEventPast ? 'opacity-60' : ''}>
            <TableCell>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div>
                        <div className="font-medium">{schedule.title}</div>
                        <div className="text-sm text-muted-foreground">
                            {config.label}
                        </div>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {getDateDisplay()}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {getTimeDisplay()}
                    </div>
                </div>
            </TableCell>
            <TableCell>
                {schedule.university && (
                    <div className="text-sm">
                        <div className="font-medium">{schedule.university.name}</div>
                        <div className="text-muted-foreground">
                            {schedule.university.faculty}
                        </div>
                    </div>
                )}
            </TableCell>
            <TableCell>
                <div className="space-y-1">
                    {schedule.location && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {schedule.location}
                        </div>
                    )}
                    {schedule.url && (
                        <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            asChild
                        >
                            <a
                                href={schedule.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1"
                            >
                                <ExternalLink className="h-3 w-3" />
                                リンク
                            </a>
                        </Button>
                    )}
                </div>
            </TableCell>
            {showActions && (
                <TableCell>
                    <div className="flex items-center gap-1">
                        {onEdit && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(schedule)}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                        )}
                        {onDelete && (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>スケジュールを削除</DialogTitle>
                                        <DialogDescription>
                                            「{schedule.title}」を削除してもよろしいですか？
                                            この操作は取り消すことができません。
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button
                                            variant="destructive"
                                            onClick={() => onDelete(schedule)}
                                        >
                                            削除
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </TableCell>
            )}
        </TableRow>
    );
}

export function ScheduleList({
    schedules,
    onEdit,
    onDelete,
    showActions = true,
    className
}: ScheduleListProps) {
    const sortedSchedules = React.useMemo(() => {
        return schedules.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [schedules]);

    if (sortedSchedules.length === 0) {
        return (
            <Card className={className}>
                <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">スケジュールがありません</p>
                        <p className="text-xs mt-1">新しいスケジュールを追加してください</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    スケジュール一覧
                </CardTitle>
                <CardDescription>
                    {schedules.length}件のスケジュールがあります
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>イベント</TableHead>
                            <TableHead>日時</TableHead>
                            <TableHead>大学</TableHead>
                            <TableHead>場所・リンク</TableHead>
                            {showActions && <TableHead className="w-[100px]">操作</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedSchedules.map((schedule) => (
                            <ScheduleRow
                                key={schedule.id}
                                schedule={schedule}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                showActions={showActions}
                            />
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
