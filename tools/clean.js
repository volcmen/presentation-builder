import { cleanDir } from './lib/fs';

/**
 * Cleans up the output (build) directory.
 */
function clean() {
  return Promise.all([
    cleanDir('dist/*', {
      nosort: true,
      dot: true
    }),
  ]);
}

export default clean;
