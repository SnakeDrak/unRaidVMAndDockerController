import { Component, OnInit, NgZone, AfterViewInit } from '@angular/core';
import { ActionSheetController, AlertController, Platform } from '@ionic/angular';
import { UnRaidLoader } from '../unRaid/UnRaidLoader.service';
import { TranslateService } from '@ngx-translate/core';
import { IUnRaidVM } from '../unRaid/IUnRaidVM';
import { IUnRaidDocker } from '../unRaid/IUnRaidDocker';
import { environment } from 'src/environments/environment.prod';
import { StorageService } from '../storage/storage.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage implements OnInit, AfterViewInit {
  public vms: Array<IUnRaidVM>;
  public dockers: Array<IUnRaidDocker>;
  public serverName = '';

  constructor(
    private translate: TranslateService,
    private unRaidLoader: UnRaidLoader,
    private actionSheetController: ActionSheetController,
    public alertController: AlertController,
    private platform: Platform,
    private zone: NgZone,
    public storage: StorageService
  ) {}

  ngOnInit(): void {
    this.platform.ready().then(() => {
      this.loadVMs();
      this.loadDockers();
    });
  }

  ngAfterViewInit() {
    const info = this.storage.getLoginInfo();

    if (info) {
      this.serverName = info.serverName;
    }
  }

  async showVMActions(vm: IUnRaidVM) {
    if (vm.is_loading) {
      return;
    }

    this.enableLoading(vm);
    const actionSheet = await this.actionSheetController.create(
      await this.unRaidLoader.getVMActions(vm, this.translate, result => {
        result
          .then(async res => {
            this.disableLoading(vm);
            if (res.error) {
              this.showError(vm.name, res.error);
              this.loadVMs();
            } else {
              this.zone.run(async () => (vm.state = res.state));
            }
          })
          .catch(res => {
            this.disableLoading(vm);
            this.showError(vm.name, `Error: ${res.error}`);
          });

        return Promise.resolve(true);
      })
    );
    await actionSheet.present();
    actionSheet.onDidDismiss().then(r => {
      if (r.role === 'backdrop') {
        this.disableLoading(vm);
      }
    });
  }

  async showDockerActions(docker: IUnRaidDocker) {
    if (docker.is_loading) {
      return;
    }

    this.enableLoading(docker);
    const actionSheet = await this.actionSheetController.create(
      await this.unRaidLoader.getDockerActions(docker, this.translate, result => {
        result
          .then(res => {
            this.disableLoading(docker);
            if (typeof res.success === 'string') {
              this.showError(docker.name, res.success);
            }

            this.loadDockers();
          })
          .catch(res => {
            this.disableLoading(docker);
            this.showError(docker.name, `Error:${res.error}`);
          });

        return Promise.resolve(true);
      })
    );
    await actionSheet.present();
    actionSheet.onDidDismiss().then(r => {
      if (r.role === 'backdrop') {
        this.disableLoading(docker);
      }
    });
  }

  enableLoading(obj: IUnRaidVM | IUnRaidDocker) {
    obj.is_loading = true;

    obj.timeout = setTimeout(() => {
      obj.is_loading = false;

      if (obj.type === 'VM') {
        this.loadVMs();
      } else {
        this.loadDockers();
      }
    }, environment.unRaidTimeout);
  }

  disableLoading(obj: IUnRaidVM | IUnRaidDocker) {
    this.zone.run(async () => (obj.is_loading = false));
    clearTimeout(obj.timeout);
  }

  async showError(name: string, error: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      subHeader: name,
      message: error,
      buttons: ['OK']
    });

    await alert.present();
  }

  async loadVMs() {
    this.vms = [];

    // Runs inside the Angular zone for updatting DOM
    this.unRaidLoader
      .getVMs()
      .then(vms => this.zone.run(() => (this.vms = vms)))
      .catch(e => {
        this.showError('VMs', `Error loadings VMS: ${e.error}`);
      });
  }

  loadDockers() {
    this.dockers = [];

    // Runs inside the Angular zone for updatting DOM
    this.unRaidLoader
      .getDockers()
      .then(dockers => this.zone.run(() => (this.dockers = dockers)))
      .catch(e => {
        this.showError('Dockers', `Error loadings Dockers: ${e.error}`);
      });
  }
}
