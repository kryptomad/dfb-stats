import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Menubar } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgOptimizedImage } from '@angular/common';
import {Button, ButtonModule} from 'primeng/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Menubar, NgOptimizedImage, ButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'dfb-stats';
  menubarItems: MenuItem[] = [
  ];
}
