import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';

export class DisconnectedFromCoreError extends CanceledPromiseError {
  public code = 'DisconnectedFromCore';
  constructor(readonly coreHost: string) {
    super(`This Databox has been disconnected from Core (coreHost: ${coreHost})`);
    this.name = 'DisconnectedFromCore';
  }
}
