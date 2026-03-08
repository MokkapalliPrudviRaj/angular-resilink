import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { IssuePriority } from '../../../core/models';

@Component({
  selector: 'app-priority-badge',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <span [class]="badgeClasses">
      <mat-icon [class]="iconClasses">{{ icon }}</mat-icon>
      {{ priorityLabel }}
    </span>
  `
})
export class PriorityBadgeComponent {
  @Input() priority!: IssuePriority;

  get priorityLabel(): string {
    const labels: Record<IssuePriority, string> = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'urgent': 'Urgent'
    };
    return labels[this.priority];
  }

  get icon(): string {
    const icons: Record<IssuePriority, string> = {
      'low': 'arrow_downward',
      'medium': 'horizontal_rule',
      'high': 'arrow_upward',
      'urgent': 'warning'
    };
    return icons[this.priority];
  }

  get badgeClasses(): string {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit';
    const priorityClasses: Record<IssuePriority, string> = {
      'low': 'bg-gray-50 text-gray-700',
      'medium': 'bg-blue-50 text-blue-700',
      'high': 'bg-orange-50 text-orange-700',
      'urgent': 'bg-red-50 text-red-700'
    };
    return `${baseClasses} ${priorityClasses[this.priority]}`;
  }

  get iconClasses(): string {
    return 'text-sm !w-3 !h-3';
  }
}
