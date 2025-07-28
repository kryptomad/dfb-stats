import { Component, Input } from '@angular/core';
import { NextMatchDayService } from '../../services/nextMatchDay.service';
import { LastStatsService } from '../../services/lastStats.service';
import { NextMatchDaysService } from '../../services/nextMatchDays.service';
import { TableModule } from 'primeng/table';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { Card } from 'primeng/card';

@Component({
  selector: 'app-startseite',
  templateUrl: './startseite.component.html',
  standalone: true,
  imports: [TableModule, NgClass, Card, NgIf, NgForOf],
  providers: [NextMatchDaysService, NextMatchDayService, LastStatsService],
})
export class StartseiteComponent {
  @Input()
  nextMatchday: number = 5;

  constructor(
    public nextMatchdayService: NextMatchDayService,
    public lastStatsService: LastStatsService,
    public nextMatchdaysService: NextMatchDaysService,
  ) {}
}
