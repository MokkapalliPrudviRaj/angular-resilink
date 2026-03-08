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
    <div class="create-issue-dialog">
      <h2 mat-dialog-title class="text-lg font-semibold text-gray-900 mb-4">Report Issue</h2>
      
      <mat-dialog-content class="space-y-4">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Title</mat-label>
          <input matInput [(ngModel)]="title" placeholder="Brief description" required>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Category</mat-label>
          <mat-select [(ngModel)]="category" required>
            <mat-option value="Plumbing">Plumbing</mat-option>
            <mat-option value="Electrical">Electrical</mat-option>
            <mat-option value="HVAC">HVAC</mat-option>
            <mat-option value="Appliance">Appliance</mat-option>
            <mat-option value="Structural">Structural</mat-option>
            <mat-option value="Pest">Pest Control</mat-option>
            <mat-option value="Other">Other</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Description</mat-label>
          <textarea 
            matInput 
            [(ngModel)]="description" 
            placeholder="Provide details about the issue"
            rows="4"
            required></textarea>
        </mat-form-field>

        <!-- Image Upload - Coming Soon -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Photos
            <span class="ml-2 text-xs text-gray-500 font-normal">Coming soon</span>
          </label>
          <div class="grid grid-cols-3 gap-3">
            <div
              *ngFor="let i of [1, 2, 3]"
              class="aspect-square border-2 border-dashed border-gray-200 rounded bg-gray-50 flex items-center justify-center opacity-50">
              <mat-icon class="text-gray-400">add</mat-icon>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 border border-gray-200 rounded p-3">
          <p class="text-sm text-gray-600">
            <span class="font-medium">Expected response:</span> {{ getETA() }}
          </p>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="gap-2 mt-4">
        <button mat-stroked-button (click)="onCancel()">Cancel</button>
        <button 
          mat-flat-button 
          color="primary" 
          (click)="onSubmit()"
          [disabled]="!isValid()">
          Submit
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .create-issue-dialog {
      min-width: 500px;
      max-width: 600px;
    }

    @media (max-width: 640px) {
      .create-issue-dialog {
        min-width: auto;
        width: 100%;
      }
    }

    ::ng-deep .mat-mdc-dialog-content {
      max-height: 70vh;
      overflow-y: auto;
    }

    .aspect-square {
      aspect-ratio: 1 / 1;
    }

    .hover\\:scale-98:hover {
      transform: scale(0.98);
    }
  `]
})
export class CreateIssueDialogComponent {
  title = '';
  description = '';
  category: Issue['category'] = 'other';

  constructor(
    public dialogRef: MatDialogRef<CreateIssueDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: any }
  ) { }

  getETA(): string {
    return categoryETAs[this.category] || '3-5 business days';
  }

  isValid(): boolean {
    return !!(this.title.trim() && this.description.trim() && this.category);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (!this.isValid()) return;

    const newIssue: Issue = {
      id: `issue-${Date.now()}`,
      title: this.title,
      description: this.description,
      category: this.category,
      notes: [],
      status: 'open',
      statusId: 1,
      priority: 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      eta: categoryETAs[this.category],
      residentId: this.data.user.customerId,
      residentName: this.data.user.name,
      apartment: this.data.user.roomNumber || 'N/A',
      images: [],
      comments: []
    };

    this.dialogRef.close(newIssue);
  }
}