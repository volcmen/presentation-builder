import fs from 'fs-extra';
import { dialog, app, BrowserWindow } from 'electron';
import { getMediaFiles, replaceAbsoluteMediaPathWithRelativeInHtml, replaceAbsoluteMediaPathWithRelativeInMd, replaceRelativeMediaPathWithAbsoluteInMd } from './pathHelpers';

const path = require('path');

const templatePath = path.join(__dirname, 'template.html');

const open = (filePath) => {
  let file = filePath;

  if (!file) {
    const win = BrowserWindow.getFocusedWindow();

    const files = dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [
        {
          name: 'Markdown Files',
          extensions: ['md', 'markdown', 'txt'],
        },
      ],
    });

    if (!files) return;

    file = files[0];
  }

  const readConf = new Promise((resolve, reject) => {
    fs.readFile(path.join(path.dirname(file), 'configuration.json'), 'utf8', (err, data) => {
      if (err) resolve({ configuration: null });
      else resolve({ configuration: JSON.parse(data) });
    });
  });

  const readRemedi = new Promise((resolve, reject) => {
    fs.readFile(path.join(path.dirname(file), 'remedi.json'), 'utf8', (err, data) => {
      if (err) resolve({ remedi: null });
      else resolve({ remedi: JSON.parse(data) });
    });
  });

  const readCustomCss = new Promise((resolve, reject) => {
    fs.readFile(path.join(path.dirname(file), 'css', 'custom.css'), 'utf8', (err, data) => {
      if (err) resolve({ customCss: '' });
      else resolve({ customCss: data });
    });
  });

  const readFile = new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, data) => {
      if (err) reject(err);
      else {
        app.addRecentDocument(file);
        const absolutePath = path.dirname(file);
        const dataWithReplacedPaths = replaceRelativeMediaPathWithAbsoluteInMd(data, absolutePath);
        resolve({ fileName: file, content: dataWithReplacedPaths });
      }
    });
  });

	return Promise.all([readRemedi, readConf, readCustomCss, readFile]); // eslint-disable-line
};

const writeFilePromise = (filePath, content) =>
  new Promise((resolve, reject) => {
    fs.ensureDir(path.dirname(filePath), (err) => {
      if (err) reject(err);

      fs.writeFile(filePath, content, (error) => {
        if (error) reject(error);
        else resolve(filePath);
      });
    });
  });

const copyFilePromise = (oldPath, newPath) =>
  new Promise((resolve, reject) => {
    fs.copy(oldPath, newPath, (err) => {
      if (err)
      // console.log('COPY FILE ERROR: ', err);
        reject(err);
      else
      // console.log('COPY FILE OK: ', newPath);
        resolve({
          filePath: newPath,
          fileName: path.basename(newPath, '.css'),
        });
    });
  });

const save = (options) => {
  let { html } = options;
  const md = options.md || null;
  const withDependecies = options.withDependencies;
  const { conf } = options;
  const { theme } = options;
  const { isCustomTheme } = options;
  const customCss = options.customCss || '';
  const fileName =
		options.fileName ||
		dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), {
		  title: withDependecies ? 'Save project' : 'Save HTML Output',
		  defaultPath: app.getPath('documents'),
		  filters: [
		    {
		      name: 'HTML Files',
		      extensions: ['html'],
		    },
		  ],
		});

  if (!fileName) return;

  return new Promise((resolve, reject) => {
		// eslint-disable-line
    fs.readFile(templatePath, 'utf8', (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  }).then((data) => {
    let filesToSave = [];

    if (withDependecies) {
      const mediaFiles = getMediaFiles(md);

      if (conf.parallaxBackgroundImage && conf.parallaxBackgroundImage.length)
        conf.parallaxBackgroundImage = conf.parallaxBackgroundImage.replace(/(?:.*[\\/])?([\w ]+\.\w+)/, 'media/$1');

      // Save configuraton
      filesToSave.push(writeFilePromise(path.join(path.dirname(fileName), 'configuration.json'), JSON.stringify(conf)));

      // Save custom css
      filesToSave.push(writeFilePromise(path.join(path.dirname(fileName), 'css', 'custom.css'), customCss));

      // Copy custom themes
      filesToSave.push(copyFilePromise(path.join(path.resolve(__dirname), 'customThemes'), path.join(path.dirname(fileName), 'css/customThemes')));

      // Save REMEDI info file
      filesToSave.push(writeFilePromise(
        path.join(path.dirname(fileName), 'remedi.json'),
        JSON.stringify({
          theme,
          isCustomTheme,
        }),
      ));

      // save dependecies
      filesToSave = filesToSave.concat([
        'lib/js/classList.js',
        'plugin/highlight/highlight.js',
        'plugin/zoom-js/zoom.js',
        'plugin/notes/notes.js',
        'plugin/notes/notes.html',
        'lib/js/html5shiv.js',
        'lib/css/zenburn.css',
        'lib/js/head.min.js',
        'js/reveal.js',
        'lib/font',
        'css',
      ].map(file => copyFilePromise(path.join(path.resolve(__dirname, 'jsLib'), 'reveal.js', file), path.join(path.dirname(fileName), file))));

      // Save media files
      if (conf.parallaxBackgroundImage && conf.parallaxBackgroundImage.length) mediaFiles.push(conf.parallaxBackgroundImage);

      if (mediaFiles.length) filesToSave = filesToSave.concat(mediaFiles.map(file => copyFilePromise(file, path.join(path.dirname(fileName), 'media', path.basename(file)))));

      html = replaceAbsoluteMediaPathWithRelativeInHtml(html);
    }

    const templateHtml = data;
    const configurationToSave = JSON.stringify(conf);
    const themePath = isCustomTheme ? 'customThemes' : 'theme';

    const finalHtml = templateHtml
      .replace('<!--[CONTENT]-->', html)
      .replace('<!--[CONFIGURATION]-->', configurationToSave)
      .replace('<!--[THEME_PATH]-->', themePath)
      .replace('<!--[THEME]-->', theme);

    // save html
    filesToSave.push(writeFilePromise(fileName, finalHtml));

    // save markdown
    if (md) {
      const mdWithRelativePath = replaceAbsoluteMediaPathWithRelativeInMd(md);
      filesToSave.push(writeFilePromise(path.join(path.dirname(fileName), path.basename(fileName).replace(/\.\w{3,4}/, '.md')), mdWithRelativePath));
    }

    return Promise.all(filesToSave);
  });
};

const saveMd = (content) => {
  const fileName = dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), {
    title: 'Save Markdown Source',
    defaultPath: app.getPath('documents'),
    filters: [
      {
        name: 'MD Files',
        extensions: ['md'],
      },
    ],
  });

  if (!fileName) return;

	return writeFilePromise(fileName, content); // eslint-disable-line
};

const saveCurrentMd = (content, fileName) => {
  if (!fileName) return;

	return writeFilePromise(fileName, content); // eslint-disable-line
};

const deleteFiles = (files) => {
  const deletePromises = files.map(file =>
    new Promise((resolve, reject) => {
      fs.remove(file, (err) => {
        if (err) reject(err);
        else resolve();
      });
    }));

  return Promise.all(deletePromises);
};

const getFilesList = options =>
  new Promise((resolve, reject) => {
    fs.readdir(path.join(__dirname, options.path), (err, files) => {
      if (err) reject(err);
      else resolve(files.filter(file => fs.statSync(path.join(__dirname, options.path, file)).isFile()).map(fileName => path.basename(fileName, options.extension)));
    });
  });

const getRemediConfig = () =>
  new Promise((resolve, reject) => {
    fs.readFile(path.join(path.resolve(__dirname), 'config.json'), 'utf8', (err, data) => {
      if (err)
        resolve({
          currentColorScheme: 'dark',
          currentLanguage: 'en',
          recentFiles: [],
        });
      else resolve(JSON.parse(data));
    });
  });

const saveRemediConfig = newConf =>
  getRemediConfig().then((oldConf) => {
    const updatedConf = JSON.stringify(Object.assign({}, oldConf, newConf));

    fs.writeFile(path.join(path.resolve(__dirname), 'config.json'), updatedConf, (err) => {
      if (err)
      // console.log('WRITE FILE ERROR: ', err);
        return Promise.reject(err);
      return Promise.resolve();
    });
  });

const copyFile = () => {};

export { copyFile as copyFilePromise, deleteFiles, getFilesList, getRemediConfig, open, save, saveCurrentMd, saveMd, saveRemediConfig };
