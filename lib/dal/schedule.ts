/**
 * Schedule Data Access Layer
 * Handles CRUD operations for schedule events
 */

import { promises as fs } from 'fs';
import path from 'path';
import { ScheduleEvent, ScheduleFilters, ScheduleFormData, ScheduleStats, ScheduleEventType } from '@/types/schedule';

const SCHEDULES_FILE = path.join(process.cwd(), 'data', 'schedules.json');

// Ensure data directory exists
async function ensureDataDir(): Promise<void> {
    const dataDir = path.dirname(SCHEDULES_FILE);
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

// Read schedules from file
async function readSchedules(): Promise<ScheduleEvent[]> {
    try {
        await ensureDataDir();
        const data = await fs.readFile(SCHEDULES_FILE, 'utf-8');
        const schedules = JSON.parse(data) as ScheduleEvent[];
        return schedules;
    } catch (error) {
        // If file doesn't exist or is corrupted, return empty array
        console.warn('Failed to read schedules file:', error);
        return [];
    }
}

// Write schedules to file
async function writeSchedules(schedules: ScheduleEvent[]): Promise<void> {
    await ensureDataDir();
    await fs.writeFile(SCHEDULES_FILE, JSON.stringify(schedules, null, 2), 'utf-8');
}

// Generate unique ID
function generateId(): string {
    return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get current timestamp
function getCurrentTimestamp(): string {
    return new Date().toISOString();
}

export async function getSchedules(filters?: ScheduleFilters): Promise<ScheduleEvent[]> {
    const schedules = await readSchedules();

    if (!filters) {
        return schedules.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    let filtered = schedules;

    if (filters.startDate) {
        filtered = filtered.filter(s => new Date(s.date) >= new Date(filters.startDate!));
    }

    if (filters.endDate) {
        filtered = filtered.filter(s => new Date(s.date) <= new Date(filters.endDate!));
    }

    if (filters.type) {
        filtered = filtered.filter(s => s.type === filters.type);
    }

    if (filters.universityId) {
        filtered = filtered.filter(s => s.university?.id === filters.universityId);
    }

    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function getScheduleById(id: string): Promise<ScheduleEvent | null> {
    const schedules = await readSchedules();
    return schedules.find(s => s.id === id) || null;
}

export async function createSchedule(data: ScheduleFormData, userId: string = 'default'): Promise<ScheduleEvent> {
    const schedules = await readSchedules();

    const newSchedule: ScheduleEvent = {
        id: generateId(),
        ...data,
        userId,
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
    };

    schedules.push(newSchedule);
    await writeSchedules(schedules);

    return newSchedule;
}

export async function updateSchedule(id: string, data: Partial<ScheduleFormData>, userId: string = 'default'): Promise<ScheduleEvent | null> {
    const schedules = await readSchedules();
    const index = schedules.findIndex(s => s.id === id && s.userId === userId);

    if (index === -1) {
        return null;
    }

    schedules[index] = {
        ...schedules[index],
        ...data,
        updatedAt: getCurrentTimestamp(),
    };

    await writeSchedules(schedules);
    return schedules[index];
}

export async function deleteSchedule(id: string, userId: string = 'default'): Promise<boolean> {
    const schedules = await readSchedules();
    const filteredSchedules = schedules.filter(s => !(s.id === id && s.userId === userId));

    if (filteredSchedules.length === schedules.length) {
        return false; // Schedule not found or doesn't belong to user
    }

    await writeSchedules(filteredSchedules);
    return true;
}

export async function getScheduleStats(userId: string = 'default'): Promise<ScheduleStats> {
    const schedules = await readSchedules();
    const userSchedules = schedules.filter(s => s.userId === userId);

    const eventsByType = userSchedules.reduce((acc, schedule) => {
        acc[schedule.type] = (acc[schedule.type] || 0) + 1;
        return acc;
    }, {} as Record<ScheduleEventType, number>);

    // Initialize all event types
    const allTypes: ScheduleEventType[] = ['exam', 'application_deadline', 'announcement', 'orientation', 'interview', 'other'];
    allTypes.forEach(type => {
        if (!(type in eventsByType)) {
            eventsByType[type] = 0;
        }
    });

    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    const upcomingEvents = userSchedules.filter(s => new Date(s.date) >= now).length;
    const thisMonthEvents = userSchedules.filter(s => {
        const eventDate = new Date(s.date);
        return eventDate >= now && eventDate <= nextMonth;
    }).length;

    return {
        totalEvents: userSchedules.length,
        eventsByType,
        upcomingEvents,
        thisMonthEvents,
    };
}

export async function createScheduleFromUniversity(
    universityData: {
        id: string;
        name: string;
        faculty: string;
        department: string;
        examType: string;
        examSchedules?: string[];
        applicationDeadline?: string;
        examDate?: string;
    },
    userId: string = 'default'
): Promise<ScheduleEvent[]> {
    const createdSchedules: ScheduleEvent[] = [];

    // Create schedule from examSchedules array
    if (universityData.examSchedules) {
        for (const scheduleText of universityData.examSchedules) {
            // Parse schedule text (e.g., "願書受付: 2024年12月1日", "試験日: 2025年2月25日")
            const examSchedule = parseExamScheduleText(scheduleText, universityData);
            if (examSchedule) {
                try {
                    const schedule = await createSchedule(examSchedule, userId);
                    createdSchedules.push(schedule);
                } catch (error) {
                    console.warn('Failed to create schedule from text:', scheduleText, error);
                }
            }
        }
    }

    // Create schedule from applicationDeadline
    if (universityData.applicationDeadline) {
        const deadlineDate = parseJapaneseDate(universityData.applicationDeadline);
        if (deadlineDate) {
            const deadlineSchedule: ScheduleFormData = {
                title: `${universityData.name} ${universityData.faculty} 願書締切`,
                date: deadlineDate.toISOString(),
                type: 'application_deadline',
                universityId: universityData.id,
                description: `願書締切日: ${universityData.applicationDeadline}`,
            };
            try {
                const schedule = await createSchedule(deadlineSchedule, userId);
                createdSchedules.push(schedule);
            } catch (error) {
                console.warn('Failed to create deadline schedule:', error);
            }
        }
    }

    // Create schedule from examDate
    if (universityData.examDate) {
        const examDate = parseJapaneseDate(universityData.examDate);
        if (examDate) {
            const examSchedule: ScheduleFormData = {
                title: `${universityData.name} ${universityData.faculty} 入試試験`,
                date: examDate.toISOString(),
                type: 'exam',
                universityId: universityData.id,
                description: `入試試験日: ${universityData.examDate}`,
            };
            try {
                const schedule = await createSchedule(examSchedule, userId);
                createdSchedules.push(schedule);
            } catch (error) {
                console.warn('Failed to create exam schedule:', error);
            }
        }
    }

    return createdSchedules;
}

// Helper function to parse exam schedule text
function parseExamScheduleText(text: string, university: any): ScheduleFormData | null {
    // Example: "願書受付: 2024年12月1日" or "試験日: 2025年2月25日"
    const match = text.match(/(.+?):\s*(.+)/);
    if (!match) return null;

    const [, label, dateStr] = match;
    const date = parseJapaneseDate(dateStr);
    if (!date) return null;

    let type: ScheduleEventType = 'other';
    let title = `${university.name} ${university.faculty}`;

    if (label.includes('願書') || label.includes('締切')) {
        type = 'application_deadline';
        title += ' 願書締切';
    } else if (label.includes('試験') || label.includes('入試')) {
        type = 'exam';
        title += ' 入試試験';
    } else if (label.includes('発表') || label.includes('合格')) {
        type = 'announcement';
        title += ' 合格発表';
    } else if (label.includes('説明会')) {
        type = 'orientation';
        title += ' 入学説明会';
    } else if (label.includes('面接')) {
        type = 'interview';
        title += ' 面接・小論文';
    }

    return {
        title,
        date: date.toISOString(),
        type,
        universityId: university.id,
        description: text,
    };
}

// Helper function to parse Japanese date format
function parseJapaneseDate(dateStr: string): Date | null {
    // Support formats like: "2025年2月25日", "2024年12月1日"
    const match = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (!match) return null;

    const [, year, month, day] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return isNaN(date.getTime()) ? null : date;
}
