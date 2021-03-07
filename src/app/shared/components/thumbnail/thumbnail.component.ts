import {Component, NgZone, OnInit} from '@angular/core';
import {ElectronService} from "../../../core/services";

@Component({
  selector: 'app-thumbnail',
  templateUrl: './thumbnail.component.html',
  styleUrls: ['./thumbnail.component.scss'],
  inputs: [ 'image' ]
})
export class ThumbnailComponent implements OnInit {

  image: Record<string, string>;
  src: string;

  constructor(public electron: ElectronService, private zone: NgZone) {

  }

  ngOnInit(): void {
    if (this.electron.isElectron) {
      this.electron.fs.readFile(`images/${this.image.name}`, 'base64', (err, data)=> {
        this.zone.run(() => {
          this.src = `data:image/jpeg;base64,${data}`;
        });
      });
    }
  }
}
