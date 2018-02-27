import path from 'path';
import chokidar from 'chokidar';
import { writeFile, copyFile, makeDir, copyDir, cleanDir, renameFile } from './lib/fs';
import pkg from '../package.json';
import { format } from './run';
import rimraf from 'rimraf';


/**
 * Copies static files such as robots.txt, favicon.ico to the
 * output (build) folder.
 */
async function afterBundle() {
  await Promise.all([
    // writeFile(
    //   'dist/package.json',
    //   JSON.stringify(
    //     {
    //       private: true,
    //       main: 'main.js'
    //     },
    //     null,
    //     2,
    //   ),
    // ),
    renameFile('dist/main-bundle.js', 'dist/main.js'),
    renameFile('dist/renderer-bundle.js', 'dist/front/renderer-bundle.js'),
    rimraf('dist/front/src', () => {
      console.log('src dltd');
    }),
  ]);

  if (process.argv.includes('--watch')) {
    const watcher = chokidar.watch(['public/**/*'], { ignoreInitial: true });

    watcher.on('all', async (event, filePath) => {
      const start = new Date();
      const src = path.relative('./', filePath);
      const dist = path.join(
        'build/',
        src.startsWith('src') ? path.relative('src', src) : src,
      );
      switch (event) {
        case 'add':
        case 'change':
          await makeDir(path.dirname(dist));
          await copyFile(filePath, dist);
          break;
        case 'unlink':
        case 'unlinkDir':
          cleanDir(dist, { nosort: true, dot: true });
          break;
        default:
          return;
      }
      const end = new Date();
      const time = end.getTime() - start.getTime();
      console.info(`[${format(end)}] ${event} '${dist}' after ${time} ms`);
    });
  }
}

export default afterBundle;
