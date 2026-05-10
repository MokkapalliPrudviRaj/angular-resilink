import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Observable, forkJoin } from 'rxjs';
import { IssueService } from '../../../core/services/issue.service';
import { StaffService } from '../../../core/services/staff.service';
import { AuthService } from '../../../core/services/auth.service';
import { Issue, Staff } from '../../../core/models';
import { ToastService } from '../../../core/services/toast.service';
import { formatDistanceToNow } from 'date-fns';
import { categoryLabels } from '../../../core/data/mock-data';
import { IssueDetailDialogComponent } from '../../../shared/components/issue-detail-dialog/issue-detail-dialog.component';

@Component({
  selector: 'app-admin-issues',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatDialogModule
  ],
  templateUrl: './admin-issues.component.html',
  styleUrls: ['./admin-issues.component.scss']
})
export class AdminIssuesComponent implements OnInit {
  public issues$!: Observable<Issue[]>;
  public staffOptions: { label: string, value: string }[] = [];
  public categoryLabels = categoryLabels;
  public allIssues: Issue[] = [];
  public filteredIssues: Issue[] = [];

  public searchQuery = '';
  public filterStatus = 'all';
  public filterPriority = 'all';

  public statusOptions: { label: string, value: string }[] = [{ label: 'All Status', value: 'all' }];
  public priorityOptions = [
    { label: 'All Priority', value: 'all' },
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Urgent', value: 'urgent' }
  ];

  public tableStatusOptions: { label: string, value: string }[] = [];
  public tablePriorityOptions = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Urgent', value: 'urgent' }
  ];

  public displayedColumns: string[] = ['issue', 'resident', 'priority', 'status', 'assignedTo', 'escalateTo', 'createdAt'];

  private readonly issueService = inject(IssueService);
  private readonly staffService = inject(StaffService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  constructor() { }

  ngOnInit(): void {
    this.loadData();
  }

  public loadData(): void {
    const clientId = 'KANHA1'; // Ideally from auth service

    // Synchronize primary data streams
    forkJoin({
      issues: this.issueService.getIssues(),
      employees: this.issueService.getEmployees(clientId)
    }).subscribe({
      next: ({ issues, employees }) => {
        // 1. Process Issues
        this.allIssues = issues;
        this.onSearch();

        // 2. Process Statuses (Pull from Service Cache to avoid redundant API call)
        const statuses = this.issueService.getStatusCache();
        if (statuses && statuses.length > 0) {
          const mappedStatuses = statuses.map((s: any) => ({
            label: s.description,
            value: s.currentStatusId
          }));
          this.statusOptions = [{ label: 'All Status', value: 'all' }, ...mappedStatuses];
          this.tableStatusOptions = mappedStatuses;
        }

        // 3. Process Staff Options (using userId as requested)
        const options = employees.map((e: any) => ({
          label: e.name || e.email || e.userId || 'Unknown Staff',
          value: e.userId || e.id
        }));

        const existingIds = new Set(options.map((o: any) => o.value));

        // Inject assigned/escalated staff from live issues
        this.allIssues.forEach(issue => {
          if (issue.assignedTo && !existingIds.has(issue.assignedTo)) {
            options.push({ label: issue.assignedToName || 'Staff', value: issue.assignedTo });
            existingIds.add(issue.assignedTo);
          }
          if (issue.escalateTo && !existingIds.has(issue.escalateTo)) {
            options.push({ label: issue.escalateToName || 'Staff', value: issue.escalateTo });
            existingIds.add(issue.escalateTo);
          }
        });

        this.staffOptions = [{ label: 'Unassigned', value: '' }, ...options];
      },
      error: (err) => {
        console.error('Failed to load admin dashboard data:', err);
        this.toastService.error('Failed to load live data');
      }
    });
  }

  public onSearch(): void {
    const query = (this.searchQuery || '').toLowerCase().trim();

    this.filteredIssues = this.allIssues.filter(issue => {
      // 1. Robust Search Matching
      const matchesSearch = !query ||
        (issue.title || '').toLowerCase().includes(query) ||
        (issue.description || '').toLowerCase().includes(query) ||
        (issue.residentName || '').toLowerCase().includes(query) ||
        (issue.apartment || '').toLowerCase().includes(query) ||
        (issue.category || '').toLowerCase().includes(query);

      // 2. Normalized Status Matching using Numerical IDs
      const matchesStatus = this.filterStatus === 'all' ||
        issue.statusId === Number(this.filterStatus);

      // 3. Priority Matching
      const matchesPriority = this.filterPriority === 'all' ||
        issue.priority === this.filterPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }

  public formatDate(date: string): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  public getCategoryLabel(category: string): string {
    return this.categoryLabels[category as keyof typeof categoryLabels] || category;
  }

  public getCategoryIcon(category: string): string {
    const iconMap: Record<string, string> = {
      'plumbing': 'plumbing',
      'electrical': 'electrical_services',
      'hvac': 'ac_unit',
      'structural': 'home',
      'pest': 'bug_report',
      'cleaning': 'cleaning_services',
      'security': 'shield',
      'appliance': 'kitchen'
    };
    return iconMap[category?.toLowerCase()] || 'settings';
  }

  public updateStatus(issue: Issue, newStatus: string): void {
    this.issueService.updateStatus(issue.id, newStatus as any).subscribe({
      next: (updatedIssue) => {
        issue.status = updatedIssue.status;
        issue.statusId = updatedIssue.statusId;
        this.toastService.success('Status updated successfully');
        this.onSearch();
      },
      error: () => {
        this.toastService.error('Failed to update status');
      }
    });
  }

  public updatePriority(issue: Issue, newPriority: string): void {
    this.issueService.updatePriority(issue.id, newPriority as any).subscribe({
      next: (updatedIssue) => {
        issue.priority = updatedIssue.priority;
        this.toastService.success('Priority updated successfully');
        this.onSearch();
      },
      error: () => {
        this.toastService.error('Failed to update priority');
      }
    });
  }

  public assignStaff(issue: Issue, staffId: string): void {
    this.issueService.assignStaff(issue.id, staffId).subscribe({
      next: (updatedIssue) => {
        issue.assignedTo = updatedIssue.assignedTo;
        issue.assignedToName = updatedIssue.assignedToName;
        this.toastService.success('Staff assigned successfully');
        this.onSearch();
      },
      error: () => {
        this.toastService.error('Failed to assign staff');
      }
    });
  }

  public onUpdateEscalation(issue: Issue, staffId: string): void {
    this.issueService.escalateIssue(issue.id, staffId).subscribe({
      next: (updatedIssue) => {
        issue.escalateTo = updatedIssue.escalateTo;
        issue.escalateToName = updatedIssue.escalateToName;
        this.toastService.success('Issue escalated successfully');
        this.onSearch();
      },
      error: () => {
        this.toastService.error('Failed to escalate issue');
      }
    });
  }

  public onViewIssueDetail(issue: Issue): void {
    this.dialog.open(IssueDetailDialogComponent, {
      width: '650px',
      maxWidth: '95vw',
      panelClass: 'custom-dialog-container',
      data: {
        issue,
        user: this.authService.getCurrentUser()
      }
    }).afterClosed().subscribe((result) => {
      if (result) {
        this.issueService.refreshIssues();
        this.loadData();
      }
    });
  }
}
