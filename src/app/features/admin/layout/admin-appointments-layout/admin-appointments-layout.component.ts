import { Component, DestroyRef, inject, signal } from '@angular/core';
import { AdminAppointmentsService } from '../../data-access/services/admin-appointments.service';
import { AdminAppointmentModel } from '../../data-access/models/admin-appointment.model';
import { toIsoDate } from '../../../../core/helpers/date/date.helper';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentsTableComponent } from '../../pages/admin-appointments/appoinments-table/appointments-table.component';
import { AppointmentDrawerComponent } from '../../pages/admin-appointments/appoinment-drawer/appointment-drawer.component';

@Component({
  selector: 'app-admin-appointments-layout',
  imports: [CommonModule, FormsModule, AppointmentsTableComponent, AppointmentDrawerComponent],
  templateUrl: './admin-appointments-layout.component.html',
  styleUrl: './admin-appointments-layout.component.css'
})
export class AdminAppointmentsLayoutComponent {
  private api = inject(AdminAppointmentsService);
  private destroyRef = inject(DestroyRef);

  // Filters (simple prototype with template-driven forms)
  from: string = '';
  to: string = '';
  status: string = 'ALL';
  q: string = '';

  // State
  items = signal<AdminAppointmentModel[]>([]);
  selected = signal<AdminAppointmentModel | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    // Default: today -> +7 days
    this.defaultFromTo();

    this.reload();
  }

  openDetails(a: AdminAppointmentModel) {
    this.selected.set(a);
  }

  reload() {
    this.loading.set(true);
    this.error.set(null);

    this.api.getList({
      from: this.from || undefined,
      to: this.to || undefined,
      status: this.status,
      q: this.q?.trim() || undefined
    })
    .pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false))
    )
    .subscribe({
      next: list => this.items.set(list),
      error: err => this.error.set(err?.error?.message ?? 'Грешка при зареждане.')
    });
  }

  clearFilters() {
    this.defaultFromTo();
    this.status = 'ALL';
    this.q = '';
    this.reload();
  }

  onCancel(e: { appointment: AdminAppointmentModel; reason?: string }) {
    this.loading.set(true);
    const id = e.appointment.id;
    this.api.cancel(id, e.reason, true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // refresh list + close drawer
          this.selected.set(null);
          this.reload();
        },
        error: err => this.error.set(err?.error?.message ?? 'Грешка при отказ.'),
        complete: () => this.loading.set(false)
      });
  }

  onReschedule(a: AdminAppointmentModel) {
    // Prototype only for now (we’ll wire dialog later)
    alert('Reschedule will be implemented next.');
  }

  onDelete(a: AdminAppointmentModel) {
    // alert('Delete will be implemented later (admin-only).');
    this.loading.set(true);
    const id = a.id;
    this.api.delete(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.selected.set(null);
          this.reload();
        },
        error: err => {
          this.error.set(err?.error?.message ?? 'Грешка при изтриване.');
          this.loading.set(false);
        },
        complete: () => this.loading.set(false)
      });
  }

  private defaultFromTo(){
    const today = new Date();
    const plus7 = new Date(today);
    plus7.setDate(today.getDate() + 7);

    // ISO yyyy-MM-dd
    this.from = toIsoDate(today); 
    this.to = toIsoDate(plus7)
  }
}
