/**
 * Schedule Server Actions
 * Server-side functions for schedule management
 */

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import {
    getSchedules,
    getScheduleById,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getScheduleStats,
    createScheduleFromUniversity,
} from '@/lib/dal/schedule';
import { ScheduleEvent, ScheduleFilters, ScheduleFormData, ScheduleEventType } from '@/types/schedule';

// Validation schemas
const scheduleFormSchema = z.object({
    title: z.string().min(1, 'タイトルは必須です').max(100, 'タイトルは100文字以内で入力してください'),
    date: z.string().refine((date) => !isNaN(Date.parse(date)), '有効な日時を入力してください'),
    type: z.enum(['exam', 'application_deadline', 'announcement', 'orientation', 'interview', 'other'] as const),
    universityId: z.string().optional(),
    description: z.string().max(500, '説明は500文字以内で入力してください').optional(),
    location: z.string().max(200, '場所は200文字以内で入力してください').optional(),
    url: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
});

const scheduleFiltersSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    type: z.enum(['exam', 'application_deadline', 'announcement', 'orientation', 'interview', 'other'] as const).optional(),
    universityId: z.string().optional(),
});

// Server Actions
export async function getSchedulesAction(filters?: ScheduleFilters): Promise<ScheduleEvent[]> {
    try {
        // Validate filters if provided
        if (filters) {
            scheduleFiltersSchema.parse(filters);
        }

        const schedules = await getSchedules(filters);
        return schedules;
    } catch (error) {
        console.error('Failed to get schedules:', error);
        throw new Error('スケジュールの取得に失敗しました');
    }
}

export async function getScheduleByIdAction(id: string): Promise<ScheduleEvent | null> {
    try {
        if (!id || typeof id !== 'string') {
            throw new Error('無効なスケジュールIDです');
        }

        const schedule = await getScheduleById(id);
        return schedule;
    } catch (error) {
        console.error('Failed to get schedule by ID:', error);
        throw new Error('スケジュールの取得に失敗しました');
    }
}

export async function createScheduleAction(formData: FormData): Promise<ScheduleEvent> {
    try {
        const rawData = {
            title: formData.get('title') as string,
            date: formData.get('date') as string,
            type: formData.get('type') as ScheduleEventType,
            universityId: formData.get('universityId') as string || undefined,
            description: formData.get('description') as string || undefined,
            location: formData.get('location') as string || undefined,
            url: formData.get('url') as string || undefined,
        };

        const validatedData = scheduleFormSchema.parse(rawData);

        // Convert empty strings to undefined for optional fields
        const cleanData: ScheduleFormData = {
            ...validatedData,
            universityId: validatedData.universityId || undefined,
            description: validatedData.description || undefined,
            location: validatedData.location || undefined,
            url: validatedData.url || undefined,
        };

        const schedule = await createSchedule(cleanData);

        revalidatePath('/schedule');
        return schedule;
    } catch (error) {
        console.error('Failed to create schedule:', error);
        if (error instanceof z.ZodError) {
            throw new Error(`入力エラー: ${error.issues.map(e => e.message).join(', ')}`);
        }
        throw new Error('スケジュールの作成に失敗しました');
    }
}

export async function updateScheduleAction(id: string, formData: FormData): Promise<ScheduleEvent | null> {
    try {
        if (!id || typeof id !== 'string') {
            throw new Error('無効なスケジュールIDです');
        }

        const rawData = {
            title: formData.get('title') as string,
            date: formData.get('date') as string,
            type: formData.get('type') as ScheduleEventType,
            universityId: formData.get('universityId') as string || undefined,
            description: formData.get('description') as string || undefined,
            location: formData.get('location') as string || undefined,
            url: formData.get('url') as string || undefined,
        };

        const validatedData = scheduleFormSchema.parse(rawData);

        const cleanData: ScheduleFormData = {
            ...validatedData,
            universityId: validatedData.universityId || undefined,
            description: validatedData.description || undefined,
            location: validatedData.location || undefined,
            url: validatedData.url || undefined,
        };

        const schedule = await updateSchedule(id, cleanData);

        if (!schedule) {
            throw new Error('スケジュールが見つからないか、更新権限がありません');
        }

        revalidatePath('/schedule');
        return schedule;
    } catch (error) {
        console.error('Failed to update schedule:', error);
        if (error instanceof z.ZodError) {
            throw new Error(`入力エラー: ${error.issues.map(e => e.message).join(', ')}`);
        }
        throw new Error('スケジュールの更新に失敗しました');
    }
}

export async function deleteScheduleAction(id: string): Promise<boolean> {
    try {
        if (!id || typeof id !== 'string') {
            throw new Error('無効なスケジュールIDです');
        }

        const success = await deleteSchedule(id);

        if (!success) {
            throw new Error('スケジュールが見つからないか、削除権限がありません');
        }

        revalidatePath('/schedule');
        return true;
    } catch (error) {
        console.error('Failed to delete schedule:', error);
        throw new Error('スケジュールの削除に失敗しました');
    }
}

export async function getScheduleStatsAction() {
    try {
        const stats = await getScheduleStats();
        return stats;
    } catch (error) {
        console.error('Failed to get schedule stats:', error);
        throw new Error('スケジュール統計の取得に失敗しました');
    }
}

export async function createScheduleFromUniversityAction(universityData: {
    id: string;
    name: string;
    faculty: string;
    department: string;
    examType: string;
    examSchedules?: string[];
    applicationDeadline?: string;
    examDate?: string;
}): Promise<ScheduleEvent[]> {
    try {
        if (!universityData.id || !universityData.name) {
            throw new Error('大学の情報が不完全です');
        }

        const schedules = await createScheduleFromUniversity(universityData);

        revalidatePath('/schedule');
        return schedules;
    } catch (error) {
        console.error('Failed to create schedules from university:', error);
        throw new Error('大学のスケジュール作成に失敗しました');
    }
}

// Utility function for redirecting after actions
export async function redirectToSchedule(): Promise<never> {
    redirect('/schedule');
}
