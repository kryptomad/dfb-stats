import { Routes } from '@angular/router';
import { StartseiteComponent } from './startseite/startseite.component';
import { RekordeComponent } from './rekorde/rekorde.component';
import { SpieltagComponent } from './spieltag/spieltag.component';
import { RegelwerkComponent } from './regelwerk/regelwerk.component';
import { StatistikenComponent } from './statistiken/statistiken.component';
import { SpielerComponent } from './spieler/spieler.component';
import { SpieleComponent } from './spiele/spiele.component';
import { AbzeichenComponent } from './abzeichen/abzeichen.component';
import { LegsComponent } from './legs/legs.component';
import { ProfilComponent } from './profil/profil.component';
import { ImpressumComponent } from './impressum/impressum.component';
import { DatenschutzComponent } from './datenschutz/datenschutz.component';

export default [
  { path: 'startseite', component: StartseiteComponent },
  { path: 'rekorde', component: RekordeComponent },
  { path: 'spieltag', component: SpieltagComponent },
  { path: 'regelwerk', component: RegelwerkComponent },
  { path: 'statistiken', component: StatistikenComponent },
  { path: 'spieler', component: SpielerComponent },
  { path: 'spiele', component: SpieleComponent },
  { path: 'abzeichen', component: AbzeichenComponent },
  { path: 'legs/:game_id', component: LegsComponent },
  { path: 'profil/:id', component: ProfilComponent },
  { path: 'impressum', component: ImpressumComponent },
  { path: 'datenschutz', component: DatenschutzComponent },
  { path: '**', redirectTo: '/notfound' },
] as Routes;
