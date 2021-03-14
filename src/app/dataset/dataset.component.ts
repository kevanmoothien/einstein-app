import {Component, NgZone, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {ElectronService} from "../core/services";

@Component({
  selector: 'app-dataset',
  templateUrl: './dataset.component.html',
  styleUrls: ['./dataset.component.scss']
})
export class DatasetComponent implements OnInit {
  id :string;
  dataset: any;
  dataset_info: string;
  payload: {
    id:number,
    name:string,
    statusMsg:string,
    totalExamples:number,
    totalLabels:number,
    available:boolean,
    numOfDuplicates:number,
    labelSummary: { labels:{id:number, name:string, numExamples:number}[] }
  };
  model: any;
  model_info: string;

  constructor(
    private route: ActivatedRoute,
    private electronService: ElectronService,
    private zone: NgZone
  ) {
    this.payload = { id: 0, name: 'unknown', statusMsg: 'QUEUE', totalExamples: 0, totalLabels: 0, available: false, numOfDuplicates: 0, labelSummary: { labels: [] } };
    this.id = this.route.snapshot.paramMap.get('id');
    this.electronService.ipcRenderer.on('datasetLoaded', (event, data)=> {
      this.zone.run(() => {
        this.dataset = data;
        console.log("***** ", this.dataset);
        this.payload = this.dataset.dataset;
        this.dataset_info = JSON.stringify(this.dataset.dataset, null, 2);
        this.electronService.ipcRenderer.send('refreshDataset', { dataset_id: this.dataset.dataset.id, project_id: this.dataset.project_id });
      });
    });
    this.electronService.ipcRenderer.on('datasetRefreshed', (event, data)=> {
      console.log('>>>>>> dataset refreshed ', data);
      this.zone.run(() => {
        this.dataset_info = JSON.stringify(data, null, 2);
        this.payload = this.dataset.dataset;
      });
    });
    this.electronService.ipcRenderer.send('loadDataset', { project_id: this.id });

    this.electronService.ipcRenderer.on('modelLoaded', (event, data)=> {
      if (data) {
        this.zone.run(() => {
          this.model = data;
          this.model_info = JSON.stringify(this.model, null, 2);
        });
      }
    });
    this.electronService.ipcRenderer.send('loadModel', { project_id: this.id });

    this.electronService.ipcRenderer.on('modelCreated', (event, data)=> {
      if (data) {
        this.zone.run(() => {
          this.model = data;
          console.log('*** model created *** ', this.model);
        });
      }
    });
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
  }

  ngOnDestroy() :void {
    this.electronService.ipcRenderer.removeAllListeners('datasetLoaded');
    this.electronService.ipcRenderer.removeAllListeners('datasetRefreshed');
    this.electronService.ipcRenderer.removeAllListeners('modelLoaded');
  }

  train() :void {
    this.electronService.ipcRenderer.send('createModel', { name: this.dataset.name,  project_id: this.id, dataset_id: this.dataset.dataset.id });
  }
}
