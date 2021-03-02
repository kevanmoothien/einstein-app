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
  images: File[];
  projectName: any;
  private sub: any;

  constructor(private electronService: ElectronService, private route: ActivatedRoute, private zone: NgZone) {
    this.zone.run(() => {
      this.id = this.route.snapshot.paramMap.get('id');
      console.log('######', this.id );
    });

    if (electronService.isElectron) {
      this.electronService.ipcRenderer.on('chosenFile', this.processImages);
      this.electronService.ipcRenderer.on('listProjectCompleted', (event, data)=>{
        console.log(">>>> **** ", data);

      });

      this.electronService.ipcRenderer.send('listProject', { id: this.id });

    }
  }

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
  }

  ngOnDestroy() {

  }

  processImages(event, images: any) {
    _.each(images, (image)=> {
      console.log(image);
    });
  }

  chooseImages () {
    this.electronService.ipcRenderer.send('chooseFile');
  }

}
