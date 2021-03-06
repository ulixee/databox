import RunningDatabox from '../lib/RunningDatabox';

export default interface IComponents {
  scriptFn: IScriptFn;
  schema?: any;
}

export type IScriptFn = (databox: RunningDatabox) => void | Promise<void>;
