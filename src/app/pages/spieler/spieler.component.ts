import { Component, inject, computed } from '@angular/core';
import { PlayersService, Player } from '../../services/players.service';
import {Card} from 'primeng/card';
import { FieldsetModule } from 'primeng/fieldset';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { NgForOf, NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-spieler',
  imports: [
    NgForOf,
    NgIf,
    Card,
    FieldsetModule,
    TagModule,
    TabsModule,
    RouterModule,
  ],
  providers: [PlayersService],
  templateUrl: './spieler.component.html',
  styleUrl: './spieler.component.scss',
})
export class SpielerComponent {
  private _playersService = inject(PlayersService);

  players: Player[] = this._playersService.getPlayers({ activeOnly: true });
}