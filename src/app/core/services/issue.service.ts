import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map, catchError, tap } from 'rxjs/operators';
import { Issue, Comment, IssueStatus, IssuePriority, IssueCategory } from '../models';
import { mockIssues, categoryETAs } from '../data/mock-data';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class IssueService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly API_URL = environment.apiUrl;

  private issuesSubject = new BehaviorSubject<Issue[]>([...mockIssues]);
  public issues$ = this.issuesSubject.asObservable();

  constructor() { }

  getIssues(): Observable<Issue[]> {
    return this.issues$;
  }

  /**
   * Get issues by status from API
   * GET http://localhost:8080/complaints/client/:clientId/status/:statusId
   */
  getIssuesByStatus(clientId: string, statusId: number): Observable<Issue[]> {
    const headers = this.authService.getAuthHeaders();

    return this.http.get<any>(`${this.API_URL}/complaints/client/${clientId}/status/${statusId}`, {
      headers
    }).pipe(
      map(response => {
        // Map API response to Issue array
        const complaints = response.complaints || response.data || response;
        return this.mapComplaintsToIssues(complaints);
      }),
      catchError(error => {
        console.error('Failed to fetch issues by status:', error);
        // Fallback to local data
        return this.filterIssues({ status: this.mapStatusIdToStatus(statusId) });
      })
    );
  }

  getIssueById(id: string): Observable<Issue | undefined> {
    return this.issues$.pipe(
      map(issues => issues.find(issue => issue.id === id))
    );
  }

  getIssuesByResidentId(residentId: string): Observable<Issue[]> {
    return this.issues$.pipe(
      map(issues => issues.filter(issue => issue.residentId === residentId))
    );
  }

  /**
   * Create issue with real API integration
   * POST http://localhost:8080/complaints/create/client/:clientId/customer/:customerId
   */
  createIssue(issueData: Omit<Issue, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'images'>): Observable<Issue> {
    const user = this.authService.getCurrentUser();

    if (!user || !user.clientId || !user.customerId) {
      console.warn('User missing clientId or customerId, using fallback');
      return this.createIssueFallback(issueData);
    }

    const headers = this.authService.getAuthHeaders();

    // Map Issue model to API complaint structure
    const complaintData = {
      clientId: user.clientId,
      customerId: user.customerId,
      title: issueData.title,
      category: this.capitalizeFirst(issueData.category),
      roomNumber: issueData.apartment,
      description: issueData.description,
      notes: [`Created by ${user.name}`, `Category: ${issueData.category}`],
      statusId: this.mapStatusToStatusId(issueData.status),
      priority: this.mapPriorityToPriorityString(issueData.priority),
      reportedBy: user.name
    };

    return this.http.post<any>(
      `${this.API_URL}/complaints/create/client/${user.clientId}/customer/${user.customerId}`,
      complaintData,
      { headers }
    ).pipe(
      map(response => {
        // Map API response to Issue
        const newIssue: Issue = {
          id: response.id || `issue-${Date.now()}`,
          title: issueData.title,
          description: issueData.description,
          category: issueData.category,
          notes: [`Created by ${user.name}`, `Category: ${issueData.category}`],
          status: issueData.status,
          statusId: this.mapStatusToStatusId(issueData.status),
          priority: issueData.priority,
          createdAt: response.createdAt || new Date().toISOString(),
          updatedAt: response.updatedAt || new Date().toISOString(),
          eta: categoryETAs[issueData.category],
          residentId: issueData.residentId,
          residentName: issueData.residentName,
          apartment: issueData.apartment,
          assignedTo: issueData.assignedTo,
          comments: [],
          images: [],
          isCommonArea: issueData.isCommonArea
        };

        // Add to local state
        const currentIssues = this.issuesSubject.value;
        this.issuesSubject.next([newIssue, ...currentIssues]);

        return newIssue;
      }),
      catchError(error => {
        console.error('Failed to create issue via API:', error);
        // Fallback to local creation
        return this.createIssueFallback(issueData);
      })
    );
  }

  /**
   * Fallback method to create issue locally
   */
  private createIssueFallback(issueData: Omit<Issue, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'images'>): Observable<Issue> {
    const newIssue: Issue = {
      ...issueData,
      statusId: this.mapStatusToStatusId(issueData.status),
      id: `issue-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      eta: categoryETAs[issueData.category],
      comments: [],
      images: []
    };

    const currentIssues = this.issuesSubject.value;
    this.issuesSubject.next([newIssue, ...currentIssues]);

    return of(newIssue).pipe(delay(300));
  }

  updateIssue(id: string, updates: Partial<Issue>): Observable<Issue> {
    const currentIssues = this.issuesSubject.value;
    const index = currentIssues.findIndex(issue => issue.id === id);

    if (index === -1) {
      return throwError(() => new Error('Issue not found'));
    }

    const updatedIssue: Issue = {
      ...currentIssues[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const newIssues = [...currentIssues];
    newIssues[index] = updatedIssue;
    this.issuesSubject.next(newIssues);

    return of(updatedIssue).pipe(delay(300));
  }

  updateStatus(id: string, status: IssueStatus): Observable<Issue> {
    return this.updateIssue(id, { status });
  }

  updatePriority(id: string, priority: IssuePriority): Observable<Issue> {
    return this.updateIssue(id, { priority });
  }

  assignStaff(id: string, staffId: string): Observable<Issue> {
    return this.updateIssue(id, { assignedTo: staffId });
  }

  addComment(issueId: string, commentData: Omit<Comment, 'id' | 'createdAt'>): Observable<Comment> {
    const newComment: Comment = {
      ...commentData,
      id: `comment-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    const currentIssues = this.issuesSubject.value;
    const issueIndex = currentIssues.findIndex(issue => issue.id === issueId);

    if (issueIndex === -1) {
      return throwError(() => new Error('Issue not found'));
    }

    const updatedIssue = {
      ...currentIssues[issueIndex],
      comments: [...currentIssues[issueIndex].comments, newComment],
      updatedAt: new Date().toISOString()
    };

    const newIssues = [...currentIssues];
    newIssues[issueIndex] = updatedIssue;
    this.issuesSubject.next(newIssues);

    return of(newComment).pipe(delay(300));
  }

  deleteIssue(id: string): Observable<void> {
    const currentIssues = this.issuesSubject.value;
    const newIssues = currentIssues.filter(issue => issue.id !== id);
    this.issuesSubject.next(newIssues);
    return of(void 0).pipe(delay(300));
  }

  searchIssues(query: string): Observable<Issue[]> {
    return this.issues$.pipe(
      map(issues => {
        const lowerQuery = query.toLowerCase();
        return issues.filter(issue =>
          issue.title.toLowerCase().includes(lowerQuery) ||
          issue.description.toLowerCase().includes(lowerQuery) ||
          issue.apartment.toLowerCase().includes(lowerQuery) ||
          issue.residentName.toLowerCase().includes(lowerQuery)
        );
      })
    );
  }

  filterIssues(filters: {
    status?: IssueStatus;
    priority?: IssuePriority;
    category?: string;
  }): Observable<Issue[]> {
    return this.issues$.pipe(
      map(issues => {
        let filtered = issues;

        if (filters.status) {
          filtered = filtered.filter(issue => issue.status === filters.status);
        }

        if (filters.priority) {
          filtered = filtered.filter(issue => issue.priority === filters.priority);
        }

        if (filters.category) {
          filtered = filtered.filter(issue => issue.category === filters.category);
        }

        return filtered;
      })
    );
  }

  // Helper methods for mapping between API and frontend models

  private mapStatusToStatusId(status: IssueStatus): number {
    const statusMap: Record<IssueStatus, number> = {
      'open': 1,
      'in-progress': 2,
      'resolved': 3,
      'closed': 4
    };
    return statusMap[status] || 1;
  }

  private mapStatusIdToStatus(statusId: number): IssueStatus {
    const statusMap: Record<number, IssueStatus> = {
      1: 'open',
      2: 'in-progress',
      3: 'resolved',
      4: 'closed'
    };
    return statusMap[statusId] || 'open';
  }

  private mapPriorityToPriorityString(priority: IssuePriority): string {
    const priorityMap: Record<IssuePriority, string> = {
      'low': '0',
      'medium': '1',
      'high': '2',
      'urgent': '3'
    };
    return priorityMap[priority] || '0';
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private mapComplaintsToIssues(complaints: any[]): Issue[] {
    return complaints.map(complaint => ({
      id: complaint.id || complaint._id,
      title: complaint.title,
      description: complaint.description,
      category: complaint.category?.toLowerCase() || 'other',
      notes: complaint.notes || [],
      status: this.mapStatusIdToStatus(complaint.statusId || 1),
      statusId: complaint.statusId || 1,
      priority: this.mapPriorityStringToPriority(complaint.priority || '0'),
      createdAt: complaint.createdAt || new Date().toISOString(),
      updatedAt: complaint.updatedAt || new Date().toISOString(),
      eta: complaint.eta || categoryETAs[(complaint.category?.toLowerCase() || 'other') as IssueCategory],
      residentId: complaint.customerId || '',
      residentName: complaint.reportedBy || 'Unknown',
      apartment: complaint.roomNumber || 'N/A',
      assignedTo: complaint.assignedTo,
      comments: [],
      images: complaint.images || [],
      isCommonArea: false
    }));
  }

  private mapPriorityStringToPriority(priority: string): IssuePriority {
    const priorityMap: Record<string, IssuePriority> = {
      '0': 'low',
      '1': 'medium',
      '2': 'high',
      '3': 'urgent'
    };
    return priorityMap[priority] || 'low';
  }

  getIssuesByCustomerId(customerId: string) {
    return this.issues$.pipe(
      map((issues) => issues.filter(issue => issue.residentId === customerId))
    );
  }
}