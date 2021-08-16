import Log from '@ulixee/commons/lib/Logger';
import IConnectionToCoreOptions from '@ulixee/databox-interfaces/IConnectionToCoreOptions';
import IConnectionToCore from '@ulixee/databox-interfaces/IConnectionToCore';
import ConnectionToCore from './ConnectionToCore';
import ConnectionToRemoteCoreServer from './ConnectionToRemoteCoreServer';

const { log } = Log(module);

export type ICreateConnectionToCoreFn = (options: IConnectionToCoreOptions) => ConnectionToCore;

export default class ConnectionFactory {

  public static createConnection(
    options: IConnectionToCoreOptions | IConnectionToCore,
    overrideCreateConnectionToCoreFn?: ICreateConnectionToCoreFn,
  ): ConnectionToCore {
    if (options instanceof ConnectionToCore) {
      // NOTE: don't run connect on an instance
      return options;
    }

    options = options as IConnectionToCoreOptions;
    let connection: ConnectionToCore;
    if (overrideCreateConnectionToCoreFn) {
      connection = overrideCreateConnectionToCoreFn(options);
    } else if (options.host) {
      connection = new ConnectionToRemoteCoreServer(options);
    } else {
      throw new Error(
        'Databox Core could not be found locally' +
        '\n' +
        'If you meant to connect to a remote host, include the "host" parameter for your connection'
      );
    }

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    const onError = (error: Error) => {
      if (error) {
        log.error('Error connecting to core', {
          error,
          sessionId: null,
        });
      }
    };

    connection.connect().then(onError).catch(onError);

    return connection;
  }
}
