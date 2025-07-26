import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { provideRouter, RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { ContentModule } from './content/content.module';

import { routes } from './app.routes';
import { MenubarModule } from 'primeng/menubar';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { NgOptimizedImage } from '@angular/common';
import {NextMatchDayService} from "./services/nextMatchDay.service";
import {LastStatsService} from "./services/lastStats.service";
import {NextMatchDaysService} from "./services/nextMatchDays.service";

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    ContentModule,
    RouterModule.forRoot(routes),
    ButtonModule,
    MenubarModule,
    MenuModule,
    NgOptimizedImage,
  ],
  exports: [RouterModule, ContentModule],
  bootstrap: [AppComponent],
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    providePrimeNG({}),
    NextMatchDayService, LastStatsService,
    NextMatchDaysService
  ],
})
export class AppModule {}
