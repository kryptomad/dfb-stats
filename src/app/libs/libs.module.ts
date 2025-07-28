import {NgModule} from "@angular/core";
import {ThemeSwitcherComponent} from "./theme-switcher/theme-switcher.component";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {StyleClassModule} from "primeng/styleclass";
import {SelectButtonModule} from "primeng/selectbutton";
import {ToggleSwitchModule} from "primeng/toggleswitch";

@NgModule({
  declarations: [ThemeSwitcherComponent],
  imports: [CommonModule, FormsModule, StyleClassModule, SelectButtonModule, ToggleSwitchModule],
  exports: [ThemeSwitcherComponent],

})
export class LibsModule {}
