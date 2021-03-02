import {Component, NgZone, OnInit, ViewChild} from '@angular/core';
import { Router } from '@angular/router';
import {ElectronService} from "../core/services";
import {NgForm} from '@angular/forms';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  id: any;
  email: string;
  secret: string;
  project: string;

  projects: any;

  @ViewChild('project') projectName;

  constructor(private router: Router, private zone: NgZone, private electronService: ElectronService) {
    this.id = 'kevan';

    if (electronService.isElectron) {
      this.electronService.ipcRenderer.on('resetDatabaseCompleted', this.datasetReset);
      this.electronService.ipcRenderer.on('credentialSaved', this.credentialSaved);

      this.electronService.ipcRenderer.on('configurationLoaded', (event, message)=> {
        this.zone.run(() => {
          this.email = message[0].email;
          this.secret = message[0].secret;
        })
      });
      this.electronService.ipcRenderer.on('projectCreated', (event, message)=> {
        this.zone.run(() => {
          this.project = '';
          this.projects.push(message);
        })
      });

      this.electronService.ipcRenderer.send('loadConfiguration');
      this.electronService.ipcRenderer.send('listProjects');

      this.electronService.ipcRenderer.on('projectListed', (event, message)=> {
        this.zone.run(() => {
          this.projects = message;
        })
      });
    }
  }

  ngOnInit(): void { }

  datasetReset (success) {
    if (success) {
      console.log('database reset completed');
    }
    else {
      console.log('database reset failed');
    }
  }

  resetDatabase () {
    this.electronService.ipcRenderer.send('resetDatabase');
  }

  onSubmit(myform: NgForm) {
    console.log(myform.value);
    this.electronService.ipcRenderer.send('saveCredentials', myform.value);
  }

  credentialSaved () {
    console.log('credential saved');
  }

  createProject (myform: NgForm) {
    this.electronService.ipcRenderer.send('createProject', { name: myform.value.project });
  }

}
