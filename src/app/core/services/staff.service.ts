import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Staff } from '../models';
import { mockStaff } from '../data/mock-data';

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private staffSubject = new BehaviorSubject<Staff[]>([...mockStaff]);
  public staff$ = this.staffSubject.asObservable();

  constructor() {}

  getStaff(): Observable<Staff[]> {
    return this.staff$;
  }

  getStaffById(id: string): Observable<Staff | undefined> {
    const staff = this.staffSubject.value.find(s => s.id === id);
    return of(staff);
  }

  createStaff(staffData: Omit<Staff, 'id'>): Observable<Staff> {
    const newStaff: Staff = {
      ...staffData,
      id: `staff-${Date.now()}`
    };

    const currentStaff = this.staffSubject.value;
    this.staffSubject.next([...currentStaff, newStaff]);

    return of(newStaff).pipe(delay(300));
  }

  updateStaff(id: string, updates: Partial<Staff>): Observable<Staff> {
    const currentStaff = this.staffSubject.value;
    const index = currentStaff.findIndex(s => s.id === id);

    if (index === -1) {
      throw new Error('Staff not found');
    }

    const updatedStaff: Staff = {
      ...currentStaff[index],
      ...updates
    };

    const newStaff = [...currentStaff];
    newStaff[index] = updatedStaff;
    this.staffSubject.next(newStaff);

    return of(updatedStaff).pipe(delay(300));
  }

  deleteStaff(id: string): Observable<void> {
    const currentStaff = this.staffSubject.value;
    const newStaff = currentStaff.filter(s => s.id !== id);
    this.staffSubject.next(newStaff);
    return of(void 0).pipe(delay(300));
  }
}
