// TODO: catch errors on promises & dispatch actions to trigger notifications display
import { remote, shell } from 'electron';
import path from 'path';
import {
  getHtml,
  getMd,
  getExportMedia,
  getCurrentFileName,
  getConfiguration,
  getRecentFiles,
  getCurrentTheme,
  getCustomCss,
  isCustomTheme,
  getNotificationDuration,
} from '../selectors';
import {
  mdChanged,
  mdLoaded,
  editorPosChanged,
  setConfiguration,
  setCustomCss,
  setTheme,
} from './actions';

const mainProcess = remote.require('./main');

function openFileSuccess(fileName) {
  return { type: 'OPEN_FILE_SUCCESS', fileName };
}

function openFileError(err) {
  return { type: 'OPEN_FILE_ERROR', err };
}

function openFileRequest() {
  return { type: 'OPEN_FILE_REQUEST' };
}

function openFileAborted() {
  return { type: 'OPEN_FILE_ABORTED' };
}

export function openFile(filePath) {
  return function (dispatch, getState) {
    dispatch(openFileRequest());

    const openFile = mainProcess.openFile(filePath);

    if (!openFile) return dispatch(openFileAborted());

    openFile
      .then(([
        { remedi },
        { configuration },
        { customCss },
        { fileName, content },
      ]) => {
        if (remedi && remedi.theme)
          dispatch(setTheme(
            remedi.theme,
            remedi.isCustomTheme,
            remedi.isCustomTheme
              ? `file:///${path.join(
                path.dirname(fileName),
                'css',
                'customThemes',
              )}`
              : null,
          ));

        dispatch(setCustomCss(customCss));
        dispatch(setConfiguration(configuration));
        dispatch(openFileSuccess(fileName));
        dispatch(mdLoaded(content));
        dispatch(editorPosChanged({ selectionStart: 0, selectionEnd: 0 }));

        const state = getState();
        const recentFiles = getRecentFiles(state);
        mainProcess.saveRemediConfig({ recentFiles });
      })
      .catch((err) => {
        dispatch(openFileError(err));
      });
  };
}

export function saveProject(saveThisProject = false) {
  return function (dispatch, getState) {
    dispatch({ type: 'SAVE_PROJECT_REQUEST' });

    const state = getState();

    const options = {
      html: getHtml(state),
      md: getMd(state),
      withDependencies: getExportMedia(state),
      conf: getConfiguration(state),
      theme: getCurrentTheme(state),
      isCustomTheme: isCustomTheme(state),
      customCss: getCustomCss(state),
    };

    if (saveThisProject)
      options.fileName = getCurrentFileName(state).replace(
        '.md',
        '.html',
      );

    mainProcess
      .saveProject(options)
      .then(() => {
        dispatch({ type: 'SAVE_PROJECT_SUCCESS' });
      })
      .catch(() => {
        dispatch({ type: 'SAVE_PROJECT_ERROR' });
      })
      .then(() => {
        setTimeout(() => {
          dispatch({ type: 'CLEAR_NOTIFICATIONS' });
        }, getNotificationDuration(state));
      });
  };
}

function saveMdRequest() {
  return { type: 'SAVE_MD_REQUEST' };
}

function saveMdSuccess(fileName) {
  return { type: 'SAVE_MD_SUCCESS', fileName };
}

function saveMdError() {
  return { type: 'SAVE_MD_ERROR' };
}

function saveMdAborted() {
  return { type: 'SAVE_MD_ABORTED' };
}

function saveMdCommon(dispatch, getState, current) {
  dispatch(saveMdRequest());

  const state = getState();

  const saveMd = current
    ? mainProcess.saveCurrentMd(getMd(state), getCurrentFileName(state))
    : mainProcess.saveMd(getMd(state));

  if (!saveMd) return dispatch(saveMdAborted());

  saveMd
    .then((fileName) => {
      dispatch(saveMdSuccess(fileName));
    })
    .catch(() => {
      dispatch(saveMdError());
    });
}

export function saveMd() {
  return function (dispatch, getState) {
    saveMdCommon(dispatch, getState, false);
  };
}

export function saveCurrentMd() {
  return function (dispatch, getState) {
    saveMdCommon(dispatch, getState, true);
  };
}

function saveHtmlRequest() {
  return { type: 'SAVE_HTML_REQUEST' };
}

function saveHtmlAborted() {
  return { type: 'SAVE_HTML_ABORTED' };
}

function saveHtmlSuccess() {
  return { type: 'SAVE_HTML_SUCCESS' };
}

function saveHtmlError() {
  return { type: 'SAVE_HTML_ERROR' };
}

export function saveHtml() {
  return function (dispatch, getState) {
    dispatch(saveHtmlRequest());

    const state = getState();

    const saveHtml = mainProcess.saveProject(getHtml(state));

    if (!saveHtml) return dispatch(saveMdAborted());

    saveHtml
      .then(() => {
        dispatch(saveHtmlSuccess());
      })
      .catch(() => {
        dispatch(saveHtmlError());
      });
  };
}

export function showInFolder() {
  return function (dispatch, getState) {
    const state = getState();

    shell.showItemInFolder(getCurrentFileName(state));
  };
}

export function openInEditor() {
  return function (dispatch, getState) {
    const state = getState();

    shell.openItem(getCurrentFileName(state));
  };
}

export function delCustomTheme(theme) {
  return function (dispatch) {
    mainProcess
      .delCustomTheme(theme)
      .then(() => {
        dispatch({ type: 'CUSTOM_THEME_DELETE_SUCCESS', theme });
      })
      .catch(() => {
        dispatch({ type: 'CUSTOM_THEME_DELETE_ERROR' });
      });
  };
}

export function loadCustomTheme(theme) {
  return function (dispatch) {
    mainProcess
      .getFilePath('css')
      .then(response => mainProcess.loadCustomTheme(response.filePath))
      .then(({ fileName }) => {
        dispatch({
          type: 'CUSTOM_THEME_LOAD_SUCCESS',
          theme: fileName,
        });
      })
      .catch(() => {
        dispatch({ type: 'CUSTOM_THEME_LOAD_ERROR' });
      });
  };
}
