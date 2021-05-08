(function (global) {
  "use strict";

  var SQFox = (function () {
    // public API module
    var Fox;
    var module = {
      iFrameWindow: null,
      actions: null,
      container: null
    };

    function init(url, container, afterInitFn, portalHeight) {
      var OFFSET = 28;
      var SQFoxURL = url || '/sqpub_fox/index.action';

      var iFrame = document.createElement('iframe');
      var contentHeight;
      
      if (typeof portalHeight == 'number') {
        contentHeight = portalHeight;
      } else {
        contentHeight = document.body.offsetHeight;
      }

      function countWinHeight() {
        return Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
      }

      var height = ((countWinHeight() - contentHeight) - OFFSET);

      // default attributes
      iFrame.frameBorder = '0';
      iFrame.scrolling = 'no';

      // default styles
      iFrame.width = '100%';
      iFrame.height = height + 'px';

      // append iFrame
      document.querySelector(container).appendChild(iFrame);

      // load Fox
      iFrame.src = SQFoxURL;

      iFrame.onload = function () {
        iFrameResize({
          enablePublicMethods: true,
          minHeight: height,
          minHeightCallBack: function () {
            return ((countWinHeight() - contentHeight) - OFFSET);
          }
        }, iFrame);

        module.iFrameWindow = iFrame.contentWindow ? iFrame.contentWindow : iFrame.contentDocument.defaultView;

        //executes afterInitFn
        if (typeof afterInitFn == 'function') {
          module.iFrameWindow.require(['fox/loading/manager'], function (loadingManager) {
            loadingManager.widgetFrameworksRendered().then(function () {
              module.iFrameWindow.require(['fox/loader'], function (loader) {
                loader.loadersExhausted().then(function () {
                  afterInitFn.call(null, SQFox);
                });
              });
            });
          });
        }
      };

      module.container = container;
      module.iFrame = iFrame;
    }

    module.init = init;

    module.unload = function () {
      module.iFrame.src = "about:blank";
    };

    module.actions = {
      home: function () {
        module.actions.forceChangeHash('#workspace');
      },
      corporateActions: function () {
        module.actions.forceChangeHash('#corporateactions');
      },
      mailbox: function () {
        module.actions.forceChangeHash("#mailbox");
      },
      transactions: function () {
        module.actions.forceChangeHash('#transactions');
      },
      orderHistory: function () {
        module.actions.forceChangeHash('#orderHistory');
      },
      shareRegister: function() {
        module.actions.forceChangeHash('#shareregister');
      },
      guidedTour: function () {
        module.iFrameWindow.require(['fox/feature.tour/tour'], function (foxFeatureTour) {
          setTimeout(function () {
            foxFeatureTour.start('guidedTour');
          }, 500);
        });
      },
      preferences: function () {
        module.actions.forceChangeHash('#pref');
        setTimeout(function () {
          window.scrollTo(0, document.body.scrollHeight);
        }, 500);
      },
      forceChangeHash: function (hash) {
        var sourceHash = module.iFrameWindow.location.hash;
        module.iFrameWindow.location.hash = hash;
        if (sourceHash == hash && hash != '#pref') { // forcing hash change
          module.iFrameWindow.location.reload();
        }
      }
    };

    return module;
  })();

  // expose SQFox module to the parent
  global.SQFox = SQFox;
})(this);
