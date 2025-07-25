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
  ],
})
export class AppModule {}
