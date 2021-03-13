import {Component, NgZone, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {ElectronService} from "../core/services";

@Component({
  selector: 'app-model',
  templateUrl: './model.component.html',
  styleUrls: ['./model.component.scss']
})
export class ModelComponent implements OnInit {
  private id: string;

  constructor(
    private route: ActivatedRoute,
    private electronService: ElectronService,
    private zone: NgZone
  ) {
    this.zone.run(() => {
      this.id = this.route.snapshot.paramMap.get('id');
    });
  }

  ngOnInit(): void {
  }

}
