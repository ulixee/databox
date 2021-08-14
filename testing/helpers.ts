import { CanceledPromiseError } from '@ulixee/commons/interfaces/IPendingWaitEvent';
import DataboxPackage from '@ulixee/databox/lib/DataboxPackage';
import DataboxActive from '@ulixee/databox/lib/DataboxActive';
import IDataboxRunOptions from '@ulixee/databox/interfaces/IDataboxRunOptions';
import FullstackDataboxPackage from '@ulixee/databox-fullstack';

export const needsClosing: { close: () => Promise<any> | void; onlyCloseOnFinal?: boolean }[] = [];

export function afterEach(): Promise<void> {
  return closeAll(false);
}

export async function afterAll(): Promise<void> {
  await closeAll(true);
}

async function closeAll(isFinal = false): Promise<void> {
  const closeList = [...needsClosing];
  needsClosing.length = 0;

  await Promise.all(
    closeList.map(async (toClose, i) => {
      if (!toClose.close) {
        // eslint-disable-next-line no-console
        console.log('Error closing', { closeIndex: i });
        return;
      }
      if (toClose.onlyCloseOnFinal && !isFinal) {
        needsClosing.push(toClose);
        return;
      }

      try {
        await toClose.close();
      } catch (err) {
        if (err instanceof CanceledPromiseError) return;
        // eslint-disable-next-line no-console
        console.log('Error shutting down', err);
      }
    }),
  );
}

export async function createClientDatabox(options: IDataboxRunOptions = {}): Promise<DataboxActive> {
  const databox = await DataboxPackage.createDataboxActive(options);
  needsClosing.push(databox);
  return databox;
}

export async function createFullstackDatabox(options: IDataboxRunOptions = {}): Promise<DataboxActive> {
  const databox = await FullstackDataboxPackage.createDataboxActive(options);
  needsClosing.push(databox);
  return databox;
}

export function onClose(closeFn: (() => Promise<any>) | (() => any), onlyCloseOnFinal = false) {
  needsClosing.push({ close: closeFn, onlyCloseOnFinal });
}

