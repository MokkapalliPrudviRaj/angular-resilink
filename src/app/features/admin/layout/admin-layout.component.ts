import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { IssueService } from '../../../core/services/issue.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit {
  mobileMenuOpen = false;
  notificationsOpen = false;

  mockNotifications = [
    { title: 'New Issue Reported', message: 'Apt 405 reported a broken lock.', time: '5m ago', read: false },
    { title: 'Task Completed', message: 'Staff resolved issue in Apt 204.', time: '1h ago', read: true },
    { title: 'System Alert', message: 'Routine maintenance scheduled for tonight.', time: '3h ago', read: true }
  ];

  unreadNotifications = 1;

  toggleNotifications(): void {
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen) {
      this.unreadNotifications = 0;
      this.mockNotifications.forEach(n => n.read = true);
    }
  }

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'grid_view', route: '/admin/dashboard' },
    { label: 'All Issues', icon: 'assignment', route: '/admin/issues' },
    { label: 'Staff', icon: 'groups', route: '/admin/staff' },
    { label: 'Resident View', icon: 'person', route: '/dashboard' }
  ];

  constructor(
    public authService: AuthService,
    private issueService: IssueService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.issueService.getIssues().subscribe(issues => {
      this.navItems = this.navItems.map(item => {
        if (item.route === '/admin/issues') {
          return { ...item, badge: issues.length };
        }
        return item;
      });
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }
}
