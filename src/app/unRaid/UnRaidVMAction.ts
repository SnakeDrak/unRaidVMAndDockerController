export enum UnRaidVMAction {
  START = 'domain-start',
  STOP = 'domain-stop',
  FORCE_STOP = 'domain-destroy',
  RESTART = 'domain-restart',
  RESUME = 'domain-resume',
  PAUSE = 'domain-pause',
  RESUME_HIBERNATE = 'pmwakeup',
  HIBERNATE = 'domain-pmsuspend'
}
