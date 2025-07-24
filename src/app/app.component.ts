import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Menubar } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgOptimizedImage } from '@angular/common';
import { Button, ButtonModule } from 'primeng/button';
import { AppModule } from './app.module';
import { Menu } from 'primeng/menu';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Menubar, NgOptimizedImage, AppModule, Menu, Button],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'dfb-stats';
  menuItems: MenuItem[] = [
    {
      label: 'Start',
      items: [
        {
          label: 'Termin nächster Abend',
          icon: 'pi pi-refresh',
        },
        {
          label: 'Highlights letzter Spieltag',
          icon: 'pi pi-upload',
        },
        {
          label: 'Nächster Oskarabend',
          icon: 'pi pi-upload',
        },
      ],
    },
    {
      label: 'Spieltag',
      items: [
        {
          label: 'Jahrestabelle',
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
