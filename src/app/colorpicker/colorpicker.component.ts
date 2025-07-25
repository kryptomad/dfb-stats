import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-colorpicker',
  templateUrl: './colorpicker.component.html',
  styleUrl: './colorpicker.component.scss',
})
export class ColorpickerComponent {
  @Input()
  show = false;
}
