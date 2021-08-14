import DataboxActive from '../lib/DataboxActive';

export default interface IComponents {
  scriptFn: IScriptFn;
  schema?: any;
}

export type IScriptFn = (databox: DataboxActive) => void | Promise<void>;
