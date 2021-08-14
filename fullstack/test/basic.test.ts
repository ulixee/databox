import { Helpers } from '@ulixee/databox-testing';

afterAll(Helpers.afterAll);
afterEach(Helpers.afterEach);

describe('basic Full Client tests', () => {
  it('receives DataboxMeta', async () => {
    const databox = await Helpers.createFullstackDatabox();
    const meta = await databox.meta;
    expect(meta.sessionId).toBeTruthy();
    await databox.close();
  });
});
