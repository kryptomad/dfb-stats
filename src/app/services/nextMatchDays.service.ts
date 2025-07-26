import { Injectable, signal, Signal } from '@angular/core';
import * as data from '../../assets/next_matchdays.json';

export interface Game {
  writer: string;
  player1: string;
  player2: string;
}

export interface NextMatchDay {
  season: string;
  matchday: number;
  games: Game[];
}

@Injectable()
export class NextMatchDaysService {
  public loadNextMatchDays(): Signal<NextMatchDay[]> {
    const dataObject = Object.create(data);
    return signal<NextMatchDay[]>(dataObject.default);
  }

  public loadNextMatchDay(matchday: number): Signal<NextMatchDay | undefined> {
    const dataObject = Object.create(data);

    const nextMatchDay: NextMatchDay | undefined = dataObject.default
      .filter((value: any) => value.matchday === matchday)
      ?.at(0);

    return signal<NextMatchDay | undefined>(nextMatchDay);
  }
}
