import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { IssueService } from '../../../core/services/issue.service';
import { StaffService } from '../../../core/services/staff.service';
import { Issue, Staff } from '../../../core/models';
import { formatDistanceToNow } from 'date-fns';

interface ChartData {
  name: string;
  value: number;
}

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    NgxChartsModule,
    NgxChartsModule,
    StatusBadgeComponent,
    PriorityBadgeComponent
  ],
  templateUrl: './admin-overview.component.html',
  styleUrls: ['./admin-overview.component.scss']
})
export class AdminOverviewComponent implements OnInit {
  issues$!: Observable<Issue[]>;
  recentIssues: Issue[] = [];
  allIssues: Issue[] = [];
  staffMembers: Staff[] = [];
  activeTabIndex = 0;

  stats = {
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    urgent: 0
  };

  avgResponseTime = 0;
  avgResponseUnit = 'Days';

  categoryData: ChartData[] = [];
  priorityData: ChartData[] = [];
  statusData: ChartData[] = [];

  chartColors: any = {
    domain: ['#5048e5', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff']
  };
  priorityScheme: any = {
    domain: ['#10b981', '#f59e0b', '#ef4444', '#7c3aed']
  };
  statusScheme: any = {
    domain: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#6b7280', '#8b5cf6', '#ec4899']
  };

  constructor(
    private issueService: IssueService,
    private staffService: StaffService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.issues$ = this.issueService.getIssues();

    this.issues$.subscribe(issues => {
      this.calculateStats(issues);
      this.calculateCategoryBreakdown(issues);
      this.calculatePriorityBreakdown(issues);
      this.calculateStatusBreakdown(issues);
      this.calculateAvgResponseTime(issues);

      this.recentIssues = [...issues]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5);

      this.allIssues = [...issues]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    });

    this.staffService.getStaff().subscribe(staff => {
      this.staffMembers = staff;
    });
  }

  calculateStats(issues: Issue[]): void {
    this.stats.total = issues.length;
    this.stats.open = issues.filter(i =>
      i.status === 'open' || i.status === 'todo'
    ).length;
    this.stats.inProgress = issues.filter(i =>
      i.status === 'in-progress' || i.status === 'pending'
    ).length;
    this.stats.resolved = issues.filter(i =>
      i.status === 'resolved' || i.status === 'closed'
    ).length;
    this.stats.urgent = issues.filter(i => i.priority === 'urgent' || i.priority === 'high').length;
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
    const breakdown: Record<string, number> = {
      'Low': 0,
      'Medium': 0,
      'High': 0,
      'Urgent': 0
    };

    const priorityMap: Record<string, string> = {
      'low': 'Low', 'medium': 'Medium', 'high': 'High', 'urgent': 'Urgent',
      '0': 'Low', '1': 'Medium', '2': 'High', '3': 'Urgent'
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

  calculateStatusBreakdown(issues: Issue[]): void {
    const statusMap: Record<string, string> = {
      'open': 'Open',
      'todo': 'Todo',
      'in-progress': 'In Progress',
      'pending': 'Pending',
      'resolved': 'Resolved',
      'rejected': 'Rejected',
      'closed': 'Closed'
    };

    // Also pull dynamic labels from the API status cache
    const apiStatuses = this.issueService.getStatusCache();
    if (apiStatuses?.length) {
      apiStatuses.forEach(s => {
        const key = (s.description || s.name || s.title || '').toLowerCase().replace(/_/g, '-');
        const label = s.title || s.name || s.description || key;
        if (key && !statusMap[key]) {
          statusMap[key] = label.charAt(0).toUpperCase() + label.slice(1);
        }
      });
    }

    const breakdown: Record<string, number> = {};

    issues.forEach(issue => {
      const label = statusMap[issue.status] || (issue.status.charAt(0).toUpperCase() + issue.status.slice(1));
      breakdown[label] = (breakdown[label] || 0) + 1;
    });

    this.statusData = Object.entries(breakdown)
      .filter(([_, value]) => value > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }

  calculateAvgResponseTime(issues: Issue[]): void {
    const resolvedIssues = issues.filter(i =>
      (i.status === 'resolved' || i.status === 'closed') && i.createdAt && i.updatedAt
    );

    if (resolvedIssues.length === 0) {
      // Fallback: compute avg age of all open issues
      const openIssues = issues.filter(i => i.createdAt);
      if (openIssues.length === 0) {
        this.avgResponseTime = 0;
        this.avgResponseUnit = 'Days';
        return;
      }
      const now = Date.now();
      const totalHours = openIssues.reduce((sum, i) => {
        return sum + (now - new Date(i.createdAt).getTime()) / (1000 * 60 * 60);
      }, 0);
      const avgHours = totalHours / openIssues.length;
      if (avgHours < 24) {
        this.avgResponseTime = Math.round(avgHours * 10) / 10;
        this.avgResponseUnit = 'Hrs';
      } else {
        this.avgResponseTime = Math.round((avgHours / 24) * 10) / 10;
        this.avgResponseUnit = 'Days';
      }
      return;
    }

    const totalHours = resolvedIssues.reduce((sum, i) => {
      const created = new Date(i.createdAt).getTime();
      const updated = new Date(i.updatedAt).getTime();
      return sum + Math.max(0, updated - created) / (1000 * 60 * 60);
    }, 0);

    const avgHours = totalHours / resolvedIssues.length;
    if (avgHours < 24) {
      this.avgResponseTime = Math.round(avgHours * 10) / 10;
      this.avgResponseUnit = 'Hrs';
    } else {
      this.avgResponseTime = Math.round((avgHours / 24) * 10) / 10;
      this.avgResponseUnit = 'Days';
    }
  }

  formatDate(date: string): string {
    if (!date) return 'just now';
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (e) {
      return 'just now';
    }
  }

  getCategoryIcon(category: string): string {
    const iconMap: Record<string, string> = {
      'plumbing': 'water_drop',
      'electrical': 'bolt',
      'hvac': 'ac_unit',
      'structural': 'foundation',
      'pest': 'pest_control',
      'cleaning': 'cleaning_services',
      'security': 'security',
      'appliance': 'kitchen'
    };
    return iconMap[category?.toLowerCase()] || 'build';
  }
}
