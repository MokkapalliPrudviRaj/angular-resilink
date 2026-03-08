import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule, ButtonComponent],
  template: `
    <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div class="w-16 h-16 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
        <mat-icon class="text-4xl text-gray-400">{{ icon }}</mat-icon>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ title }}</h3>
      <p class="text-gray-600 mb-6 max-w-md">{{ description }}</p>
      <app-button 
        *ngIf="actionLabel"
        (clicked)="action.emit()">
        {{ actionLabel }}
      </app-button>
    </div>
  `
})
export class EmptyStateComponent {
  @Input() icon: string = 'inbox';
  @Input() title: string = 'No data found';
  @Input() description: string = 'There is nothing to display here yet.';
  @Input() actionLabel?: string;
  @Output() action = new EventEmitter<void>();
}
