import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DatasetRoutingModule } from './dataset-routing.module';
import { DatasetComponent } from './dataset.component';


@NgModule({
  declarations: [DatasetComponent],
  imports: [
    CommonModule,
    DatasetRoutingModule
  ]
})
export class DatasetModule { }
