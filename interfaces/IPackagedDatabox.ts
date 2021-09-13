import { IDataboxRunOptions } from './IDataboxRunOptions';

export interface IPackagedDatabox {
  run(options?: IDataboxRunOptions): Promise<void>;
}
