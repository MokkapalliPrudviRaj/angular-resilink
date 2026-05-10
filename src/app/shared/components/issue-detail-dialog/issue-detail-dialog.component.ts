import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { IssueService } from '../../../core/services/issue.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-issue-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <div class="issue-detail-container p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
          {{ issue?.title }}
        </h2>
        <button mat-icon-button mat-dialog-close class="text-gray-400 hover:text-gray-600">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="space-y-6 pt-2 m-0 max-h-[60vh]">
        
        <!-- Description -->
        <div *ngIf="issue?.description" class="bg-slate-50/50 border border-slate-100 rounded-xl p-4">
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</p>
          <p class="text-sm text-slate-700 leading-relaxed">{{ issue.description }}</p>
        </div>

        <!-- Notes -->
        <div *ngIf="issue?.notes?.length">
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Timeline & Notes</p>
          <div class="space-y-3">
            <div *ngFor="let note of issue.notes" class="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
              <mat-icon class="text-blue-500 mt-0.5">chat</mat-icon>
              <div class="flex-1">
                <p class="text-sm text-blue-900 font-medium leading-relaxed">{{ note }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- New Note Input -->
        <div class="pt-2">
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Add New Note</p>
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Your Note</mat-label>
            <textarea 
              matInput 
              [(ngModel)]="newNote" 
              placeholder="Type update here..." 
              rows="3"
              [disabled]="loading"
            ></textarea>
          </mat-form-field>
        </div>

      </mat-dialog-content>

      <mat-dialog-actions align="end" class="gap-3 mt-6 p-0">
        <button mat-button mat-dialog-close [disabled]="loading" class="px-6 py-2 rounded-lg text-gray-600 font-medium">
          Cancel
        </button>
        <button 
          mat-flat-button 
          color="primary" 
          [disabled]="!newNote.trim() || loading"
          (click)="updateNotes()"
          class="px-8 py-2 rounded-lg font-bold shadow-md shadow-primary/20 hover:scale-[1.02] transition-transform"
        >
          <span *ngIf="!loading">Update Notes</span>
          <span *ngIf="loading">Updating...</span>
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
    
    .issue-detail-container {
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

    /* Custom scrollbar for content */
    mat-dialog-content::-webkit-scrollbar {
      width: 6px;
    }
    mat-dialog-content::-webkit-scrollbar-track {
      background: transparent;
    }
    mat-dialog-content::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 999px;
    }
    mat-dialog-content::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }

    @media (max-width: 640px) {
      .issue-detail-container {
        width: 100%;
        padding: 1.25rem;
      }
    }
  `]
})
export class IssueDetailDialogComponent implements OnInit {
  issue: any;
  newNote = '';
  loading = false;

  constructor(
    public dialogRef: MatDialogRef<IssueDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private issueService: IssueService,
    private toast: ToastService
  ) {
    this.issue = { ...data.issue };
  }

  ngOnInit(): void {
    this.loading = true;
    this.issueService.getIssueById(this.issue.id).subscribe({
      next: (updatedIssue) => {
        this.issue = { ...this.issue, ...updatedIssue };
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to fetch latest issue data:', err);
        this.loading = false;
        // Even if it fails, we still have the initial data passed to the dialog
      }
    });
  }

  updateNotes(): void {
    if (!this.newNote.trim()) {
      return;
    }

    this.loading = true;
    
    // The backend appends notes, so we only send the new note
    const newNotesArray = [this.newNote.trim()];

    this.issueService.updateNotes(this.issue.id, newNotesArray).subscribe({
      next: (response) => {
        this.newNote = '';
        this.loading = false;
        this.toast.success('Notes updated successfully');
        this.dialogRef.close(response);
      },
      error: (err) => {
        console.error('Update notes error:', err);
        // Even if there's a parsing error from the backend, if it reached here,
        // it might have actually succeeded. The service should catch it now.
        this.loading = false;
        this.toast.error('Failed to update notes');
      }
    });
  }
}