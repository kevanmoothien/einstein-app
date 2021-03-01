import {ChangeDetectorRef, Component, OnInit, ViewChild} from '@angular/core';
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

  @ViewChild('project') projectName;

  constructor(private router: Router, private electronService: ElectronService, private chRef: ChangeDetectorRef) {
    this.id = 'kevan';



    if (electronService.isElectron) {
      this.electronService.ipcRenderer.on('resetDatabaseCompleted', this.datasetReset);
      this.electronService.ipcRenderer.on('credentialSaved', this.credentialSaved);

      this.electronService.ipcRenderer.on('configurationLoaded', (event, message)=> {
        console.log(">>>>> configuration loaded", message);
        this.email = message[0].email;
        this.secret = message[0].secret;

        chRef.detectChanges();
      });
      this.electronService.ipcRenderer.on('projectCreated', (event, message)=> {
        console.log(">>>>> project created: ", message);
        this.project = '';
        chRef.detectChanges();
      });

      this.electronService.ipcRenderer.send('loadConfiguration');
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
    this.electronService.ipcRenderer.send('createProject', myform.value);
  }

}
