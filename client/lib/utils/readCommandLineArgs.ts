import * as YargsParser from 'yargs-parser';

export function readCommandLineArgs(): any {
  const data = YargsParser(process.argv);
  delete data._;
  return data;
}
