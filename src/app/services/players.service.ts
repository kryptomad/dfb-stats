import { Injectable, signal, Signal } from '@angular/core';
import * as playersData from '../../assets/players.json';

export interface Player {
  id: number;
  name: string;
  nickname: string | null;
  image: string;
  memberSince: number;
  isFounder: boolean;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class PlayersService {
  private allPlayers: Player[] = [];
  private activePlayers: Player[] = [];
  private byId = new Map<number, Player>();

  // falls du irgendwo eine Liste brauchst:
  private activePlayersSignal = signal<Player[]>([]);
  private allPlayersSignal = signal<Player[]>([]);

  constructor() {
    const raw: any[] = Object.create(playersData).default;

    this.allPlayers = raw
      .map((p: any) => ({
        id: p.player_id,
        name: p.name,
        nickname: p.nickname,
        image: p.image,
        memberSince: p.memberSince,
        isFounder: p.isFounder,
        isActive: !!p.isActive, // booleans!
      }))
      .sort((a, b) => (a.memberSince ?? 0) - (b.memberSince ?? 0));

    this.activePlayers = this.allPlayers.filter((p) => p.isActive);

    this.byId = new Map(this.allPlayers.map((p) => [p.id, p]));

    this.activePlayersSignal.set(this.activePlayers);
    this.allPlayersSignal.set(this.allPlayers);
  }

  /** Für Listen in der UI: standardmäßig nur Aktive */
  loadPlayers(activeOnly: boolean = true): Signal<Player[]> {
    return activeOnly ? this.activePlayersSignal : this.allPlayersSignal;
  }

  /** Für Lookups (Timeline, Stats, Historie): IMMER in allen suchen */
  getPlayerById(id: number): Player | undefined {
    return this.byId.get(id);
  }

  /** Optional nützlich */
  getAllPlayers(): Player[] {
    return this.allPlayers;
  }

  getPlayerNameById(id: number): string {
    return this.getPlayerById(id)?.name ?? `ID ${id}`;
  }
}
