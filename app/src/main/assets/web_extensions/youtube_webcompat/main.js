(function () {
  // If missing, inject a `<meta name="viewport">` tag to trigger YouTube's mobile layout.
  const viewport = document.head.querySelector('meta[name="viewport"]');
  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=user-width, initial-scale=1';
    document.head.appendChild(viewport);
  }

  const playerEl = document.getElementById('movie_player');
  if (!playerEl) {
    return;
  }

  const LOGTAG = '[firefox-reality] ';
  const YOUTUBE_DEFAULT_QUALITY = 1440;

  class YouTubeImprover {
    constructor ({
      supportedQualities = [
        4320,
        2880,
        2160,
        1440,
        1080,
        720,
        480,
        360,
        240,
        144
      ],
      defaultQuality = YOUTUBE_DEFAULT_QUALITY,
      qualityLabels = {
        4320: 'highres', // 8K / 4320p / QUHD
        2880: 'hd2880', // 5K / 2880p / UHD+
        2160: 'hd2160', // 4K / 2160p / UHD
        1440: 'hd1440', // 1440p / QHD
        1080: 'hd1080', // 1080p / FHD
        720: 'hd720', // 720p / HD
        480: 'large', // 480p
        360: 'medium', // 360p
        240: 'small', // 240p
        144: 'tiny', // 144p
        0: 'auto'
      },
      ignoreDefault = false
    },
    win = window,
    doc = document
  ) {
      this.qualitySizes = {};
      this.qualityLabels = qualityLabels;
      this.ignoreDefault = ignoreDefault;
      this.win = win;
      this.doc = doc;

      supportedQualities.forEach(size => {
        this.qualitySizes[qualityLabels[size]] = size;
      });

      this.defaultQuality = this.parseQuality(defaultQuality);
      console.log('defaultQuality', defaultQuality);

      this.playerEl = this.doc.getElementById('movie_player');
      if (!this.playerEl) {
        return;
      }
    }

    getDesiredIndexFromQualityChoices (choices, desiredQuality) {
      desiredQuality = this.parseQuality(desiredQuality);
      let idx = 0;

      if (this.ignoreDefault) {
        return choices.findIndex(size => size === desiredQuality);
      }

      // TODO: If not found, go to the next best one.
      let bestChoice = null;
      choices.reverse().forEach((size, idx) => {
        if (size >= desiredQuality) {
          bestChoice = size;
        }
      });
      return choices.indexOf(bestChoiceSize);
    }

    get currentQuality () {
      if (!this.playerEl) {
        return null;
      }

      return this.parseQuality(this.playerEl.getPlaybackQuality());
    }

    get currentQualityLabel () {
      if (!this.playerEl) {
        return null;
      }

      return this.playerEl.getPlaybackQuality();
    }

    parseQuality (value) {
      const valuePassed = value;

      value = parseInt(value, 10);
      if (!Number.isInteger(value)) {
        if (valuePassed === String(value) && !(value in this.qualityLabels)) {
          throw new Error(`Invalid quality: ${valuePassed}"; supported choices: ${Object.keys(this.qualityLabels)}`);
        }

        if (typeof value === 'string') {
          value = value.toLowerCase().trim();

          if (value === 'default' || value === 'original') {
            value = 'auto';
          }
          if (value === 'auto') {
            return 0;
          }

          if (!(value in this.qualitySizes)) {
            throw new Error(`Invalid quality: "${valuePassed}"; supported choices: ${Object.keys(this.qualitySizes).join(', ')}`);
          }

          return this.qualityLabels[value];
        }
      }

      return value;
    }

    getQualitySerialised (quality) {
      const creation = Date.now();

      return JSON.stringify({
        creation,
        data: this.qualitySizes[quality],
        expiration: creation + 2592e6
      });
    }

    set quality (value) {
      if (!this.playerEl) {
        return false;
      }

      let currentQuality = this.currentQuality;
      let currentQualityLabel = this.currentQualityLabel;

      let desiredQuality = this.parseQuality(value);
      let desiredQualityLabel = this.qualityLabels[desiredQuality];

      if (typeof desiredQuality === 'undefined') {
        value = this.defaultQuality;
      }

      if (desiredQuality === 0) {
        // Open the `Settings` menu.
        console.log(`${LOGTAG}Opened video "Settings" menu`);
        this.doc.querySelector('ytp-settings-button, .ytp-settings-button').click();

        // Select the `Quality` sub-menu.
        console.log(`${LOGTAG}Opened video "Quality" sub-menu`);
        this.doc.querySelector('ytp-settings-menu ytp-menuitem:last-child, .ytp-settings-menu .ytp-menuitem:last-child').click();

        const autoQualityEl = this.doc.querySelector(`ytp-quality-menu ytp-menuitem:first-child, .ytp-quality-menu .ytp-menuitem:last-child`);
        autoQualityEl.click();

        console.log(`${LOGTAG}Changed video quality to "Auto"`);

        return true;
      }

      if (desiredQuality === currentQuality) {
        console.log(`${LOGTAG}Quality is already playing at "${currentQualityLabel}" (requested "${desiredQualityLabel}")`);
        return;
      }

      const availableSizes = this.playerEl.getAvailableQualityLevels();
      console.info(`${LOGTAG}Available quality levels:`, availableSizes);

      try {
        localStorage.setItem('yt-player-quality', this.getQualitySerialised(desiredQuality));
      } catch (err) {
        console.warn(`Could not set "yt-player-quality" in Local Storage`);
      }

      const pressButtons = () => {
        // Open the `Settings` menu.
        const settingsButtonEl = this.doc.querySelector('ytp-settings-button, .ytp-settings-button');
        if (!settingsButtonEl) {
          return;
        }
        console.log(`${LOGTAG}Opened video "Settings" menu`);
        settingsButtonEl.click();

        let settingsEl = this.doc.querySelector('ytp-settings-shown, .ytp-settings-shown');
        if (settingsEl) {
          settingsEl.classList.remove('ytp-settings-shown');
        }

        // Click on the row for the new quality.
        const qualityButtonEl = this.doc.querySelector('ytp-settings-menu ytp-menuitem:last-child, .ytp-settings-menu .ytp-menuitem:last-child');
        if (!qualityButtonEl) {
          return;
        }
        console.log(`${LOGTAG}Opened video "Quality" sub-menu`);
        qualityButtonEl.click();

        settingsEl = this.doc.querySelector('ytp-settings-shown, .ytp-settings-shown');
        if (settingsEl) {
          settingsEl.classList.remove('ytp-settings-shown');
        }

        // Select the best `Quality`.
        // NOTE: The best quality is always the first item in the `Quality` list.
        //       See below for how to cross-reference the `ytp-menuitem` rows with the shortnames -
        //       because there are no classes or identifiers in the DOM to query for.)
        const newQualityIdx = this.getDesiredIndexFromQualityChoices(availableSizes.map(label => this.qualitySizes[label]), desiredQuality);

        const changeQuality = () => {
          const newQualityEl = this.doc.querySelector(`ytp-quality-menu [role="menuitemradio"]:nth-child(${newQualityIdx + 1}), .ytp-quality-menu [role="menuitemradio"]:nth-child(${newQualityIdx +1})`);
          console.info(`newQualityEl`, newQualityEl);

          if (!newQualityEl) {
            return;
          }

          newQualityEl.click();
          console.log(`${LOGTAG}Changed video quality to "${newQualityEl.textContent}" ("${this.qualityLabel}")`);

          settingsEl = this.doc.querySelector('ytp-settings-shown, .ytp-settings-shown');
          if (settingsEl) {
            settingsEl.classList.remove('ytp-settings-shown');
          }

          // Dismiss the `Settings` menu.
          document.querySelector('.ytp-chrome-controls, body').click();
        };

        const skipAdInterval = this.win.setInterval(() => {
          const skipAdButtonEl = this.doc.querySelector('.ytp-ad-skip-button');
          if (!skipAdButtonEl) {
            this.win.clearInterval(skipAdInterval);
            changeQuality();
            return;
          }

          skipAdButtonEl.click();
          this.playerEl.click();
        }, 500);
      };

      pressButtons();

      return true;
    }
  }

  const qs = window.URLSearchParams && new window.URLSearchParams(window.location.search);
  let desiredQuality = qs && (qs.get('vq') || qs.get('quality') || '').trim().toLowerCase();
  if (desiredQuality) {
    improver = new YouTubeImprover({
      defaultQuality: desiredQuality,
      ignoreDefault: true
    });
  } else {
    improver = new YouTubeImprover({
      defaultQuality: YOUTUBE_DEFAULT_QUALITY
    });
  }
})();
