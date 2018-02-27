import React, { Component } from 'react';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';

import Menu from './Menu';
import Workarea from './Workarea';
import BgPanel from './BgPanel';
import ConfPanel from './ConfPanel';
import ThemesPanel from './ThemesPanel';
import {
  getCurrentFileName,
  getLeftPanelStatus,
  getPreviewPanelOpen,
  getInit,
  getDirtyStatus,
  getRightPanelStatus,
  getConfPanelStatus,
  getThemesPanelStatus,
  getUiConf,
} from '../selectors';
import { setInit } from '../actions/actions';

const mapStateToProps = state => ({
  currentFileName: getCurrentFileName(state),
  dirty: getDirtyStatus(state),
  leftPanelOpen: getLeftPanelStatus(state),
  previewOpen: getPreviewPanelOpen(state),
  rightPanelOpen: getRightPanelStatus(state),
  confPanelOpen: getConfPanelStatus(state),
  themesPanelOpen: getThemesPanelStatus(state),
  uiConf: getUiConf(state),
  // init: getInit(state)
});

const mapDispatchToProps = dispatch => ({
  init: () => dispatch(setInit()),
});

class App extends Component {
  componentDidMount() {
    this.props.init();
  }

  shouldComponentUpdate(nextProps) {
    return nextProps.uiConf.labels;
  }

  render() {
    if (!this.props.uiConf.labels) return null;

    let classes = 'application';
    if (this.props.leftPanelOpen) classes += ' leftPanelOpen';
    if (this.props.rightPanelOpen) classes += ' rightPanelOpen';
    if (this.props.confPanelOpen) classes += ' confPanelOpen';
    if (this.props.themesPanelOpen) classes += ' themesPanelOpen';
    if (!this.props.uiConf.showButtonText) classes += ' hideButtonText';
    if (this.props.previewOpen) classes += ' previewOn';
    if (this.props.init) classes += ' show';

    const styles = [
      {
        rel: 'stylesheet',
        href: 'style.css',
        type: 'text/css',
      },
      {
        rel: 'stylesheet',
        href: `skins/${this.props.uiConf.currentColorScheme}.css`,
        type: 'text/css',
      },
    ];

    return (
      <div className={classes}>
        <Helmet
          title={`Apollo Editor${this.props.currentFileName.length ? ` - ${this.props.currentFileName}` : ''}${this.props.dirty ? '*' : ''}`}
          link={styles}
        />
        <Menu />
        <Workarea />
        <BgPanel />
        <ConfPanel />
        <ThemesPanel />
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
