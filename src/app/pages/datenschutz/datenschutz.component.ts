import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-datenschutz',
  imports: [],
  templateUrl: './datenschutz.component.html',
  styleUrl: './datenschutz.component.scss'
})
export class DatenschutzComponent {

  // datenschutz.component.ts
email = ['kryptomad','proton.me']; // ['name','domain']
mailto(ev: Event) {
  ev.preventDefault();
  const addr = `${this.email[0]}@${this.email[1]}`;
  window.location.href = `mailto:${addr}`;
}


}
