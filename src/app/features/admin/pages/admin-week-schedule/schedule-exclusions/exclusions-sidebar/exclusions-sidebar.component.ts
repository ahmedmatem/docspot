import { Component, computed, inject, Input, signal } from '@angular/core';
import { ScheduleExclusionsService } from '../schedule-exclusions.service';
import { ToastrService } from 'ngx-toastr';
import { AppointmentService } from '../../../../../../core/data-access/services/appointment.service';
import { ScheduleExclusion, SlotDto } from '../../../../data-access/models/week-schedule.model';
import { hmToMin, todayYmd, todayYmdPlus } from '../../../../../../core/helpers/date/date.helper';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-exclusions-sidebar',
  imports: [],
  templateUrl: './exclusions-sidebar.component.html',
  styleUrl: './exclusions-sidebar.component.css'
})
export class ExclusionsSidebarComponent {
  private exclusionsService = inject(ScheduleExclusionsService);
  private appointmentService = inject(AppointmentService);
  private toastr = inject(ToastrService);

  // ←—— parent passes the current pending list from the left form
  @Input() pending: ScheduleExclusion[] = [];

  // date filters for list
  from = signal(todayYmd());
  to = signal(todayYmdPlus(14)); // two weeks by default

  // data
  loading = signal(false);
  items = signal<ScheduleExclusion[]>([]);
  selectedId = signal<string | null>(null);
  deletingId = signal<string | null>(null);

  // slots for selected exclusion's date
  loadingSlots = signal(false);
  slots = signal<SlotDto[]>([]);

  // derive currently selected exclusion & date
  selected = computed(() => this.items().find(x => x.id === this.selectedId()) || null);
  selectedDate = computed(() => this.selected()?.date ?? null);

  ngOnInit() { this.loadList(); }

  loadList() {
    this.loading.set(true);
    this.exclusionsService.list(this.from(), this.to()).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: list => {
        this.items.set(list);
        if (!this.selectedId() && list.length)
          this.select(list[0].id!);
        // If nothing selected, clear slots
        if (!list.length) {
          this.selectedId.set(null);
          this.slots.set([]);
        }
      },
      error: () => this.toastr.error('Грешка при зареждане на изключвания'),
    });
  }

  select(id: string) {
    this.selectedId.set(id);
    const date = this.selectedDate();
    if (!date) { this.slots.set([]); return; }
    this.loadingSlots.set(true);
    this.appointmentService.getSlots(date).pipe(
      finalize(() => this.loadingSlots.set(false))
    ).subscribe({
      next: s => this.slots.set(s),
      error: () => this.toastr.error('Грешка при зареждане на слотовете'),
    });
  }

  delete(id: string) {
    if (!confirm('Да се изтрие ли изключването?')) return;
    this.deletingId.set(id);
    this.exclusionsService.delete(id).pipe(
      finalize(() => this.deletingId.set(null))
    ).subscribe({
      next: () => {
        this.items.update(arr => arr.filter(x => x.id !== id));
        if (this.selectedId() === id) { this.selectedId.set(null); this.slots.set([]); }
        this.toastr.success('Изключението е изтрито.');
      },
      error: () => this.toastr.error('Грешка при изтриване'),
    });
  }

  // overlay logic: is a slot excluded by PENDING (left) + this saved selection?
  isSlotExcluded(slot: SlotDto): boolean {
    const date = this.selectedDate();
    if (!date) return false;

    // 1) saved selected exclusion (the opened accordion item)
    const sel = this.selected();
    if (sel) {
      if (sel.exclusionType === 'day') return true;
      if (sel.exclusionType === 'timeRange' && sel.start && sel.end) {
        if (this.overlaps(slot.time, slot.length, sel.start, sel.end)) return true;
      }
    }
    return false;
  }

  dmy = (date: string) => date.toDmy();
  
  hmToEnd(startHm: string, lenMin: number): string {
    const [h, m] = startHm.split(':').map(Number);
    const total = h * 60 + m + lenMin;
    const hh = String(Math.floor(total / 60)).padStart(2, '0');
    const mm = String(total % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  private overlaps(slotStart: string, slotLenMin: number, rangeStart: string, rangeEnd: string): boolean {
    const ss = hmToMin(slotStart);
    const se = ss + slotLenMin;
    const rs = hmToMin(rangeStart);
    const re = hmToMin(rangeEnd);
    return ss < re && rs < se; // half-open overlap
  }
}
