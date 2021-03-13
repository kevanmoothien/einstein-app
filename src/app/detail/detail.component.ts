import {Component, NgZone, OnInit} from '@angular/core';
import * as _ from 'lodash';
import { ElectronService } from "../core/services";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit {
  id: string;
  images: { id: number, uuid: string, name: string, project_id: string, label: string, uploaded: boolean }[];
  projectName: string;
  label: string;
  labels: string[];
  dataset :any;
  progressValue: number;

  // TODO: load dataset and check completed - add a setInterval to check status of dataset

  constructor(
    private electronService: ElectronService,
    private route: ActivatedRoute,
    private zone: NgZone
  ) {
    this.zone.run(() => {
      this.id = this.route.snapshot.paramMap.get('id');
    });

    if (electronService.isElectron) {
      this.electronService.ipcRenderer.on('chosenFile', (event, args)=> {
        this.processImages(event, args);
      });
      this.electronService.ipcRenderer.on('listProjectCompleted', (event, data)=>{
        this.zone.run(() => {
          this.projectName = data[0].name;
        });
      });
      this.electronService.ipcRenderer.on('listProjectImagesCompleted', (event, images)=>{
        this.zone.run(() => {
          this.images = images;

          const uploaded = _.filter(this.images, (image)=> { return image.uploaded; });
          this.progressValue = Math.ceil((uploaded.length / this.images.length) * 100);

          this.refreshImages();
          this.labels = _.orderBy(_.uniq(_.map(images, 'label')));
        });
      });

      this.electronService.ipcRenderer.on('imageDeleted', (event, data)=> {
        this.zone.run(()=> {
          _.remove(this.images, (image)=> {
            return image['uuid'] == data.image_id;
          });
        });
      });
      this.electronService.ipcRenderer.on('datasetCreated', (event, data)=> {
        this.zone.run(() => {
          this.dataset = data;
        });
      });
      this.electronService.ipcRenderer.on('datasetLoaded', (event, data)=> {
        this.zone.run(() => {
          this.dataset = data;
          this.refreshImages();
        });
      });
      this.electronService.ipcRenderer.on('imageUploaded', (event, image)=> {
        this.zone.run(() => {
          _.find(this.images, (im)=>{
            return im.uuid == image.uuid;
          }).uploaded = true;

          const uploaded = _.filter(this.images, (image)=> { return image.uploaded; });
          this.progressValue = Math.ceil((uploaded.length / this.images.length) * 100);
        });
      });
      this.electronService.ipcRenderer.send('loadDataset', { project_id: this.id });
      this.electronService.ipcRenderer.send('listProject', { id: this.id });
      this.electronService.ipcRenderer.send('listProjectImages', { project_id: this.id });
    }
  }

  ngOnInit() :void {
    this.id = this.route.snapshot.paramMap.get('id');
  }

  ngOnDestroy() :void {
    this.electronService.ipcRenderer.removeAllListeners('chosenFile');
    this.electronService.ipcRenderer.removeAllListeners('imageDeleted');
    this.electronService.ipcRenderer.removeAllListeners('listProjectImagesCompleted');
    this.electronService.ipcRenderer.removeAllListeners('listProjectCompleted');
    this.electronService.ipcRenderer.removeAllListeners('datasetCreated');
    this.electronService.ipcRenderer.removeAllListeners('datasetLoaded');
    this.electronService.ipcRenderer.removeAllListeners('imageUploaded');
  }

  processImages(event, images: any) :void {
    this.zone.run(() => {
      _.each(images, (image: any)=> {
        this.images.push(image);
      });
    });
  }

  chooseImages() :void {
    if (this.label == undefined || this.label == '') {
      // TODO: use bootstrap alert for this part
      alert('Please insert a label first.');
      return;
    }
    this.labels.push(this.label);
    this.zone.run(() => {
      this.labels = _.orderBy(_.uniq(this.labels));
    });
    this.electronService.ipcRenderer.send('chooseFile', { project_id: this.id, label: this.label });
  }

  createDataset() {
    const dataset = { project_id: this.id, name: this.projectName, labels: this.labels };
    this.electronService.ipcRenderer.send('createDataset', dataset);
  }

  selectLabel(l: string) {
    this.label = l;
  }

  private refreshImages() {
    if (this.dataset && this.images && this.images.length > 0) {
      this.electronService.ipcRenderer.send('uploadImages', { project_id: this.id});
    }
  }
}
