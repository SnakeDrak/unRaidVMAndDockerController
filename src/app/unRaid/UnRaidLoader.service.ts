import { Injectable } from '@angular/core';
import { HTTP } from '@ionic-native/http/ngx';
import { UnRaidDockerAction } from './UnRaidDockerAction';
import { UnRaidDockerState } from './UnRaidDockerState';
import { UnRaidVMAction } from './UnRaidVMAction';
import { UnRaidVMState } from './UnRaidVMState';
import { IUnRaidVMActionResponse } from './IUnRaidVMActionResponse';
import { IUnRaidDockerActionResponse } from './IUnRaidDockerActionResponse';
import { ActionSheetOptions } from '@ionic/core';
import { TranslateService } from '@ngx-translate/core';
import { IUnRaidDocker } from './IUnRaidDocker';
import { IUnRaidVM } from './IUnRaidVM';
import { StorageService } from '../storage/storage.service';
import { ILoginInfo } from '../login/ILoginInfo';

@Injectable({
  providedIn: 'root'
})
export class UnRaidLoader {
  constructor(private http: HTTP, private storage: StorageService) {}

  public getDockers(): Promise<IUnRaidDocker[]> {
    const info = this.storage.getLoginInfo();

    return this.http
      .get(`${info.server}/plugins/dynamix.docker.manager/include/DockerContainers.php`, {}, this.getHeaders(info))
      .then(data => this.getDockersFromDOM(data.data));
  }

  public getVMs(): Promise<IUnRaidVM[]> {
    const info = this.storage.getLoginInfo();

    return this.http
      .get(`${info.server}/plugins/dynamix.vm.manager/include/VMMachines.php`, {}, this.getHeaders(info))
      .then(data => this.getVMsFromDOM(data.data));
  }

  public async getDockerActions(
    docker: IUnRaidDocker,
    translate: TranslateService,
    buttonClickedCallback: (res: Promise<IUnRaidDockerActionResponse>) => Promise<boolean>
  ): Promise<ActionSheetOptions> {
    const actions = Object.values(UnRaidDockerAction).map(v => `UNRAID.DOCKER_${v}`);
    const translations = await translate.get(actions).toPromise();

    const res: ActionSheetOptions = {
      header: docker.name,
      buttons: []
    };

    if (docker.state === UnRaidDockerState.STARTED || docker.state === UnRaidDockerState.PAUSED) {
      res.buttons.push({
        text: translations[`UNRAID.DOCKER_${UnRaidDockerAction.RESTART}`],
        icon: 'refresh',
        handler: () => buttonClickedCallback(this.executeDockerAction(docker.id, UnRaidDockerAction.RESTART))
      });
    }

    if (docker.state === UnRaidDockerState.STARTED) {
      res.buttons.push({
        text: translations[`UNRAID.DOCKER_${UnRaidDockerAction.PAUSE}`],
        icon: 'pause',
        handler: () => buttonClickedCallback(this.executeDockerAction(docker.id, UnRaidDockerAction.PAUSE))
      });
      res.buttons.push({
        text: translations[`UNRAID.DOCKER_${UnRaidDockerAction.STOP}`],
        icon: 'square',
        handler: () => buttonClickedCallback(this.executeDockerAction(docker.id, UnRaidDockerAction.STOP))
      });
    } else if (docker.state === UnRaidDockerState.PAUSED) {
      res.buttons.push({
        text: translations[`UNRAID.DOCKER_${UnRaidDockerAction.RESUME}`],
        icon: 'play',
        handler: () => buttonClickedCallback(this.executeDockerAction(docker.id, UnRaidDockerAction.RESUME))
      });
    } else if (docker.state === UnRaidDockerState.STOPPED) {
      res.buttons.push({
        text: translations[`UNRAID.DOCKER_${UnRaidDockerAction.START}`],
        icon: 'play',
        handler: () => buttonClickedCallback(this.executeDockerAction(docker.id, UnRaidDockerAction.START))
      });
    }

    return res;
  }

  public async getVMActions(
    vm: IUnRaidVM,
    translate: TranslateService,
    buttonClickedCallback: (res: Promise<IUnRaidVMActionResponse>) => Promise<boolean>
  ): Promise<ActionSheetOptions> {
    const actions = Object.values(UnRaidVMAction).map(v => `UNRAID.VM_${v}`);
    const translations = await translate.get(actions).toPromise();

    const res: ActionSheetOptions = {
      header: vm.name,
      buttons: []
    };

    if (
      vm.state === UnRaidVMState.STARTED ||
      vm.state === UnRaidVMState.RUNNING ||
      vm.state === UnRaidVMState.PAUSED ||
      vm.state === UnRaidVMState.HIBERNATED ||
      vm.state === UnRaidVMState.UNKNOWN
    ) {
      res.buttons.push({
        text: translations[`UNRAID.VM_${UnRaidVMAction.FORCE_STOP}`],
        role: 'destructive',
        icon: 'alert',
        handler: () => buttonClickedCallback(this.executeVMAction(vm.id, UnRaidVMAction.FORCE_STOP))
      });
    }

    if (vm.state === UnRaidVMState.RUNNING || vm.state === UnRaidVMState.STARTED) {
      res.buttons.push({
        text: translations[`UNRAID.VM_${UnRaidVMAction.PAUSE}`],
        icon: 'pause',
        handler: () => buttonClickedCallback(this.executeVMAction(vm.id, UnRaidVMAction.PAUSE))
      });
      res.buttons.push({
        text: translations[`UNRAID.VM_${UnRaidVMAction.STOP}`],
        icon: 'square',
        handler: () => buttonClickedCallback(this.executeVMAction(vm.id, UnRaidVMAction.STOP))
      });
      res.buttons.push({
        text: translations[`UNRAID.VM_${UnRaidVMAction.RESTART}`],
        icon: 'refresh',
        handler: () => buttonClickedCallback(this.executeVMAction(vm.id, UnRaidVMAction.RESTART))
      });
      res.buttons.push({
        text: translations[`UNRAID.VM_${UnRaidVMAction.HIBERNATE}`],
        icon: 'bed',
        handler: () => buttonClickedCallback(this.executeVMAction(vm.id, UnRaidVMAction.HIBERNATE))
      });
    } else if (vm.state === UnRaidVMState.HIBERNATED) {
      res.buttons.push({
        text: translations[`UNRAID.VM_${UnRaidVMAction.RESUME_HIBERNATE}`],
        icon: 'play',
        handler: () => buttonClickedCallback(this.executeVMAction(vm.id, UnRaidVMAction.RESUME_HIBERNATE))
      });
    } else if (vm.state === UnRaidVMState.PAUSED || vm.state === UnRaidVMState.UNKNOWN) {
      res.buttons.push({
        text: translations[`UNRAID.VM_${UnRaidVMAction.RESUME}`],
        icon: 'play',
        handler: () => buttonClickedCallback(this.executeVMAction(vm.id, UnRaidVMAction.RESUME))
      });
    } else {
      res.buttons.push({
        text: translations[`UNRAID.VM_${UnRaidVMAction.START}`],
        icon: 'play',
        handler: () => buttonClickedCallback(this.executeVMAction(vm.id, UnRaidVMAction.START))
      });
    }

    return res;
  }

  private executeDockerAction(dockerId: string, action: UnRaidDockerAction): Promise<IUnRaidDockerActionResponse> {
    const info = this.storage.getLoginInfo();

    return this.executeAction<IUnRaidDockerActionResponse>(
      dockerId,
      `${info.server}/Docker`,
      `${info.server}/plugins/dynamix.docker.manager/include/Events.php`,
      action,
      info
    );
  }

  private executeVMAction(vmId: string, action: UnRaidVMAction): Promise<IUnRaidVMActionResponse> {
    const info = this.storage.getLoginInfo();

    return this.executeAction<IUnRaidVMActionResponse>(
      vmId,
      `${info.server}/VMs`,
      `${info.server}/plugins/dynamix.vm.manager/include/VMajax.php`,
      action,
      info
    );
  }

  private getHeaders(info: ILoginInfo) {
    return {
      Authorization: `Basic ${info.auth}`
    };
  }

  private getDockersFromDOM(data: string): IUnRaidDocker[] {
    const dockers: IUnRaidDocker[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<table>${data}</table>`, 'text/html');
    doc.querySelectorAll('.ct-name').forEach(e => {
      dockers.push({
        id: e.querySelector('span[id]').id,
        name: e.querySelector('a').innerText,
        state: e.querySelector('.state').innerHTML as UnRaidDockerState,
        is_loading: false,
        type: 'Docker'
      });
    });

    return dockers;
  }

  private getVMsFromDOM(data: string): IUnRaidVM[] {
    const vm: IUnRaidVM[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<table>${data}</table>`, 'text/html');
    doc.querySelectorAll('.vm-name').forEach(e => {
      vm.push({
        id: e.querySelector('span[id]').id.substr(3),
        name: e.querySelector('a').innerText,
        state: e.querySelector('.state').innerHTML as UnRaidVMState,
        is_loading: false,
        type: 'VM'
      });
    });

    return vm;
  }

  private executeAction<Response>(
    id: string,
    urlCsrf: string,
    urlAction: string,
    action: UnRaidDockerAction | UnRaidVMAction,
    info: ILoginInfo
  ): Promise<Response> {
    return this.http
      .get(urlCsrf, {}, this.getHeaders(info))
      .then(data => data.data.match(/&csrf_token=([^&'"]+)/)[1])
      .then(csrf_token => {
        return this.http
          .post(
            urlAction,
            {
              action: action,
              uuid: id,
              container: id,
              csrf_token: csrf_token
            },
            this.getHeaders(info)
          )
          .then((res: any) => JSON.parse(res.data) as Response);
      });
  }
}
