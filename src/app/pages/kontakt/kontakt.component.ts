import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-kontakt',
  imports: [],
  templateUrl: './kontakt.component.html',
  styleUrl: './kontakt.component.scss'
})
export class KontaktComponent {

  // datenschutz.component.ts
email = ['kryptomad','proton.me']; // ['name','domain']
mailto(ev: Event) {
  ev.preventDefault();
  const addr = `${this.email[0]}@${this.email[1]}`;
  window.location.href = `mailto:${addr}`;
}

}
