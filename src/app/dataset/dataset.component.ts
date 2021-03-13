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

  constructor(
    private route: ActivatedRoute,
    private electronService: ElectronService,
    private zone: NgZone
  ) {
    this.id = this.route.snapshot.paramMap.get('id');
    this.electronService.ipcRenderer.on('datasetLoaded', (event, data)=> {
      this.zone.run(() => {
        this.dataset = data;
        console.log("***** ", this.dataset);
        this.dataset_info = JSON.stringify(this.dataset.dataset, null, 2);
        this.electronService.ipcRenderer.send('refreshDataset', { dataset_id: this.dataset.dataset.id, project_id: this.dataset.project_id });
      });
    });
    this.electronService.ipcRenderer.on('datasetRefreshed', (event, data)=> {
      console.log('>>>>>> dataset refreshed ', data);
      this.zone.run(() => {
        this.dataset_info = JSON.stringify(data, null, 2);
      });
    });
    this.electronService.ipcRenderer.send('loadDataset', { project_id: this.id });
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
  }

  ngOnDestroy() :void {
    this.electronService.ipcRenderer.removeAllListeners('datasetLoaded');
    this.electronService.ipcRenderer.removeAllListeners('datasetRefreshed');
  }

}
