import { Injectable, signal } from '@angular/core';
import * as nextMatchDay from '../../assets/nextMatchday.json';
import * as nextMatchDays from '../../assets/next_matchdays.json';

interface DataNextMatchDays {
  season: string;
  matchday: number;
  games: Game[];
}

interface DataNextMatchDay {
  gastgeber: string;
  datum: string;
  zeit: string;
  oskardarten: boolean;
  gelddarten: boolean;
  season: string;
  matchday: number;
}

export interface Game {
  writer: string;
  player1: string;
  player2: string;
}

export interface NextMatchDay {
  gastgeber: string;
  datum: string;
  zeit: string;
  oskardarten: boolean;
  gelddarten: boolean;
  season: string;
  matchday: number;
  games?: Game[];
}

@Injectable()
export class NextMatchDayService {
  public loadNextMatchDay() {
    const nextMatchDay = this.loadNextMatchday();
    const nextMatchDays: DataNextMatchDays | undefined =
      this.loadNextMatchDays()
        .filter(
          (value: DataNextMatchDays) =>
            value.season === nextMatchDay.season &&
            value.matchday === nextMatchDay.matchday,
        )
        ?.at(0);

    return signal<NextMatchDay | undefined>({
      gastgeber: nextMatchDay.gastgeber,
      datum: nextMatchDay.datum,
      zeit: nextMatchDay.zeit,
      oskardarten: nextMatchDay.oskardarten,
      gelddarten: nextMatchDay.gelddarten,
      season: nextMatchDay.season,
      matchday: nextMatchDay.matchday,
      games: nextMatchDays?.games,
    });
  }

  private loadNextMatchday(): DataNextMatchDay {
    return nextMatchDay;
  }

  private loadNextMatchDays(): DataNextMatchDays[] {
    const dataObject = Object.create(nextMatchDays);

    return dataObject.default;
  }
}
