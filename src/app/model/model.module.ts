import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ModelRoutingModule } from './model-routing.module';
import { ModelComponent } from "./model.component";
import {SharedModule} from "../shared/shared.module";


@NgModule({
  declarations: [ModelComponent],
  imports: [
    CommonModule,
    ModelRoutingModule,
    SharedModule
  ]
})
export class ModelModule { }
