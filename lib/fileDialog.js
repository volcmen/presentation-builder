import { dialog, BrowserWindow } from 'electron';

const filters = {
  css: {
    name: 'Css',
    extensions: ['css'],
  },

  img: {
    name: 'Images',
    extensions: ['jpg', 'jpeg', 'png', 'svg', 'gif'],
  },

  video: {
    name: 'Video',
    extensions: ['avi', 'mp4', 'mpg', 'mpeg'],
  },
};

const getFilePath = (fileType) => {
  // console.log('pippo ', filters[fileType]);
  const files = dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openFile'],
    filters: [filters[fileType]],
  });

  if (!files) return Promise.reject();

  return Promise.resolve({ filePath: files[0] });
};

export default getFilePath;
