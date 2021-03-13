import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { PageNotFoundComponent } from './components/';
import { ThumbnailComponent } from "./components/";
import { WebviewDirective } from './directives/';
import { FormsModule } from '@angular/forms';
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {MatProgressBarModule} from '@angular/material/progress-bar';


@NgModule({
  declarations: [PageNotFoundComponent, WebviewDirective, ThumbnailComponent],
  imports: [CommonModule, TranslateModule, FormsModule, MatProgressSpinnerModule, FontAwesomeModule, MatProgressBarModule],
  exports: [TranslateModule, WebviewDirective, FormsModule, PageNotFoundComponent, ThumbnailComponent, MatProgressBarModule]
})
export class SharedModule {}
