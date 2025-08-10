import { Injectable, signal, Signal } from '@angular/core';
import * as playersData from '../../assets/players.json';

export interface Player {
  id: number;
  name: string;
  nickname: string | null;
  image: string;
  location?: string;
  color?: string;
  memberSince: number;
  isFounder: boolean;
  roles?: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class PlayersService {
  players: Player[] = [];
  private allPlayers: Player[] = [];
  private activePlayers: Player[] = [];
  private byId = new Map<number, Player>();

  // bestehende Signals bleiben erhalten
  private activePlayersSignal = signal<Player[]>([]);
  private allPlayersSignal = signal<Player[]>([]);

  kassenwartName = '';
  statistikwartName = '';

  constructor() {
    const raw: any[] = Object.create(playersData).default;

    this.allPlayers = raw
      .map((p: any) => ({
        id: p.player_id,
        name: p.name,
        nickname: p.nickname,
        image: p.image,
        location: p.location,
        color: p.color,
        memberSince: p.memberSince,
        roles: p.roles,
        isFounder: !!p.isFounder,
        isActive: !!p.isActive,
      }))
      .sort((a, b) => (a.memberSince ?? 0) - (b.memberSince ?? 0));

    this.activePlayers = this.allPlayers.filter((p) => p.isActive);

    this.byId = new Map(this.allPlayers.map((p) => [p.id, p]));

    this.activePlayersSignal.set(this.activePlayers);
    this.allPlayersSignal.set(this.allPlayers);
  }

  /* =========================
     NEUE, EINFACHE ZENTRALE API
     ========================= */

  /** Ein Spieler komplett */
  getPlayer(id: number): Player | undefined {
    return this.byId.get(id);
  }

  /** Alle Spieler – optional gefiltert / subset per ids */
  getPlayers(): Player[];
  getPlayers(opts: { activeOnly?: boolean; ids?: number[] }): Player[];
  getPlayers(opts?: { activeOnly?: boolean; ids?: number[] }): Player[] {
    let list: Player[] = opts?.ids?.length
      ? (opts.ids.map((id) => this.byId.get(id)).filter(Boolean) as Player[])
      : [...this.allPlayers];

    if (opts?.activeOnly) list = list.filter((p) => p.isActive);
    return list;
  }
}
