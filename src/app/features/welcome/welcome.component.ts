import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CardComponent, CardContentComponent } from '../../shared/components/card/card.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent, CardComponent, CardContentComponent, MatIconModule],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent {
  isHovering = false;

  features = [
    {
      icon: 'check_circle',
      title: 'Issue Tracking',
      description: 'Track and resolve issues with automatic ETAs',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      delay: 100
    },
    {
      icon: 'group',
      title: 'Staff Management',
      description: 'Assign tasks and track workload efficiently',
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50',
      delay: 200
    },
    {
      icon: 'bar_chart',
      title: 'Analytics & Reports',
      description: 'Insights with detailed visualizations',
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50',
      delay: 300
    },
    {
      icon: 'notifications',
      title: 'Real-time Updates',
      description: 'Instant notifications and status updates',
      gradient: 'from-orange-500 to-amber-500',
      bgGradient: 'from-orange-50 to-amber-50',
      delay: 400
    },
    {
      icon: 'shield',
      title: 'Secure Access',
      description: 'Role-based permissions and security',
      gradient: 'from-pink-500 to-rose-500',
      bgGradient: 'from-pink-50 to-rose-50',
      delay: 500
    },
    {
      icon: 'apartment',
      title: 'Modern Interface',
      description: 'Beautiful design on all devices',
      gradient: 'from-indigo-500 to-purple-500',
      bgGradient: 'from-indigo-50 to-purple-50',
      delay: 600
    }
  ];

  testimonials = [
    {
      name: 'Jane Doe',
      role: 'Property Manager',
      company: 'Sunset Apartments',
      avatar: 'JD',
      review: 'ResiLink has transformed how we handle maintenance requests. Response times are down 50% and resident satisfaction is at an all-time high.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Building Manager',
      company: 'Harbor View Complex',
      avatar: 'MC',
      review: 'The analytics dashboard gives us incredible insights. We can now predict maintenance needs before they become urgent issues.',
      rating: 4
    },
    {
      name: 'Sarah Williams',
      role: 'Operations Director',
      company: 'Metro Living',
      avatar: 'SW',
      review: 'Our staff loves the mobile-friendly interface. They can update tickets on the go, which has improved our efficiency dramatically.',
      rating: 5
    },
    {
      name: 'David Rodriguez',
      role: 'Facility Manager',
      company: 'Parkside Residences',
      avatar: 'DR',
      review: 'The automated ETA feature is a game-changer. Residents appreciate knowing exactly when to expect repairs.',
      rating: 4
    },
    {
      name: 'Emily Thompson',
      role: 'Property Owner',
      company: 'Riverside Towers',
      avatar: 'ET',
      review: 'Best investment we\'ve made for our property management. The ROI has been phenomenal with reduced operational costs.',
      rating: 5
    },
    {
      name: 'James Park',
      role: 'Community Manager',
      company: 'Oak Hill Apartments',
      avatar: 'JP',
      review: 'The kanban board view makes it so easy to see the status of all maintenance requests at a glance. Highly recommend!',
      rating: 5
    }
  ];

  constructor(private router: Router) { }

  onHoverStart() {
    this.isHovering = true;
  }

  onHoverEnd() {
    this.isHovering = false;
  }
}
