import { DatePipe, UpperCasePipe } from '@angular/common';
import { Component, computed, input, Input, output, signal } from '@angular/core';

export type Slot = {
  time: string, 
  available: boolean,
  length: number
};

@Component({
  selector: 'app-time-slot',
  imports: [DatePipe, UpperCasePipe],
  templateUrl: './time-slot.component.html',
  styleUrl: './time-slot.component.css',
})
export class TimeSlotComponent {
  @Input() selectedTime: string | null = null;
  
  readonly selectedSlot = signal<string | null>(null);

  date = input.required<Date>();

  slots = input<Slot[]>([]); // [{ {time: '09:00', available: true }, ... }]

  slotSelected = output<string>();

  readonly weekday = computed(() => {
    const d = this.date();
    return d.toLocaleDateString('bg-BG', {weekday: 'long'}).toUpperCase();
  });

  // pick(time: string){
  //   this.selectedSlot.set(time);
  //   this.slotSelected.emit(time);
  // }
  pick(slot: Slot) {
    if (!slot.available) return;
    this.slotSelected.emit(slot.time);
  }
}
