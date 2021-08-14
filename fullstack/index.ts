import '@ulixee/commons/lib/SourceMapSupport';
import Core from '@ulixee/databox-core';
import ShutdownHandler from '@ulixee/commons/lib/ShutdownHandler';
import DataboxPackage from './lib/DataboxPackage';

ShutdownHandler.exitOnSignal = false;

Core.start().catch(error => {
  console.log('ERROR starting Core within Fullstack', error); // eslint-disable-line no-console
});

export {
  Core,
};

export default DataboxPackage;
