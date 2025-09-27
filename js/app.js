/*
  app.js

  This script adds interactivity to the airship microsite. It assigns
  behaviour to hotspots, manages tooltips and controls transitions between
  multiple looping video elements. Additional hotspots and videos can be added
  by following the same pattern.
*/

document.addEventListener('DOMContentLoaded', () => {
  const allVideos = Array.from(document.querySelectorAll('video'));
  allVideos.forEach(video => video.load());

  const hotspots = Array.from(document.querySelectorAll('.hotspot'));
  const tooltips = Array.from(document.querySelectorAll('.tooltip'));
  const returnButton = document.getElementById('returnButton');
  const backgroundAudio = document.getElementById('backgroundAudio');
  const scrollCue = document.querySelector('.scroll-cue');
  const hamburgerButton = document.querySelector('.hamburger');

  if (backgroundAudio) {
    backgroundAudio.loop = true;
    backgroundAudio.preload = 'auto';
    backgroundAudio.volume = 0.5;

    const interactionHandler = () => {
      safePlay(backgroundAudio).then(success => {
        if (success) {
          document.removeEventListener('pointerdown', interactionHandler);
          document.removeEventListener('keydown', interactionHandler);
        }
      });
    };

    safePlay(backgroundAudio).then(success => {
      if (!success) {
        document.addEventListener('pointerdown', interactionHandler);
        document.addEventListener('keydown', interactionHandler);
      }
    });
  }

  const frontVideo = document.getElementById('frontVideo');
  const frontSequence = frontVideo ? createVariantSequence(frontVideo, [
    { mp4: 'assets/front-loop-01.mp4' },
    { mp4: 'assets/front-loop-02.mp4' },
    { mp4: 'assets/front-loop-03.mp4' },
    { mp4: 'assets/front-loop-04.mp4' },
    { mp4: 'assets/front-loop-05.mp4' },
    { mp4: 'assets/front-loop-06.mp4' },
    { mp4: 'assets/front-loop-07.mp4' },
  ]) : null;

  const backVideo = document.getElementById('backVideo');
  const backSequence = backVideo ? createVariantSequence(backVideo, [
    { mp4: 'assets/back-loop-01.mp4' },
    { mp4: 'assets/back-loop-02.mp4' },
  ]) : null;

  const sideVideo = document.getElementById('sideVideo');
  const sideSequence = sideVideo ? createVariantSequence(sideVideo, [
    { webm: 'assets/side-loop.webm', mp4: 'assets/side-loop.mp4' },
  ]) : null;

  const topVideo = document.getElementById('topVideo');
  const topSequence = topVideo ? createVariantSequence(topVideo, [
    { webm: 'assets/top-loop.webm', mp4: 'assets/top-loop.mp4' },
  ]) : null;

  const variantSequences = new Map();
  if (frontSequence) {
    variantSequences.set(frontVideo, frontSequence);
  }
  if (backSequence) {
    variantSequences.set(backVideo, backSequence);
  }
  if (sideSequence) {
    variantSequences.set(sideVideo, sideSequence);
  }
  if (topSequence) {
    variantSequences.set(topVideo, topSequence);
  }

  const transitionVideos = Array.from(document.querySelectorAll('.video.transition'));
  transitionVideos.forEach(video => {
    video.loop = false;
    video.pause();
    video.currentTime = 0;
  });

  const sceneConfig = [
    {
      id: 'front',
      loopId: 'frontVideo',
      enterTransitionId: null,
      exitTransitionId: null,
      hotspotSelector: '[data-target="frontVideo"]',
      tooltipId: null,
    },
    {
      id: 'back',
      loopId: 'backVideo',
      enterTransitionId: 'frontToBackTransition',
      exitTransitionId: 'backToFrontTransition',
      hotspotSelector: '[data-target="backVideo"]',
      tooltipId: 'backTooltip',
    },
    {
      id: 'side',
      loopId: 'sideVideo',
      enterTransitionId: 'frontToSideTransition',
      exitTransitionId: 'sideToFrontTransition',
      hotspotSelector: '[data-target="sideVideo"]',
      tooltipId: 'sideTooltip',
    },
    {
      id: 'top',
      loopId: 'topVideo',
      enterTransitionId: 'frontToTopTransition',
      exitTransitionId: 'topToFrontTransition',
      hotspotSelector: '[data-target="topVideo"]',
      tooltipId: 'topTooltip',
    },
  ];

  const scenes = {};
  const sceneByLoopId = {};

  sceneConfig.forEach(config => {
    const loop = document.getElementById(config.loopId);
    const enterTransition = config.enterTransitionId ? document.getElementById(config.enterTransitionId) : null;
    const exitTransition = config.exitTransitionId ? document.getElementById(config.exitTransitionId) : null;
    const hotspot = config.hotspotSelector ? document.querySelector(config.hotspotSelector) : null;
    const tooltip = config.tooltipId ? document.getElementById(config.tooltipId) : null;

    scenes[config.id] = {
      id: config.id,
      loop,
      enterTransition,
      exitTransition,
      hotspot,
      tooltip,
    };

    sceneByLoopId[config.loopId] = scenes[config.id];
  });

  const loopVideos = sceneConfig
    .map(config => scenes[config.id]?.loop)
    .filter(Boolean);

  let currentScene = scenes.front;
  const sceneStack = [];
  let activeTooltip = null;
  let isTransitioning = false;

  activateScene(currentScene, { showTooltip: false }).catch(() => {});

  if (returnButton) {
    returnButton.addEventListener('click', event => {
      event.stopPropagation();
      event.preventDefault();
      goBack();
    });
  }

  document.addEventListener('click', event => {
    const hotspot = event.target.closest('.hotspot');
    if (hotspot) {
      event.preventDefault();
      event.stopPropagation();
      onHotspotClick(hotspot);
      return;
    }

    if (event.target.closest('.tooltip')) {
      return;
    }

    if (event.target.closest('.back-control')) {
      return;
    }

    hideAllTooltips();
  });

  if (scrollCue) {
    scrollCue.addEventListener('click', () => {
      const targetSection = document.getElementById('content');
      if (targetSection) {
        try {
          targetSection.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
          const targetTop = window.pageYOffset + targetSection.getBoundingClientRect().top;
          if (typeof window.scrollTo === 'function') {
            try {
              window.scrollTo({ top: targetTop, behavior: 'smooth' });
            } catch (scrollError) {
              window.scrollTo(0, targetTop);
            }
          }
        }
      }
    });
  }

  if (hamburgerButton) {
    if (!hamburgerButton.hasAttribute('aria-expanded')) {
      hamburgerButton.setAttribute('aria-expanded', 'false');
    }

    hamburgerButton.addEventListener('click', () => {
      const isActive = hamburgerButton.classList.toggle('is-active');
      hamburgerButton.setAttribute('aria-expanded', String(isActive));
      console.log('Hamburger toggled', isActive);
    });
  }

  function onHotspotClick(hotspot) {
    if (isTransitioning) {
      return;
    }

    const targetLoopId = hotspot.dataset.target;
    if (!targetLoopId) {
      return;
    }

    const targetScene = sceneByLoopId[targetLoopId];
    if (!targetScene) {
      return;
    }

    const transitionId = hotspot.dataset.transition;
    const transitionVideo = transitionId ? document.getElementById(transitionId) : targetScene.enterTransition;

    if (targetScene === currentScene) {
      if (targetScene.tooltip) {
        const isVisible = activeTooltip === targetScene.tooltip;
        if (isVisible) {
          hideAllTooltips();
        } else {
          showTooltip(targetScene.tooltip);
        }
      }
      return;
    }

    hideAllTooltips();

    initiateSceneTransition({
      transitionVideo,
      targetScene,
      fromScene: currentScene,
      pushHistory: true,
      showTooltip: true,
    });
  }

  function goBack() {
    if (isTransitioning || sceneStack.length === 0) {
      return;
    }

    const previousScene = sceneStack.pop();
    hideAllTooltips();

    initiateSceneTransition({
      transitionVideo: currentScene.exitTransition,
      targetScene: previousScene,
      fromScene: currentScene,
      pushHistory: false,
      showTooltip: Boolean(previousScene.tooltip),
    });
  }

  function initiateSceneTransition({ transitionVideo, targetScene, fromScene, pushHistory, showTooltip }) {
    const sourceScene = fromScene || currentScene;
    showLoadingOverlay();
    const launchTransition = () => {
      startTransition(transitionVideo, targetScene, {
        fromScene: sourceScene,
        pushHistory,
        showTooltip,
      });
    };

    if (!sourceScene || !sourceScene.loop) {
      launchTransition();
      return;
    }

    const sequencer = variantSequences.get(sourceScene.loop);
    if (sequencer) {
      isTransitioning = true;
      sequencer.waitForBreak()
        .catch(() => {})
        .then(() => {
          launchTransition();
        });
      return;
    }

    const loop = sourceScene.loop;
    if (Number.isFinite(loop.duration) && Number.isFinite(loop.currentTime) && loop.duration > 0) {
      const playbackRate = loop.playbackRate && loop.playbackRate > 0 ? loop.playbackRate : 1;
      const remaining = Math.max(0, (loop.duration - loop.currentTime) / playbackRate);
      if (remaining > 0.15) {
        isTransitioning = true;
        setTimeout(() => {
          launchTransition();
        }, remaining * 1000);
        return;
      }
    }

    launchTransition();
  }

  function startTransition(transitionVideo, targetScene, { fromScene, pushHistory, showTooltip }) {
    if (!targetScene || !targetScene.loop) {
      hideLoadingOverlay();
      return;
    }

    const sourceScene = fromScene || currentScene;

    if (pushHistory && sourceScene && sceneStack[sceneStack.length - 1] !== sourceScene) {
      sceneStack.push(sourceScene);
    }

    if (!transitionVideo) {
      hideLoadingOverlay();
      Promise.resolve(activateScene(targetScene, { showTooltip }))
        .catch(() => {});
      return;
    }

    isTransitioning = true;

    transitionVideos.forEach(video => {
      if (video !== transitionVideo) {
        video.pause();
        video.classList.remove('active');
        video.currentTime = 0;
      }
    });

    transitionVideo.classList.add('active');
    transitionVideo.loop = false;
    transitionVideo.currentTime = 0;

    hideLoadingOverlay();

    safePlay(transitionVideo);

    const targetSequencer = variantSequences.get(targetScene.loop);
    const primedScenePromise = primeScene(targetScene);

    let transitionFadeStarted = false;
    const TRANSITION_FADE_HEADROOM = 0.65;

    const onTransitionTimeUpdate = () => {
      if (transitionFadeStarted) {
        return;
      }

      const { duration, currentTime } = transitionVideo;
      if (!Number.isFinite(duration) || duration <= 0) {
        return;
      }

      const dynamicHeadroom = Math.min(
        TRANSITION_FADE_HEADROOM,
        Math.max(0.25, duration * 0.35)
      );

      if (duration - currentTime <= dynamicHeadroom) {
        transitionFadeStarted = true;
        if (targetSequencer) {
          targetSequencer.setVisibility(true);
        } else if (targetScene.loop) {
          targetScene.loop.classList.remove('sequence-hidden');
          targetScene.loop.classList.add('active');
          safePlay(targetScene.loop);
        }
        transitionVideo.classList.remove('active');
      }
    };

    transitionVideo.addEventListener('timeupdate', onTransitionTimeUpdate);

    const stopSourceLoop = () => {
      if (!sourceScene || !sourceScene.loop) {
        return;
      }

      const sequencer = variantSequences.get(sourceScene.loop);
      let releaseFrozenFrame;

      if (sequencer) {
        releaseFrozenFrame = sequencer.stop({ preserveCurrentFrame: true });
      } else {
        sourceScene.loop.pause();
        sourceScene.loop.currentTime = 0;
      }

      if (releaseFrozenFrame) {
        if (typeof requestAnimationFrame === 'function') {
          requestAnimationFrame(() => {
            releaseFrozenFrame();
          });
        } else {
          setTimeout(() => releaseFrozenFrame(), 16);
        }
      }

      sourceScene.loop.classList.remove('active');
    };

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        requestAnimationFrame(stopSourceLoop);
      });
    } else {
      setTimeout(stopSourceLoop, 0);
    }

    transitionVideo.addEventListener('ended', () => {
      const readyPromise = Promise.all([
        primedScenePromise,
        activateScene(targetScene, { showTooltip, skipTransitionCleanup: true })
      ]);

      readyPromise
        .catch(() => {})
        .finally(() => {
          transitionVideo.removeEventListener('timeupdate', onTransitionTimeUpdate);

          transitionVideo.pause();
          transitionVideo.classList.remove('active');
          transitionVideo.currentTime = 0;

          transitionVideos.forEach(video => {
            if (video !== transitionVideo) {
              video.pause();
              video.classList.remove('active');
              video.currentTime = 0;
            }
          });

          hideLoadingOverlay();
        });
    }, { once: true });
  }

  function primeScene(scene) {
    if (!scene || !scene.loop) {
      return Promise.resolve(false);
    }

    const sequencer = variantSequences.get(scene.loop);
    if (sequencer) {
      sequencer.setVisibility(false);
      return sequencer.start().then(result => {
        sequencer.setVisibility(false);
        return result;
      });
    }

    scene.loop.loop = true;
    scene.loop.currentTime = 0;
    scene.loop.muted = true;
    scene.loop.classList.add('sequence-hidden');
    return safePlay(scene.loop);
  }

  function activateScene(scene, { showTooltip, skipTransitionCleanup = false }) {
    if (!scene || !scene.loop) {
      isTransitioning = false;
      return Promise.resolve();
    }

    hideAllTooltips();

    if (!skipTransitionCleanup) {
      transitionVideos.forEach(video => {
        video.pause();
        video.classList.remove('active');
        video.currentTime = 0;
      });
    }

    let activationPromise = null;

    loopVideos.forEach(video => {
      if (video === scene.loop) {
        video.classList.add('active');
        video.muted = true;
        const sequencer = variantSequences.get(video);
        if (sequencer) {
          const startResult = sequencer.start();
          const ensureVisible = () => {
            sequencer.setVisibility(true);
          };

          if (startResult && typeof startResult.then === 'function') {
            activationPromise = startResult.then(result => {
              ensureVisible();
              return result;
            });
          } else {
            ensureVisible();
            activationPromise = Promise.resolve(startResult);
          }
        } else {
          video.loop = true;
          video.currentTime = 0;
          video.classList.remove('sequence-hidden');
          activationPromise = safePlay(video);
        }
      } else {
        video.classList.remove('active');
        const sequencer = variantSequences.get(video);
        if (sequencer) {
          sequencer.stop();
        } else {
          video.pause();
          video.currentTime = 0;
        }
        video.classList.remove('sequence-hidden');
      }
    });

    const finalizeSceneActivation = () => {
      currentScene = scene;
      updateHotspotVisibility(scene);

      if (showTooltip && scene.tooltip) {
        showTooltip(scene.tooltip);
      }

      updateReturnButton();
      isTransitioning = false;
    };

    const activation = activationPromise || Promise.resolve();

    return activation
      .then(result => {
        finalizeSceneActivation();
        return result;
      })
      .catch(error => {
        finalizeSceneActivation();
        throw error;
      });
  }

  function hideAllTooltips() {
    tooltips.forEach(tooltip => {
      tooltip.classList.remove('visible');
    });
    activeTooltip = null;
  }

  function showTooltip(tooltip) {
    if (!tooltip) {
      return;
    }
    hideAllTooltips();
    tooltip.classList.add('visible');
    activeTooltip = tooltip;
  }

  function updateHotspotVisibility(scene) {
    hotspots.forEach(hotspot => {
      const originId = hotspot.dataset.scene;
      if (!originId || (scene.loop && originId === scene.loop.id)) {
        hotspot.classList.remove('hidden');
      } else {
        hotspot.classList.add('hidden');
      }
    });
  }

  function updateReturnButton() {
    if (!returnButton) {
      return;
    }

    if (sceneStack.length > 0 && currentScene && currentScene.exitTransition) {
      returnButton.classList.add('visible');
    } else {
      returnButton.classList.remove('visible');
    }
  }

  function safePlay(media) {
    if (!media) {
      return Promise.resolve(false);
    }

    try {
      const playPromise = media.play();
      if (playPromise && typeof playPromise.then === 'function') {
        return playPromise
          .then(() => true)
          .catch(() => false);
      }
      return Promise.resolve(true);
    } catch (error) {
      return Promise.resolve(false);
    }
  }

  function createVariantSequence(video, variants) {
    if (!video) {
      return null;
    }

    const validVariants = Array.isArray(variants)
      ? variants.filter(variant => variant && (variant.mp4 || variant.webm))
      : [];

    if (!validVariants.length) {
      return null;
    }

    const container = video.parentElement;
    if (!container) {
      return null;
    }

    const FADE_DURATION_MS = 520;
    const CROSSFADE_MIN = 0.75;
    const CROSSFADE_MAX = 1.8;
    const CROSSFADE_RATIO = 0.12;
    const players = [video, createBufferVideo(video)];

    let activeIndex = 0;
    let bufferIndex = 1;
    let isRunning = false;
    let lastVariantIndex = -1;
    let pendingVariantIndex = -1;
    let bufferReady = false;
    let preparingPromise = null;
    let crossfadeInProgress = false;
    let pendingFadeTimeout = null;
    let activeHeadroom = 1.0;
    let awaitingExternalBreak = false;
    let breakResolvers = [];
    let isHidden = false;

    players.forEach(initialisePlayer);
    players.forEach(player => {
      player.style.setProperty('--sequence-fade-duration', `${FADE_DURATION_MS}ms`);
    });

    const onPlayerEnded = (event) => {
      if (event.target !== players[activeIndex]) {
        return;
      }

      if (awaitingExternalBreak) {
        resolveExternalBreak(true);
        return;
      }

      startCrossfade(true);
    };
    players.forEach(player => player.addEventListener('ended', onPlayerEnded));

    const onTimeUpdate = () => {
      if (!isRunning || crossfadeInProgress || awaitingExternalBreak) {
        return;
      }

      const currentPlayer = players[activeIndex];
      if (!currentPlayer || !bufferReady || currentPlayer.readyState < 2 || !Number.isFinite(currentPlayer.duration)) {
        return;
      }

      const headroom = getHeadroom(currentPlayer.duration);
      activeHeadroom = headroom;

      const remaining = currentPlayer.duration - currentPlayer.currentTime;
      if (remaining <= headroom) {
        startCrossfade(false);
      }
    };

    function attachProgressMonitor() {
      detachProgressMonitor();
      const currentPlayer = players[activeIndex];
      if (currentPlayer) {
        currentPlayer.addEventListener('timeupdate', onTimeUpdate);
      }
    }

    function detachProgressMonitor() {
      players.forEach(player => player.removeEventListener('timeupdate', onTimeUpdate));
    }

    function resumeCurrentPlayerFromTail() {
      const currentPlayer = players[activeIndex];
      if (!currentPlayer) {
        return;
      }

      const headroom = activeHeadroom;

      if (Number.isFinite(currentPlayer.duration) && currentPlayer.duration > headroom) {
        try {
          currentPlayer.currentTime = Math.max(0, currentPlayer.duration - headroom);
        } catch (error) {
          currentPlayer.currentTime = 0;
        }
      } else {
        try {
          currentPlayer.currentTime = 0;
        } catch (error) {
          // Ignore seek failures
        }
      }

      safePlay(currentPlayer);
    }

    function getHeadroom(duration) {
      if (!Number.isFinite(duration) || duration <= 0) {
        return CROSSFADE_MIN;
      }

      const scaled = duration * CROSSFADE_RATIO;
      return Math.max(CROSSFADE_MIN, Math.min(CROSSFADE_MAX, scaled));
    }

    function initialisePlayer(player) {
      player.classList.add('sequence-layer');
      player.classList.remove('sequence-visible');
      player.loop = false;
      player.muted = true;
      player.playsInline = true;
      player.preload = 'auto';
      player.removeAttribute('controls');
      player.removeAttribute('autoplay');
      clearSources(player);

      if (player !== video) {
        player.removeAttribute('poster');
      }
    }

    function createBufferVideo(base) {
      const clone = base.cloneNode(false);
      clone.removeAttribute('id');
      clone.setAttribute('aria-hidden', 'true');
      clone.classList.remove('active');
      container.insertBefore(clone, base.nextSibling);
      return clone;
    }

    function clearSources(player) {
      Array.from(player.querySelectorAll('source')).forEach(source => source.remove());
      player.removeAttribute('src');
    }

    function applyVariant(player, variant) {
      clearSources(player);

      let applied = false;

      if (variant.webm) {
        const source = document.createElement('source');
        source.type = 'video/webm';
        source.src = variant.webm;
        player.appendChild(source);
        applied = true;
      }

      if (variant.mp4) {
        const source = document.createElement('source');
        source.type = 'video/mp4';
        source.src = variant.mp4;
        player.appendChild(source);
        applied = true;
      }

      if (!applied) {
        return Promise.resolve(false);
      }

      return new Promise(resolve => {
        let settled = false;

        const cleanup = () => {
          player.removeEventListener('canplaythrough', onReady);
          player.removeEventListener('canplay', onReady);
          player.removeEventListener('error', onError);
        };

        const onReady = () => {
          if (settled) {
            return;
          }
          settled = true;
          cleanup();
          player.currentTime = 0;

          if (player === players[activeIndex] && Number.isFinite(player.duration) && player.duration > 0) {
            activeHeadroom = getHeadroom(player.duration);
          }

          resolve(true);
        };

        const onError = () => {
          if (settled) {
            return;
          }
          settled = true;
          cleanup();
          resolve(false);
        };

        player.addEventListener('canplaythrough', onReady, { once: true });
        player.addEventListener('canplay', onReady, { once: true });
        player.addEventListener('error', onError, { once: true });

        player.load();

        if (player.readyState >= 2) {
          onReady();
        }
      });
    }

    function pickNextVariantIndex(excludeIndex) {
      if (validVariants.length === 1) {
        return 0;
      }

      let nextIndex = Math.floor(Math.random() * validVariants.length);
      if (typeof excludeIndex === 'number') {
        while (nextIndex === excludeIndex && validVariants.length > 1) {
          nextIndex = Math.floor(Math.random() * validVariants.length);
        }
      }
      return nextIndex;
    }

    function prepareBuffer() {
      if (!isRunning || awaitingExternalBreak) {
        bufferReady = false;
        preparingPromise = null;
        return Promise.resolve(false);
      }

      if (preparingPromise) {
        return preparingPromise;
      }

      const exclude = pendingVariantIndex >= 0 ? pendingVariantIndex : lastVariantIndex;
      const nextIndex = pickNextVariantIndex(exclude);
      pendingVariantIndex = nextIndex;
      const variant = validVariants[nextIndex];
      const bufferPlayer = players[bufferIndex];

      preparingPromise = applyVariant(bufferPlayer, variant).then(success => {
        if (!success) {
          pendingVariantIndex = -1;
        }

        if (!isRunning) {
          bufferReady = false;
        } else {
          bufferReady = success;
        }

        preparingPromise = null;
        return success;
      });

      return preparingPromise;
    }

    function startCrossfade(force) {
      if (!isRunning) {
        return;
      }

      if (awaitingExternalBreak) {
        return;
      }

      if (crossfadeInProgress) {
        return;
      }

      crossfadeInProgress = true;

      const proceed = () => {
        if (!isRunning || !bufferReady) {
          crossfadeInProgress = false;
          if (force) {
            resumeCurrentPlayerFromTail();
          }
          return;
        }

        performSwitch();
      };

      if (bufferReady) {
        proceed();
      } else {
        prepareBuffer().then(success => {
          if (!success) {
            crossfadeInProgress = false;
            if (force) {
              resumeCurrentPlayerFromTail();
            }
            return;
          }
          proceed();
        });
      }
    }

    function performSwitch() {
      const currentPlayer = players[activeIndex];
      const nextPlayer = players[bufferIndex];

      if (!currentPlayer || !nextPlayer) {
        crossfadeInProgress = false;
        return;
      }

      if (pendingFadeTimeout !== null) {
        clearTimeout(pendingFadeTimeout);
        pendingFadeTimeout = null;
      }

      detachProgressMonitor();

      nextPlayer.currentTime = 0;
      nextPlayer.classList.add('sequence-visible');
      safePlay(nextPlayer);

      const previousActive = activeIndex;
      const previousBuffer = bufferIndex;

      if (pendingVariantIndex >= 0) {
        lastVariantIndex = pendingVariantIndex;
      }

      pendingVariantIndex = -1;
      bufferReady = false;

      activeIndex = previousBuffer;
      bufferIndex = previousActive;

      pendingFadeTimeout = setTimeout(() => {
        currentPlayer.classList.remove('sequence-visible');
        currentPlayer.pause();
        currentPlayer.currentTime = 0;

        if (isRunning) {
          prepareBuffer();
        }

        pendingFadeTimeout = null;
      }, FADE_DURATION_MS);

      crossfadeInProgress = false;

      if (isRunning) {
        attachProgressMonitor();
      }
    }

    function start() {
      if (isRunning) {
        const currentPlayer = players[activeIndex];
        if (currentPlayer.classList.contains('sequence-visible') && currentPlayer.paused) {
          safePlay(currentPlayer);
        }
        return Promise.resolve(true);
      }

      isRunning = true;

      const currentPlayer = players[activeIndex];
      const nextIndex = pickNextVariantIndex(lastVariantIndex);
      const variant = validVariants[nextIndex];

      return applyVariant(currentPlayer, variant).then(success => {
        if (!success) {
          isRunning = false;
          return false;
        }

        if (!isRunning) {
          return false;
        }

        lastVariantIndex = nextIndex;
        currentPlayer.classList.add('sequence-visible');
        currentPlayer.currentTime = 0;
        safePlay(currentPlayer);
        currentPlayer.removeAttribute('poster');
        activeHeadroom = getHeadroom(currentPlayer.duration);

        prepareBuffer();
        attachProgressMonitor();
        return true;
      });
    }

    function stop(options = {}) {
      const { preserveCurrentFrame = false } = options;

      isRunning = false;
      bufferReady = false;
      pendingVariantIndex = -1;
      preparingPromise = null;
      crossfadeInProgress = false;
      cancelExternalBreak(false);

      if (pendingFadeTimeout !== null) {
        clearTimeout(pendingFadeTimeout);
        pendingFadeTimeout = null;
      }

      detachProgressMonitor();

      const currentPlayer = players[activeIndex];

      players.forEach(player => {
        player.pause();
      });

      players.forEach(player => {
        if (player !== currentPlayer || !preserveCurrentFrame) {
          player.currentTime = 0;
          player.classList.remove('sequence-visible');
        }
      });

      setVisibility(true);

      if (!preserveCurrentFrame && currentPlayer) {
        currentPlayer.classList.remove('sequence-visible');
      }

      if (preserveCurrentFrame && currentPlayer) {
        return () => {
          currentPlayer.currentTime = 0;
          currentPlayer.classList.remove('sequence-visible');
        };
      }

      return undefined;
    }

    function waitForBreak() {
      if (!isRunning) {
        return Promise.resolve(true);
      }

      if (awaitingExternalBreak) {
        return new Promise(resolve => {
          breakResolvers.push(resolve);
        });
      }

      const currentPlayer = players[activeIndex];
      if (currentPlayer && currentPlayer.ended) {
        return Promise.resolve(true);
      }

      awaitingExternalBreak = true;
      bufferReady = false;
      preparingPromise = null;
      pendingVariantIndex = -1;

      return new Promise(resolve => {
        breakResolvers.push(resolve);
      });
    }

    function resolveExternalBreak(result) {
      awaitingExternalBreak = false;
      bufferReady = false;
      preparingPromise = null;
      pendingVariantIndex = -1;
      const resolvers = breakResolvers;
      breakResolvers = [];
      resolvers.forEach(resolve => resolve(result));
    }

    function cancelExternalBreak(result) {
      if (!awaitingExternalBreak && breakResolvers.length === 0) {
        breakResolvers = [];
        return;
      }

      awaitingExternalBreak = false;
      bufferReady = false;
      preparingPromise = null;
      pendingVariantIndex = -1;
      const resolvers = breakResolvers;
      breakResolvers = [];
      resolvers.forEach(resolve => resolve(result));
    }

    function setVisibility(visible) {
      isHidden = !visible;
      players.forEach(player => {
        if (visible) {
          player.classList.remove('sequence-hidden');
        } else {
          player.classList.add('sequence-hidden');
        }
      });
    }

    return { start, stop, waitForBreak, setVisibility };
  }

  function showLoadingOverlay() {
    if (!loadingOverlay) {
      return;
    }
    loadingOverlay.setAttribute('aria-hidden', 'false');
    loadingOverlay.classList.add('visible');
  }

  function hideLoadingOverlay() {
    if (!loadingOverlay) {
      return;
    }
    loadingOverlay.classList.remove('visible');
    loadingOverlay.setAttribute('aria-hidden', 'true');
  }

});
