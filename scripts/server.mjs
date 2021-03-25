import { readFileSync, existsSync } from 'fs';
import { ChildObserver } from './child-nodemon.mjs';


(() => {

  const [ ,, ...args ] = process.argv;

  const watchMode = args.includes('watch');

  let version;
  try {

    ({ version } = JSON.parse(readFileSync('./projects/server/package.json').toString('utf8')));

  } catch {

    console.error('failed to read `package.json` from `projects/server`');

    return;
  }

  if (!version) {

    throw new Error('`version` not specified at `projects/server/package.json`');
  }

  for (const bundle of [ 'api', 'ng' ]) {
    const bundlePath = `./projects/server/dist/${ version }/${ bundle }.js`;

    if (existsSync(bundlePath)) {
      
      const observer = new ChildObserver(bundlePath, watchMode);

      process.on('exit', () => observer.destroy());

    } else {

      console.warn(`bundle \`${ bundle }.js\` does not exists`);

    }

  }

})();
