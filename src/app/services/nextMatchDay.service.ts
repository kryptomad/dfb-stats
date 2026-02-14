import { Injectable, signal } from '@angular/core';
import * as nextMatchDay from '../../assets/nextMatchday.json';
import * as nextMatchDays from '../../assets/next_matchdays.json';
import * as nextMatchDaysV2 from '../../assets/next_matchdays_2026-2027.json';
import * as players from '../../assets/players.json';

interface DataNextMatchDays {
  season: string;
  matchday: number;
  games: Game[];
}

interface BoardGame {
  game: number;
  player1: string;
  player2: string;
}

interface DataNextMatchDaysV2 {
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

export interface Game {
  writer: string;
  player1: string;
  player2: string;
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
  games?: Game[];
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

    // Try v2 format first (2-board system)
    const v2Match = this.loadNextMatchDaysV2()
      .find(v => v.season === nextMD.season && v.matchday === nextMD.matchday);

    // Fallback to v1 format (single board with writer)
    const v1Match = !v2Match
      ? this.loadNextMatchDays()
          .find(v => v.season === nextMD.season && v.matchday === nextMD.matchday)
      : undefined;

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
      games: v1Match?.games,
      boardA: v2Match?.boardA,
      boardB: v2Match?.boardB,
    });
  }

  public loadUpcomingV2(): UpcomingMatchDay | undefined {
    const allV2 = this.loadNextMatchDaysV2();
    return allV2.length > 0 ? allV2[0] : undefined;
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

  private loadNextMatchDays(): DataNextMatchDays[] {
    const dataObject = Object.create(nextMatchDays);
    return dataObject.default;
  }

  private loadNextMatchDaysV2(): DataNextMatchDaysV2[] {
    const dataObject = Object.create(nextMatchDaysV2);
    return dataObject.default;
  }
}