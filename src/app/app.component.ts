import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Menubar } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgOptimizedImage } from '@angular/common';
import { Button, ButtonModule } from 'primeng/button';
import { AppModule } from './app.module';
import { Menu } from 'primeng/menu';
import { StartseiteComponent } from './content/startseite/startseite.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: false,
})
export class AppComponent {
  title = 'dfb-stats';
  menuItems: MenuItem[] = [
    {
      label: 'Start',
      route: '',
      items: [
        {
          label: 'Termin nächster Abend',
          routerLink: 'startseite',
          fragment: 'naechster-spieltag',
        },
        {
          label: 'Highlights letzter Spieltag',
          routerLink: 'startseite',
          fragment: 'highlights-letzter-spieltag',
        },
        {
          label: 'Nächster Oskarabend',
          routerLink: 'startseite',
          fragment: 'naechster-oskarabend',
        },
      ],
    },
    {
      label: 'Spieltag',
      items: [
        {
          label: 'Jahrestabelle',
          routerLink: 'spieltag/jahrestabelle',
        },
      ],
    },
    {
      label: 'Spiele',
      items: [],
    },
    {
      label: 'Spieler',
      items: [
        {
          label: 'Bestleistungen',
        },
        {
          label: 'Spieler vs. Spieler',
        },
      ],
    },
    {
      label: 'Statistiken',
      items: [
        {
          label: 'Allzeit-Rekorde',
        },
        {
          label: 'Jahresvergleich',
        },
        {
          label: 'Trendverlauf',
        },
      ],
    },
    {
      label: 'Rekorde',
      items: [
        {
          label: 'Gesamtwertungen',
        },
        {
          label: 'Jahreswertungen',
        },
        {
          label: 'Spieltagswertungen',
        },
        {
          label: 'Matchwertungen',
        },
      ],
    },
    {
      label: 'Regelwerk',
      items: [
        {
          label: 'Spielregeln',
        },
        {
          label: 'Dartkasse',
        },
        {
          label: 'Vereinsregeln',
        },
      ],
    },
  ];
}
