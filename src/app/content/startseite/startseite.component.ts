import { Component, OnInit } from '@angular/core';
import { NextMatchDayService } from '../../services/nextMatchDay.service';

@Component({
  selector: 'app-startseite',
  templateUrl: './startseite.component.html',
  styleUrl: './startseite.component.scss',
  standalone: false,
})
export class StartseiteComponent {
  constructor(public nextMatchdayService: NextMatchDayService) {}
}
