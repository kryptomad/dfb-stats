import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Card } from 'primeng/card';
import { FieldsetModule } from 'primeng/fieldset';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { NgIf } from '@angular/common';
import { BadgeModule } from 'primeng/badge';

import { PlayersService, Player } from '../../services/players.service';

@Component({
  selector: 'app-profil',
  imports: [Card, RouterModule, FieldsetModule, TagModule, TabsModule, NgIf, BadgeModule],
  providers: [PlayersService],
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.scss']
})
export class ProfilComponent implements OnInit {
  playerId!: number;
  player: Player | undefined;

  constructor(private route: ActivatedRoute, private playersService: PlayersService) {}

  ngOnInit() {
    this.playerId = Number(this.route.snapshot.paramMap.get('id'));
    this.player = this.playersService.getPlayerById(this.playerId);
  }

  
}
