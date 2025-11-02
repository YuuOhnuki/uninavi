'use client';

import * as React from 'react';
import { Plus, Calendar, List, BarChart3 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CalendarView } from '@/components/features/schedule/CalendarView';
import { ScheduleForm } from '@/components/features/schedule/ScheduleForm';
import { ScheduleList } from '@/components/features/schedule/ScheduleList';
import {
    getSchedulesAction,
    createScheduleAction,
    updateScheduleAction,
    deleteScheduleAction,
    getScheduleStatsAction,
} from '@/lib/actions/schedule';
import { ScheduleEvent, ScheduleFormData, ScheduleStats } from '@/types/schedule';

function HeroSection(): React.ReactElement {
    return (
        <section className="text-center">
            <p className="text-primary/80 text-xs font-medium tracking-[0.3em] uppercase">Schedule Manager</p>
            <h1 className="text-foreground mt-3 text-4xl font-bold md:text-5xl">スケジュール管理</h1>
            <p className="text-muted-foreground mt-4 text-lg md:text-xl">
                入試スケジュールや合格発表などの重要な日程を一元管理。カレンダーで視覚的に確認できます。
            </p>
        </section>
    );
}

function StatsSection({ stats }: { stats: ScheduleStats }): React.ReactElement {
    return (
        <div className="grid grid-cols-3 gap-4">
            <Card>
                <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{stats.totalEvents}</div>
                    <p className="text-muted-foreground text-xs">総イベント数</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
                    <p className="text-muted-foreground text-xs">今後の予定</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{stats.thisMonthEvents}</div>
                    <p className="text-muted-foreground text-xs">今月の予定</p>
                </CardContent>
            </Card>
        </div>
    );
}

export function ScheduleClient(): React.ReactElement {
    const [schedules, setSchedules] = React.useState<ScheduleEvent[]>([]);
    const [stats, setStats] = React.useState<ScheduleStats | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [editingSchedule, setEditingSchedule] = React.useState<ScheduleEvent | null>(null);
    const [showCreateForm, setShowCreateForm] = React.useState(false);
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);

    // Load schedules and stats
    const loadData = React.useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const [schedulesData, statsData] = await Promise.all([getSchedulesAction(), getScheduleStatsAction()]);

            setSchedules(schedulesData);
            setStats(statsData);
        } catch (err) {
            console.error('Failed to load schedule data:', err);
            setError('スケジュールの読み込みに失敗しました');
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        void loadData();
    }, [loadData]);

    const handleCreateSchedule = React.useCallback(
        async (data: ScheduleFormData) => {
            try {
                const formData = new FormData();
                formData.append('title', data.title);
                formData.append('date', data.date);
                formData.append('type', data.type);
                if (data.universityId) formData.append('universityId', data.universityId);
                if (data.description) formData.append('description', data.description);
                if (data.location) formData.append('location', data.location);
                if (data.url) formData.append('url', data.url);

                await createScheduleAction(formData);
                setShowCreateForm(false);
                await loadData();
            } catch (err) {
                console.error('Failed to create schedule:', err);
                throw err; // Re-throw to let the form handle it
            }
        },
        [loadData]
    );

    const handleUpdateSchedule = React.useCallback(
        async (data: ScheduleFormData) => {
            if (!editingSchedule) return;

            try {
                const formData = new FormData();
                formData.append('title', data.title);
                formData.append('date', data.date);
                formData.append('type', data.type);
                if (data.universityId) formData.append('universityId', data.universityId);
                if (data.description) formData.append('description', data.description);
                if (data.location) formData.append('location', data.location);
                if (data.url) formData.append('url', data.url);

                await updateScheduleAction(editingSchedule.id, formData);
                setEditingSchedule(null);
                await loadData();
            } catch (err) {
                console.error('Failed to update schedule:', err);
                throw err;
            }
        },
        [editingSchedule, loadData]
    );

    const handleDeleteSchedule = React.useCallback(
        async (schedule: ScheduleEvent) => {
            try {
                await deleteScheduleAction(schedule.id);
                await loadData();
            } catch (err) {
                console.error('Failed to delete schedule:', err);
                setError('スケジュールの削除に失敗しました');
            }
        },
        [loadData]
    );

    const handleEditSchedule = React.useCallback((schedule: ScheduleEvent) => {
        setEditingSchedule(schedule);
    }, []);

    const handleCancelEdit = React.useCallback(() => {
        setEditingSchedule(null);
        setShowCreateForm(false);
    }, []);

    if (isLoading && schedules.length === 0) {
        return (
            <div className="space-y-12">
                <HeroSection />
                <div className="flex items-center justify-center py-12">
                    <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
                    <span className="ml-2">読み込み中...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            <HeroSection />

            {error && (
                <Alert variant="destructive">
                    <AlertTitle>エラー</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {stats && <StatsSection stats={stats} />}

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">スケジュール管理</h2>
                    <p className="text-muted-foreground">入試関連の重要な日程を管理できます</p>
                </div>
                <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
                    <DialogTrigger asChild>
                        <Button variant="default">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>スケジュールを追加</DialogTitle>
                            <DialogDescription>新しいスケジュールを追加します</DialogDescription>
                        </DialogHeader>
                        <ScheduleForm onSubmit={handleCreateSchedule} onCancel={handleCancelEdit} />
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="calendar" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="calendar" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        カレンダー
                    </TabsTrigger>
                    <TabsTrigger value="list" className="flex items-center gap-2">
                        <List className="h-4 w-4" />
                        一覧
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="calendar" className="space-y-6">
                    <CalendarView schedules={schedules} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
                </TabsContent>

                <TabsContent value="list" className="space-y-6">
                    <ScheduleList schedules={schedules} onEdit={handleEditSchedule} onDelete={handleDeleteSchedule} />
                </TabsContent>
            </Tabs>

            {/* Edit Dialog */}
            <Dialog open={!!editingSchedule} onOpenChange={(open) => !open && setEditingSchedule(null)}>
                <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>スケジュール編集</DialogTitle>
                        <DialogDescription>スケジュールの情報を更新します</DialogDescription>
                    </DialogHeader>
                    {editingSchedule && (
                        <ScheduleForm
                            initialData={editingSchedule}
                            onSubmit={handleUpdateSchedule}
                            onCancel={handleCancelEdit}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
