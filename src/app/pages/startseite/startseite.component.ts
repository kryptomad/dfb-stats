import { Component, computed, inject, signal } from '@angular/core';
import { LastStatsService } from '../../services/lastStats.service';
import { NextMatchDayService } from '../../services/nextMatchDay.service';
import { PlayersService } from '../../services/players.service';
import { TableModule } from 'primeng/table';
import { NgClass, NgForOf, NgIf, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { Card } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-startseite',
  templateUrl: './startseite.component.html',
  styleUrls: ['./startseite.component.scss'],
  standalone: true,
  imports: [TableModule, NgClass, NgIf, Card, NgForOf, ChipModule, NgOptimizedImage, AvatarModule, NgTemplateOutlet, ButtonModule],
  providers: [NextMatchDayService, LastStatsService],
})
export class StartseiteComponent {
  private _nextMatchdayService = inject(NextMatchDayService);
  private _nextMatchday = this._nextMatchdayService.loadNextMatchDay();
  private _playersService = inject(PlayersService);

  gastgeber = computed(() => this._nextMatchday()?.gastgeber);
  datum = computed(() => this._nextMatchday()?.datum);
  zeit = computed(() => this._nextMatchday()?.zeit);
  gelddarten = computed(() => this._nextMatchday()?.gelddarten);
  oskardarten = computed(() => this._nextMatchday()?.oskardarten);
  season = computed(() => this._nextMatchday()?.season);
  matchday = computed(() => this._nextMatchday()?.matchday);
  location = computed(() => this._nextMatchday()?.location);
  image = computed(() => this._nextMatchday()?.image);
  boardA = computed(() => this._nextMatchday()?.boardA);
  boardB = computed(() => this._nextMatchday()?.boardB);

  // Upcoming season preview (v2 format)
  upcoming = this._nextMatchdayService.loadUpcomingV2();

  private _lastStatsService = inject(LastStatsService);
  private _lastStats = this._lastStatsService.loadLastStats();

  lastStats = computed(() => this._lastStats());

  addToCalendar(): void {
    const datumRaw = this.datum() ?? '';
    const zeitRaw = this.zeit() ?? '';
    const gastgeber = this.gastgeber() ?? '';
    const season = this.season() ?? '';
    const matchday = this.matchday() ?? '';

    // Parse "Freitag, 27.03.2026" → "27.03.2026"
    const datePart = datumRaw.includes(',') ? datumRaw.split(', ')[1] : datumRaw;
    const [day, month, year] = datePart.split('.');
    // Parse "19:30 Uhr" → "19:30"
    const [hour, minute] = zeitRaw.replace(' Uhr', '').split(':');

    const pad = (n: string) => n.padStart(2, '0');
    const dtStart = `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`;
    const endHour = String(parseInt(hour, 10) + 3).padStart(2, '0');
    const dtEnd = `${year}${pad(month)}${pad(day)}T${endHour}${pad(minute)}00`;

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Dartfreunde Borchen//DE',
      'BEGIN:VEVENT',
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:Dartabend bei ${gastgeber}`,
      `DESCRIPTION:Dartfreunde Borchen n.e.V. – Saison ${season} Spieltag ${matchday}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dartabend.ics';
    a.click();
    URL.revokeObjectURL(url);
  }

  addToGoogleCalendar(): void {
    const datumRaw = this.datum() ?? '';
    const zeitRaw = this.zeit() ?? '';
    const gastgeber = this.gastgeber() ?? '';
    const season = this.season() ?? '';
    const matchday = this.matchday() ?? '';

    const datePart = datumRaw.includes(',') ? datumRaw.split(', ')[1] : datumRaw;
    const [day, month, year] = datePart.split('.');
    const [hour, minute] = zeitRaw.replace(' Uhr', '').split(':');

    const pad = (n: string) => n.padStart(2, '0');
    const dtStart = `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`;
    const endHour = String(parseInt(hour, 10) + 3).padStart(2, '0');
    const dtEnd = `${year}${pad(month)}${pad(day)}T${endHour}${pad(minute)}00`;

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `Dartabend bei ${gastgeber}`,
      dates: `${dtStart}/${dtEnd}`,
      details: `Dartfreunde Borchen n.e.V. – Saison ${season} Spieltag ${matchday}`,
    });

    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
  }

  getPlayerImage(playerName: string): string {
    const players = this._playersService.getPlayers({});
    const player = players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
    return player?.image
      ? `assets/players/${player.image}`
      : 'assets/players/default-avatar.png';
  }
}
