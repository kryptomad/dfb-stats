import { Injectable, signal } from '@angular/core';
import * as nextMatchDay from '../../assets/nextMatchday.json';
import * as nextMatchDays from '../../assets/next_matchdays.json';
import * as players from '../../assets/players.json';

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

    // Spieler anhand des Namens finden
    const host = this.findPlayerByName(nextMatchDay.gastgeber);

    return signal<NextMatchDay | undefined>({
      gastgeber: nextMatchDay.gastgeber,
      datum: nextMatchDay.datum,
      zeit: nextMatchDay.zeit,
      oskardarten: nextMatchDay.oskardarten,
      gelddarten: nextMatchDay.gelddarten,
      season: nextMatchDay.season,
      matchday: nextMatchDay.matchday,
      location: host?.location || 'default-location.png', // <-- aus players.json
      image: host?.image || 'default-player.png', // <-- aus players.json
      games: nextMatchDays?.games,
    });
  }

  private findPlayerByName(name: string): Player | undefined {
    // <-- neue Methode
    const playersData = this.loadPlayers();
    return playersData.find(
      (player: Player) => player.name.toLowerCase() === name.toLowerCase(),
    );
  }

  private loadPlayers(): Player[] {
    // <-- neue Methode
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
}