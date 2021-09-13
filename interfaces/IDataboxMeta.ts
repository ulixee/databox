import { ISessionCreateOptions } from './ISessionCreateOptions';

export interface IDataboxMeta extends Omit<Required<ISessionCreateOptions>, 'scriptInstanceMeta'> {
  sessionId: string;
}
