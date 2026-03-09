import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Issue } from '../../../core/models';
import { categoryETAs } from '../../../core/data/mock-data';

@Component({
  selector: 'app-create-issue-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="create-issue-container p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
          Report New Issue
        </h2>
        <button mat-icon-button (click)="onCancel()" class="text-gray-400 hover:text-gray-600">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <mat-dialog-content class="space-y-6 pt-2 m-0">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <mat-form-field appearance="outline" class="w-full h-fit">
            <mat-label>Title</mat-label>
            <input matInput [(ngModel)]="title" placeholder="e.g., Water flow prob in kitchen" required>
            <mat-icon matSuffix class="text-gray-400">title</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full h-fit">
            <mat-label>Category</mat-label>
            <mat-select [(ngModel)]="category" required>
              <mat-option *ngFor="let cat of availableCategories" [value]="cat.toLowerCase()">
                {{ cat }}
              </mat-option>
            </mat-select>
            <mat-icon matSuffix class="text-gray-400">category</mat-icon>
          </mat-form-field>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <mat-form-field appearance="outline" class="w-full h-fit">
            <mat-label>Priority</mat-label>
            <mat-select [(ngModel)]="priority" required>
              <mat-option value="low">Low (Routine)</mat-option>
              <mat-option value="medium">Medium (Standard)</mat-option>
              <mat-option value="high">High (Urgent)</mat-option>
              <mat-option value="urgent">Critical (Emergency)</mat-option>
            </mat-select>
            <mat-icon matSuffix [class.text-red-500]="priority === 'urgent'" class="text-gray-400">priority_high</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full h-fit">
            <mat-label>Apartment/Room</mat-label>
            <input matInput [(ngModel)]="roomNumber" placeholder="e.g., C-704">
            <mat-icon matSuffix class="text-gray-400">room</mat-icon>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Detailed Description</mat-label>
          <textarea 
            matInput 
            [(ngModel)]="description" 
            placeholder="Explain what's wrong so we can help faster..."
            rows="3"
            required></textarea>
        </mat-form-field>

        <div class="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
          <mat-icon class="text-blue-500 mt-0.5">info</mat-icon>
          <div>
            <p class="text-sm text-blue-800 font-medium">Resolution Target</p>
            <p class="text-xs text-blue-600">Expected response within {{ getETA() }} for {{ category }} requests.</p>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="gap-3 mt-6 p-0">
        <button mat-button (click)="onCancel()" class="px-6 py-2 rounded-lg text-gray-600 font-medium">
          Cancel
        </button>
        <button 
          mat-flat-button 
          color="primary" 
          (click)="onSubmit()"
          [disabled]="!isValid() || loading"
          class="px-8 py-2 rounded-lg font-bold shadow-md shadow-primary/20 hover:scale-[1.02] transition-transform">
          <span *ngIf="!loading">Submit Request</span>
          <span *ngIf="loading">Processing...</span>
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      overflow: hidden;
      border-radius: 1.5rem;
    }
    
    .create-issue-container {
      background: white;
      max-width: 650px;
    }

    ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
      border-radius: 1.5rem !important;
      overflow: hidden;
    }

    ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }

    mat-form-field {
      margin-bottom: 0px !important;
    }

    @media (max-width: 640px) {
      .create-issue-container {
        width: 100%;
        padding: 1.25rem;
      }
    }
  `]
})
export class CreateIssueDialogComponent {
  title = '';
  description = '';
  category: string = 'general';
  priority: Issue['priority'] = 'medium';
  roomNumber = '';
  loading = false;

  availableCategories = [
    'General', 'Electrical', 'Water', 'Gas', 'Heating', 'Cooling', 'Appliances', 'Furniture',
    'Kitchen', 'Bathroom', 'Living Room', 'Bedroom', 'Office', 'Garage', 'Basement', 'Attic',
    'Storage', 'Barn', 'Carpet', 'Floor', 'Ceiling', 'Shelves', 'Cabinets', 'Bookcases'
  ];

  constructor(
    public dialogRef: MatDialogRef<CreateIssueDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: any }
  ) {
    if (data.user) {
      this.roomNumber = data.user.roomNumber || data.user.apartment || '';
    }
  }

  getETA(): string {
    return categoryETAs[this.category] || '3-5 business days';
  }

  isValid(): boolean {
    return !!(this.title.trim() && this.description.trim() && this.category && this.priority);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (!this.isValid()) return;
    this.loading = true;

    // Simulate small delay for UX if needed, or just close
    const issuePayload: Partial<Issue> = {
      title: this.title,
      description: this.description,
      category: this.category,
      priority: this.priority,
      apartment: this.roomNumber,
      notes: [`Initial report by resident via dashboard`],
      status: 'open',
      statusId: 1
    };

    this.dialogRef.close(issuePayload);
  }
}