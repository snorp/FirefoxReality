(function () {
  // If missing, inject a `<meta name="viewport">` tag to trigger YouTube's mobile layout.
  const viewport = document.head.querySelector('meta[name="viewport"]');
  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=user-width, initial-scale=1';
    document.head.appendChild(viewport);
  }

  // (function () {
  // const
  playerEl = document.getElementById('movie_player');
  if (!playerEl) {
    return;
  }

  // const
  YOUTUBE_QUALITY_SIZES = [4320, 2880, 2160, 1440, 1080, 720, 480, 360, 240, 144];
  // const
  YOUTUBE_QUALITY_DEFAULT_SIZE = 1440;
  // const
  YOUTUBE_QUALITY_LABELS = {
    4320: 'highres',
    2160: 'hd2160',
    1440: 'hd1440',
    1080: 'hd1080',
    720: 'hd720',
    480: 'large',
    360: 'medium',
    240: 'small',
    144: 'tiny'
  };

  // const
  YOUTUBE_QUALITY_SIZES_BY_LABEL = {};
  YOUTUBE_QUALITY_SIZES.forEach(size => {
    YOUTUBE_QUALITY_SIZES_BY_LABEL[YOUTUBE_QUALITY_LABELS[size]] = size;
  });

  // const
  YOUTUBE_QUALITY_DEFAULT_SIZE_LABEL = YOUTUBE_QUALITY_LABELS[YOUTUBE_QUALITY_DEFAULT_SIZE];

  function getBestDefaultQuality (choices, defaultQuality) {
    //let
    defaultQualitySize = defaultQuality;
    //let
    defaultQualityLabel = YOUTUBE_QUALITY_LABELS[defaultQuality];

    if (!Number.isInteger(defaultQuality)) {
      defaultQualitySize = YOUTUBE_QUALITY_SIZES_BY_LABEL[defaultQuality];
      defaultQualityLabel = defaultQuality;
    }

    if (!defaultQualitySize) {
      throw new Error(`Quality "${defaultQualitySize}" not supported on YouTube`);
    }

    //let
    idx = choices.indexOf(defaultQualityLabel);
    if (idx > -1) {
      return idx;
    }

    //let
    label = '';
    for (idx = 0; idx < choices.length; idx++) {
      label = choices[idx];
      if (label in YOUTUBE_QUALITY_SIZES_BY_LABEL && YOUTUBE_QUALITY_SIZES_BY_LABEL[label] <= YOUTUBE_QUALITY_DEFAULT_SIZE) {
        return idx;
      }
    }

    return idx;
  }

  // const
  playbackQuality = playerEl.getPlaybackQuality();

  // let
  desiredQuality = YOUTUBE_QUALITY_DEFAULT_SIZE;

  // const
  qs = window.URLSearchParams && new URLSearchParams(window.location.search);

  // const
  userDesiredQuality = qs && (qs.get('vq') || qs.get('quality') || '').trim().toLowerCase();
  if (userDesiredQuality) {
    // const
    userDesiredQualityNumber = parseInt(userDesiredQuality, 10);
    if (Number.isInteger(userDesiredQualityNumber)) {
      userDesiredQuality = YOUTUBE_QUALITY_LABELS[userDesiredQualityNumber];
    } else {
      userDesiredQuality = YOUTUBE_QUALITY_LABELS[userDesiredQuality];
    }

    desiredQuality = userDesiredQuality || desiredQuality;

    if (desiredQuality === 'auto' || desiredQuality === 'default') {
      // Open the `Settings` menu.
      console.log('Opened video "Settings" menu');
      document.querySelector('ytp-settings-button, .ytp-settings-button').click();

      // Select the `Quality` sub-menu.
      console.log('Opened video "Quality" sub-menu');
      document.querySelector('ytp-settings-menu ytp-menuitem:last-child, .ytp-settings-menu .ytp-menuitem:last-child').click();

      // Select the best `Quality`.
      // NOTE: The best quality is always the first item in the `Quality` list.
      //       See below for how to cross-reference the `ytp-menuitem` rows with the shortnames -
      //       because there are no classes or identifiers in the DOM to query for.)
      // const
      autoQualityEl = document.querySelector(`ytp-quality-menu ytp-menuitem:first-child, .ytp-quality-menu .ytp-menuitem:last-child`);
      autoQualityEl.click();
      console.log(`Changed changed to "Auto"`);
      return;
    }
  }

  if (!userDesiredQuality && YOUTUBE_QUALITY_SIZES_BY_LABEL[playbackQuality] >= desiredQuality) {
    console.log(`Quality is already playing at "${playbackQuality}" (requested "${YOUTUBE_QUALITY_LABELS[desiredQuality]}")`);
  } else {
    console.log('Available quality levels:', playerEl.getAvailableQualityLevels());

    // const
    newQualityIdx = getBestDefaultQuality(playerEl.getAvailableQualityLevels(), desiredQuality);
    console.log('Row number corresponding to new quality:', playerEl.getAvailableQualityLevels());

    // Open the `Settings` menu.
    console.log('Opened video "Settings" menu');
    document.querySelector('ytp-settings-button, .ytp-settings-button').click();

    // Click on the row for the new quality.
    console.log('Opened video "Quality" sub-menu');
    document.querySelector('ytp-settings-menu ytp-menuitem:last-child, .ytp-settings-menu .ytp-menuitem:last-child').click();

    // Select the best `Quality`. (The best quality is always the first item. See below for how to cross-reference the `ytp-menuitem` rows with the shortnames - because there are no classes or identifiers in the DOM to query for.)

    // const
    newQualityEl = document.querySelector(`ytp-quality-menu ytp-menuitem:first-child, .ytp-quality-menu .ytp-menuitem:nth-child(${newQualityIdx})`);
    newQualityEl.click();
    console.log(`Changed changed to "${newQualityEl.textContent}" ("${playerEl.getPlaybackQuality()}")`);
  }
})();
