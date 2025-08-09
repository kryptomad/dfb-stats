import { Injectable, signal, Signal } from '@angular/core';
import * as playersData from '../../assets/players.json';

  export interface Player {
    id: number;
    name: string;
    nickname: string | null;
    image: string;
    memberSince: number;
    isFounder: boolean;
    roles?: string;
    isActive: boolean;
    color?: string;
  }

  @Injectable({ providedIn: 'root' })
  export class PlayersService {
    players: Player[] = [];
    private allPlayers: Player[] = [];
    private activePlayers: Player[] = [];
    private byId = new Map<number, Player>();
    private activePlayersSignal = signal<Player[]>([]);
    private allPlayersSignal = signal<Player[]>([]);
    private playerColors: Record<number, string> = {
      1: '#3498db',
      2: '#1abc9c',
      3: '#2ecc71',
      4: '#e67e22', //inaktiv
      5: '#f1c40f', //inaktiv
      6: '#9b59b6',
      7: '#e74c3c', //inaktiv
      8: '#e91e63',
    };

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
          memberSince: p.memberSince,
          roles: p.roles,
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
    getPlayerDetailsById(id: number): Player | undefined {
      return this.byId.get(id);
    }

    /** Optional nützlich */
    getAllPlayers(): Player[] {
      return this.allPlayers;
    }

    getPlayerNameById(id: number): string {
      return this.getPlayerDetailsById(id)?.name ?? `ID ${id}`;
    }

    // setze die Farben für jeweiligen SPieler IDs
    getPlayerColorById(playerId: number): string {
      return this.playerColors[playerId] ?? '#999999'; // Fallback grau
    }

    initRoles() {
      const kassenwart = this.allPlayers.find((p) => p.roles === 'Kassenwart');
      if (kassenwart) {
        this.kassenwartName = kassenwart.nickname?.trim() || kassenwart.name;
      }

      const statistikwart = this.allPlayers.find(
        (p) => p.roles === 'Statistikwart',
      );
      if (statistikwart) {
        this.statistikwartName =
          statistikwart.nickname?.trim() || statistikwart.name;
      }
    }
  }
