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
    const databox = options instanceof RunningDatabox ? options : options.databox;
    if (!databox) return;

    delete options.databox;

    if (databox.queryOptions) {
      for (const [key, value] of Object.entries(databox.queryOptions)) {
        if (!options[key]) options[key] = value;
      }
    }

    if (!options.connectionToCore) {
      options.connectionToCore = { host: databox.host };
    }

    if (!(options instanceof RunningDatabox)) {
      // align session ids to make easier to find
      options.sessionId = databox.sessionId;
    }

    options.externalIds ??= {};
    options.externalIds.databoxSessionId = databox.sessionId;

    hero.on('command', (command, commandId) => {
      databox.lastExternalId = commandId;
    });

    databox.on('close', () => hero.close());
    databox.on('error', () => hero.close());
  });
}
