import type Hero from '@ulixee/hero';
import type IHeroCreateOptions from '@ulixee/hero/interfaces/IHeroCreateOptions';
import RunningDatabox from '../RunningDatabox';

// This is our integration hook between Hero and Databox

let HeroConstructor;

try {
  // eslint-disable-next-line global-require,import/no-extraneous-dependencies
  HeroConstructor = require('@ulixee/hero').default;
} catch (error) {
  // do nothing
}

if (HeroConstructor) {
  HeroConstructor.on('new', (hero: Hero, options: IHeroCreateOptions) => {
    const possibleDatabox = options.databox || (options as RunningDatabox);
    delete options.databox;
    const databox: RunningDatabox =
      possibleDatabox?.constructor.name === RunningDatabox.name ? possibleDatabox : null;
    if (!databox) return;

    if (!options.connectionToCore) {
      options.connectionToCore = { host: databox.host };
    }

    hero.on('command', (command, commandId) => {
      databox.lastExternalId = commandId;
    });
  });
}
