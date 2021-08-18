import Hero from '@ulixee/hero';
import Databox from '@ulixee/databox';

// configure input.url by running as node example.org.js --input.url="https://ulixee.org"

export default new Databox(async databox => {
  const { input, output } = databox;
  input.url ??= 'https://example.org';

  const hero = new Hero({
    showBrowser: true,
    databox,
  });

  await hero.goto(input.url);
  const title = await hero.document.title;

  output.title = title;
  output.body = await hero.document.body.textContent;
  console.log(`LOADED ${input.url}: ${title}`);
  await hero.close();
});
