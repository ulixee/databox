import * as Fs from 'fs';

export default function loadUlixeeConfig(): IConfig {
  let config;
  config = config || tryLoad(`${process.cwd()}/ulixee.json`);
  if (require.main) {
    config = config || tryLoad(`${require.main.path}/ulixee.json`);
  }
  return config || {};
}

function tryLoad(path: string): IConfig | void {
  if (!Fs.existsSync(path)) return;
  return JSON.parse(Fs.readFileSync(path, 'utf-8')) as IConfig;
}

interface IConfig {
  serverHost?: string;
}
