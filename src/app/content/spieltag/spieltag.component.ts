import { Component, OnInit } from '@angular/core';
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

  ngOnInit(): void {}
}
