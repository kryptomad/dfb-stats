import { AfterViewInit, Component, ModelSignal, OnInit } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { MatchDaysService } from '../../services/matchDay.service';

@Component({
  selector: 'app-spieltag',
  templateUrl: './spieltag.component.html',
  styleUrl: './spieltag.component.scss',
  standalone: false,
})
export class SpieltagComponent implements OnInit {
  matchdays: { season: string; matchday: number }[] = [];

  constructor(public matchdayService: MatchDaysService) {}

  ngOnInit(): void {
    this.matchdayService.loadMatchdays().subscribe((matchday) => {
      matchday
        .map((value) => {
          return {
            season: value.season,
            matchday: value.matchday,
          };
        })
        .forEach((value) => this.matchdays.push(value));
    });
  }
}
