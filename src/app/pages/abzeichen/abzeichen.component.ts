import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { Card } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { AccordionModule } from 'primeng/accordion';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { FieldsetModule } from 'primeng/fieldset';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { BadgesService, BadgeWithHolder, ChipWinner } from '../../services/badges.service';

@Component({
  selector: 'app-abzeichen',
  imports: [
    TableModule,
    Card,
    ChipModule,
    AccordionModule,
    NgClass,
    NgFor,
    NgIf,
    AvatarModule,
    OverlayBadgeModule,
    FieldsetModule,
    ProgressBarModule,
    ToastModule,
    RouterModule,
  ],
  templateUrl: './abzeichen.component.html',
  styleUrl: './abzeichen.component.scss',
})
export class AbzeichenComponent {
  private badgesService = inject(BadgesService);

  kategorieNamen = this.badgesService.kategorieNamen;
  kategorieFarbe = this.badgesService.kategorieFarbe;
  leaderboardData = this.badgesService.getChipTotals();
  chipWinners = this.badgesService.getChipWinners();
  maxPoints = 100;

  getAbzeichenForKategorie(kategorie: string): BadgeWithHolder[] {
    return this.badgesService.getBadgesForKategorie(kategorie);
  }

  getSpielerBild(playerId: number): string {
    return this.badgesService.getSpielerBild(playerId);
  }
}
