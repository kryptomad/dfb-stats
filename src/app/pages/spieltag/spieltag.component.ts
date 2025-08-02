import { Component, OnInit } from '@angular/core';
import { GamesService } from '../../services/games.service';
import { NgForOf } from '@angular/common';
import { Card } from 'primeng/card';

@Component({
  selector: 'app-spieltag',
  imports: [Card, NgForOf],
  providers: [GamesService],
  templateUrl: './spieltag.component.html',
  styleUrl: './spieltag.component.scss',
})
export class SpieltagComponent implements OnInit {
  letzteSpieltage: any[] = [];

  constructor(private gamesService: GamesService) {}

  ngOnInit() {
    this.letzteSpieltage = this.gamesService.getLastNSpieltage(10);
  }
}
