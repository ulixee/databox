import { Helpers } from '@ulixee/databox-testing';
import Output from '@ulixee/databox/lib/Output';
import ReplayOutput from '@ulixee/databox-tools/lib/ReplayOutput';
import ObjectObserver from '@ulixee/databox/lib/ObjectObserver';

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic Replay API tests', () => {
  it('should be able to rebuild an output', async () => {
    const observable = new ObjectObserver(new Output());

    const clientOutput = observable.proxy;
    const replayOutput = new ReplayOutput();
    let id = 0;
    observable.onChanges = changes => {
      const changesToRecord = changes.map(change => ({
        type: change.type,
        value: JSON.stringify(change.value),
        path: JSON.stringify(change.path),
        lastCommandId: id,
        timestamp: new Date().getTime(),
      }));
      replayOutput.onOutput(changesToRecord);
    };

    clientOutput.test = 1;
    expect(replayOutput.getLatestOutput(id).output).toEqual(clientOutput.toJSON());

    id += 1;
    clientOutput.sub = { nested: true, str: 'test', num: 1 };
    expect(replayOutput.getLatestOutput(id).output).toEqual(clientOutput.toJSON());

    id += 1;
    delete clientOutput.sub.num;
    expect(replayOutput.getLatestOutput(id).output).toEqual(clientOutput.toJSON());

    id += 1;
    delete clientOutput.sub;
    delete clientOutput.test;
    expect(replayOutput.getLatestOutput(id).output).toEqual(clientOutput.toJSON());

    id += 1;
    clientOutput.array = [{ test: 1 }, { test: 2 }, { test: 3 }];
    expect(replayOutput.getLatestOutput(id).output).toEqual(clientOutput.toJSON());

    id += 1;
    clientOutput.array.splice(1, 1);
    expect(replayOutput.getLatestOutput(id).output).toEqual(clientOutput.toJSON());

    id += 1;
    clientOutput.array.push({ test: 0 });
    clientOutput.array.sort((a, b) => {
      return a.test - b.test;
    });
    expect(replayOutput.getLatestOutput(id).output).toEqual(clientOutput.toJSON());
  });
});
