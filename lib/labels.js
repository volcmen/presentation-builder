import fs from 'fs';
import path from 'path';

const loadLabels = (iso) => {
  const filePath = path.join(__dirname, 'i18n', `${iso}.json`);

  return new Promise((fullfill, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) reject(err);
      else fullfill(data);
    });
  }).then(data => JSON.parse(data));
};

const loadLabelsSync = (iso) => {
  const translations = fs.readFileSync(path.join('lib', 'locale', iso, 'ui.json'), 'utf8');

  if (!translations) return null;

  return JSON.parse(translations);
};

export { loadLabels, loadLabelsSync };
