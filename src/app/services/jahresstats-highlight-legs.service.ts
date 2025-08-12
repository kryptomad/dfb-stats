import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { LegsQueriesService, BestLegEntry } from './legs-query.service';
import { SeasonSelectorService } from './season-selector.service';

@Injectable({ providedIn: 'root' })
export class JahresstatsHighlightLegsService {
  constructor(
    private legsQueries: LegsQueriesService,
    private seasonSelector: SeasonSelectorService
  ) {}

  getBestLegsForLatestSeason(): Observable<BestLegEntry[]> {
    return this.seasonSelector.getSelectedSeason$().pipe(
      switchMap(season => this.getBestLegsForSeason(season || ''))
    );
  }

  getBestLegsForSeason(season: string | number): Observable<BestLegEntry[]> {
    return this.legsQueries.perPlayerBestLegsInSeason();
  }
}