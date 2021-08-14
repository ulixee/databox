import ICoreRequestPayload from '@ulixee/databox-interfaces/ICoreRequestPayload';
import ICoreResponsePayload from '@ulixee/databox-interfaces/ICoreResponsePayload';
import { Helpers } from '@ulixee/databox-testing';
import DataboxPackage from '../index';
import ConnectionToCore from '../connections/ConnectionToCore';
import readCommandLineArgs from '../lib/utils/readCommandLineArgs';
import IConnectionToCoreOptions from '../interfaces/IConnectionToCoreOptions';

afterAll(Helpers.afterAll);

class MockedConnectionToCore extends ConnectionToCore {
  public readonly outgoing = jest.fn(
    async ({ command }: ICoreRequestPayload): Promise<ICoreResponsePayload> => {
      if (command === 'Session.create') {
        return {
          data: { sessionId: 'session-id', sessionsDataLocation: '' },
        };
      }
    },
  );

  async internalSendRequest(payload: ICoreRequestPayload): Promise<void> {
    const response = await this.outgoing(payload);
    this.onMessage({
      responseId: payload.messageId,
      data: response?.data ?? {},
      ...(response ?? {}),
    });
  }

  protected createConnection = () => Promise.resolve(null);
  protected destroyConnection = () => Promise.resolve(null);
}

describe('basic Databox tests', () => {
  it('automatically runs and closes a databox', async () => {
    let connectionToCore: MockedConnectionToCore;
    class CustomDataboxPackage extends DataboxPackage {
      createConnectionToCoreFn() {
        connectionToCore = new MockedConnectionToCore();
        return connectionToCore;
      }
    }

    let databoxPackage;
    const ranScript = await new Promise(resolve => {
      // eslint-disable-next-line no-new
      databoxPackage = new CustomDataboxPackage(() => resolve(true));
    });
    await new Promise(resolve => process.nextTick(resolve));
    expect(ranScript).toBe(true);
    expect(databoxPackage.databoxActive.isClosing).toBe(true);
    await databoxPackage.databoxActive.close();

    const outgoingCommands = connectionToCore.outgoing.mock.calls;
    expect(outgoingCommands.map(c => c[0].command)).toMatchObject([
      'Core.connect',
      'Session.create',
      'Session.close',
      'Core.disconnect',
    ]);
  });

  it('waits until run method is explicitly called', async () => {
    process.env.DATABOX_RUN_LATER = 'true';
    let ranScript = false;
    const connectionToCore = new MockedConnectionToCore();
    const databoxPackage = new DataboxPackage(() => { ranScript = true });
    await databoxPackage.run({ connectionToCore });
    expect(ranScript).toBe(true);

    const outgoingCommands = connectionToCore.outgoing.mock.calls;
    expect(outgoingCommands.map(c => c[0].command)).toMatchObject([
      'Core.connect',
      'Session.create',
      'Session.close',
    ]);
  });

  it('can read command line args', async () => {
    process.argv[2] = '--input.city=Atlanta';
    process.argv[3] = '--input.state="GA"';
    process.argv[4] = '--input.address.number=9145';
    process.argv[5] = '--input.address.street="Street Street"';
    expect(readCommandLineArgs()).toEqual({
      city: 'Atlanta',
      state: 'GA',
      address: {
        number: '9145',
        street: 'Street Street',
      },
    });
  });
});
