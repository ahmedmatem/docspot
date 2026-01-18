import { Component, inject, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { WeekSchedulesService } from '../../../data-access/services/week-schedule.service';
import { todayYmd } from '../../../../../core/helpers/date/date.helper';
import { WeekDayKey, WeekDays } from '../../../data-access/models/week-schedule.model'
import { DaylySchedulePreviewComponent } from '../tabs/create-week-schedule/dayly-schedule-preview/dayly-schedule-preview.component';

type ExclusionType = 'day' | 'timeRange';

type PendingExclusion = {
  exclusionType: ExclusionType;
  date: string;           // yyyy-MM-dd
  start?: string;     // HH:mm (for 'time')
  end?: string;       // HH:mm
  reason?: string;
};

@Component({
  selector: 'app-schedule-exclude',
  imports: [DaylySchedulePreviewComponent],
  templateUrl: './schedule-exclusions.component.html',
  styleUrl: './schedule-exclusions.component.css'
})
export class ScheduleExclusionsComponent {
  private toastr = inject(ToastrService);
  private weekScheduleService = inject(WeekSchedulesService);

  // slot length – take from active week or setting
  slotLengthMinutes = 20;

  // ---- Card 1: exclude slots within a day
  slotDate = signal<string>(todayYmd());
  slotFrom = signal<string>('12:00');
  slotTo = signal<string>('14:00');
  slotReason = signal<string>('');

  // ---- Card 2: exclude whole days (range + weekdays)
  rangeFrom = signal<string>(todayYmd());
  rangeTo = signal<string>(todayYmd());
  dayReason = signal<string>('');

  weekdays = WeekDays;
  weekdayFlags = signal<Record<WeekDayKey, boolean>>({
    0: false, // Sun
    1: true, 2: true, 3: true, 4: true, 5: true,
    6: false // Sat
  });

  toggleWeekday(key: WeekDayKey, checked: boolean) {
    this.weekdayFlags.update(m => ({ ...m, [key]: checked }));
  }

  // ---- Generated previews
  previewSlots = signal<string[]>([]);
  previewDays = signal<string[]>([]);

  // Pending to save
  pending = signal<PendingExclusion[]>([]);
  saving = signal(false);

  previewTimeExclusion() {
    this.previewSlots.set(this.makeSlots(this.slotDate(), this.slotFrom(), this.slotTo()));
  }

  previewDayExclusion() {
    const start = new Date(this.rangeFrom()), end = new Date(this.rangeTo());
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const days: string[] = [];
    const millesInDay = 24 * 60 * 60 * 1000;
    for (let t = start.getTime(); t <= end.getTime(); t += millesInDay) {
      const d = new Date(t);
      const dow = d.getDay(); // 0..6 (Sun..Sat)
      if (this.isWeekDayKey(dow) && this.weekdayFlags()[dow]) {
        const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
        days.push(`${y}-${m}-${day}`);
      }
    }
    this.previewDays.set(days);
  }

  addTimeExclusion() {
    if (!this.previewSlots().length)
      this.previewTimeExclusion();
    const entry: PendingExclusion = {
      exclusionType: 'timeRange',
      date: this.slotDate(),
      start: this.slotFrom(),
      end: this.slotTo(),
      reason: this.slotReason().trim() || undefined
    };
    this.pending.update(a => [...a, entry]);
    this.toastr.success('Добавено изключване на слотове');
  }

  addDayExclusion() {
    if (!this.previewDays().length)
      this.previewDayExclusion();
    const items: PendingExclusion[] = this.previewDays().map(d => ({
      exclusionType: 'day',
      date: d,
      reason: this.dayReason().trim() || undefined
    }));
    this.pending.update(a => [...a, ...items]);
    this.toastr.success('Добавени дни за изключване');
  }

  removePending(i: number) {
    this.pending.update(arr => arr.filter((_, idx) => idx !== i));
  }

  clearPending() {
    this.pending.set([]);
  }

  // Optional preview on the right for the currently focused day (slotDate)
  dayIntervalsForPreview() {
    // Returns your preview format: [{start:'08:00', end:'17:00'}] etc if you want.
    // If you only want to show list items, you can omit this and keep the left previews.
    return []; // plug if needed
  }

  saveAll() {
    if (!this.pending().length) return;

    const dto = { exclusions: this.pending() };
    this.saving.set(true);

    this.weekScheduleService.saveExclusions(dto).subscribe({
      next: () => {
        this.saving.set(false);
        this.toastr.success('Изключванията са запазени');
        this.clearPending();
        // Optionally, refresh weeks or navigate
        // this.weekSvc.loadAll().subscribe();
      },
      error: () => {
        this.saving.set(false);
        this.toastr.error('Грешка при запис');
      }
    });
  }

  // Helpers
  private makeSlots(date: string, from: string, to: string): string[] {
    const toMinutes = (t: string) => {
      const [hh, mm] = t.split(':').map(Number);
      return hh * 60 + mm;
    };

    const start = toMinutes(from), end = toMinutes(to), len = this.slotLengthMinutes;
    const out: string[] = [];

    for (let t = start; t + len <= end; t += len) {
      const sH = String(Math.floor(t / 60)).padStart(2, '0');
      const sM = String(t % 60).padStart(2, '0');
      const eMins = t + len;
      const eH = String(Math.floor(eMins / 60)).padStart(2, '0');
      const eM = String(eMins % 60).padStart(2, '0');
      out.push(`${sH}:${sM} - ${eH}:${eM}`);
    }

    return out;
  }

  private isWeekDayKey(n: number): n is WeekDayKey {
    return n >= 0 && n <= 6; // 0..6 (Sun..Sat)
  }

}
