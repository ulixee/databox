// eslint-disable-next-line import/no-extraneous-dependencies,import/no-self-import
const copyfiles = require('copyfiles');
const pkg = require('./package.json');

const copyToDir = process.env.OUT_DIR;
const isStandardBuild = copyToDir === 'build';
const workspaces =
  pkg.workspaces?.packages.map(x => x.replace('/*', '')).filter(x => !x.startsWith('../')) || [];

const copyArgs = [
  '-e "node_modules"',
  'package*.json',
  'examples/*.js',
  'examples/*.mjs',
  '.*ignore',
];
if (isStandardBuild) {
  copyArgs.push('testing/*/**', 'yarn.lock');
}

for (const workspace of workspaces) {
  copyArgs.push(
    `${workspace}/*.cjs`,
    `${workspace}/*.mjs`,
    `${workspace}/**/.*ignore`,
    `${workspace}/**/*.sh`,
  );
}

if (isStandardBuild) copyArgs.push('-a');

copyfiles([...copyArgs, copyToDir], {}, () => {
  // eslint-disable-next-line no-console
  console.log('Files Copied');
});
