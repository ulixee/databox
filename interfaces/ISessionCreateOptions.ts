import { IScriptInstanceMeta } from './IScriptInstanceMeta';

export interface ISessionCreateOptions {
  scriptInstanceMeta?: IScriptInstanceMeta;
  input?: { command?: string } & any;
}
