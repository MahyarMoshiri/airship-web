/*
  app.js

  This script adds interactivity to the airship microsite. It assigns
  behaviour to hotspots, manages tooltips and controls transitions between
  multiple looping video elements. Additional hotspots and videos can be added
  by following the same pattern.
*/

document.addEventListener('DOMContentLoaded', () => {
  const mainVideo = document.getElementById('mainVideo');
  const backVideo = document.getElementById('backVideo');
  const backHotspot = document.querySelector('.backHotspot');
  const backDescription = document.getElementById('back-description');

  // Ensure the main video is visible on page load
  mainVideo.classList.add('active');

  /**
   * Helper to activate one video and hide the others. Adds the
   * 'active' class to the target video, causing it to fade in via CSS.
   *
   * @param {HTMLVideoElement} targetVideo The video element to show
   */
  function switchToVideo(targetVideo) {
    document.querySelectorAll('.video').forEach(video => {
      video.classList.remove('active');
    });
    targetVideo.classList.add('active');
  }

  /**
   * Toggle the tooltip for the back hotspot and switch videos accordingly.
   */
  backHotspot.addEventListener('click', (event) => {
    event.stopPropagation();
    // Toggle tooltip visibility
    backDescription.classList.toggle('visible');
    // Toggle between the main and back videos
    if (backVideo.classList.contains('active')) {
      switchToVideo(mainVideo);
    } else {
      switchToVideo(backVideo);
    }
  });

  // Hide the tooltip when clicking outside of it or the hotspot
  document.body.addEventListener('click', (event) => {
    if (!backHotspot.contains(event.target) && !backDescription.contains(event.target)) {
      backDescription.classList.remove('visible');
    }
  });
});