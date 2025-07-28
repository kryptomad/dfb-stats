import { Routes } from '@angular/router';
import { StartseiteComponent } from './startseite/startseite.component';

export default [
  { path: 'startseite', component: StartseiteComponent },
  { path: '**', redirectTo: '/notfound' },
] as Routes;
