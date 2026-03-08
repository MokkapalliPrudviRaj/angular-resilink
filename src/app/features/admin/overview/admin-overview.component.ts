import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardContentComponent } from '../../../shared/components/card/card.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { IssueService } from '../../../core/services/issue.service';
import { Issue } from '../../../core/models';
import { formatDistanceToNow } from 'date-fns';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardContentComponent,
    StatusBadgeComponent,
    PriorityBadgeComponent
  ],
  templateUrl: './admin-overview.component.html',
  styleUrls: ['./admin-overview.component.scss']
})
export class AdminOverviewComponent implements OnInit {
  issues$!: Observable<Issue[]>;
  recentIssues$!: Observable<Issue[]>;

  stats = {
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    urgent: 0
  };

  constructor(private issueService: IssueService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.issues$ = this.issueService.getIssues();

    this.issues$.subscribe(issues => {
      this.calculateStats(issues);
    });

    this.recentIssues$ = this.issues$.pipe(
      map(issues => issues.slice(0, 5))
    );
  }

  calculateStats(issues: Issue[]): void {
    this.stats.total = issues.length;
    this.stats.open = issues.filter(i => i.status === 'open').length;
    this.stats.inProgress = issues.filter(i => i.status === 'in-progress').length;
    this.stats.resolved = issues.filter(i => i.status === 'resolved').length;
    this.stats.urgent = issues.filter(i => i.priority === 'urgent').length;
  }

  formatDate(date: string): string {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  }
}
