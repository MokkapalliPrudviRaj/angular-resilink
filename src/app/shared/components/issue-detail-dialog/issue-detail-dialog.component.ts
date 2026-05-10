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
<div class="flex h-[92vh] flex-col overflow-hidden bg-[#F7F7F8]">

  <!-- TOP HEADER -->
  <div class="border-b border-slate-200 bg-white px-6 py-5">

    <div class="flex items-start justify-between gap-4">

      <div class="flex items-start gap-4">

        <!-- ICON -->
        <div
          class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm"
        >
          <mat-icon>
            {{ getIssueIcon(issue?.category) }}
          </mat-icon>
        </div>

        <!-- TITLE -->
        <div class="space-y-2">

          <div class="flex flex-wrap items-center gap-2">

            <div
              class="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500"
            >
              Ticket
            </div>

            <div
              class="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-primary"
            >
              {{ getStatusText(issue?.statusId) }}
            </div>

          </div>

          <h1
            class="text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-3xl"
          >
            {{ issue?.title }}
          </h1>

          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">

            <div class="flex items-center gap-1.5 text-slate-500">
              <mat-icon class="!h-4 !w-4 shrink-0" style="font-size:16px;line-height:1">person</mat-icon>
              <span>{{ issue?.residentName || issue?.userDetails?.name || 'Unknown' }}</span>
            </div>

            <span class="h-1 w-1 rounded-full bg-slate-300 shrink-0"></span>

            <div class="flex items-center gap-1.5 text-slate-500">
              <mat-icon class="!h-4 !w-4 shrink-0" style="font-size:16px;line-height:1">home</mat-icon>
              <span>{{ issue?.apartment || issue?.roomNumber || 'C-NA' }}</span>
            </div>

            <span class="h-1 w-1 rounded-full bg-slate-300 shrink-0"></span>

            <div class="flex items-center gap-1.5 text-slate-500">
              <mat-icon class="!h-4 !w-4 shrink-0" style="font-size:16px;line-height:1">schedule</mat-icon>
              <span>{{ formatDate(issue?.createdAt) }}</span>
            </div>

          </div>

        </div>

      </div>

      <!-- CLOSE -->
      <button
        mat-icon-button
        mat-dialog-close
        class="!text-slate-400 hover:!bg-slate-100 hover:!text-slate-900"
      >
        <mat-icon>close</mat-icon>
      </button>

    </div>

  </div>

  <!-- BODY -->
  <div class="flex-1 overflow-y-auto">

    <div class="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">

      <!-- DESCRIPTION -->
      <div
        class="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
      >

        <div class="mb-4 flex items-center gap-2">

          <div
            class="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100"
          >
            <mat-icon class="!text-slate-600">description</mat-icon>
          </div>

          <div>
            <p
              class="text-xs font-black uppercase tracking-[0.25em] text-slate-400"
            >
              Description
            </p>
          </div>

        </div>

        <p
          class="text-[15px] leading-8 text-slate-700"
        >
          {{ issue?.description || 'No description available.' }}
        </p>

      </div>

      <!-- DETAILS -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div
          class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p
            class="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400"
          >
            Assigned To
          </p>

          <div class="flex items-center gap-2">

            <div
              class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary"
            >
              {{ getInitial(issue?.assignedToDetails?.name) }}
            </div>

            <p class="text-sm font-bold text-slate-900">
              {{ issue?.assignedToDetails?.name || 'Unassigned' }}
            </p>

          </div>

        </div>

        <div
          class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p
            class="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400"
          >
            Escalated To
          </p>

          <div class="flex items-center gap-2">

            <div
              class="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-xs font-black text-orange-600"
            >
              {{ getInitial(issue?.escalateToDetails?.name) }}
            </div>

            <p class="text-sm font-bold text-slate-900">
              {{ issue?.escalateToDetails?.name || 'Not Escalated' }}
            </p>

          </div>

        </div>

        <div
          class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p
            class="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400"
          >
            Priority
          </p>

          <div class="flex items-center gap-2">

            <div
              class="rounded-full px-3 py-1 text-xs font-black"
              [ngClass]="{
                'bg-red-100 text-red-600': issue?.priority === '1',
                'bg-yellow-100 text-yellow-700': issue?.priority === '2',
                'bg-green-100 text-green-700': issue?.priority === '3'
              }"
            >
              {{ getPriority(issue?.priority) }}
            </div>

          </div>

        </div>

        <div
          class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p
            class="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400"
          >
            Category
          </p>

          <p class="text-sm font-bold capitalize text-slate-900">
            {{ issue?.category || 'General' }}
          </p>

        </div>

      </div>

      <!-- TIMELINE -->
      <div
        class="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm"
      >

        <div class="mb-8 flex items-center gap-3">

          <div
            class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"
          >
            <mat-icon>forum</mat-icon>
          </div>

          <div>
            <h2 class="text-xl font-black tracking-tight text-slate-900">
              Activity Timeline
            </h2>

            <p class="text-sm text-slate-500">
              All updates and communication history
            </p>
          </div>

        </div>

        <!-- EMPTY -->
        <div
          *ngIf="!issue?.statusUpdates?.length"
          class="rounded-3xl border border-dashed border-slate-300 py-20 text-center"
        >

          <mat-icon class="!h-16 !w-16 !text-6xl !text-slate-300">
            chat_bubble_outline
          </mat-icon>

          <p class="mt-4 text-sm font-bold text-slate-400">
            No updates available
          </p>

        </div>

        <!-- TIMELINE ITEMS -->
        <div class="space-y-8">

          <div
            *ngFor="let update of issue?.statusUpdates; let i = index"
            class="relative pl-10"
          >

            <!-- LINE -->
            <div
              *ngIf="i !== issue?.statusUpdates?.length - 1"
              class="absolute left-[15px] top-10 h-full w-[2px] bg-slate-200"
            ></div>

            <!-- DOT -->
            <div
              class="absolute left-0 top-2 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-primary shadow"
            >

              <mat-icon class="!h-4 !w-4 !text-base !text-white">
                done
              </mat-icon>

            </div>

            <!-- CARD -->
            <div
              class="rounded-[28px] border border-slate-200 bg-slate-50 p-5 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl"
            >

              <!-- TOP -->
              <div class="mb-4 flex flex-wrap items-center justify-between gap-3">

                <div class="flex flex-wrap items-center gap-2">

                  <div
                    class="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-primary"
                  >
                    {{ update?.status || 'UPDATED' }}
                  </div>

                  <div
                    class="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500"
                  >
                    #{{ i + 1 }}
                  </div>

                </div>

                <div class="text-xs font-bold text-slate-400">
                  {{ formatDate(update?.createdAt) }}
                </div>

              </div>

              <!-- NOTES -->
              <div
                *ngIf="update?.notes?.length"
                class="space-y-3"
              >

                <div
                  *ngFor="let note of update.notes"
                  class="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                >

                  <div class="flex items-start gap-3">

                    <div
                      class="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary"
                    ></div>

                    <p
                      class="text-sm leading-7 text-slate-700"
                    >
                      {{ note }}
                    </p>

                  </div>

                </div>

              </div>

              <!-- NO NOTES -->
              <div
                *ngIf="!update?.notes?.length"
                class="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm font-medium text-slate-400"
              >
                No notes added for this update.
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

  </div>

  <!-- CHATGPT STYLE INPUT -->
  <div class="border-t border-slate-200 bg-white px-4 py-4 sm:px-6">

    <div
      class="mx-auto flex max-w-5xl items-end gap-3 rounded-[30px] border border-slate-200 bg-slate-50 p-3 shadow-sm"
    >

      <textarea
        [(ngModel)]="newNote"
        rows="1"
        placeholder="Message issue timeline..."
        class="max-h-40 min-h-[52px] flex-1 resize-none border-0 bg-transparent px-2 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
      ></textarea>

      <button
        mat-mini-fab
        color="primary"
        [disabled]="!newNote.trim() || loading"
        (click)="updateNotes()"
        class="!shadow-lg shadow-primary/20"
      >

        <mat-icon *ngIf="!loading">send</mat-icon>

        <mat-icon *ngIf="loading" class="animate-spin">
          refresh
        </mat-icon>

      </button>

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

    ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
      border-radius: 32px !important;
      overflow: hidden;
      background: transparent !important;
      box-shadow: 0 20px 80px rgba(0,0,0,0.18) !important;
    }

    ::ng-deep .mat-mdc-dialog-content {
      margin: 0 !important;
      padding: 0 !important;
      max-height: unset !important;
    }

    ::ng-deep .mat-mdc-dialog-actions {
      margin: 0 !important;
      padding: 0 !important;
    }

    /* SCROLLBAR */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    ::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 999px;
    }

    ::-webkit-scrollbar-track {
      background: transparent;
    }

    textarea::-webkit-scrollbar {
      display: none;
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
    this.fetchIssue();
  }

  fetchIssue(): void {

    this.loading = true;

    this.issueService.getIssueById(this.issue.id).subscribe({
      next: (res) => {
        this.issue = res;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });

  }

  updateNotes(): void {

    if (!this.newNote.trim()) {
      return;
    }

    this.loading = true;

    const payload = [this.newNote.trim()];

    this.issueService.updateNotes(this.issue.id, payload).subscribe({
      next: (res) => {

        this.newNote = '';

        this.toast.success('Update added successfully');

        this.fetchIssue();

      },
      error: (err) => {

        console.error(err);

        this.loading = false;

        this.toast.error('Failed to update');

      }
    });

  }

  getInitial(name: string): string {
    return name?.charAt(0)?.toUpperCase() || '?';
  }

  getPriority(priority: string): string {

    switch (priority) {
      case '1':
        return 'High';

      case '2':
        return 'Medium';

      case '3':
        return 'Low';

      default:
        return 'Normal';
    }

  }

  getStatusText(statusId: number): string {

    switch (statusId) {

      case 0:
        return 'Open';

      case 1:
        return 'In Progress';

      case 2:
        return 'Resolved';

      case 3:
        return 'Closed';

      default:
        return 'Open';
    }

  }

  getIssueIcon(category: string): string {

    const map: any = {
      plumbing: 'water_drop',
      electrical: 'bolt',
      cleaning: 'cleaning_services',
      security: 'shield',
      hvac: 'ac_unit',
      appliance: 'kitchen'
    };

    return map?.[category?.toLowerCase()] || 'support_agent';
  }

  formatDate(date: string): string {

    if (!date) return '';

    return new Date(date).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

  }

}