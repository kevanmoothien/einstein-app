import {Component, NgZone, OnInit} from '@angular/core';
import {ElectronService} from "../../../core/services";
import {DomSanitizer, SafeUrl} from "@angular/platform-browser";

@Component({
  selector: 'app-thumbnail',
  templateUrl: './thumbnail.component.html',
  styleUrls: ['./thumbnail.component.scss'],
  inputs: [ 'image' ]
})
export class ThumbnailComponent implements OnInit {

  image: Record<string, string>;
  src: SafeUrl;
  label: string;

  constructor(public electron: ElectronService, private zone: NgZone, private sanitizer: DomSanitizer) {

  }

  ngOnInit(): void {
    if (this.electron.isElectron) {
      this.label = this.image.label;
      this.electron.fs.readFile(`images/${this.image.name}`, 'base64', (err, data)=> {
        console.log('>>>> &&&& Erro: ' + err);
        this.zone.run(() => {
          this.src = this.sanitizer.bypassSecurityTrustUrl(`data:image/jpeg;base64,${data}`);
        });
      });
    }
  }

  delete() {
    this.electron.ipcRenderer.send('deleteImage', {id: this.image.uuid});
  }
}
