import { Injectable, signal, Signal } from '@angular/core';
import * as playersData from '../../assets/players.json';

export interface Player {
  id: number;
  name: string;
  nickname: string;
  image: string;
  memberSince: number;
}

@Injectable()
export class PlayersService {
  public loadPlayers(): Signal<Player[]> {
    const dataObject = Object.create(playersData);

    const players: Player[] = dataObject.default.map((p: any) => ({
      id: p.id,
      name: p.name,
      nickname: p.nickname,
      image: p.image,
      memberSince: p.memberSince,
    }));

    return signal<Player[]>(players);
  }
}
