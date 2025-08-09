import { Component, OnInit } from '@angular/core';
import { PlayersService } from '../../services/players.service';

@Component({
  selector: 'app-regelwerk',
  imports: [],
  providers: [PlayersService],
  templateUrl: './regelwerk.component.html',
  styleUrl: './regelwerk.component.scss',
  standalone: true,
})
export class RegelwerkComponent implements OnInit {
  constructor(public playersService: PlayersService) {} // public, damit HTML zugreifen kann

  ngOnInit() {
    this.playersService.initRoles();
  }
}
