import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled"
      [class]="buttonClasses"
      (click)="handleClick($event)">
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class ButtonComponent {
  @Input() variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' = 'default';
  @Input() size: 'default' | 'sm' | 'lg' | 'icon' = 'default';
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() extraClass: string = '';
  @Output() clicked = new EventEmitter<Event>();

  handleClick(event: Event): void {
    if (!this.disabled) {
      this.clicked.emit(event);
    }
  }

  get buttonClasses(): string {
    const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none w-full h-full';

    const variantClasses = {
      'default': 'bg-primary text-white hover:bg-primary-hover focus:ring-primary',
      'destructive': 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
      'outline': 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary',
      'secondary': 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
      'ghost': 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
      'link': 'text-primary underline-offset-4 hover:underline focus:ring-primary'
    };

    const sizeClasses = {
      'default': 'h-10 px-4 py-2',
      'sm': 'h-8 px-3 text-sm',
      'lg': 'h-12 px-6',
      'icon': 'h-10 w-10'
    };

    return `${baseClasses} ${variantClasses[this.variant]} ${sizeClasses[this.size]} ${this.extraClass}`;
  }
}
