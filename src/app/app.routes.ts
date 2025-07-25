import { Routes } from '@angular/router';
import { StartseiteComponent } from './content/startseite/startseite.component';
import { SpieltagComponent } from './content/spieltag/spieltag.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'startseite',
  },
  {
    path: 'startseite',
    component: StartseiteComponent,
  },
  {
    path: 'spieltag',
    component: SpieltagComponent,
    children: [
      {
        path: 'jahrestabelle',
        component: SpieltagComponent,
      },
    ],
  },
];
