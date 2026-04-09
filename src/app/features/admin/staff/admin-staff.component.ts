import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { StaffService } from '../../../core/services/staff.service';
import { Staff } from '../../../core/models';

@Component({
  selector: 'app-admin-staff',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    FormsModule
  ],
  templateUrl: './admin-staff.component.html',
  styleUrls: ['./admin-staff.component.scss']
})
export class AdminStaffComponent implements OnInit {
  staff$!: Observable<Staff[]>;
  totalActiveTasks = 0;
  availableStaff = 0;
  avgLoad = '0';
  Math = Math;

  constructor(private staffService: StaffService) { }

  ngOnInit(): void {
    this.loadStaff();
  }

  loadStaff(): void {
    this.staff$ = this.staffService.getStaff();
    this.staff$.subscribe(staff => {
      this.totalActiveTasks = staff.reduce((sum, s) => sum + s.activeIssues, 0);
      this.availableStaff = staff.filter(s => s.activeIssues <= 1).length;
      this.avgLoad = staff.length > 0
        ? (this.totalActiveTasks / staff.length).toFixed(1)
        : '0';
    });
  }

  showAddForm = false;
  isEdit = false;
  editingId: string | null = null;
  newStaff = { name: '', role: '', email: '', phone: '', activeIssues: 0 };

  addStaff(): void {
    this.isEdit = false;
    this.editingId = null;
    this.newStaff = { name: '', role: '', email: '', phone: '', activeIssues: 0 };
    this.showAddForm = true;
  }

  editStaff(staff: Staff): void {
    this.isEdit = true;
    this.editingId = staff.id;
    this.newStaff = { name: staff.name, role: staff.role, email: staff.email, phone: staff.phone, activeIssues: staff.activeIssues };
    this.showAddForm = true;
  }

  cancelAdd(): void {
    this.showAddForm = false;
    this.isEdit = false;
    this.editingId = null;
    this.newStaff = { name: '', role: '', email: '', phone: '', activeIssues: 0 };
  }

  submitStaff(): void {
    if (this.newStaff.name && this.newStaff.role) {
      if (this.isEdit && this.editingId) {
        this.staffService.updateStaff(this.editingId, this.newStaff).subscribe(() => {
          this.cancelAdd();
          this.loadStaff();
        });
      } else {
        this.staffService.createStaff(this.newStaff).subscribe(() => {
          this.cancelAdd();
          this.loadStaff();
        });
      }
    }
  }

  deleteStaff(id: string): void {
    if (confirm('Are you sure you want to remove this staff member?')) {
      this.staffService.deleteStaff(id).subscribe(() => {
        this.loadStaff();
      });
    }
  }
}
