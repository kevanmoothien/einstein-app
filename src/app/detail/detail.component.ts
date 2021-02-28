import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { ElectronService } from "../core/services";

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit {
  id = 'Kevan';
  images: File[];

  constructor(private electronService: ElectronService) {
    if (electronService.isElectron) {
      this.electronService.ipcRenderer.on('chosenFile', this.processImages);
    }
  }

  ngOnInit(): void { }

  processImages(event, images: any) {
    _.each(images, (image)=> {
      console.log(image);
    });
    // const src = `data:image/jpg;base64,${base64}`;
    // console.log(src);
  }

  fileChange(file) {
    this.images = file.target.files;
    _.each(this.images, (image)=> {
      console.log(image.name);
    });
  }

  chooseImages () {
    this.electronService.ipcRenderer.send('chooseFile');
  }

}
