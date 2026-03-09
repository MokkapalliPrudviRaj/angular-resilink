import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Observable } from 'rxjs';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardContentComponent } from '../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { IssueService } from '../../../core/services/issue.service';
import { StaffService } from '../../../core/services/staff.service';
import { Issue, Staff } from '../../../core/models';
import { ToastService } from '../../../core/services/toast.service';
import { formatDistanceToNow } from 'date-fns';
import { categoryLabels } from '../../../core/data/mock-data';

@Component({
  selector: 'app-admin-issues',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardContentComponent,
    // ButtonComponent,
  ],
  templateUrl: './admin-issues.component.html',
  styleUrls: ['./admin-issues.component.scss']
})
export class AdminIssuesComponent implements OnInit {
  issues$!: Observable<Issue[]>;
  staff$!: Observable<Staff[]>;
  categoryLabels = categoryLabels;

  searchQuery = '';

  constructor(
    private issueService: IssueService,
    private staffService: StaffService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.issues$ = this.issueService.getIssues();
    this.staff$ = this.staffService.getStaff();
  }

  formatDate(date: string): string {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  }

  getCategoryLabel(category: string): string {
    return this.categoryLabels[category as keyof typeof categoryLabels] || category;
  }

  getStaffName(staffId: string | undefined, staffList: Staff[]): string {
    if (!staffId) return 'Unassigned';
    const staff = staffList.find(s => s.id === staffId);
    return staff ? staff.name : 'Unknown';
  }

  updateStatus(issue: Issue, newStatus: string): void {
    this.issueService.updateStatus(issue.id, newStatus as any).subscribe({
      next: () => {
        this.toast.success('Status updated successfully');
      },
      error: () => {
        this.toast.error('Failed to update status');
      }
    });
  }

  updatePriority(issue: Issue, newPriority: string): void {
    this.issueService.updatePriority(issue.id, newPriority as any).subscribe({
      next: () => {
        this.toast.success('Priority updated successfully');
      },
      error: () => {
        this.toast.error('Failed to update priority');
      }
    });
  }

  assignStaff(issue: Issue, staffId: string): void {
    this.issueService.assignStaff(issue.id, staffId).subscribe({
      next: () => {
        this.toast.success('Staff assigned successfully');
      },
      error: () => {
        this.toast.error('Failed to assign staff');
      }
    });
  }
}
