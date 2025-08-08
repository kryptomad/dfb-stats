import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-impressum',
  imports: [],
  templateUrl: './impressum.component.html',
  styleUrl: './impressum.component.scss'
})
export class ImpressumComponent {

  // datenschutz.component.ts
email = ['kryptomad','proton.me']; // ['name','domain']
mailto(ev: Event) {
  ev.preventDefault();
  const addr = `${this.email[0]}@${this.email[1]}`;
  window.location.href = `mailto:${addr}`;
}

}
