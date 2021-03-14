import {Component, NgZone, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {ElectronService} from "../core/services";
import {ThemePalette} from "@angular/material/core";

@Component({
  selector: 'app-model',
  templateUrl: './model.component.html',
  styleUrls: ['./model.component.scss']
})
export class ModelComponent implements OnInit {
  private id: string;
  record: any;
  model: { modelId:string, progress:number, status:string, name:string, failureMsg:string };
  progress: number;
  spinner = true;
  color: ThemePalette = 'primary';
  predictionInProgress = false;
  prediction: { probabilities: {label:string, probability:number}[], message:string };

  constructor(
    private route: ActivatedRoute,
    private electronService: ElectronService,
    private zone: NgZone
  ) {
    this.model = { modelId: undefined, progress: 0, status: 'UNKNOWN', name: 'Unknown', failureMsg: undefined };
    this.prediction = { message: undefined, probabilities: [] };
    this.zone.run(() => {
      this.id = this.route.snapshot.paramMap.get('id');
    });
    this.electronService.ipcRenderer.on('modelLoaded', (event, data)=> {
      if (data) {
        this.zone.run(() => {
          this.record = data;
          this.model = this.record.model;
          this.reloadModel(10000);
        });
      }
    });
    this.electronService.ipcRenderer.send('loadModel', { project_id: this.id });

    this.electronService.ipcRenderer.on('modelStatusUpdated', (event, data)=> {
      if (data) {
        this.zone.run(() => {
          this.model = data;
          this.reloadModel(60000);
        });
      }
    });

    this.electronService.ipcRenderer.on('predictImageCompleted', (event, data)=> {
      this.zone.run(() => {
        this.prediction = data;
        this.predictionInProgress = false;
      });
    });
  }

  ngOnInit(): void {
  }

  ngOnDestroy() :void {
    this.electronService.ipcRenderer.removeAllListeners('modelLoaded');
    this.electronService.ipcRenderer.removeAllListeners('modelStatusUpdated');
    this.electronService.ipcRenderer.removeAllListeners('predictImageCompleted');
  }

  reloadModel(timeout) :void {
    if (this.model.status == 'QUEUED' || this.model.status == 'RUNNING') {
      setTimeout(()=>{
        this.queryModelStatus();
      }, timeout);
    }
    else {
      this.spinner = false;
    }
    if (this.model.status == 'FAILURE') {
      this.color = 'warn';
    }
    this.progress = this.model.progress * 100;
  }

  queryModelStatus() :void {
    this.electronService.ipcRenderer.send('modelStatus', { project_id: this.id, modelId: this.model.modelId });
  }

  predictImage() :void {
    this.predictionInProgress = true;
    this.electronService.ipcRenderer.send('predictImage', { project_id: this.id, modelId: this.model.modelId });
  }
}
