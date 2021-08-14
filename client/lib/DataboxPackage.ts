import './utils/heroHook';
import readCommandLineArgs from './utils/readCommandLineArgs';
import DataboxActive from './DataboxActive';
import IComponents, { IScriptFn } from '../interfaces/IComponents';
import ConnectionManager from './ConnectionManager';
import IDataboxRunOptions from '../interfaces/IDataboxRunOptions';
import { ICreateConnectionToCoreFn } from '../connections/ConnectionFactory';
import loadUlixeeConfig from './utils/loadUlixeeConfig';

export default class DataboxPackage {
  public static createConnectionToCoreFn: ICreateConnectionToCoreFn;
  public databoxActive: DataboxActive;

  #components: IComponents;

  constructor(scriptFn: IScriptFn, otherComponents: Omit<IComponents, 'scriptFn'> = {}) {
    this.#components = {
      scriptFn,
      ...otherComponents,
    }
    if (process.env.DATABOX_RUN_LATER) return;

    const params = readCommandLineArgs();
    const options: IDataboxRunOptions = { params };
    const ulixeeConfig = loadUlixeeConfig();
    if (ulixeeConfig.serverHost) {
      options.connectionToCore = { host: ulixeeConfig.serverHost };
    }

    this.run(options).catch(error => {
      console.log(`ERROR running databox: `, error)
    });
  }

  public async run(options: IDataboxRunOptions = {}): Promise<void> {
    const { createDataboxActive } = this.constructor as any
    this.databoxActive = await createDataboxActive.call(this, options);
    await this.#components.scriptFn(this.databoxActive);
    await this.databoxActive.close();
    this.databoxActive = undefined;
  }

  public static createDataboxActive(options: IDataboxRunOptions = {}): Promise<DataboxActive> {
    return new Promise<DataboxActive>(async (resolve, reject) => {
      try {
        const createConnectionToCoreFn = this.createConnectionToCoreFn;
        const connectionManager = new ConnectionManager({ createConnectionToCoreFn, ...options });
        await connectionManager.getConnectedCoreSessionOrReject();
        process.nextTick(() => {
          resolve(new DataboxActive(connectionManager, options));
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}
