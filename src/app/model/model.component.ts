import {Component, NgZone, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {ElectronService} from "../core/services";

@Component({
  selector: 'app-model',
  templateUrl: './model.component.html',
  styleUrls: ['./model.component.scss']
})
export class ModelComponent implements OnInit {
  private id: string;
  record: any;
  model: { modelId:string, progress:number, status:string, name:string };
  progress: number;

  constructor(
    private route: ActivatedRoute,
    private electronService: ElectronService,
    private zone: NgZone
  ) {
    this.model = { modelId: undefined, progress: 0, status: 'UNKNOWN', name: 'Unknown' };
    this.zone.run(() => {
      this.id = this.route.snapshot.paramMap.get('id');
    });
    this.electronService.ipcRenderer.on('modelLoaded', (event, data)=> {
      if (data) {
        this.zone.run(() => {
          this.record = data;
          console.log('************** ', this.record);
          this.model = this.record.model;
          this.progress = this.model.progress * 100;
        });
      }
    });
    this.electronService.ipcRenderer.send('loadModel', { project_id: this.id });
  }

  ngOnInit(): void {
  }

}
