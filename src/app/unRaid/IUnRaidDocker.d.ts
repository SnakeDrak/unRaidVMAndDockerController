import { UnRaidDockerState } from './UnRaidDockerState';

interface IUnRaidDocker {
  id: string;
  name: string;
  state: UnRaidDockerState;
  is_loading: boolean;
  type: 'Docker';
  timeout?: any;
}
