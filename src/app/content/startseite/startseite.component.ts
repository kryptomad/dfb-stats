import { Component, Input } from '@angular/core';
import { NextMatchDayService } from '../../services/nextMatchDay.service';
import { LastStatsService } from '../../services/lastStats.service';
import { NextMatchDaysService } from '../../services/nextMatchDays.service';

@Component({
  selector: 'app-startseite',
  templateUrl: './startseite.component.html',
  styleUrl: './startseite.component.scss',
  standalone: false,
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
