import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError, switchMap, shareReplay } from 'rxjs';
import { delay, map, catchError, tap } from 'rxjs/operators';
import { Issue, Comment, IssueStatus, IssuePriority, IssueCategory, ComplaintStatus, Employee } from '../models';
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

  private issuesSubject = new BehaviorSubject<Issue[]>([]);
  public issues$ = this.issuesSubject.asObservable();

  constructor() { }

  private issuesCached$: Observable<Issue[]> | null = null;

  getIssues(): Observable<Issue[]> {
    if (this.issuesCached$) return this.issuesCached$;

    const user = this.authService.getCurrentUser();
    const clientId = user?.clientId || 'KANHA1';

    this.issuesCached$ = this.getComplaintStatuses(clientId).pipe(
      switchMap(() => this.http.get<any>(`${this.API_URL}/complaint-service/complaints/client/${clientId}?t=${new Date().getTime()}`)),
      map(response => {
        const complaints = Array.isArray(response) ? response : (response.complaints || response.data || []);
        let allIssues = this.mapComplaintsToIssues(complaints);

        // Sort by newest first
        allIssues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        this.issuesSubject.next(allIssues);
        return allIssues;
      }),
      shareReplay(1),
      catchError(error => {
        console.error('Failed to fetch all issues for admin:', error);
        this.issuesCached$ = null; // Clear on error so we can try again
        return of([]);
      })
    );

    return this.issuesCached$;
  }

  refreshIssues(): void {
    this.issuesCached$ = null;
    this.getIssues().subscribe();
  }

  /**
   * Get issues by status from API
   * GET http://localhost:8080/complaints/client/:clientId/status/:statusId
   */
  getIssuesByStatus(clientId: string, statusId: number): Observable<Issue[]> {
    return this.http.get<any>(`${this.API_URL}/complaint-service/complaints/client/${clientId}/status/${statusId}`).pipe(
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

  getComplaintCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_URL}/complaint-service/complaint/categories/all`).pipe(
      catchError(error => {
        console.error('Failed to load complaint categories:', error);
        return of([] as string[]);
      })
    );
  }

  getEmployees(clientId: string): Observable<Employee[]> {
    return this.http.post<Employee[]>(`${this.API_URL}/user-service/employees/${clientId}`, {}).pipe(
      catchError(error => {
        console.error('Failed to load employees:', error);
        return of([] as Employee[]);
      })
    );
  }

  getIssueById(id: string): Observable<Issue> {
    return this.http.get<any>(`${this.API_URL}/complaint-service/complaint/${id}`).pipe(
      map(response => {
        const issues = this.mapComplaintsToIssues([response]);
        return issues[0];
      }),
      catchError(error => {
        console.error(`Failed to fetch issue details for ${id}:`, error);
        return throwError(() => new Error('Could not load issue details'));
      })
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
      category: this.titleCase(issueData.category),
      roomNumber: user.roomNumber || 'C-NA',
      description: issueData.description,
      notes: issueData.notes && issueData.notes.length > 0 ? issueData.notes : [`Reported by ${user.name}`],
      statusId: issueData.statusId || this.mapStatusToStatusId(issueData.status),
      priority: this.mapPriorityToPriorityString(issueData.priority),
      assignedTo: issueData.assignedTo || ''
    };

    return this.http.post<any>(
      `${this.API_URL}/complaint-service/complaint/create/client/${clientId}/user/${customerId}`,
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
          status: issueData.status || this.mapStatusIdToStatus(complaintData.statusId),
          statusId: complaintData.statusId,
          priority: issueData.priority,
          createdAt: response.createdAt || new Date().toISOString(),
          updatedAt: response.updatedAt || new Date().toISOString(),
          eta: categoryETAs[issueData.category] || '3-5 business days',
          residentId: customerId,
          residentName: user.name,
          apartment: complaintData.roomNumber,
          assignedTo: response.assignedTo || issueData.assignedTo || '',
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

  updateStatus(id: string, status: IssueStatus, escalateTo: string = '', notes: string[] = []): Observable<Issue> {
    const user = this.authService.getCurrentUser();
    const statusId = this.mapStatusToStatusId(status);
    const category = this.getIssueCategoryById(id);
    const baseNote = `Status changed to ${status}`;
    const allNotes = notes.length > 0 ? notes : [baseNote];

    const body = {
      statusId,
      category: this.capitalizeFirst(category),
      updatedBy: user?.id || user?.customerId || '',
      escalateTo: escalateTo || '',
      notes: allNotes
    };

    return this.http.post<any>(
      `${this.API_URL}/complaint-service/complaint/update/${id}`,
      body,
      { headers: this.authService.getAuthHeaders() }
    ).pipe(
      map(response => {
        const currentIssues = this.issuesSubject.value;
        const issueIndex = currentIssues.findIndex(issue => issue.id === id);
        const updatedIssue: Issue = issueIndex === -1 ? {
          id,
          title: response.title || 'Updated Issue',
          description: response.description || '',
          category: (response.category || category).toLowerCase(),
          notes: response.notes || allNotes,
          status,
          statusId,
          priority: this.mapPriorityStringToPriority(String(response.priority || '0')),
          createdAt: response.createdAt || new Date().toISOString(),
          updatedAt: response.updatedAt || new Date().toISOString(),
          eta: response.eta || '',
          residentId: response.customerId || '',
          residentName: response.reportedBy || 'Unknown',
          apartment: response.roomNumber || 'N/A',
          assignedTo: response.assignedTo || '',
          comments: [],
          images: response.images || [],
          isCommonArea: false
        } : {
          ...currentIssues[issueIndex],
          status,
          statusId,
          updatedAt: response.updatedAt || new Date().toISOString(),
          notes: [...currentIssues[issueIndex].notes, ...allNotes]
        };

        if (issueIndex !== -1) {
          const newIssues = [...currentIssues];
          newIssues[issueIndex] = updatedIssue;
          this.issuesSubject.next(newIssues);
        }

        return updatedIssue;
      }),
      catchError(error => {
        console.error('Failed to update complaint status via API:', error);
        return this.updateIssue(id, { status });
      })
    );
  }

  updateNotes(id: string, notes: string[]): Observable<any> {
    const user = this.authService.getCurrentUser();
    const currentIssues = this.issuesSubject.value;
    const issue = currentIssues.find(i => i.id === id);

    const body = {
      statusId: issue ? (issue.statusId || this.mapStatusToStatusId(issue.status)) : 1,
      category: issue ? this.capitalizeFirst(issue.category || 'General') : 'General',
      updatedBy: user?.id || user?.customerId || '',
      escalateTo: issue?.escalateTo || '',
      notes: notes
    };

    return this.http.post(
      `${this.API_URL}/complaint-service/complaint/update/${id}`,
      body,
      { headers: this.authService.getAuthHeaders(), responseType: 'text' }
    ).pipe(
      map(responseText => {
        let response: any = {};
        try {
          response = JSON.parse(responseText);
        } catch (e) {
          response = { message: responseText };
        }

        // Also update local cache
        if (issue) {
          const issueIndex = currentIssues.findIndex(i => i.id === id);
          if (issueIndex !== -1) {
            const updatedIssue = {
              ...currentIssues[issueIndex],
              notes: [...currentIssues[issueIndex].notes, ...notes]
            };
            const newIssues = [...currentIssues];
            newIssues[issueIndex] = updatedIssue;
            this.issuesSubject.next(newIssues);
          }
        }
        return response;
      }),
      catchError(error => {
        console.error('Failed to update notes via API:', error);
        return throwError(() => error);
      })
    );
  }

  updatePriority(id: string, priority: IssuePriority): Observable<Issue> {
    return this.updateIssue(id, { priority });
  }

  assignStaff(id: string, staffId: string): Observable<Issue> {
    const body = {
      assignTo: staffId
    };

    return this.http.post<any>(
      `${this.API_URL}/complaint-service/complaint/assign-to/${id}`,
      body,
      { headers: this.authService.getAuthHeaders() }
    ).pipe(
      map(response => {
        // Find and update the local issue state
        const currentIssues = this.issuesSubject.value;
        const index = currentIssues.findIndex(i => i.id === id);

        if (index !== -1) {
          const updatedIssue = {
            ...currentIssues[index],
            assignedTo: staffId,
            // Safe navigation for response and assignedToDetails
            assignedToName: response?.assignedToDetails?.name || currentIssues[index].assignedToName
          };

          const newIssues = [...currentIssues];
          newIssues[index] = updatedIssue;
          this.issuesSubject.next(newIssues);
          return updatedIssue;
        }

        // If not found in local list, map from response
        const mapped = this.mapComplaintsToIssues([response]);
        return mapped[0];
      }),
      catchError(error => {
        console.error('Failed to assign staff via API:', error);
        return throwError(() => new Error('Failed to assign staff'));
      })
    );
  }
  escalateIssue(id: string, staffId: string): Observable<Issue> {
    const body = {
      escalateTo: staffId
    };

    return this.http.post<any>(
      `${this.API_URL}/complaint-service/complaint/escalate-to/${id}`,
      body,
      { headers: this.authService.getAuthHeaders() }
    ).pipe(
      map(response => {
        const currentIssues = this.issuesSubject.value;
        const index = currentIssues.findIndex(i => i.id === id);

        if (index !== -1) {
          const updatedIssue = {
            ...currentIssues[index],
            escalateTo: staffId,
            // Safe navigation for response and escalateToDetails
            escalateToName: response?.escalateToDetails?.name || currentIssues[index].escalateToName
          };

          const newIssues = [...currentIssues];
          newIssues[index] = updatedIssue;
          this.issuesSubject.next(newIssues);
          return updatedIssue;
        }

        const mapped = this.mapComplaintsToIssues([response]);
        return mapped[0];
      }),
      catchError(error => {
        console.error('Failed to escalate issue via API:', error);
        return throwError(() => new Error('Failed to escalate issue'));
      })
    );
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

  private getIssueCategoryById(id: string): string {
    const issue = this.issuesSubject.value.find(issueItem => issueItem.id === id);
    return issue?.category || 'general';
  }

  private mapStatusToStatusId(status: string): number {
    if (this.statusCache.length > 0) {
      const match = this.statusCache.find(s =>
        s.name.toLowerCase() === status.toLowerCase() ||
        s.title.toLowerCase() === status.toLowerCase()
      );
      if (match) return match.currentStatusId;
    }

    const statusMap: Record<string, number> = {
      'open': 1, 'in-progress': 2, 'resolved': 3, 'closed': 4
    };
    return statusMap[status] || 1;
  }

  private statusCache: any[] = [];

  getStatusCache(): any[] {
    return this.statusCache;
  }

  getComplaintStatuses(clientId: string): Observable<any[]> {
    if (this.statusCache && this.statusCache.length > 0) {
      return of(this.statusCache);
    }
    return this.http.get<any[]>(`${this.API_URL}/complaint-service/complaint-status/all/client/${clientId}`).pipe(
      tap(statuses => this.statusCache = statuses),
      catchError(error => {
        console.error('Failed to fetch complaint statuses:', error);
        return of([]);
      })
    );
  }

  private mapStatusIdToStatus(statusId: number): string {
    if (!this.statusCache || this.statusCache.length === 0) {
      const statusMap: Record<number, string> = {
        1: 'Todo', 2: 'Pending', 3: 'Resolved', 4: 'Rejected'
      };
      return statusMap[statusId] || 'Todo';
    }

    // Exact match using currentStatusId from API
    const matchedStatus = this.statusCache.find(s => s.currentStatusId === statusId);

    // If statusId is 0, default to 'Todo' or first status
    if (statusId === 0) {
      const todoStatus = this.statusCache.find(s => s.currentStatusId === 1) || this.statusCache[0];
      return todoStatus ? todoStatus.description : 'Todo';
    }

    return matchedStatus ? matchedStatus.description : 'Todo';
  }

  private mapPriorityToPriorityString(priority: IssuePriority): string {
    const priorityMap: Record<IssuePriority, string> = {
      'low': '0', 'medium': '1', 'high': '2', 'urgent': '3'
    };
    return priorityMap[priority] || '0';
  }

  private titleCase(str: string): string {
    return str
      .toLowerCase()
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private mapComplaintsToIssues(complaints: any[]): Issue[] {
    return complaints.map(complaint => {
      // Unified statusId resolution
      const statusId = complaint.statusId !== undefined ? Number(complaint.statusId) : 1;

      // Flatten notes from status updates if top-level notes are missing
      let notes = complaint.notes || [];
      if (notes.length === 0 && complaint.statusUpdates && Array.isArray(complaint.statusUpdates)) {
        notes = complaint.statusUpdates.reduce((acc: string[], update: any) => {
          if (update.notes && Array.isArray(update.notes)) {
            return [...acc, ...update.notes];
          }
          return acc;
        }, []);
      }

      // Use only userDetails.name for Resident Name as requested
      const residentName = complaint.userDetails?.name || 'Resident';

      // Direct Staff Name extraction with "UNKNOWN" filter
      const assignedToName =
        (complaint.assignedToDetails?.name && complaint.assignedToDetails.name !== 'UNKNOWN')
          ? complaint.assignedToDetails.name
          : '';

      const escalateToName =
        (complaint.escalateToDetails?.name && complaint.escalateToDetails.name !== 'UNKNOWN')
          ? complaint.escalateToDetails.name
          : '';

      // Robust Apartment detection
      const apartment =
        complaint.roomNumber ||
        complaint.apartmentNumber ||
        complaint.flatNumber ||
        'N/A';

      // Status mapping - handle strings or objects
      let statusRaw = complaint.status || this.mapStatusIdToStatus(statusId);

      if (typeof statusRaw === 'object' && statusRaw !== null) {
        statusRaw = statusRaw.name || statusRaw.title || statusRaw.label;
      }
      const status = String(statusRaw || 'open').toLowerCase().replace(/_/g, '-');

      // Robust Assigned To detection
      const assignedTo =
        complaint.assignedToDetails?.id ||
        complaint.assignedToId ||
        complaint.assignedStaffId ||
        complaint.staffId ||
        complaint.assignedTo ||
        '';

      return {
        id: complaint.id || complaint._id,
        title: complaint.title || 'No Title',
        description: complaint.description || '',
        category: (complaint.category || 'general').toLowerCase(),
        notes: notes,
        status: status as IssueStatus,
        statusId: statusId,
        priority: this.mapPriorityStringToPriority(String(complaint.priority || '0')),
        createdAt: complaint.createdAt || new Date().toISOString(),
        updatedAt: complaint.updatedAt || new Date().toISOString(),
        eta: complaint.eta || '',
        residentId: complaint.reportedByDetails?.id || complaint.userDetails?.id || complaint.customerId || '',
        residentName: residentName,
        apartment: apartment,
        assignedTo: (complaint.assignedToDetails?.id === 'UNKNOWN' || !complaint.assignedToDetails?.id || complaint.assignedToDetails?.name === 'UNKNOWN') ? '' : complaint.assignedToDetails.id,
        assignedToName: (complaint.assignedToDetails?.name === 'UNKNOWN' || !complaint.assignedToDetails?.name) ? 'Unassigned' : complaint.assignedToDetails.name,
        escalateTo: (complaint.escalateToDetails?.id === 'UNKNOWN' || !complaint.escalateToDetails?.id || complaint.escalateToDetails?.name === 'UNKNOWN') ? '' : complaint.escalateToDetails.id,
        escalateToName: (complaint.escalateToDetails?.name === 'UNKNOWN' || !complaint.escalateToDetails?.name) ? 'None' : complaint.escalateToDetails.name,
        comments: [],
        images: complaint.images || [],
        isCommonArea: false,
        statusUpdates: complaint.statusUpdates || [],
        userDetails: complaint.userDetails || null,
        assignedToDetails: complaint.assignedToDetails || null,
        escalateToDetails: complaint.escalateToDetails || null,
        reportedByDetails: complaint.reportedByDetails || null
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
    this.http.get<any>(`${this.API_URL}/complaint-service/complaints/client/${user.clientId}/user/${customerId}`).pipe(
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