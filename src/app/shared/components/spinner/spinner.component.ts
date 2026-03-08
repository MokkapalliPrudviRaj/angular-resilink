import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="containerClasses">
      <div [class]="spinnerClasses"></div>
      <p *ngIf="text" class="mt-4 text-sm text-gray-600">{{ text }}</p>
    </div>
  `,
  styles: [`
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .animate-spin {
      animation: spin 1s linear infinite;
    }
  `]
})
export class SpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() text?: string;
  @Input() fullScreen: boolean = false;

  get containerClasses(): string {
    const base = 'flex flex-col items-center justify-center';
    return this.fullScreen 
      ? `${base} fixed inset-0 bg-white bg-opacity-80 z-50`
      : base;
  }

  get spinnerClasses(): string {
    const baseClasses = 'border-4 border-gray-200 border-t-primary rounded-full animate-spin';
    
    const sizeClasses = {
      'sm': 'w-6 h-6',
      'md': 'w-12 h-12',
      'lg': 'w-16 h-16'
    };
    
    return `${baseClasses} ${sizeClasses[this.size]}`;
  }
}
