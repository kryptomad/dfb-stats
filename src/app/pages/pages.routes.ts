import { Routes } from '@angular/router';
import { StartseiteComponent } from './startseite/startseite.component';
import { RekordeComponent } from './rekorde/rekorde.component';

export default [
  { path: 'startseite', component: StartseiteComponent },
  { path: 'rekorde', component: RekordeComponent },
  { path: '**', redirectTo: '/notfound' },
] as Routes;
