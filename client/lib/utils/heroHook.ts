import RunningDatabox from '../RunningDatabox';

// This is our integration hook between Hero and Databox

let Hero;

try {
  // eslint-disable-next-line global-require,import/no-extraneous-dependencies
  Hero = require('@ulixee/hero').default;
} catch (error) {
  // do nothing
}

if (Hero) {
  Hero.on('new', (hero: typeof Hero, options: any) => {
    const possibleDatabox = options.databox || options;
    delete options.databox;
    const databox: any = possibleDatabox?.constructor.name === RunningDatabox.name ? possibleDatabox : null;
    if (!databox) return;

    if (!options.connectionToCore) {
      options.connectionToCore = { host: databox.host };
    }

    hero.on('command', (command, commandId) => {
      databox.lastExternalId = commandId;
    });
  });
}
