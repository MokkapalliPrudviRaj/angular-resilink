import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { CardComponent, CardHeaderComponent, CardContentComponent } from '../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { StaffService } from '../../../core/services/staff.service';
import { Staff } from '../../../core/models';

@Component({
  selector: 'app-admin-staff',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    CardComponent,

    CardContentComponent,
    ButtonComponent
  ],
  templateUrl: './admin-staff.component.html',
  styleUrls: ['./admin-staff.component.scss']
})
export class AdminStaffComponent implements OnInit {
  staff$!: Observable<Staff[]>;

  constructor(private staffService: StaffService) { }

  ngOnInit(): void {
    this.loadStaff();
  }

  loadStaff(): void {
    this.staff$ = this.staffService.getStaff();
  }

  addStaff(): void {
    console.log('Add staff dialog');
  }
}
