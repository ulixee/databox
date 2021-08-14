import ISessionCreateOptions from '@ulixee/databox-interfaces/ISessionCreateOptions';
import ConnectionToCore from '../connections/ConnectionToCore';
import IConnectionToCoreOptions from './IConnectionToCoreOptions';

export default interface IDataboxRunOptions
  extends Partial<
    Omit<ISessionCreateOptions, 'scriptInstanceMeta'>
  > {
  connectionToCore?: IConnectionToCoreOptions | ConnectionToCore;
  action?: string;
  params?: {};
  fields?: {};
}
