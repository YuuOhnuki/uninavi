'use client';

import * as React from 'react';
import { format, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CalendarDays, GraduationCap, FileText, Megaphone, Users, MessageSquare, MoreHorizontal } from 'lucide-react';

import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ScheduleEvent, ScheduleEventType } from '@/types/schedule';

interface CalendarViewProps {
    schedules: ScheduleEvent[];
    selectedDate?: Date;
    onDateSelect?: (date: Date | undefined) => void;
    className?: string;
}

const EVENT_TYPE_CONFIGS: Record<
    ScheduleEventType,
    {
        icon: React.ComponentType<{ className?: string }>;
        label: string;
        color: string;
        bgColor: string;
    }
> = {
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

interface EventIndicatorProps {
    events: ScheduleEvent[];
    date: Date;
}

function EventIndicator({ events, date }: EventIndicatorProps) {
    if (events.length === 0) return null;

    return (
        <div className="flex flex-col items-center gap-1 px-1">
            {/* イベントタイプ別のアイコン表示 */}
            <div className="flex flex-wrap justify-center gap-1">
                {events.slice(0, 3).map((event, index) => {
                    const config = EVENT_TYPE_CONFIGS[event.type];
                    const Icon = config.icon;
                    return (
                        <div
                            key={`${event.id}-${index}`}
                            className={cn(
                                'flex h-5 w-5 items-center justify-center rounded-full border-2 shadow-sm',
                                config.bgColor,
                                config.bgColor.replace('bg-', 'border-')
                            )}
                            title={`${config.label}: ${event.title}`}
                        >
                            <Icon className={cn('h-3 w-3', config.color)} />
                        </div>
                    );
                })}
                {events.length > 3 && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-400 bg-gray-300 shadow-sm">
                        <span className="text-xs font-bold text-gray-700">+</span>
                    </div>
                )}
            </div>
        </div>
    );
}

interface DayWithEventsProps {
    date: Date;
    schedules: ScheduleEvent[];
}

function DayWithEvents({ date, schedules }: DayWithEventsProps) {
    const daySchedules = schedules.filter((schedule) => isSameDay(new Date(schedule.date), date));

    const hasEvents = daySchedules.length > 0;

    return (
        <div className="relative flex h-full min-h-20 w-full flex-col items-center justify-start">
            <div className={cn('flex w-full items-center justify-center text-sm', hasEvents && 'font-semibold')}>
                {format(date, 'd')}
            </div>
            <EventIndicator events={daySchedules} date={date} />
        </div>
    );
}

interface ScheduleEventCardProps {
    event: ScheduleEvent;
    onClick?: (event: ScheduleEvent) => void;
}

function ScheduleEventCard({ event, onClick }: ScheduleEventCardProps) {
    const config = EVENT_TYPE_CONFIGS[event.type];
    const Icon = config.icon;

    return (
        <Card
            className={cn('cursor-pointer border-l-4 transition-colors hover:shadow-md', config.bgColor)}
            onClick={() => onClick?.(event)}
        >
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <Icon className={cn('h-4 w-4', config.color)} />
                        <Badge variant="outline" className={config.color}>
                            {config.label}
                        </Badge>
                    </div>
                    <span className="text-muted-foreground text-xs">
                        {format(new Date(event.date), 'HH:mm', { locale: ja })}
                    </span>
                </div>
                <CardTitle className="text-sm leading-tight">{event.title}</CardTitle>
            </CardHeader>
            {event.description && (
                <CardContent className="pt-0">
                    <CardDescription className="line-clamp-2 text-xs">{event.description}</CardDescription>
                    {event.university && (
                        <div className="text-muted-foreground mt-2 text-xs">
                            {event.university.name} {event.university.faculty}
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}

interface EventsListProps {
    schedules: ScheduleEvent[];
    selectedDate?: Date;
    onEventClick?: (event: ScheduleEvent) => void;
}

function EventsList({ schedules, selectedDate, onEventClick }: EventsListProps) {
    const displaySchedules = selectedDate
        ? schedules.filter((schedule) => isSameDay(new Date(schedule.date), selectedDate))
        : schedules.filter((schedule) => new Date(schedule.date) >= new Date());

    if (displaySchedules.length === 0) {
        return (
            <Card className="h-full">
                <CardContent className="text-muted-foreground flex h-full items-center justify-center">
                    <div className="text-center">
                        <CalendarDays className="mx-auto mb-4 h-12 w-12 opacity-50" />
                        <p className="text-sm">
                            {selectedDate
                                ? `${format(selectedDate, 'M月d日', { locale: ja })}の予定はありません`
                                : '今後の予定はありません'}
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            {selectedDate && (
                <h3 className="text-lg font-semibold">{format(selectedDate, 'M月d日 (E)', { locale: ja })}の予定</h3>
            )}
            {!selectedDate && <h3 className="text-lg font-semibold">今後の予定</h3>}
            <div className="max-h-96 space-y-2 overflow-y-auto">
                {displaySchedules
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((event) => (
                        <ScheduleEventCard key={event.id} event={event} onClick={onEventClick} />
                    ))}
            </div>
        </div>
    );
}

export function CalendarView({ schedules, selectedDate, onDateSelect, className }: CalendarViewProps) {
    const [selectedEventForDetail, setSelectedEventForDetail] = React.useState<ScheduleEvent | null>(null);
    const [eventDetailDialogOpen, setEventDetailDialogOpen] = React.useState(false);

    const handleDayClick = (date: Date | undefined) => {
        onDateSelect?.(date);
    };

    const modifiers = React.useMemo(() => {
        const eventDates = schedules.map((schedule) => new Date(schedule.date));
        return {
            hasEvents: eventDates,
        };
    }, [schedules]);

    const modifiersClassNames = {
        hasEvents: 'bg-accent/50 font-semibold',
    };

    return (
        <div className={cn('grid grid-cols-1 gap-6 lg:grid-cols-2', className)}>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5" />
                        カレンダー
                    </CardTitle>
                    <CardDescription>スケジュールを視覚的に確認できます</CardDescription>
                </CardHeader>
                <CardContent>
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDayClick}
                        modifiers={modifiers}
                        modifiersClassNames={modifiersClassNames}
                        locale={ja}
                        className="w-full"
                        components={{
                            Day: ({ day, ...props }) => (
                                <td {...props}>
                                    <DayWithEvents date={day.date} schedules={schedules} />
                                </td>
                            ),
                        }}
                    />
                </CardContent>
            </Card>

            <Card className="h-fit">
                <CardHeader>
                    <CardTitle>スケジュール一覧</CardTitle>
                    <CardDescription>
                        {selectedDate ? `${format(selectedDate, 'M月d日', { locale: ja })}の予定` : '今後の予定'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <EventsList
                        schedules={schedules}
                        selectedDate={selectedDate}
                        onEventClick={(event) => {
                            setSelectedEventForDetail(event);
                            setEventDetailDialogOpen(true);
                        }}
                    />
                </CardContent>
            </Card>

            {/* Event Detail Dialog */}
            <Dialog open={eventDetailDialogOpen} onOpenChange={setEventDetailDialogOpen}>
                <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>イベント詳細</DialogTitle>
                        <DialogDescription>スケジュールイベントの詳細情報を表示しています</DialogDescription>
                    </DialogHeader>
                    {selectedEventForDetail && (
                        <div className="mt-4 space-y-4">
                            <ScheduleEventCard event={selectedEventForDetail} />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
