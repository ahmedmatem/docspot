export type WeekModel = Record<string, string[]>; // {mon: [...], tue: [...], ...}

export type ExclusionType = 'day' | 'timeRange';

export interface ScheduleExclusion {
    exclusionType: ExclusionType;
    date: string;     // yyyy-MM-dd
    start?: string;   // HH:mm
    end?: string;
    reason?: string;
}

export interface ExclusionBatchDto {
    // Bulk creation: multiple days/slots to exclude
    exclusions: ScheduleExclusion[];
}

export interface SlotDto {
  time: string;     // "HH:mm"
  length: number;   // minutes
  available: boolean;
}

export const WeekDays = [
    { key: 1, label: 'Пон' },
    { key: 2, label: 'Вто' },
    { key: 3, label: 'Сря' },
    { key: 4, label: 'Чет' },
    { key: 5, label: 'Пет' },
    { key: 6, label: 'Съб' },
    { key: 0, label: 'Нед' },
] as const;

export type WeekDay = typeof WeekDays[number];
export type WeekDayKey = WeekDay['key'];
export type WeekDayLabel = WeekDay['label'];