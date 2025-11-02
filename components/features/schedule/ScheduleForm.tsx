'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
    CalendarIcon,
    GraduationCap,
    FileText,
    Megaphone,
    Users,
    MessageSquare,
    MoreHorizontal,
    Save,
    X,
} from 'lucide-react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ScheduleEvent, ScheduleFormData, ScheduleEventType } from '@/types/schedule';

const scheduleFormSchema = z.object({
    title: z.string().min(1, 'タイトルは必須です').max(100, 'タイトルは100文字以内で入力してください'),
    date: z.date(),
    type: z.enum(['exam', 'application_deadline', 'announcement', 'orientation', 'interview', 'other'] as const),
    universityId: z.string().optional(),
    description: z.string().max(500, '説明は500文字以内で入力してください').optional(),
    location: z.string().max(200, '場所は200文字以内で入力してください').optional(),
    url: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

const EVENT_TYPE_OPTIONS: Array<{
    value: ScheduleEventType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
}> = [
    {
        value: 'exam',
        label: '入試試験',
        icon: GraduationCap,
        description: '入試試験の日程',
    },
    {
        value: 'application_deadline',
        label: '願書締切',
        icon: FileText,
        description: '願書の提出締切日',
    },
    {
        value: 'announcement',
        label: '合格発表',
        icon: Megaphone,
        description: '合格発表の日程',
    },
    {
        value: 'orientation',
        label: '入学説明会',
        icon: Users,
        description: '入学説明会の日程',
    },
    {
        value: 'interview',
        label: '面接・小論文',
        icon: MessageSquare,
        description: '面接や小論文試験の日程',
    },
    {
        value: 'other',
        label: 'その他',
        icon: MoreHorizontal,
        description: 'その他のイベント',
    },
];

interface ScheduleFormProps {
    initialData?: ScheduleEvent;
    onSubmit: (data: ScheduleFormData) => Promise<void>;
    onCancel?: () => void;
    isLoading?: boolean;
    universities?: Array<{
        id: string;
        name: string;
        faculty: string;
        department: string;
    }>;
}

export function ScheduleForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
    universities = [],
}: ScheduleFormProps) {
    const form = useForm<ScheduleFormValues>({
        resolver: zodResolver(scheduleFormSchema),
        defaultValues: {
            title: initialData?.title || '',
            date: initialData ? new Date(initialData.date) : new Date(),
            type: initialData?.type || 'other',
            universityId: initialData?.university?.id || '',
            description: initialData?.description || '',
            location: initialData?.location || '',
            url: initialData?.url || '',
        },
    });

    const handleSubmit = async (values: ScheduleFormValues) => {
        try {
            const formData: ScheduleFormData = {
                title: values.title,
                date: values.date.toISOString(),
                type: values.type,
                universityId: values.universityId || undefined,
                description: values.description || undefined,
                location: values.location || undefined,
                url: values.url || undefined,
            };

            await onSubmit(formData);
        } catch (error) {
            console.error('Failed to submit schedule form:', error);
        }
    };

    const selectedType = form.watch('type');
    const selectedTypeOption = EVENT_TYPE_OPTIONS.find((option) => option.value === selectedType);

    return (
        <Card className="mx-auto w-full max-w-2xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    {initialData ? 'スケジュールを編集' : 'スケジュールを追加'}
                </CardTitle>
                <CardDescription>
                    {initialData ? 'スケジュールの情報を更新してください' : '新しいスケジュールを追加します'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>タイトル *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="スケジュールのタイトルを入力"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>イベントタイプ *</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isLoading}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="text w-full">
                                                <SelectValue placeholder="イベントタイプを選択" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {EVENT_TYPE_OPTIONS.map((option) => {
                                                const Icon = option.icon;
                                                return (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        <div className="flex items-center gap-2">
                                                            <Icon className="h-4 w-4" />
                                                            <div>
                                                                <div className="font-medium">{option.label}</div>
                                                                <div className="text-muted-foreground text-xs">
                                                                    {option.description}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>日時 *</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        'w-full pl-3 text-left font-normal',
                                                        !field.value && 'text-muted-foreground'
                                                    )}
                                                    disabled={isLoading}
                                                >
                                                    {field.value ? (
                                                        format(field.value, 'yyyy年MM月dd日 (E) HH:mm', { locale: ja })
                                                    ) : (
                                                        <span>日時を選択</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                initialFocus
                                                locale={ja}
                                            />
                                            <div className="border-t p-3">
                                                <Label htmlFor="time" className="text-sm font-medium">
                                                    時間
                                                </Label>
                                                <Input
                                                    id="time"
                                                    type="time"
                                                    className="mt-1"
                                                    value={field.value ? format(field.value, 'HH:mm') : ''}
                                                    onChange={(e) => {
                                                        const [hours, minutes] = e.target.value.split(':');
                                                        const newDate = new Date(field.value || new Date());
                                                        newDate.setHours(parseInt(hours), parseInt(minutes));
                                                        field.onChange(newDate);
                                                    }}
                                                    disabled={isLoading}
                                                />
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {universities.length > 0 && (
                            <FormField
                                control={form.control}
                                name="universityId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>関連大学</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="大学を選択（任意）" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="">選択しない</SelectItem>
                                                {universities.map((university) => (
                                                    <SelectItem key={university.id} value={university.id}>
                                                        {university.name} {university.faculty}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            このスケジュールに関連する大学がある場合に選択してください
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>場所</FormLabel>
                                    <FormControl>
                                        <Input placeholder="開催場所を入力" {...field} disabled={isLoading} />
                                    </FormControl>
                                    <FormDescription>オンラインの場合はURLを入力してください</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>URL</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="url"
                                            placeholder="https://example.com"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormDescription>関連するウェブサイトのURL（任意）</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>説明</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="スケジュールの詳細を入力"
                                            className="min-h-[100px]"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        スケジュールの詳細な説明を入力してください（任意）
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex gap-3 pt-4">
                            <Button type="submit" disabled={isLoading} className="flex-1">
                                {isLoading ? (
                                    <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                                        保存中...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        {initialData ? '更新' : '保存'}
                                    </>
                                )}
                            </Button>
                            {onCancel && (
                                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                                    <X className="mr-2 h-4 w-4" />
                                    キャンセル
                                </Button>
                            )}
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
