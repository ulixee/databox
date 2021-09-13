import { IConnectionToCoreOptions } from '@ulixee/databox-interfaces/IConnectionToCoreOptions';
import type {} from '@ulixee/hero';
import { Observable } from './lib/ObjectObserver';
import { PackagedDatabox } from './lib/PackagedDatabox';
import { ConnectionToCore } from './connections/ConnectionToCore';
import { RunningDatabox } from './lib/RunningDatabox';

export { Observable, IConnectionToCoreOptions, ConnectionToCore };

declare module '@ulixee/hero' {
  export interface IHeroCreateOptions {
    databox?: RunningDatabox;
  }
}

export default PackagedDatabox;
