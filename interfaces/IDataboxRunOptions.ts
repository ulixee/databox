import { ISessionCreateOptions } from './ISessionCreateOptions';
import { IConnectionToCore } from './IConnectionToCore';
import { IConnectionToCoreOptions } from './IConnectionToCoreOptions';

export interface IDataboxRunOptions
  extends Partial<Omit<ISessionCreateOptions, 'scriptInstanceMeta'>> {
  connectionToCore?: IConnectionToCoreOptions | IConnectionToCore;
  action?: string;
  input?: {};
  fields?: {};
}
