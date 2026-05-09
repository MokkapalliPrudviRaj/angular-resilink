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

import { formatDistanceToNow } from 'date-fns';

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
    MatIconModule
  ],

  template: `
<div class="flex h-[90vh] flex-col overflow-hidden rounded-[32px] bg-[#f7f7f8]">

  <!-- HEADER -->
  <div class="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">

    <div class="flex items-center gap-4">

      <div class="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-sm">
        <mat-icon class="scale-125">
          {{ getCategoryIcon(issue?.category || 'general') }}
        </mat-icon>
      </div>

      <div>

        <div class="flex items-center gap-3 flex-wrap">

          <h2 class="text-xl font-black tracking-tight text-slate-900">
            {{ issue?.title }}
          </h2>

          <div
            class="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]"
            [ngClass]="{
              'bg-emerald-100 text-emerald-700': issue?.statusId === 1,
              'bg-amber-100 text-amber-700': issue?.statusId === 0,
              'bg-red-100 text-red-700': issue?.statusId === 2
            }"
          >
            {{ issue?.status || 'OPEN' }}
          </div>

        </div>

        <div class="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">

          <span>
            #{{ issue?.id?.substring(0,8)?.toUpperCase() }}
          </span>

          <span>•</span>

          <span>
            Room {{ issue?.roomNumber || '-' }}
          </span>

          <span>•</span>

          <span>
            {{ formatDate(issue?.createdAt) }}
          </span>

        </div>

      </div>

    </div>

    <button
      mat-icon-button
      (click)="dialogRef.close()"
      class="hover:bg-slate-100"
    >
      <mat-icon>close</mat-icon>
    </button>

  </div>

  <!-- BODY -->
  <div class="flex flex-1 overflow-hidden">

    <!-- LEFT -->
    <div class="flex flex-1 flex-col overflow-hidden">

      <!-- DESCRIPTION -->
      <div class="border-b border-slate-200 bg-white px-6 py-5">

        <div class="rounded-3xl border border-slate-200 bg-slate-50 p-5">

          <p class="text-sm leading-8 font-medium text-slate-700">
            {{ issue?.description || 'No description available' }}
          </p>

        </div>

      </div>

      <!-- CHAT -->
      <div class="flex-1 overflow-y-auto px-6 py-6 space-y-6">

        <!-- EMPTY -->
        <div
          *ngIf="!issue?.statusUpdates?.length"
          class="flex h-full flex-col items-center justify-center"
        >

          <div class="rounded-full bg-slate-200 p-5">
            <mat-icon class="!h-10 !w-10 !text-5xl text-slate-400">
              forum
            </mat-icon>
          </div>

          <h3 class="mt-5 text-lg font-black text-slate-700">
            No updates yet
          </h3>

          <p class="mt-2 text-sm font-medium text-slate-400">
            Conversation updates will appear here
          </p>

        </div>

        <!-- MESSAGES -->
        <div
          *ngFor="let update of issue?.statusUpdates"
          class="flex gap-4"
        >

          <!-- AVATAR -->
          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-black text-white shadow-lg"
          >
            {{
              issue?.reportedByDetails?.name
                ? issue.reportedByDetails.name.charAt(0)
                : 'U'
            }}
          </div>

          <!-- MESSAGE CARD -->
          <div class="flex-1">

            <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">

              <!-- TOP -->
              <div class="mb-4 flex flex-wrap items-center justify-between gap-3">

                <div class="flex items-center gap-2 flex-wrap">

                  <h4 class="text-sm font-black text-slate-900">
                    {{ issue?.reportedByDetails?.name || 'User' }}
                  </h4>

                  <div
                    class="rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.15em]"
                    [ngClass]="{
                      'bg-blue-100 text-blue-700': update?.status === 'UPDATED',
                      'bg-red-100 text-red-700': update?.status === 'ESCALATED',
                      'bg-emerald-100 text-emerald-700': update?.statusId === 1,
                      'bg-slate-100 text-slate-600': !update?.status
                    }"
                  >
                    {{ update?.status || 'NOTE' }}
                  </div>

                </div>

                <span class="text-[11px] font-bold text-slate-400">
                  {{ formatDate(update?.createdAt) }}
                </span>

              </div>

              <!-- NOTES -->
              <div
                *ngIf="update?.notes?.length; else noNotes"
                class="space-y-3"
              >

                <div
                  *ngFor="let note of update.notes"
                  class="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium leading-7 text-slate-700"
                >
                  {{ note }}
                </div>

              </div>

              <!-- EMPTY NOTES -->
              <ng-template #noNotes>

                <div class="rounded-2xl bg-slate-50 px-4 py-3">

                  <p class="text-sm italic text-slate-400">
                    No additional notes
                  </p>

                </div>

              </ng-template>

            </div>

          </div>

        </div>

      </div>

      <!-- INPUT -->
      <div class="border-t border-slate-200 bg-white p-5">

        <div class="flex items-end gap-4">

          <div class="flex-1">

            <textarea
              [(ngModel)]="newNote"
              rows="2"
              placeholder="Write an update..."
              class="min-h-[70px] w-full resize-none rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            ></textarea>

          </div>

          <button
            mat-flat-button
            color="primary"
            [disabled]="!newNote.trim() || loading"
            (click)="addNote()"
            class="!h-[56px] !w-[56px] !min-w-[56px] !rounded-2xl shadow-lg shadow-primary/20"
          >

            <mat-icon>
              send
            </mat-icon>

          </button>

        </div>

      </div>

    </div>

    <!-- RIGHT SIDEBAR -->
    <div class="hidden w-[320px] border-l border-slate-200 bg-white xl:flex xl:flex-col">

      <div class="border-b border-slate-200 p-6">

        <h3 class="text-lg font-black tracking-tight text-slate-900">
          Issue Details
        </h3>

      </div>

      <div class="flex-1 overflow-y-auto p-6 space-y-5">

        <!-- RESIDENT -->
        <div class="rounded-3xl border border-slate-200 bg-slate-50 p-5">

          <p class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            Resident
          </p>

          <h4 class="mt-2 text-sm font-bold text-slate-900">
            {{ issue?.userDetails?.name || 'Unknown' }}
          </h4>

        </div>

        <!-- ASSIGNED -->
        <div class="rounded-3xl border border-slate-200 bg-slate-50 p-5">

          <p class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            Assigned To
          </p>

          <h4 class="mt-2 text-sm font-bold text-slate-900">
            {{ issue?.assignedToDetails?.name || 'Unassigned' }}
          </h4>

        </div>

        <!-- ESCALATED -->
        <div class="rounded-3xl border border-slate-200 bg-slate-50 p-5">

          <p class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            Escalated To
          </p>

          <h4 class="mt-2 text-sm font-bold text-slate-900">
            {{ issue?.escalateToDetails?.name || 'Not Escalated' }}
          </h4>

        </div>

        <!-- PRIORITY -->
        <div class="rounded-3xl border border-slate-200 bg-slate-50 p-5">

          <p class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            Priority
          </p>

          <h4 class="mt-2 text-sm font-bold text-slate-900">
            {{ issue?.priority || '-' }}
          </h4>

        </div>

        <!-- CREATED -->
        <div class="rounded-3xl border border-slate-200 bg-slate-50 p-5">

          <p class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            Created
          </p>

          <h4 class="mt-2 text-sm font-bold text-slate-900">
            {{ formatDate(issue?.createdAt) }}
          </h4>

        </div>

      </div>

    </div>

  </div>

</div>
`,

  styles: [`
    :host {
      display: block;
      overflow: hidden;
      border-radius: 32px;
    }

    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    ::-webkit-scrollbar-track {
      background: transparent;
    }

    ::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 999px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `]
})
export class IssueDetailDialogComponent implements OnInit {

  issue: any;

  newNote = '';

  loading = false;

  constructor(
    public dialogRef: MatDialogRef<IssueDetailDialogComponent>,

    @Inject(MAT_DIALOG_DATA)
    public data: any,

    private issueService: IssueService,

    private toast: ToastService
  ) {
    this.issue = { ...data.issue };
  }

  ngOnInit(): void {
    this.refreshIssueDetails();
  }

  refreshIssueDetails(): void {

    this.loading = true;

    this.issueService.getIssueById(this.issue.id).subscribe({

      next: (response: any) => {

        this.issue = response;

        this.loading = false;
      },

      error: () => {

        this.loading = false;

        this.toast.error('Failed to load issue details');
      }
    });
  }

  addNote(): void {

    if (!this.newNote.trim()) {
      return;
    }

    this.loading = true;

    this.issueService.updateStatus(
      this.issue.id,
      this.issue.statusId,
      this.issue?.escalateToDetails?.id || '',
      [this.newNote]
    ).subscribe({

      next: () => {

        this.newNote = '';

        this.refreshIssueDetails();

        this.loading = false;

        this.toast.success('Update posted successfully');
      },

      error: () => {

        this.loading = false;

        this.toast.error('Failed to post update');
      }
    });
  }

  formatDate(date: string): string {

    if (!date) {
      return 'Just now';
    }

    try {

      return formatDistanceToNow(
        new Date(date),
        { addSuffix: true }
      );

    } catch {

      return 'Just now';
    }
  }

  getCategoryIcon(category: string): string {

    const iconMap: Record<string, string> = {

      plumbing: 'water_drop',

      electrical: 'bolt',

      hvac: 'ac_unit',

      structural: 'home',

      pest: 'bug_report',

      cleaning: 'cleaning_services',

      security: 'shield',

      appliance: 'kitchen',

      general: 'support_agent'
    };

    return iconMap[category?.toLowerCase()] || 'support_agent';
  }
}