import { Injectable, signal, Signal } from '@angular/core';
import * as data from '../../assets/last_stats.json';

export interface LastStat {
  kategorie: string;
  spieler: string[];
  wert: number;
}

@Injectable()
export class LastStatsService {
  public loadLastStats(): Signal<LastStat[]> {
    const dataObject = Object.create(data);

    const lastStats: LastStat[] = dataObject.default.map((value: any) => {
      return {
        kategorie: value.kategorie,
        spieler: Array.isArray(value.spieler) ? value.spieler : [value.spieler],
        wert: value.wert,
      };
    });

    return signal<LastStat[]>(lastStats);
  }
}
