import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AdminAppointmentModel } from "../models/admin-appointment.model";
import { AdminAppointmentsQuery } from "../models/admin-appointments.query";
import { environment } from "../../../../../environments/environment";

@Injectable({ providedIn: 'root' })
export class AdminAppointmentsService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiAdminBaseUrl}/appointments`;

    getList(query: AdminAppointmentsQuery): Observable<AdminAppointmentModel[]> {
        let params = new HttpParams();

        if (query.from) params = params.set('from', query.from);
        if (query.to) params = params.set('to', query.to);
        if (query.q) params = params.set('q', query.q);
        if (query.status && query.status !== 'ALL') params = params.set('status', query.status);

        return this.http.get<AdminAppointmentModel[]>(this.baseUrl, { params });
    }

    cancel(id: string, reason?: string, notifyPatient: boolean = true): Observable<string> {
        return this.http.post(`${this.baseUrl}/${id}/cancel`, { reason, notifyPatient }, { responseType: 'text' });
    }

    delete(id: string): Observable<string> {
        return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
    }

    reschedule(id: string, newDate: string, newTime: string, reason?: string, notifyPatient = true) {
        return this.http.post(`${this.baseUrl}/${id}/reschedule`, { newDate, newTime, reason, notifyPatient }, { responseType: 'text' });
    }
}