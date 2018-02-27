import { app, BrowserWindow } from 'electron';

import { open, save, saveMd, saveCurrentMd, getRemediConfig, saveRemediConfig, getFilesList, deleteFiles, copyFile } from './file';
import getFilePath from './fileDialog';
import { loadLabels, loadLabelsSync } from './labels';

const path = require('path');

// const menu = require('./menu');
// const theme = require('./theme');

let previewWin;

app.on('ready', () => {
  console.log('The application is ready.');

  let mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    icon: path.join(__dirname, 'images', 'favicon.ico'),
  });

  mainWindow.loadURL(`file://${path.join(__dirname, 'front', 'index.html')}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});

function openPreviewWin(content) {
  // if (previewWin) { //refresh
  // 	previewWin.webContents.send('refresh', content, configuration.get(), theme.get());
  // 	return;
  // }
  return new Promise((resolve, reject) => {
    previewWin = new BrowserWindow({
      width: 600,
      height: 600,
      // autoHideMenuBar: true,
      center: true,
      show: false,
      icon: path.join(__dirname, 'images', 'favicon.ico'),
      webPreferences: {
        devTools: true,
      },
    });

    previewWin.setMenuBarVisibility(false);
    // previewWin.webContents.openDevTools()
    previewWin.loadURL(`file://${path.join(__dirname, 'preview', 'preview.html')}`);

    previewWin.once('ready-to-show', () => {
      // previewWin.webContents.send('init', content, configuration.get(), theme.get())
      previewWin.show();

      resolve(previewWin);
    });

    // previewWin.on('closed', () => {
    // 	previewWin = null;
    // });
  });
}

module.exports = {
  openFile: open,
  saveProject: save,
  saveMd,
  saveCurrentMd,
  getFilePath,
  getRemediConfig,
  saveRemediConfig,
  getThemesList: () => getFilesList({ path: 'front/skins', extension: '.css' }),
  getLanguagesList: () => getFilesList({ path: 'i18n', extension: '.json' }),
  getCustomThemesList: () => getFilesList({ path: 'customThemes', extension: '.css' }),
  delCustomTheme: theme => deleteFiles([path.join(__dirname, 'customThemes', `${theme}.css`)]),
  loadCustomTheme: newThemePath => copyFile(newThemePath, path.join(__dirname, 'customThemes', path.basename(newThemePath))),
  loadLabels,
  loadLabelsSync,
  openPreviewWin,

  // refreshPreview: menu.openPreview,
};
