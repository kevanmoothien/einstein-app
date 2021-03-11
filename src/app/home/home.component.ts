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
  email: string;
  secret: string;
  project: string;

  projects: any;

  constructor(private router: Router, private zone: NgZone, private electronService: ElectronService) {
    if (electronService.isElectron) {
      this.electronService.ipcRenderer.on('resetDatabaseCompleted', this.databaseReset);
      this.electronService.ipcRenderer.on('credentialSaved', this.credentialSaved);

      this.electronService.ipcRenderer.on('configurationLoaded', (event, data)=> {
        this.zone.run(() => {
          try {
            this.email = data[0].email;
            this.secret = data[0].secret;
          }
          catch(e) {
            console.log('secret not found');
          }
        });
      });
      this.electronService.ipcRenderer.on('projectCreated', (event, message)=> {
        this.zone.run(() => {
          this.project = '';
          this.projects.push(message);
        });
      });

      this.electronService.ipcRenderer.send('loadConfiguration');
      this.electronService.ipcRenderer.send('listProjects');

      this.electronService.ipcRenderer.on('projectListed', (event, message)=> {
        this.zone.run(() => {
          this.projects = message;
        });
      });
    }
  }

  ngOnInit(): void { }

  ngOnDestroy(): void {
    this.electronService.ipcRenderer.removeAllListeners('projectListed');
    this.electronService.ipcRenderer.removeAllListeners('projectCreated');
    this.electronService.ipcRenderer.removeAllListeners('configurationLoaded');
    this.electronService.ipcRenderer.removeAllListeners('credentialSaved');
    this.electronService.ipcRenderer.removeAllListeners('resetDatabaseCompleted');
  }

  databaseReset (success): void {
    if (success) {
      console.log('database reset completed');
    }
    else {
      console.log('database reset failed');
    }
  }

  resetDatabase () :void {
    this.electronService.ipcRenderer.send('resetDatabase');
  }

  onSubmit(myform: NgForm) :void {
    console.log(myform.value);
    this.electronService.ipcRenderer.send('saveCredentials', myform.value);
  }

  credentialSaved () :void {
    console.log('credential saved');
  }

  createProject (myform: NgForm) :void {
    this.electronService.ipcRenderer.send('createProject', { name: myform.value.project });
  }
}
