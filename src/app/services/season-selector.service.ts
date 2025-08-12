import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface SeasonDataSource {
  getSeasons$(): Observable<any[]>;
}

@Injectable({ providedIn: 'root' })
export class SeasonSelectorService {
  private seasonsSubject = new BehaviorSubject<string[]>([]); // Immer mit leerem Array starten
  private selectedSeasonSubject = new BehaviorSubject<string | null>(null);
  private dataSource: SeasonDataSource | null = null;

  constructor() {
    this.loadSeasons(); // Sofort ausführen
  }

  setDataSource(source: SeasonDataSource): void {
    this.dataSource = source;
    this.loadSeasons(); // Neu laden, wenn Datenquelle geändert wird
  }

  private loadSeasons(): void {
    if (!this.dataSource) {
      this.seasonsSubject.next([]);
      return;
    }
    this.dataSource.getSeasons$().pipe(
      map(data => [...new Set(data.map(item => item.season?.toString()).filter(s => s !== undefined))].sort((a, b) => {
        const [yearA] = a.split('/').map(Number);
        const [yearB] = b.split('/').map(Number);
        return yearB - yearA; // Neueste zuerst
      }))
    ).subscribe(seasons => {
      this.seasonsSubject.next(seasons || []); // Immer Array
      if (!this.selectedSeasonSubject.value && seasons.length > 0) {
        this.selectedSeasonSubject.next(seasons[0]); // Standard: neueste Saison
      }
    }, error => {
      console.error('Fehler beim Laden der Saisons:', error);
      this.seasonsSubject.next([]); // Fallback auf leeres Array
    });
  }

  getSeasons$(): Observable<string[]> {
    return this.seasonsSubject.asObservable();
  }

  getSelectedSeason$(): Observable<string | null> {
    return this.selectedSeasonSubject.asObservable();
  }

  setSelectedSeason(season: string | null): void { // Null akzeptieren
    if (season === null) {
      this.selectedSeasonSubject.next(this.seasonsSubject.value.length > 0 ? this.seasonsSubject.value[0] : null); // Fallback auf erste Saison oder null
    } else {
      this.selectedSeasonSubject.next(season);
    }
  }
}