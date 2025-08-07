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

    const players: Player[] = dataObject.default
      .filter((p: any) => p.isActive)
      .map((p: any) => ({
        id: p.player_id,
        name: p.name,
        nickname: p.nickname,
        image: p.image,
        memberSince: p.memberSince,
        isFounder: p.isFounder,
      }));

    players.sort((a, b) => {
      return (
        new Date(a.memberSince).getTime() - new Date(b.memberSince).getTime()
      );
    });

    return signal<Player[]>(players);
  }

  getPlayerById(id: number): Player | undefined {
    const players = this.loadPlayers()();
    return players.find((p) => p.id === id);
  }

  getPlayerNameById(id: number): string {
    return this.getPlayerById(id)?.name ?? `ID ${id}`;
  }
}
