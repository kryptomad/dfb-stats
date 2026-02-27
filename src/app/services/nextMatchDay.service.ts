import { Injectable, signal } from '@angular/core';
import * as nextMatchDay from '../../assets/nextMatchday.json';
import * as spielplan from '../../assets/spielplan.json';
import * as players from '../../assets/players.json';

interface BoardGame {
  game: number;
  player1: string;
  player2: string;
}

interface SpielplanEntry {
  season: string;
  matchday: number;
  boardA: BoardGame[];
  boardB: BoardGame[];
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

interface Player {
  player_id: number;
  name: string;
  nickname: string | null;
  image: string;
  location: string;
  roles: string | null;
  memberSince: number;
  leftAt: number | null;
  isFounder: boolean;
  isActive: boolean;
  color: string;
  comment: string | null;
}

export type { BoardGame };

export interface NextMatchDay {
  gastgeber: string;
  datum: string;
  zeit: string;
  oskardarten: boolean;
  gelddarten: boolean;
  season: string;
  matchday: number;
  location: string;
  image: string;
  boardA?: BoardGame[];
  boardB?: BoardGame[];
}

export interface UpcomingMatchDay {
  season: string;
  matchday: number;
  boardA: BoardGame[];
  boardB: BoardGame[];
}

@Injectable()
export class NextMatchDayService {
  public loadNextMatchDay() {
    const nextMD = this.loadNextMatchday();
    const host = this.findPlayerByName(nextMD.gastgeber);

    const match = this.loadSpielplan()
      .find(v => v.season === nextMD.season && v.matchday === nextMD.matchday);

    return signal<NextMatchDay | undefined>({
      gastgeber: nextMD.gastgeber,
      datum: nextMD.datum,
      zeit: nextMD.zeit,
      oskardarten: nextMD.oskardarten,
      gelddarten: nextMD.gelddarten,
      season: nextMD.season,
      matchday: nextMD.matchday,
      location: host?.location || 'default-location.png',
      image: host?.image || 'default-player.png',
      boardA: match?.boardA,
      boardB: match?.boardB,
    });
  }

  public loadUpcomingV2(): UpcomingMatchDay | undefined {
    const all = this.loadSpielplan();
    return all.length > 0 ? all[0] : undefined;
  }

  private findPlayerByName(name: string): Player | undefined {
    const playersData = this.loadPlayers();
    return playersData.find(
      (player: Player) => player.name.toLowerCase() === name.toLowerCase(),
    );
  }

  private loadPlayers(): Player[] {
    const dataObject = Object.create(players);
    return dataObject.default;
  }

  private loadNextMatchday(): DataNextMatchDay {
    return nextMatchDay;
  }

  private loadSpielplan(): SpielplanEntry[] {
    const dataObject = Object.create(spielplan);
    return dataObject.default;
  }
}
