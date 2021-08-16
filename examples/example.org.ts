import Hero from '@ulixee/hero';
import Databox from '@ulixee/databox';

// configure input.url by running as node example.org.js --input.url="https://ulixee.org"

export default new Databox(async databox => {
  const { input } = databox;
  input.url ??= 'https://example.org';

  const hero = new Hero(databox);
  await hero.goto(input.url);
  const title = await hero.document.title;
  console.log(`LOADED ${input.url}: ${title}`);
  await hero.close();
});
