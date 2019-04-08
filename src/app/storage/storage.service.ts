import { Injectable } from '@angular/core';
import { ILoginInfo } from '../login/ILoginInfo';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  constructor() {}

  getLoginInfo(): ILoginInfo | null {
    const loginInfo = localStorage.getItem('loginInfo');

    if (loginInfo) {
      return JSON.parse(loginInfo);
    }

    return null;
  }

  setLoginInfo(loginInfo: ILoginInfo) {
    localStorage.setItem('loginInfo', JSON.stringify(loginInfo));
  }
}
