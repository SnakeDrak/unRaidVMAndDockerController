import { UnRaidVMState } from './UnRaidVMState';
import { TimeoutError } from 'rxjs';

interface IUnRaidVM {
  id: string;
  name: string;
  state: UnRaidVMState;
  is_loading: boolean;
  type: 'VM';
  timeout?: any;
}
