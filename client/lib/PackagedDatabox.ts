import IDataboxRunOptions from '@ulixee/databox-interfaces/IDataboxRunOptions';
import IPackagedDatabox from '@ulixee/databox-interfaces/IPackagedDatabox';
import readCommandLineArgs from './utils/readCommandLineArgs';
import RunningDatabox from './RunningDatabox';
import IComponents, { IScriptFn } from '../interfaces/IComponents';
import ConnectionManager from './ConnectionManager';
import { ICreateConnectionToCoreFn } from '../connections/ConnectionFactory';
import UlixeeConfig from '@ulixee/commons/config';

export default class PackagedDatabox implements IPackagedDatabox {
  public static createConnectionToCoreFn: ICreateConnectionToCoreFn;
  public runningDatabox: RunningDatabox;

  #components: IComponents;

  constructor(scriptFn: IScriptFn, otherComponents: Omit<IComponents, 'scriptFn'> = {}) {
    this.#components = {
      scriptFn,
      ...otherComponents,
    };
    if (process.env.DATABOX_RUN_LATER) return;

    const options: IDataboxRunOptions = readCommandLineArgs();
    const serverHost = UlixeeConfig.load()?.serverHost ?? UlixeeConfig.global.serverHost;
    if (serverHost) {
      options.connectionToCore = { host: serverHost };
    }

    this.run(options).catch(error => {
      // eslint-disable-next-line no-console
      console.error(`ERROR running databox: `, error);
    });
  }

  public async run(options: IDataboxRunOptions = {}): Promise<void> {
    const { createRunningDatabox } = this.constructor as typeof PackagedDatabox;
    try {
      this.runningDatabox = await createRunningDatabox.call(
        this,
        options,
        this.createRunningDataboxFn.bind(this),
      );
      await this.runScript();
      return this.runningDatabox.output;
    } catch (error) {
      this.runningDatabox?.emit('error', error);
      throw error;
    } finally {
      await this.runningDatabox?.close();
      this.runningDatabox = undefined;
    }
  }

  protected async runScript(): Promise<void> {
    await this.#components.scriptFn(this.runningDatabox);
  }

  protected createRunningDataboxFn(
    connectionManager: ConnectionManager,
    options: IDataboxRunOptions,
  ): Promise<RunningDatabox> {
    return Promise.resolve(new RunningDatabox(connectionManager, options));
  }

  public static async createRunningDatabox(
    options: IDataboxRunOptions = {},
    createRunningDataboxFn?: (
      connectionManager: ConnectionManager,
      options: IDataboxRunOptions,
    ) => Promise<RunningDatabox>,
  ): Promise<RunningDatabox> {
    const createConnectionToCoreFn = this.createConnectionToCoreFn;
    const connectionManager = new ConnectionManager({ createConnectionToCoreFn, ...options });
    await connectionManager.getConnectedCoreSessionOrReject();
    await new Promise(process.nextTick);
    return createRunningDataboxFn
      ? await createRunningDataboxFn(connectionManager, options)
      : new RunningDatabox(connectionManager, options);
  }
}
