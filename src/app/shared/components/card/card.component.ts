import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="'rounded-xl shadow-sm border border-gray-200 overflow-hidden ' + extraClass">
      <ng-content></ng-content>
    </div>
  `
})
export class CardComponent {
  @Input() extraClass: string = 'bg-white';
}

@Component({
  selector: 'app-card-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 border-b border-gray-200">
      <ng-content></ng-content>
    </div>
  `
})
export class CardHeaderComponent { }

@Component({
  selector: 'app-card-title',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h3 class="text-lg font-semibold text-gray-900">
      <ng-content></ng-content>
    </h3>
  `
})
export class CardTitleComponent { }

@Component({
  selector: 'app-card-content',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <ng-content></ng-content>
    </div>
  `
})
export class CardContentComponent { }

@Component({
  selector: 'app-card-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 pt-0">
      <ng-content></ng-content>
    </div>
  `
})
export class CardFooterComponent { }
