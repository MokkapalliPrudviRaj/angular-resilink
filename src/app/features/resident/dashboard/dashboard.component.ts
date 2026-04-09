import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
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
    RouterModule,
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
  mobileMenuOpen = false;

  stats = {
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0
  };

  categoryData: CategoryData[] = [];
  priorityData: PriorityData[] = [];
  chartColors: any = {
    domain: ['#5048e5', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff']
  };
  priorityScheme: any = {
    domain: ['#10b981', '#f59e0b', '#ef4444', '#7c3aed']
  };

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

    const customerId = user.customerId || user.id;
    console.log('Fetching issues for customer:', customerId);

    this.issues$ = this.issueService.getIssuesByCustomerId(customerId);

    this.issues$.subscribe({
      next: (issues) => {
        console.log(`Loaded ${issues.length} issues`);
        this.issues = issues;
        this.calculateStats(issues);
        this.calculateCategoryBreakdown(issues);
        this.calculatePriorityBreakdown(issues);
        this.updateRecentActivity(issues);
        this.updateFilteredIssues();
      },
      error: (err) => console.error('Dashboard load error:', err)
    });
  }

  calculateStats(issues: Issue[]): void {
    this.stats.total = issues.length;
    // statusId 1: open, 2: in-progress, 3: resolved, 4: closed
    this.stats.open = issues.filter(i => i.statusId === 1).length;
    this.stats.inProgress = issues.filter(i => i.statusId === 2).length;
    this.stats.resolved = issues.filter(i => i.statusId === 3 || i.statusId === 4).length;

    console.log('Calculated Stats:', this.stats);
  }

  calculateCategoryBreakdown(issues: Issue[]): void {
    const breakdown: Record<string, number> = {};
    issues.forEach(issue => {
      const cat = (issue.category || 'other').toLowerCase();
      breakdown[cat] = (breakdown[cat] || 0) + 1;
    });
    this.categoryData = Object.entries(breakdown).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  }

  calculatePriorityBreakdown(issues: Issue[]): void {
    const priorityMap: Record<string, string> = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'urgent': 'Urgent',
      '0': 'Low',
      '1': 'Medium',
      '2': 'High',
      '3': 'Urgent'
    };

    const breakdown: Record<string, number> = {
      'Low': 0,
      'Medium': 0,
      'High': 0,
      'Urgent': 0
    };

    issues.forEach(issue => {
      const label = priorityMap[issue.priority] || 'Medium';
      breakdown[label]++;
    });

    this.priorityData = Object.entries(breakdown).map(([name, value]) => ({
      name,
      value
    }));
  }

  updateRecentActivity(issues: Issue[]): void {
    this.recentActivity = [...issues]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }

  updateFilteredIssues(): void {
    if (!this.issues) return;

    this.filteredIssues = this.issues.filter(issue => {
      const matchesSearch = !this.searchQuery ||
        issue.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        issue.description?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        issue.category?.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesStatus = this.filterStatusId === 'all' || String(issue.statusId) === String(this.filterStatusId);
      return matchesSearch && matchesStatus;
    });
  }

  formatDate(date: string): string {
    if (!date) return 'just now';
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (e) {
      return 'just now';
    }
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
      '3': 'urgent',
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'urgent': 'urgent'
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
      width: '650px',
      maxWidth: '95vw',
      panelClass: 'premium-dialog',
      data: { user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.issueService.createIssue(result as any).subscribe({
          next: (newIssue) => {
            this.snackBar.open(
              `Issue reported successfully!`,
              'Close',
              {
                duration: 4000,
                panelClass: ['success-snackbar']
              }
            );
            this.loadIssues();
          },
          error: (err) => {
            this.snackBar.open('Failed to create issue.', 'Close', { duration: 5000 });
          }
        });
      }
    });
  }

  openIssueDetail(issue: Issue): void {
    this.snackBar.open(`Viewing detail for: ${issue.title}`, 'Close', { duration: 2000 });
  }
}