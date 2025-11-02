/**
 * Schedule management types for university entrance exam schedules
 */

export type ScheduleEventType =
    | 'exam' // 入試試験日
    | 'application_deadline' // 願書締切
    | 'announcement' // 合格発表
    | 'orientation' // 入学説明会
    | 'interview' // 面接・小論文
    | 'other'; // その他

export interface ScheduleEvent {
    id: string;
    title: string;
    date: string; // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
    type: ScheduleEventType;
    university?: {
        id: string;
        name: string;
        faculty: string;
        department: string;
        examType: string;
    };
    description?: string;
    location?: string;
    url?: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface ScheduleFilters {
    startDate?: string;
    endDate?: string;
    type?: ScheduleEventType;
    universityId?: string;
}

export interface ScheduleFormData {
    title: string;
    date: string;
    type: ScheduleEventType;
    universityId?: string;
    description?: string;
    location?: string;
    url?: string;
}

export interface ScheduleStats {
    totalEvents: number;
    eventsByType: Record<ScheduleEventType, number>;
    upcomingEvents: number;
    thisMonthEvents: number;
}
