import { Injectable, signal, Signal } from '@angular/core';
import * as playersData from '../../assets/players.json';

export interface Player {
  id: number;
  name: string;
  nickname: string | null;
  image: string;
  memberSince: number;
  isFounder: boolean;
}

@Injectable()
export class PlayersService {
  public loadPlayers(): Signal<Player[]> {
    const dataObject = Object.create(playersData);

    // Map zuerst
    const players: Player[] = dataObject.default.map((p: any) => ({
      id: p.player_id,
      name: p.name,
      nickname: p.nickname,
      image: p.image,
      memberSince: p.memberSince,
      isFounder: p.isFounder
    }));

    // Dann sortieren:
    players.sort((a, b) => {
      // Falls memberSince ein Datum (string) ist, ggf. in Date umwandeln:
      return new Date(a.memberSince).getTime() - new Date(b.memberSince).getTime();
    });

    return signal<Player[]>(players);
  }
}