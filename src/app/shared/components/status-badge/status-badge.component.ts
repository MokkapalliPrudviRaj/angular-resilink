import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IssueStatus } from '../../../core/models';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClasses">
      {{ statusLabel }}
    </span>
  `
})
export class StatusBadgeComponent {
  @Input() status!: IssueStatus;

  get statusLabel(): string {
    const labels: Record<IssueStatus, string> = {
      'open': 'Open',
      'in-progress': 'In Progress',
      'resolved': 'Resolved',
      'closed': 'Closed'
    };
    return labels[this.status];
  }

  get badgeClasses(): string {
    const baseClasses = 'px-3 py-1 rounded-full text-xs font-medium border';
    const statusClasses: Record<IssueStatus, string> = {
      'open': 'bg-blue-50 text-blue-700 border-blue-200',
      'in-progress': 'bg-amber-50 text-amber-700 border-amber-200',
      'resolved': 'bg-green-50 text-green-700 border-green-200',
      'closed': 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return `${baseClasses} ${statusClasses[this.status]}`;
  }
}
