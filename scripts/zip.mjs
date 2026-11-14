// Zips the contents of dist/ (NOT the dist folder itself) so index.html
// sits at the root of the zip — that is what itch.io's HTML5 player expects.
import bestzip from 'bestzip';

await bestzip({ cwd: 'dist', source: '*', destination: '../era-runner.zip' });
console.log('Created era-runner.zip — upload it to itch.io as an HTML game.');
