function initReveal(configuration) {
  setTimeout(() => {
    if (!Reveal.isReady()) {
      configuration.dependencies = [
        {
          src: '../../jsLib/reveal.js/lib/js/classList.js',
          condition() {
            return !document.body.classList;
          },
        },
        {
          src:
						'../../jsLib/reveal.js/plugin/highlight/highlight.js',
          async: true,
          callback() {
            hljs.initHighlightingOnLoad();
            hljs.initHighlighting();
          },
        },
        {
          src:
						'../../jsLib/reveal.js/plugin/zoom-js/zoom.js',
          async: true,
        },
        {
          src:
						'../../jsLib/reveal.js/plugin/notes/notes.js',
          async: true,
        },
      ];

      Reveal.initialize(configuration);
      Reveal.slide(0);
    } else {
      Reveal.configure(configuration);
      Reveal.setState(Reveal.getState());
      hljs.initHighlighting.called = false;
      hljs.initHighlighting();
    }
  }, 50);
}
