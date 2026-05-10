import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Issue } from '../../../core/models';
import { categoryETAs } from '../../../core/data/mock-data';
import { IssueService } from '../../../core/services/issue.service';

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
<div class="flex flex-col max-h-[92vh] overflow-hidden rounded-[28px] bg-slate-50">

  <!-- HEADER -->
  <div
    class="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-xl px-5 sm:px-8 py-5"
  >

    <div class="flex items-center gap-4">

      <div
        class="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm"
      >
        <mat-icon>support_agent</mat-icon>
      </div>

      <div>

        <h2 class="text-2xl font-black tracking-tight text-slate-900">
          Report New Issue
        </h2>

        <p class="mt-1 text-sm font-medium text-slate-500">
          Create maintenance or support request
        </p>

      </div>

    </div>

    <button
      mat-icon-button
      (click)="onCancel()"
      class="!text-slate-400 hover:!bg-slate-100 hover:!text-slate-900 transition-all"
    >
      <mat-icon>close</mat-icon>
    </button>

  </div>

  <!-- BODY -->
  <mat-dialog-content
    class="flex-1 overflow-y-auto p-5 sm:p-8"
  >

    <div class="space-y-6">

      <!-- TITLE -->
      <div
        class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
      >

        <label
          class="mb-3 block text-[11px] font-black uppercase tracking-[0.25em] text-slate-400"
        >
          Issue Title
        </label>

        <div
          class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition-all focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10"
        >

          <mat-icon class="text-slate-400">
            title
          </mat-icon>

          <input
            [(ngModel)]="title"
            type="text"
            placeholder="Water leakage in kitchen..."
            class="h-14 w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
          />

        </div>

      </div>

      <!-- CATEGORY + PRIORITY -->
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">

        <!-- CATEGORY -->
        <div
          class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
        >

          <label
            class="mb-3 block text-[11px] font-black uppercase tracking-[0.25em] text-slate-400"
          >
            Category
          </label>

          <div
            class="rounded-full border border-slate-200 bg-slate-50 h-14 flex items-center"
          >

            <mat-select
              [(ngModel)]="category"
              panelClass="premium-panel"
              class="w-full"
            >

              <mat-option
                *ngFor="let cat of availableCategories"
                [value]="cat.toLowerCase()"
              >
                {{ cat }}
              </mat-option>

            </mat-select>

          </div>

        </div>

        <!-- PRIORITY -->
        <div
          class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
        >

          <label
            class="mb-3 block text-[11px] font-black uppercase tracking-[0.25em] text-slate-400"
          >
            Priority
          </label>

          <div class="grid grid-cols-2 gap-3">

            <button
              *ngFor="let item of priorities"
              type="button"
              (click)="priority = item.value"
              class="rounded-2xl border px-4 py-4 text-left transition-all duration-200"
              [ngClass]="priority === item.value
                ? item.activeClass
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'"
            >

              <div class="flex items-center gap-2">

                <div
                  class="h-3 w-3 rounded-full"
                  [ngClass]="item.dot"
                ></div>

                <p class="text-sm font-black text-slate-800">
                  {{ item.label }}
                </p>

              </div>

              <p class="mt-1 text-xs text-slate-500">
                {{ item.desc }}
              </p>

            </button>

          </div>

        </div>

      </div>

      <!-- STATUS + ASSIGN -->
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">

        <!-- STATUS -->
        <div
          class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
        >

          <label
            class="mb-3 block text-[11px] font-black uppercase tracking-[0.25em] text-slate-400"
          >
            Initial Status
          </label>

          <div
            class="rounded-full border border-slate-200 bg-slate-50 h-14 flex items-center"
          >

            <mat-select
              [(ngModel)]="selectedStatusId"
              panelClass="premium-panel"
              class="w-full"
            >

              <mat-option
                *ngFor="let status of statusOptions"
                [value]="status.currentStatusId"
              >
                {{ status.title || status.name }}
              </mat-option>

            </mat-select>

          </div>

        </div>

        <!-- ASSIGN -->
        <div
          class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
        >

          <label
            class="mb-3 block text-[11px] font-black uppercase tracking-[0.25em] text-slate-400"
          >
            Assign Employee
          </label>

          <div
            class="rounded-full border border-slate-200 bg-slate-50 h-14 flex items-center"
          >

            <mat-select
              [(ngModel)]="selectedAssignedTo"
              panelClass="premium-panel"
              class="w-full"
            >

              <mat-option value="">
                Auto Assign
              </mat-option>

              <mat-option
                *ngFor="let employee of employees"
                [value]="employee.id"
              >
                {{ employee.label }}
              </mat-option>

            </mat-select>

          </div>

        </div>

      </div>

      <!-- ROOM -->
      <div
        class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
      >

        <label
          class="mb-3 block text-[11px] font-black uppercase tracking-[0.25em] text-slate-400"
        >
          Apartment / Room
        </label>

        <div
          class="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-5"
        >

          <mat-icon class="text-slate-400">
            apartment
          </mat-icon>

          <input
            [(ngModel)]="roomNumber"
            type="text"
            placeholder="C-704"
            class="h-14 w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
          />

        </div>

      </div>

      <!-- DESCRIPTION -->
      <div
        class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
      >

        <label
          class="mb-3 block text-[11px] font-black uppercase tracking-[0.25em] text-slate-400"
        >
          Detailed Description
        </label>

        <textarea
          [(ngModel)]="description"
          rows="5"
          placeholder="Explain the issue clearly..."
          class="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
        ></textarea>

      </div>

      <!-- ETA -->
      <div
        class="flex items-start gap-4 rounded-[28px] border border-blue-100 bg-blue-50 p-5"
      >

        <div
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600"
        >
          <mat-icon>bolt</mat-icon>
        </div>

        <div>

          <p class="text-sm font-black text-blue-900">
            Expected Resolution Time
          </p>

          <p class="mt-1 text-sm leading-6 text-blue-700">

            Expected response within

            <span class="font-black">
              {{ getETA() }}
            </span>

            for

            <span class="capitalize font-black">
              {{ category }}
            </span>

            category.

          </p>

        </div>

      </div>

    </div>

  </mat-dialog-content>

  <!-- FOOTER -->
  <div
    class="border-t border-slate-200 bg-white p-5 sm:p-6"
  >

    <div
      class="flex items-center justify-between gap-4"
    >

      <p class="hidden sm:block text-xs font-bold text-slate-400">
        Please verify the details before submitting
      </p>

      <div class="ml-auto flex items-center gap-3">

        <button
          mat-button
          (click)="onCancel()"
          class="!rounded-2xl !px-6 !py-3 !font-bold !text-slate-600"
        >
          Cancel
        </button>

        <button
          mat-flat-button
          color="primary"
          [disabled]="!isValid() || loading"
          (click)="onSubmit()"
          class="!rounded-2xl !px-8 !py-6 !font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
        >

          <div class="flex items-center gap-2">

            <mat-icon *ngIf="!loading">
              send
            </mat-icon>

            <span>
              {{ loading ? 'Submitting...' : 'Submit Request' }}
            </span>

          </div>

        </button>

      </div>

    </div>

  </div>

</div>
`,

  styles: [`
    :host {
      display: block;
      overflow: hidden;
      border-radius: 28px;
    }

    ::ng-deep .premium-panel {
      background: #ffffff !important;
      border-radius: 1rem !important;
      padding: 8px !important;
      border: 1px solid #e2e8f0 !important;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1) !important;
    }

    ::ng-deep .premium-panel .mat-mdc-option {
      color: #475569 !important;
      border-radius: 0.5rem !important;
      margin-bottom: 2px !important;
      font-size: 14px !important;
      font-weight: 600 !important;
    }

    ::ng-deep .premium-panel .mdc-list-item__primary-text {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    ::ng-deep .premium-panel .mat-mdc-option:hover {
      background: #f8fafc !important;
      color: #0f172a !important;
    }

    ::ng-deep .premium-panel .mat-mdc-option.mdc-list-item--selected {
      background: #f1f5f9 !important;
      color: #0f172a !important;
      font-weight: 700 !important;
    }
    
    ::ng-deep .premium-panel .mat-pseudo-checkbox {
      order: 2 !important;
      margin-left: auto !important;
    }

    ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
      border-radius: 28px !important;
      overflow: hidden !important;
      background: transparent !important;
      box-shadow:
        0 10px 40px rgba(15, 23, 42, 0.18) !important;
    }

    ::ng-deep .mat-mdc-dialog-content::-webkit-scrollbar {
      width: 6px;
    }

    ::ng-deep .mat-mdc-dialog-content::-webkit-scrollbar-track {
      background: transparent;
    }

    ::ng-deep .mat-mdc-dialog-content::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 999px;
    }

    ::ng-deep .mat-mdc-select-value {
      color: #0f172a !important;
      font-size: 14px;
      font-weight: 600;
    }

    ::ng-deep .mat-mdc-select-arrow {
      color: #64748b !important;
    }

    ::ng-deep .mat-mdc-select-trigger {
      padding: 0 1.25rem !important;
      box-sizing: border-box !important;
    }

    @media (max-width: 640px) {
      :host {
        border-radius: 22px;
      }
    }
  `]
})

export class CreateIssueDialogComponent implements OnInit {

  title = '';
  description = '';

  category: string = 'general';

  priority: Issue['priority'] = 'low';

  roomNumber = '';

  selectedStatusId = 1;

  selectedAssignedTo = '';

  loading = false;

  availableCategories: string[] = [];

  statusOptions: Array<{
    currentStatusId: number;
    title: string;
    name: string;
    description: string;
  }> = [];

  employees: Array<{
    id: string;
    label: string;
    email: string;
  }> = [];

  priorities: Array<{
    value: Issue['priority'];
    label: string;
    desc: string;
    dot: string;
    activeClass: string;
  }> = [
    {
      value: 'low',
      label: 'Low',
      desc: 'Routine issue',
      dot: 'bg-green-400',
      activeClass: 'border-green-300 bg-green-50'
    },
    {
      value: 'medium',
      label: 'Medium',
      desc: 'Standard issue',
      dot: 'bg-yellow-400',
      activeClass: 'border-yellow-300 bg-yellow-50'
    },
    {
      value: 'high',
      label: 'High',
      desc: 'Urgent issue',
      dot: 'bg-orange-400',
      activeClass: 'border-orange-300 bg-orange-50'
    },
    {
      value: 'urgent',
      label: 'Critical',
      desc: 'Emergency',
      dot: 'bg-red-400',
      activeClass: 'border-red-300 bg-red-50'
    }
  ];

  constructor(
    public dialogRef: MatDialogRef<CreateIssueDialogComponent>,

    @Inject(MAT_DIALOG_DATA)
    public data: { user: any },

    private issueService: IssueService
  ) {

    if (data?.user) {

      this.roomNumber =
        data.user.roomNumber ||
        data.user.apartment ||
        '';

    }
  }

  ngOnInit(): void {

    const clientId =
      this.data?.user?.clientId || 'KANHA1';

    this.loadMetadata(clientId);
  }

  loadMetadata(clientId: string): void {

    this.issueService
      .getComplaintCategories()
      .subscribe({

        next: (categories: string[]) => {

          if (categories?.length) {

            this.availableCategories = categories;

            this.category =
              categories[0].toLowerCase();

          }

        }

      });

    this.issueService
      .getComplaintStatuses(clientId)
      .subscribe({

        next: (statuses: any[]) => {

          this.statusOptions = statuses || [];

          if (statuses?.length) {

            const todoStatus = statuses.find(
              s =>
                s.name?.toLowerCase() === 'todo' ||
                s.title?.toLowerCase() === 'todo'
            );

            this.selectedStatusId =
              todoStatus?.currentStatusId ||
              statuses[0]?.currentStatusId;

          }

        }

      });

    this.issueService
      .getEmployees(clientId)
      .subscribe({

        next: (employees: any[]) => {

          this.employees = employees.map(employee => ({

            id: employee.id,

            label:
              employee.name?.trim()
                ? employee.name
                : employee.email || employee.userId,

            email: employee.email

          }));

        }

      });
  }

  getETA(): string {

    return (
      categoryETAs[this.category] ||
      '3-5 business days'
    );
  }

  isValid(): boolean {

    return !!(
      this.title.trim() &&
      this.description.trim() &&
      this.category &&
      this.priority
    );
  }

  onCancel(): void {

    this.dialogRef.close();
  }

  onSubmit(): void {

    if (!this.isValid()) {
      return;
    }

    this.loading = true;

    const selectedStatus =
      this.statusOptions.find(
        status =>
          status.currentStatusId ===
          this.selectedStatusId
      );

    const issuePayload: any = {

      title: this.title,

      description: this.description,

      category: this.category,

      priority: this.priority,

      roomNumber: this.roomNumber,

      apartment: this.roomNumber,

      notes: [
        'Initial report submitted from resident dashboard'
      ],

      status: (
        selectedStatus?.name ||
        selectedStatus?.title ||
        'Open'
      ).toLowerCase(),

      statusId: this.selectedStatusId,

      assignedTo:
        this.selectedAssignedTo || '',

      customerId:
        this.data?.user?.customerId ||
        this.data?.user?.id,

      reportedBy:
        this.data?.user?.name || ''

    };

    this.dialogRef.close(issuePayload);
  }
}