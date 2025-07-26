import { Injectable, OnInit, signal, Signal } from '@angular/core';
import * as data from '../../assets/spieltage.json';

export interface Matchday {
  game_id: number;
  date: string;
  p1: string;
  p1_legs: number;
  p2: string;
  p2_legs: number;
  season: string;
  matchday: number;
  p1_avg_3dart_match: number;
  p2_avg_3dart_match: number;
}

@Injectable()
export class MatchDaysService implements OnInit {
  private data: Matchday[] = [];

  ngOnInit(): void {
    const dataObject = Object.create(data);

    this.data = dataObject.default;
  }

  public loadMatchday(
    season: string,
    matchday: number,
  ): Signal<Matchday | undefined> {
    const result: Matchday | undefined = this.data
      .filter((value) => value.season === season && value.matchday === matchday)
      ?.at(0);

    return signal<Matchday | undefined>(result);
  }
}
