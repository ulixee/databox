import Hero, { ConnectionToCore as ConnectionToHeroCore } from '@ulixee/hero';
import ICoreRequestPayload from '@ulixee/databox-interfaces/ICoreRequestPayload';
import ICoreResponsePayload from '@ulixee/databox-interfaces/ICoreResponsePayload';
import { Helpers } from '@ulixee/databox-testing';
import PackagedDatabox from '../index';
import ConnectionToDataboxCore from '../connections/ConnectionToCore';

afterAll(Helpers.afterAll);

class MockedConnectionToDataboxCore extends ConnectionToDataboxCore {
  public readonly outgoing = jest.fn(
    async ({ command }: ICoreRequestPayload): Promise<ICoreResponsePayload> => {
      if (command === 'Core.createSession') {
        return {
          data: { sessionId: 'session-id' },
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

class MockedConnectionToHeroCore extends ConnectionToHeroCore {
  public readonly outgoing = jest.fn(
    async ({ command }: ICoreRequestPayload): Promise<ICoreResponsePayload> => {
      if (command === 'Core.createSession') {
        return {
          data: { sessionId: 'session-id' },
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

describe('basic Databox+Hero tests', () => {
  it('waits until run method is explicitly called', async () => {
    process.env.DATABOX_RUN_LATER = 'true';
    let lastExternalId = 0;
    const connectionToDataboxCore = new MockedConnectionToDataboxCore();
    const connectionToHeroCore = new MockedConnectionToHeroCore();
    const packagedDatabox = new PackagedDatabox(async databox => {
      const hero = new Hero({ databox, connectionToCore: connectionToHeroCore });
      await hero.goto('https://news.ycombinator.org');
      await hero.close();
      lastExternalId = databox.lastExternalId;
    });
    await packagedDatabox.run({ connectionToCore: connectionToDataboxCore });
    expect(lastExternalId).toBe(2);

    const outgoingDataboxCommands = connectionToDataboxCore.outgoing.mock.calls;
    expect(outgoingDataboxCommands.map(c => c[0].command)).toMatchObject([
      'Core.connect',
      'Core.createSession',
      'Session.close',
    ]);

    const outgoingHeroCommands = connectionToHeroCore.outgoing.mock.calls;
    expect(outgoingHeroCommands.map(c => c[0].command)).toMatchObject([
      'Core.connect',
      'Core.createSession',
      'Tab.goto',
      'Session.close',
    ]);
  });

  it('should call close on hero automatically', async () => {
    process.env.DATABOX_RUN_LATER = 'true';
    const connectionToDataboxCore = new MockedConnectionToDataboxCore();
    const connectionToHeroCore = new MockedConnectionToHeroCore();
    const packagedDatabox = new PackagedDatabox(async databox => {
      const hero = new Hero({ databox, connectionToCore: connectionToHeroCore });
      await hero.goto('https://news.ycombinator.org');
    });
    await packagedDatabox.run({ connectionToCore: connectionToDataboxCore });

    const outgoingHeroCommands = connectionToHeroCore.outgoing.mock.calls;
    expect(outgoingHeroCommands.map(c => c[0].command)).toMatchObject([
      'Core.connect',
      'Core.createSession',
      'Tab.goto',
      'Session.close',
    ]);
  });

  it('should emit close hero on error', async () => {
    process.env.DATABOX_RUN_LATER = 'true';
    const connectionToDataboxCore = new MockedConnectionToDataboxCore();
    const connectionToHeroCore = new MockedConnectionToHeroCore();
    const packagedDatabox = new PackagedDatabox(async databox => {
      const hero = new Hero({ databox, connectionToCore: connectionToHeroCore });
      await hero.goto('https://news.ycombinator.org').then(() => {
        throw new Error('test');
      });

      await hero.interact('click');
    });

    await expect(
      packagedDatabox.run({ connectionToCore: connectionToDataboxCore }),
    ).rejects.toThrowError();

    const outgoingHeroCommands = connectionToHeroCore.outgoing.mock.calls;
    expect(outgoingHeroCommands.map(c => c[0].command)).toMatchObject([
      'Core.connect',
      'Core.createSession',
      'Tab.goto',
      'Session.close',
    ]);
  });

  it.skip('should pass host from Databox to Hero', async () => {
    // ToDo
  });
});
