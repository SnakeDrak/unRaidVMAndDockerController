import { Component, OnInit, NgZone } from '@angular/core';
import { Platform, LoadingController } from '@ionic/angular';
import { ILoginInfo } from './ILoginInfo';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'src/environments/environment';
import { HTTP } from '@ionic-native/http/ngx';
import { Router } from '@angular/router';
import { StorageService } from '../storage/storage.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss']
})
export class LoginPage implements OnInit {
  private loginInfo: ILoginInfo;
  public error: string;
  public password: string;
  public host: string;
  public ssl = true;

  constructor(
    private platform: Platform,
    private loadingController: LoadingController,
    private translate: TranslateService,
    private zone: NgZone,
    private http: HTTP,
    private router: Router,
    private storage: StorageService
  ) {}

  ngOnInit() {
    this.platform.ready().then(() => {
      const loginInfo = this.storage.getLoginInfo();

      if (loginInfo) {
        this.loginInfo = loginInfo;
        this.login();
      }
    });
  }

  submit() {
    const protocol = this.ssl ? 'https' : 'http';

    this.loginInfo = {
      server: `${protocol}://${this.host}`,
      auth: btoa(`${environment.user}:${this.password}`),
      serverName: ''
    };

    this.login();
  }

  async login() {
    const texts = await this.translate.get(['LOGIN.LOADING', 'LOGIN.SERVER_NOT_FOUND', 'LOGIN.WRONG_PASSWORD']).toPromise();
    const loading = await this.loadingController.create({
      message: texts['LOGIN.LOADING']
    });
    const timeout = setTimeout(() => loading.dismiss(), environment.unRaidTimeout);
    await loading.present();
    loading.onWillDismiss().then(() => clearTimeout(timeout));

    this.http
      .get(
        `${this.loginInfo.server}/Dashboard`,
        {},
        {
          Authorization: `Basic ${this.loginInfo.auth}`
        }
      )
      .then(data => data.data.match(/<title>([^\/]+)\//)[1])
      .then(serverName => {
        this.loginInfo.serverName = serverName;
        this.storage.setLoginInfo(this.loginInfo);
      })
      .then(() => loading.dismiss())
      .then(() => this.router.navigate(['home']))
      .catch(e => {
        loading.dismiss();

        this.zone.run(() => {
          switch (e.status) {
            case 401:
              this.error = texts['LOGIN.WRONG_PASSWORD'];
              break;
            case 404:
              this.error = texts['LOGIN.SERVER_NOT_FOUND'];
              break;
            default:
              this.error = e.error;
          }
        });
      });
  }
}
