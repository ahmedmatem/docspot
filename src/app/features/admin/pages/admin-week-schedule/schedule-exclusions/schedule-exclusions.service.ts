import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ExclusionBatchDto, ScheduleExclusion } from '../../../data-access/models/week-schedule.model';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ScheduleExclusionsService {
  private http = inject(HttpClient);
  private adminApiUrl = `${environment.apiAdminBaseUrl}/week-schedules`;

  constructor() { }

  list(from?: string, to?: string) {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to)   params = params.set('to', to);
    return this.http.get<ScheduleExclusion[]>(`${this.adminApiUrl}/exclusions`, { params });
  }

  createBatch(dto: ExclusionBatchDto) {
    return this.http.post<{ created: number }>(`${this.adminApiUrl}/exclusions`, dto);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.adminApiUrl}/exclusions/${encodeURIComponent(id)}`);
  }
}
