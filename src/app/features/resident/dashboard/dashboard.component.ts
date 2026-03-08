import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardContentComponent } from '../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { CreateIssueDialogComponent } from '../create-issue-dialog/create-issue-dialog.component';
import { AuthService } from '../../../core/services/auth.service';
import { IssueService } from '../../../core/services/issue.service';
import { Issue, IssueStatus, IssuePriority } from '../../../core/models';
import { categoryETAs } from '../../../core/data/mock-data';
import { formatDistanceToNow } from 'date-fns';

interface CategoryData {
  name: string;
  value: number;
}

interface PriorityData {
  name: string;
  value: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatBadgeModule,
    MatDialogModule,
    MatSnackBarModule,
    NgxChartsModule,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardContentComponent,
    ButtonComponent,
    StatusBadgeComponent,
    PriorityBadgeComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  issues$!: Observable<Issue[]>;
  issues: Issue[] = [];
  recentActivity: Issue[] = [];
  filteredIssues: Issue[] = [];
  activeTabIndex = 0;
  searchQuery = '';
  filterStatusId: number | 'all' = 'all';

  stats = {
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0
  };

  categoryData: CategoryData[] = [];
  priorityData: PriorityData[] = [];
  chartColors = ['#5048e5', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

  constructor(
    public authService: AuthService,
    private issueService: IssueService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadIssues();
  }

  loadIssues(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.issues$ = this.issueService.getIssuesByCustomerId(user.customerId!);

    this.issues$.subscribe(issues => {
      this.issues = issues;
      this.calculateStats(issues);
      this.calculateCategoryBreakdown(issues);
      this.calculatePriorityBreakdown(issues);
      this.updateRecentActivity(issues);
      this.updateFilteredIssues();
    });
  }

  calculateStats(issues: Issue[]): void {
    this.stats.total = issues.length;
    this.stats.open = issues.filter(i => i.statusId === 1).length;
    this.stats.inProgress = issues.filter(i => i.statusId === 2).length;
    this.stats.resolved = issues.filter(i => i.statusId === 3 || i.statusId === 4).length;
  }

  calculateCategoryBreakdown(issues: Issue[]): void {
    const breakdown: Record<string, number> = {};
    issues.forEach(issue => {
      breakdown[issue.category] = (breakdown[issue.category] || 0) + 1;
    });
    this.categoryData = Object.entries(breakdown).map(([name, value]) => ({ name, value }));
  }

  calculatePriorityBreakdown(issues: Issue[]): void {
    const priorityMap: Record<string, string> = {
      '0': 'Low',
      '1': 'Medium',
      '2': 'High',
      '3': 'Urgent'
    };

    const breakdown = {
      '0': 0,
      '1': 0,
      '2': 0,
      '3': 0
    };

    issues.forEach(issue => {
      if (issue.priority in breakdown) {
        breakdown[issue.priority as keyof typeof breakdown]++;
      }
    });

    this.priorityData = Object.entries(breakdown).map(([key, value]) => ({
      name: priorityMap[key],
      value
    }));
  }

  updateRecentActivity(issues: Issue[]): void {
    this.recentActivity = [...issues]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }

  updateFilteredIssues(): void {
    this.filteredIssues = this.issues.filter(issue => {
      const matchesSearch = issue.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        issue.description.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesStatus = this.filterStatusId === 'all' || issue.statusId === this.filterStatusId;
      return matchesSearch && matchesStatus;
    });
  }

  formatDate(date: string): string {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  }

  getStatusFromId(statusId: number): IssueStatus {
    const statusMap: Record<number, IssueStatus> = {
      1: 'open',
      2: 'in-progress',
      3: 'resolved',
      4: 'closed'
    };
    return statusMap[statusId] || 'open';
  }

  getPriorityFromString(priority: string): IssuePriority {
    const priorityMap: Record<string, IssuePriority> = {
      '0': 'low',
      '1': 'medium',
      '2': 'high',
      '3': 'urgent'
    };
    return priorityMap[priority] || 'medium';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  openCreateIssue(): void {
    const user = this.authService.getCurrentUser();
    const dialogRef = this.dialog.open(CreateIssueDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Add the new issue to the service
        this.issueService.createIssue(result);
        this.loadIssues();
        this.snackBar.open(
          `Issue reported successfully! ETA: ${result.eta}`,
          'Close',
          {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          }
        );
      }
    });
  }

  openIssueDetail(issue: Issue): void {
    // TODO: Open issue detail dialog
    console.log('Open issue detail', issue);
  }

  // Watch for search and filter changes
  ngDoCheck(): void {
    this.updateFilteredIssues();
  }
}