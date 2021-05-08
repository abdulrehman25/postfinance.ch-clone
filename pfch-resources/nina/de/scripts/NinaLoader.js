/**
 * Copyright 2010-2013 Nuance Communications Inc. All rights reserved.
 */

/**
 * @namespace
 */
window.Nina = window.Nina || {};
window.NinaVars = window.NinaVars || {};
/**
 * @namespace
 */
window.Nina.AgentLoader = function() {
  "use strict";
  var me = {}, NinaVars = window.NinaVars;
  me.agentId = 'pfde';
  me.loaderFileName = "scripts/NinaLoader.js";
  me.loaded = {};
  me.loaded.name = "";
  me.loadingList = {};
  me.isActive = false;
  me.push = {};
  me.push.timer;
  me.push.label;
 
  loadLoaderStyles();

  // First check if we have any agent session cookie. If it exists, we trigger the loading of the main js
  var pattern = /^Nina-pfde-session$/;
  /*only cookies for this domain and path will be retrieved */
  var cookieJar = document.cookie.split("; ");
  for (var x = 0; x < cookieJar.length; x++) {
    var oneCookie = cookieJar[x].split("=");
    if (oneCookie[0].search(pattern) === 0 && oneCookie[1].indexOf("popinState") !== -1) {
      // We have a live session cookie, so we'll be loading the corresponding js
      me.isActive = oneCookie[1].indexOf("popinState%22%3A%22O%22") > -1;
      load(me.agentId); 
    }
  }


  window.addEventListener('load', function() {
    if (!me.isActive) {
      initPush();
    }
  }, false);
  
  function initPush() {
    var pushConfig = document.querySelectorAll('div[data-chatbot-push=true], div[data-chatbot-push-extreme=true]');
    
    if (pushConfig.length === 1) {
      var timer = parseInt(pushConfig[0].getAttribute('data-push-timer'), 10) * 1000;
      var animationTimer = parseInt(pushConfig[0].getAttribute('data-animation-timer'), 10) * 1000;
      var durationTimer = parseInt(pushConfig[0].getAttribute('data-duration-timer'), 10) * 1000;
      var repetitions = parseInt(pushConfig[0].getAttribute('data-repetitions'));
      me.push.label = pushConfig[0].getAttribute('data-expanded-label');
      var extremePush = pushConfig[0].getAttribute('data-chatbot-push-extreme') === 'true';
      if (extremePush) {
        durationTimer = parseInt(pushConfig[0].getAttribute('data-openchat-timer'), 10) * 1000;
      }

      setTimeout(function() {
        if (!isActive()) {
          Nina.AgentLoader.renderFlowbox();
          Nina.AgentLoader.startAnimation(animationTimer, durationTimer, repetitions, extremePush);
        }
      }, timer);
    }
  }

  function isActive() {
    return document.cookie.indexOf("popinState%22%3A%22O%22") > -1;
  }

  /**
   * Show the agent whose id is requested. If not already loaded, load it. Otherwise, just call the show method
   * @param {string} id
   * @returns {void}
   */
  function load(id, options) {
    options = options || {};
    if (me.loaded.name === id) {
      // Already loaded this one, need to call method that shows the virtual agent
      me.loaded.popin.show();
      return;
    } else if (me.loaded.popin && me.loaded.popin !== null && me.loaded.popin.hide &&
        typeof me.loaded.popin.hide === "function") {
      me.loaded.popin.hide();
    }

    if (!me.loadingList.hasOwnProperty(id)) {
      //we put a lock to prevent multiple loading
      if (options.lock) {
        me.loadingList[id] = true;
      }
      /**
       * If the proactive launch is active or if the opener param is set,
       * we set the action that opened the popin : NinaVars.opener = opener|"user"
       */
      if (options.hasOwnProperty("opener")) {
        NinaVars.opener = options.opener;
      }

      // Load asynchronously. Once support for async attribute is generalized we can remove that but for now,
      // timeout is the best bet.
      var baseDir = getScriptPath(me.loaderFileName);

      // Insert CSS
      var e = document.createElement("link");
      e.rel = "stylesheet";
      e.type = "text/css";
      e.href = baseDir + "css/" + id + ".css";
      e.media = "all";
      document.getElementsByTagName("head")[0].appendChild(e);

      // Insert JS
      e = document.createElement("script");
      e.src = baseDir + "scripts/" + id + ".js";
      e.type = "text/javascript";
      e.async = true;
      e.onerror = function() {
        delete me.loadingList[id];
      };
      var s = document.getElementsByTagName("script")[0];
      s.parentNode.insertBefore(e, s);
    }//else it's locked, the JS is loading and the popin is not registered yet (me.loaded.name)
  }

  /**
   * Retrieves the base path of the location the agent files are stored in
   * @param {string} scriptname
   * @returns {string}
   */
  function getScriptPath(scriptname) {
    scriptname = scriptname.toLowerCase();
    var scriptobjects = document.getElementsByTagName("script");
    for (var i = 0; i < scriptobjects.length; i++) {
      if (scriptobjects[i].src && scriptobjects[i].src.toLowerCase().lastIndexOf(scriptname) !== -1) {
        return scriptobjects[i].src.toString().substring(0, scriptobjects[i].src.toLowerCase().lastIndexOf(scriptname));
      }
    }
    return null;
  }

  function loadLoaderStyles() {
    var baseDir = getScriptPath(me.loaderFileName);
    var e = document.createElement("link");
    e.rel = "stylesheet";
    e.type = "text/css";
    e.href = baseDir + "css/NinaLoader.css";
    e.media = "all";
    document.getElementsByTagName("head")[0].appendChild(e);
  }

  function isFlowboxRendered() {
    return document.getElementById("cb_flowbox") != null;
  }

  function renderFlowbox() {
    if (!isFlowboxRendered()) {
      var classId = "cb_flowbox";
      var cb_flowbox = document.createElement("div");
      cb_flowbox.id = classId;
      cb_flowbox.className = classId;
      cb_flowbox.setAttribute("aria-hidden", "true");
      cb_flowbox.tabIndex = "-1";

      var cb_button = document.createElement("button");
      cb_button.id = classId + "-btn";
      cb_button.className = classId + "--trigger-btn";
      cb_button.setAttribute("aria-expanded", "false");
      cb_button.type = "button";

      var cb_button_a = document.createElement("a");

      var cb_button_icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      cb_button_icon.setAttribute("width", "24");
      cb_button_icon.setAttribute("height", "24");
      cb_button_icon.setAttribute("viewBox", "0 0 41 38");
      cb_button_icon.setAttribute("fill", "none");
      cb_button_icon.setAttribute("class", classId + "--trigger--btn--icon");

      var cb_button_icon_path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      cb_button_icon_path.setAttribute("d", "M12 31V30H11H7C3.68629 30 1 27.3137 1 24V7C1 3.68629 3.68629 1 7 1H34C37.3137 1 40 3.68629 40 7V24C40 27.3137 37.3137 30 34 30H18.5H18.1058L17.8177 30.2689L12 35.6988V31Z");
      cb_button_icon_path.setAttribute("stroke", "black");
      cb_button_icon_path.setAttribute("stroke-width", "2");
      cb_button_icon_path.setAttribute("stroke-linecap", "square");
      cb_button_icon_path.setAttribute("class", classId + "--trigger--btn--icon--path");
      cb_button_icon.appendChild(cb_button_icon_path);

      var cb_button_icon_c1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      cb_button_icon_c1.setAttribute("cx", "13");
      cb_button_icon_c1.setAttribute("cy", "20");
      cb_button_icon_c1.setAttribute("r", "2");
      cb_button_icon_c1.setAttribute("fill", "black");
      cb_button_icon_c1.setAttribute("class", classId + "--trigger--btn--icon--circle");
      cb_button_icon.appendChild(cb_button_icon_c1);

      var cb_button_icon_c2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      cb_button_icon_c2.setAttribute("cx", "20");
      cb_button_icon_c2.setAttribute("cy", "20");
      cb_button_icon_c2.setAttribute("r", "2");
      cb_button_icon_c2.setAttribute("fill", "black");
      cb_button_icon_c2.setAttribute("class", classId + "--trigger--btn--icon--circle");
      cb_button_icon.appendChild(cb_button_icon_c2);

      var cb_button_icon_c3 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      cb_button_icon_c3.setAttribute("cx", "27");
      cb_button_icon_c3.setAttribute("cy", "20");
      cb_button_icon_c3.setAttribute("r", "2");
      cb_button_icon_c3.setAttribute("fill", "black");
      cb_button_icon_c3.setAttribute("class", classId + "--trigger--btn--icon--circle");
      cb_button_icon.appendChild(cb_button_icon_c3);

      var cb_button_span = document.createElement("span");
      cb_button_span.className = classId + "--trigger--btn--label";
      var label = (me.push && me.push.label) ? me.push.label : "Haben Sie Fragen?";
      cb_button_span.innerText = label;

      cb_button.appendChild(cb_button_icon);
      cb_button.appendChild(cb_button_span);
      cb_flowbox.appendChild(cb_button);

      cb_button.addEventListener("click", function() {load(me.agentId)});

      document.body.appendChild(cb_flowbox);

      return true;
    }
    return false;
  }

  function removeFlowbox() {
    if (isFlowboxRendered()) {
      var flowbox = document.getElementById("cb_flowbox");
      flowbox.parentNode.removeChild(flowbox);
    }
  }

  function openFlowbox() {
    if (isFlowboxRendered()) {
      document.getElementById("cb_flowbox-btn").classList.add("open");
    }
  }

  function closeFlowbox() {
    if (isFlowboxRendered()) {
      document.getElementById("cb_flowbox-btn").classList.remove("open");
    }
  }

  return {
    /**
     * This function will display the virtual agent whose id is provided.
     * @param {string} id The id of the virtual agent we want to display
     * @param {object} options Contains properties like "opener" (optional)
     * @returns {void}
     */
    loadAgent: function(id, options) {
      var o = options || {};
      o.lock = true;
      load(id, options);
    },
    /**
     * This function is used by the popin module to indicate it has initialized and provide access to its functions
     * to the NinaLoader module
     * @param {string} id The id of the virtual agent
     * @param {Object} popinFunctions Object containing the popin display functions (show, hide, minimize)
     * @returns {void}
     */
    setAgentPopin: function(id, popinFunctions) {
      me.loaded.name = id;
      me.loaded.popin = popinFunctions;
    },
    /**
     * This function returns the base url where the NinaLoader module is located. It's used by other modules in the case the
     * page embedding the agent is not in the same directory as the agent.
     * @returns {string}
     */
    getBaseDir: function() {
      return getScriptPath(me.loaderFileName);
    },

    renderFlowbox: function() {
      renderFlowbox();
    },

    removeFlowbox: function() {
      removeFlowbox();
    },

    openFlowbox: function() {
      openFlowbox();
    },

    closeFlowbox: function() {
      closeFlowbox();
    },

    isSmallViewPort: function() {
      if(window.innerWidth <= 900 || window.innerHeight <= 680) {
        return true;
      } else {
        return false;
      }
    },

    isLoaded: function() {
      return me.loaded;
    },

    startAnimation: function(animationTimer, durationTimer, repetitions, extremePush) {
      if (repetitions > 0) {  
        setTimeout(function() {
          Nina.AgentLoader.openFlowbox();
          setTimeout(function() {
            Nina.AgentLoader.closeFlowbox()
            Nina.AgentLoader.startAnimation(animationTimer, durationTimer, repetitions - 1, extremePush);
          }, durationTimer);
        }, animationTimer);
      } else if (extremePush) {
        load(me.agentId);
      }
    }
  };
}();
