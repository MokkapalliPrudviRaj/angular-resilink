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
    return this.http.get<any>(`${this.API_URL}/complaints/client/${clientId}/status/${statusId}`).pipe(
      map(response => {
        const complaints = Array.isArray(response) ? response : (response.complaints || response.data || []);
        return this.mapComplaintsToIssues(complaints);
      }),
      catchError(error => {
        console.error(`Failed to fetch issues by status ${statusId}:`, error);
        return of([]); // Return empty array on failure instead of error, so merge observables succeed
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

    if (!user) {
      console.warn('No user logged in, using fallback');
      return this.createIssueFallback(issueData);
    }

    const clientId = user.clientId || 'KANHA1';
    const customerId = user.customerId || user.id;

    console.log('Creating issue with:', { clientId, customerId, title: issueData.title });

    // Map Issue model to API complaint structure
    const complaintData = {
      clientId: clientId,
      customerId: customerId,
      title: issueData.title,
      category: this.capitalizeFirst(issueData.category),
      roomNumber: issueData.apartment || user.roomNumber || user.apartment || 'N/A',
      description: issueData.description,
      notes: issueData.notes && issueData.notes.length > 0 ? issueData.notes : [`Reported by ${user.name}`],
      statusId: issueData.statusId || this.mapStatusToStatusId(issueData.status),
      priority: this.mapPriorityToPriorityString(issueData.priority)
    };

    return this.http.post<any>(
      `${this.API_URL}/complaints/create/client/${clientId}/customer/${customerId}`,
      complaintData
    ).pipe(
      tap(resp => console.log('API Create Response:', resp)),
      map(response => {
        const newIssue: Issue = {
          id: response.id || `issue-${Date.now()}`,
          title: issueData.title,
          description: issueData.description,
          category: issueData.category,
          notes: complaintData.notes,
          status: this.mapStatusIdToStatus(complaintData.statusId),
          statusId: complaintData.statusId,
          priority: issueData.priority,
          createdAt: response.createdAt || new Date().toISOString(),
          updatedAt: response.updatedAt || new Date().toISOString(),
          eta: categoryETAs[issueData.category] || '3-5 business days',
          residentId: customerId,
          residentName: user.name,
          apartment: complaintData.roomNumber,
          assignedTo: response.assignedTo || '',
          comments: [],
          images: [],
          isCommonArea: issueData.isCommonArea || false
        };

        const currentIssues = this.issuesSubject.value;
        this.issuesSubject.next([newIssue, ...currentIssues]);
        return newIssue;
      }),
      catchError(error => {
        console.error('Failed to create issue via API:', error);
        return this.createIssueFallback(issueData);
      })
    );
  }

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
        if (filters.status) filtered = filtered.filter(i => i.status === filters.status);
        if (filters.priority) filtered = filtered.filter(i => i.priority === filters.priority);
        if (filters.category) filtered = filtered.filter(i => i.category === filters.category);
        return filtered;
      })
    );
  }

  private mapStatusToStatusId(status: IssueStatus): number {
    const statusMap: Record<IssueStatus, number> = {
      'open': 1, 'in-progress': 2, 'resolved': 3, 'closed': 4
    };
    return statusMap[status] || 1;
  }

  private mapStatusIdToStatus(statusId: number): IssueStatus {
    const statusMap: Record<number, IssueStatus> = {
      1: 'open', 2: 'in-progress', 3: 'resolved', 4: 'closed'
    };
    return statusMap[statusId] || 'open';
  }

  private mapPriorityToPriorityString(priority: IssuePriority): string {
    const priorityMap: Record<IssuePriority, string> = {
      'low': '0', 'medium': '1', 'high': '2', 'urgent': '3'
    };
    return priorityMap[priority] || '0';
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private mapComplaintsToIssues(complaints: any[]): Issue[] {
    return complaints.map(complaint => {
      const statusId = Number(complaint.statusId || 1);
      return {
        id: complaint.id || complaint._id,
        title: complaint.title,
        description: complaint.description,
        category: (complaint.category || 'other').toLowerCase(),
        notes: complaint.notes || [],
        status: this.mapStatusIdToStatus(statusId),
        statusId: statusId,
        priority: this.mapPriorityStringToPriority(String(complaint.priority || '0')),
        createdAt: complaint.createdAt || new Date().toISOString(),
        updatedAt: complaint.updatedAt || new Date().toISOString(),
        eta: complaint.eta || categoryETAs[((complaint.category || 'other').toLowerCase()) as IssueCategory],
        residentId: complaint.customerId || '',
        residentName: complaint.reportedBy || 'Unknown',
        apartment: complaint.roomNumber || 'N/A',
        assignedTo: complaint.assignedTo,
        comments: [],
        images: complaint.images || [],
        isCommonArea: false
      };
    });
  }

  private mapPriorityStringToPriority(priority: string): IssuePriority {
    const priorityMap: Record<string, IssuePriority> = {
      '0': 'low', '1': 'medium', '2': 'high', '3': 'urgent'
    };
    return priorityMap[priority] || 'low';
  }

  getIssuesByCustomerId(customerId: string): Observable<Issue[]> {
    const user = this.authService.getCurrentUser();
    if (!user || !user.clientId) {
      console.warn(`[IssueService] ClientId missing, falling back to mock data`);
      return this.issues$.pipe(map(issues => issues.filter(i => i.residentId === customerId)));
    }

    // Call the combined api endpoint that fetches all complaints for this customer
    this.http.get<any>(`${this.API_URL}/complaints/all/client/${user.clientId}/customer/${customerId}`).pipe(
      map(response => {
        const complaints = Array.isArray(response) ? response : (response.complaints || response.data || []);
        let allUserIssues = this.mapComplaintsToIssues(complaints);

        // Sort by newest first
        allUserIssues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        this.issuesSubject.next(allUserIssues);
      }),
      catchError(error => {
        console.error('Failed to fetch all issues by customerId:', error);
        return of([]);
      })
    ).subscribe();

    return this.issues$;
  }
}