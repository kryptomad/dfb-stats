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

    const players: Player[] = dataObject.default.map((p: any) => ({
      id: p.player_id, // wichtig: in JSON heißt es player_id!
      name: p.name,
      nickname: p.nickname,
      image: p.image,
      memberSince: p.memberSince,
      isFounder: p.isFounder
    }));

    return signal<Player[]>(players);
  }
}
