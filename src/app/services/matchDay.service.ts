import {
  Injectable,
  model,
  ModelSignal,
  OnInit,
  signal,
  Signal,
} from '@angular/core';
import * as data from '../../assets/games.json';

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

@Injectable({
  providedIn: 'root',
})
export class MatchDaysService implements OnInit {
  private data: Matchday[] = [];

  ngOnInit(): void {
    const dataObject = Object.create(data);

    this.data = dataObject.default;
  }

  public loadMatchdays(): Signal<Matchday[]> {
    const result: Matchday[] = this.data.sort(
      (a, b) => a.matchday - b.matchday,
    );

    return signal<Matchday[]>(result);
  }
}
