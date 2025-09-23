# Airship Website Foundation

This repository provides a starting point for building a highly visual
interactive website similar to Loro&nbsp;Piana's **Festive Quest** microsite. It
demonstrates how to layer interactive elements over a looping video
background and switch between different scenes using simple CSS
transitions.

## Structure

The project is organised as follows:

```
airship-website/
├── index.html              # Home page with video backgrounds and hotspots
├── css/
│   └── styles.css          # Styling for layout, video, hotspots, tooltips
├── js/
│   └── app.js              # Logic for hotspots, tooltips and video transitions
└── assets/
    ├── airship-placeholder.png  # Placeholder image for the video poster
    ├── main.mp4               # (you add) 120‑second front‑view video of the airship
    └── back.mp4               # (you add) 120‑second back‑view video of the airship
```

### index.html

The HTML file includes two `<video>` elements layered on top of each
other. Only one video is visible at a time; the other stays hidden until
activated. Between them sits a **hotspot** (`.backHotspot`)—an
absolutely‑positioned `div` that responds to clicks. When a user clicks
the hotspot, it triggers a transition to the back video and reveals a
tooltip containing descriptive text.

### css/styles.css

The stylesheet resets default browser spacing, sets up the video
container and defines the appearance of the hotspots and tooltips. It
also provides a smooth fade effect when switching videos: the `.video`
elements transition their opacity between `0` and `1` using the
`.active` class.

### js/app.js

The script listens for user interactions. On page load it activates the
front video. Clicking the hotspot toggles a tooltip and switches
between the front and rear views. Clicking anywhere else hides the
tooltip. If you want additional hotspots or scenes, duplicate the
patterns here: assign unique classes/IDs, update the markup and adjust
the event listeners.

## Usage

1. Replace `assets/main.mp4` and `assets/back.mp4` with your own
   **seamlessly looping** 120‑second videos. The front clip should show
   the main airship view; the back clip should depict the alternative
   perspective.
2. Adjust the hotspot’s position and size in `index.html` (the
   `style="top: …; left: …; width: …; height: …;"` attribute) so it
   aligns with the feature you want users to click (e.g. the back of
   the airship).
3. Edit the tooltip text in the `#back-description` `div` to provide
   relevant information about what the user is viewing.
4. Open `index.html` in your browser to test the interaction. Use
   additional hotspots and videos to build out more sections of your
   website.

This foundation uses only plain HTML, CSS and vanilla JavaScript.
You’re free to extend it with animation libraries such as GSAP for
more complex transitions, or integrate it into a modern framework
(React, Vue or Svelte) if your project demands it. The goal here is to
provide a minimal yet expressive starting point for your airship‑themed
interactive experience.
