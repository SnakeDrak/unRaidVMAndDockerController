import { UnRaidVMState } from './UnRaidVMState';

export interface IUnRaidVMActionResponse {
  error?: string;
  success?: boolean;
  state?: UnRaidVMState;
}
