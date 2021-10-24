import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomTrainingRoutingModule } from './custom-training-routing.module';
import { CustomTrainingComponent } from './custom-training.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [CustomTrainingComponent],
  exports: [CustomTrainingComponent],
  imports: [
    CommonModule,
    CustomTrainingRoutingModule
  ]
})
export class CustomTrainingModule { }
