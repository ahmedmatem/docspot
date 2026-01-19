import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ExclusionBatchDto, ScheduleExclusion } from '../../../data-access/models/week-schedule.model';

@Injectable({
  providedIn: 'root'
})
export class ScheduleExclusionsService {
  private http = inject(HttpClient);
  private apiUrl = '/api/admin/week-schedules/exclusions';

  constructor() { }

  list(from?: string, to?: string) {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to)   params = params.set('to', to);
    return this.http.get<ScheduleExclusion[]>(this.apiUrl, { params });
  }

  createBatch(dto: ExclusionBatchDto) {
    return this.http.post<{ created: number }>(this.apiUrl, dto);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${encodeURIComponent(id)}`);
  }
}
