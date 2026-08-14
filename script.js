/* ==========================================================================
   OPENING SCENE - SCRIPT
   This file controls the entire animation sequence:
   the pigeon flies across the screen, a feather separates and falls,
   a small line of text fades in - and the pigeon can be caught,
   held, and (if held long enough) reveal a note.
   ========================================================================== */

// ======================================
// EDITABLE VARIABLES
// ======================================
// Change any of the numbers below to adjust the animation.
// Times are in milliseconds (1000ms = 1 second) unless noted otherwise.

// --- Timing ---
let initialDelay = 2000;         // wait before the pigeon appears (ms)
let flightDuration = 1800;       // how long the flight across the screen takes (ms)
let featherFallDuration = 3000;  // how long the feather takes to fall (ms)
let textFadeDelay = 500;         // wait after the feather lands before the text fades in (ms)

// --- Pigeon ---
let pigeonSize = 240;          // width of the pigeon image, in pixels (height adjusts automatically)
let pigeonStartY = 68;         // vertical entry point, % of screen height (lower-right entrance)
let pigeonEndY = 12;           // vertical exit point, % of screen height (upper-left exit)
let pigeonStartXBuffer = 0;    // extra px beyond the right edge before the pigeon appears (0 = right at the edge)
let pigeonEndXBuffer = 0;      // extra px beyond the left edge before the pigeon disappears (0 = right at the edge)
let pigeonWobbleAmount = 18;   // how much the pigeon rises/dips during flight, in px (keeps it from looking mechanical)

// --- Feather ---
let featherSize = 35;               // width of the feather image, in pixels
let releasePosition = 0.5;          // when in the flight the feather separates (0 = start, 1 = end, 0.5 = middle)
let featherReleaseOffsetX = 0.5;    // horizontal release point on the pigeon's body (0-1, 0.5 = center)
let featherReleaseOffsetY = 0.78;   // vertical release point on the pigeon's body (0-1, near the bottom)
let featherDriftDistance = 60;      // how far the feather drifts left/right while falling, in px
let featherRotationAmount = 50;     // how much the feather rotates while falling, in degrees
let landingPosition = 85;           // where the feather lands, % of screen height (85 = near the bottom)
let featherLandedFloatDelay = 300;  // ms - pause after landing before the idle "click me" float animation starts

// --- Audio ---
let cooingVolume = 0.6;  // 0 (silent) to 1 (full volume)
let wingVolume = 0.5;    // 0 (silent) to 1 (full volume)

// --- Pigeon Catching ---
const pigeonHoldDuration = 3000;      // how long the visitor must hold the pigeon for a successful catch (ms)
let pigeonFrontSize = 180;            // base width of the frozen front-facing pigeon, in pixels
let pigeonFrontMaxViewportPercent = 0.45; // the front-facing pigeon never exceeds this % of the screen width (keeps it usable on phones)
let minimumResumeFlightDuration = 600;    // shortest time (ms) the pigeon takes to fly off-screen after being released early
const pigeonCaughtVolume = 0.6;       // volume for the "caught" sound (0 to 1)
const paperOpenVolume = 0.5;          // volume for the "paper opening" sound (0 to 1)

// --- Wrestler ---
// (wrestler size/position, arm pivot, armpit target/hit area, and the
// arrow's tail offset are all CSS custom properties instead - see the
// ":root" section near the top of style.css, since those are pure
// display/positioning values you may want to fine-tune by eye.)
let wrestlerEntranceDuration = 1300;  // ms - how long the wrestler takes to rise fully into view
let wrestlerReadyDelay = 400;         // ms - pause after rising before the feather becomes draggable
let armRotationDuration = 2000;       // ms - how long the arm's one full rotation takes
let armSwapFraction = 0.5;            // fraction (0-1) through the rotation when the empty hand becomes the jar - should land while the hand is off-screen, pointing down
const tickleDuration = 2000;          // ms of ACTIVE tickling required at the armpit for success
let tickleWiggleThreshold = 1.5;      // px of movement per frame before it counts as deliberate motion (filters out tiny jitter)
let tickleWiggleWindow = 400;         // ms - how recently the feather must have changed direction to still count as "actively wiggling"

// The wrestler/jar exit, once the arm's rotation finishes (see
// startWrestlerExit() below).
const wrestlerExitDelay = 1500;   // ms - how long the finished pose holds still before the jar hands off and the wrestler leaves
const wrestlerExitDuration = 1200; // ms - how long the downward exit slide takes

// The closeup jar swap, once the wrestler has fully exited (see
// startJarCloseup() below).
const jarZoomDelay = 500;     // ms - how long the jar stays still after the wrestler leaves, before the closeup swap and zoom begin
const jarZoomDuration = 800;  // ms - how long the enlarge-in-place animation takes

// --- The Jar Opens ---
// (see the "STEP 8: THE JAR OPENS" section further down for how these
// are used. The jar's closed/open sizes, every object's shared
// displayed size, and how far each object sits from the jar are CSS
// custom properties instead - see "--closed-jar-size" / "--open-jar-
// size" / "--nav-object-size" / "--object-offset-x" / "--object-
// offset-y" near the top of style.css (with a second, genuinely
// different portrait set in its "max-width: 480px" media query), since
// those are pure display values best tuned with clamp() directly in CSS.)

// The settled jar's idle float, before AND after it's clicked open.
let jarFloatDistance = 7;     // px - how far up/down it gently bobs; bigger = more noticeable motion
let jarFloatDuration = 2400;  // ms - one full up-down cycle; bigger = slower, calmer bobbing

// The four objects growing out of the jar once it's opened - all four
// start and finish together (see revealObjects() below), so there's
// only the one shared duration, no stagger between them.
let objectRevealDuration = 800; // ms - how long every object's move-and-grow-in animation takes, all four at once
let objectFloatDistance = 7;    // px - how far up/down each settled object gently bobs (shared by all four)

// On desktop landscape screens, the wrestler is positioned next to the
// feather's actual landing spot instead of using the fixed CSS position
// (see positionWrestlerNearFeather() below). Mobile/portrait screens
// keep using the fixed --wrestler-horizontal-position from style.css.
let wrestlerFeatherGap = 30;           // px - gap between the wrestler's right edge and the landed feather
let wrestlerMinLeftMargin = 16;        // px - the wrestler never sits closer than this to the left edge
let wrestlerRightClearance = 0.35;     // fraction of the viewport width kept clear on the right, for the arm's swing during rotation
let desktopLandscapeMinWidth = 900;    // px - viewport width above which this repositioning applies

// Two more small, fixed implementation details - how long the jar's
// one-shot "pop" takes, and how long it then takes to grow from
// --closed-jar-size to --open-jar-size. See "jar-open-pulse" and
// "#jar-wrapper.open" in style.css.
const jarOpenPulseDuration = 240; // ms
const jarOpenScaleDuration = 400; // ms


/* --------------------------------------------------------------------
   TABLET / IPAD LANDSCAPE DETECTION
   A previous attempt gated the iPad-landscape layout purely on the CSS
   media features "hover: none" / "pointer: coarse" - and had no visible
   effect on a real iPad. The reason: iPadOS Safari's default "Request
   Desktop Website" behaviour makes it answer THOSE SPECIFIC media
   queries as if a mouse were attached ("pointer: fine", "hover: hover"),
   even on a plain touchscreen iPad with no mouse or trackpad connected
   - so a query built only from them can silently never match, no
   matter what's inside it. "navigator.maxTouchPoints" is a hardware
   capability check instead of a CSS media feature, and isn't affected
   by that "desktop site" request, so it's what actually determines
   touch capability here. Combined with a width/height range that fits
   iPad-sized screens but excludes both phones (too narrow or too short
   in landscape) and a touch laptop at a similar resolution is
   impossible to fully rule out from dimensions alone, but touch
   laptops are rare enough that this is an acceptable trade-off for
   correctly catching every current iPad model.
   Sets one class on <html> - see ".tablet-landscape" in style.css for
   what it actually changes. Runs immediately (before ELEMENT
   REFERENCES, well before first paint) and again on resize/rotation,
   so rotating a real iPad updates it live. */
function isTabletLandscapeDevice() {
  const isTouchCapable = navigator.maxTouchPoints > 0;
  const isLandscape = window.innerWidth > window.innerHeight;
  const isTabletWidth = window.innerWidth >= 900 && window.innerWidth <= 1400;
  const isTabletHeight = window.innerHeight >= 600;
  return isTouchCapable && isLandscape && isTabletWidth && isTabletHeight;
}

// Same idea, for tablet PORTRAIT - used below by
// applyTabletWrestlerWidthFallback() so its aspect-ratio-independence
// fix (see that function's own comment) covers portrait too, not just
// landscape. "600px" matches the exact width threshold style.css's own
// touch-portrait block already uses to distinguish tablet portrait
// from phone portrait ("orientation: portrait) and (max-width: 600px)"
// is the phone-only sub-query) - every current iPad is comfortably
// wider than that in portrait, every current phone is comfortably
// narrower, so no separate height check is needed here the way
// landscape's detection needs one.
function isTabletPortraitDevice() {
  const isTouchCapable = navigator.maxTouchPoints > 0;
  const isPortrait = window.innerHeight > window.innerWidth;
  const isTabletWidth = window.innerWidth > 600;
  return isTouchCapable && isPortrait && isTabletWidth;
}

// The exact inverse width check from "isTabletPortraitDevice" above -
// used by "startWrestlerExit" below to scope its own fix to iPhone
// portrait only, never iPad portrait (which "isTabletPortraitDevice"
// already owns) or any landscape orientation.
function isPhonePortraitDevice() {
  const isTouchCapable = navigator.maxTouchPoints > 0;
  const isPortrait = window.innerHeight > window.innerWidth;
  const isPhoneWidth = window.innerWidth <= 600;
  return isTouchCapable && isPortrait && isPhoneWidth;
}

function updateTabletLandscapeClass() {
  document.documentElement.classList.toggle('tablet-landscape', isTabletLandscapeDevice());
}

updateTabletLandscapeClass();
window.addEventListener('resize', updateTabletLandscapeClass);
window.addEventListener('orientationchange', updateTabletLandscapeClass);


/* --------------------------------------------------------------------
   ELEMENT REFERENCES
   Grabbing the HTML elements we will be animating / controlling.
   -------------------------------------------------------------------- */
const pigeon = document.getElementById('pigeon');
const feather = document.getElementById('feather');
const openingText = document.getElementById('opening-text');
const clickMessage = document.getElementById('click-message');
const cooingSound = document.getElementById('cooing-sound');
const flappingSound = document.getElementById('flapping-sound');
const caughtSound = document.getElementById('caught-sound');
const paperSound = document.getElementById('paper-sound');
const paperContainer = document.getElementById('paper-container'); // wraps note-paper.png + its text together
const wrestler = document.getElementById('wrestler');
const wrestlerArm = document.getElementById('wrestler-arm');
const wrestlerBody = document.getElementById('wrestler-body');
const armpitHitArea = document.getElementById('armpit-hit-area');
const wrestlerArrow = document.getElementById('wrestler-arrow');
const wrestlerJar = document.getElementById('wrestler-jar');
const jarWrapper = document.getElementById('jar-wrapper');
const jarVisual = document.getElementById('jar-visual');
const jarClosedImg = document.getElementById('jar-closed');
const jarOpenImg = document.getElementById('jar-open');
const jarScene = document.getElementById('jar-scene');
const objectFortuneTeller = document.getElementById('object-fortune-teller');
const objectTapeDispenser = document.getElementById('object-tape-dispenser');
const objectBag = document.getElementById('object-bag');
const objectPortalHand = document.getElementById('object-portal-hand');
const objectTooltip = document.getElementById('object-tooltip');

const aboutOverlay = document.getElementById('about-overlay');
const aboutOverlayFrame = document.getElementById('about-overlay-frame');

// TEMPORARY - tablet-portrait-only feather + wrestler-scene debug
// status (see "#portrait-feather-debug" in index.html/style.css - CSS
// alone decides whether it's actually visible, so none of this needs
// to check device type itself). The feather status is wired into the
// feather's real, existing handlers further down - see
// handleFeatherPointerDown, handleFeatherPointerUp,
// startWrestlerEntrance, and one new inert click listener next to the
// real "pointerdown" one. The wrestler/body/arm/arrow lines refresh on
// a plain interval (started further down, once ELEMENT REFERENCES has
// run) so they show the settled state, not just a snapshot from the
// exact moment the feather was tapped.
const portraitFeatherDebugStatus = document.getElementById('portrait-feather-debug');
let portraitFeatherStatusText = 'WAITING';

function formatElementDebugInfo(el) {
  if (!el) return 'N/A';
  const computed = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  return 'd=' + computed.display + ' v=' + computed.visibility + ' o=' + computed.opacity +
    ' w=' + Math.round(rect.width) + ' h=' + Math.round(rect.height) +
    ' t=' + computed.top + ' l=' + computed.left +
    ' tf=' + computed.transform +
    ' rect(' + Math.round(rect.x) + ',' + Math.round(rect.y) + ',' + Math.round(rect.width) + ',' + Math.round(rect.height) + ')';
}

function updatePortraitFeatherDebugPanel() {
  if (!portraitFeatherDebugStatus) return;
  portraitFeatherDebugStatus.textContent =
    'FEATHER: ' + portraitFeatherStatusText + '\n' +
    'WRESTLER: ' + formatElementDebugInfo(wrestler) + '\n' +
    'BODY: ' + formatElementDebugInfo(wrestlerBody) + '\n' +
    'ARM: ' + formatElementDebugInfo(wrestlerArm) + '\n' +
    'ARROW: ' + formatElementDebugInfo(wrestlerArrow);
}

function setPortraitFeatherDebugStatus(status) {
  portraitFeatherStatusText = status;
  updatePortraitFeatherDebugPanel();
}

// PERMANENT (not debug-only) - #wrestler's width is normally derived
// purely from its own CSS "aspect-ratio" (see style.css). Browser
// support for "aspect-ratio" varies by OS/browser version, and if it's
// ever unsupported, the wrestler's width silently collapses to 0 -
// which would make it (and everything inside it) invisible even
// though its height still renders fine, and would also feed a
// meaningless 0 into positionWrestlerNearFeather() above. This
// computes the exact same width "aspect-ratio: 2780 / 4171" would
// already produce and sets it explicitly, so on any browser where
// "aspect-ratio" already works this changes nothing (identical
// resulting number) - it can only matter on a browser where it
// doesn't. Scoped to tablet landscape AND tablet portrait, per "don't
// touch desktop/phone": on every other device this clears any
// leftover inline width and leaves the CSS "aspect-ratio" property in
// sole, untouched control, exactly as before.
function applyTabletWrestlerWidthFallback() {
  if (!isTabletLandscapeDevice() && !isTabletPortraitDevice()) {
    wrestler.style.width = '';
    return;
  }
  const heightPx = wrestler.getBoundingClientRect().height;
  if (heightPx > 0) {
    wrestler.style.width = (heightPx * (2780 / 4171)) + 'px';
  }
}

applyTabletWrestlerWidthFallback();
window.addEventListener('resize', applyTabletWrestlerWidthFallback);
window.addEventListener('orientationchange', applyTabletWrestlerWidthFallback);

// A fresh cross-page navigation (about.html's or interventions.html's
// title/icon, both linking back to "index.html?state=open-jar"), or
// even the very first paint of a brand-new visit, can occasionally
// catch the browser mid-transition, with window.innerWidth/innerHeight
// reporting a transient, not-yet-settled value at the exact moment the
// two checks above first ran (synchronously, at the very top of this
// file) - silently leaving "html.tablet-landscape" (and the tablet-only
// wrestler width fallback) un-applied for the rest of this page's life,
// even though the device's real orientation/size never changed. Re-
// running both one frame later, after the browser has had a chance to
// settle, fixes that silently and is a harmless no-op wherever the very
// first check already read correctly. Called once from
// beginHomeSequence() below - the single shared entry point for every
// way this page can start (a genuine fresh load, the "?state=open-jar"
// URL, the sessionStorage-based restore, and a bfcache "pageshow")-
// rather than being duplicated per branch, so every one of those is
// covered by this same, single check.
function refreshTabletLandscapeDetection() {
  requestAnimationFrame(() => {
    updateTabletLandscapeClass();
    applyTabletWrestlerWidthFallback();
  });
}

// TEMPORARY - now that wrestler/wrestlerBody/wrestlerArm/wrestlerArrow
// all exist, start refreshing the portrait debug panel for real.
updatePortraitFeatherDebugPanel();
setInterval(updatePortraitFeatherDebugPanel, 500);

// Preloads the four navigation object images (they already have "src"
// set from page load, so this mostly just waits for the download that's
// already under way) and decodes each one, so the jar is never allowed
// to open before all four are genuinely ready to paint - the actual
// cause of them ever appearing "one after another" in the past. Starts
// immediately, long before the wrestler/jar sequence could realistically
// reach the point of the visitor clicking the jar.
let navigationAssetsReady = false;

function preloadImage(img) {
  if (img.decode) return img.decode().catch(() => {}); // ignore decode errors - the browser still has the image ready to paint
  if (img.complete) return Promise.resolve();
  return new Promise((resolve) => {
    img.addEventListener('load', resolve, { once: true });
    img.addEventListener('error', resolve, { once: true });
  });
}

Promise.all(
  [objectFortuneTeller, objectTapeDispenser, objectBag, objectPortalHand].map(preloadImage)
).then(() => {
  navigationAssetsReady = true;
});

// Apply size, volume, and position settings from the variables above
pigeon.style.width = pigeonSize + 'px';
feather.style.width = featherSize + 'px';
cooingSound.volume = cooingVolume;
flappingSound.volume = wingVolume;
caughtSound.volume = pigeonCaughtVolume;
paperSound.volume = paperOpenVolume;
// #opening-text's position is pure CSS now (top/right + safe-area
// support - see "--logo-margin" in style.css), so there's nothing to
// set here.

// script.js is the source of truth for these timings, so push them into
// the matching CSS custom properties the wrestler's transitions use.
document.documentElement.style.setProperty('--wrestler-entrance-duration', wrestlerEntranceDuration + 'ms');
document.documentElement.style.setProperty('--arm-rotation-duration', armRotationDuration + 'ms');
document.documentElement.style.setProperty('--wrestler-exit-duration', wrestlerExitDuration + 'ms');

// Same idea for the jar's float and pop, and the four objects' float/reveal.
document.documentElement.style.setProperty('--jar-float-distance', jarFloatDistance + 'px');
document.documentElement.style.setProperty('--jar-float-duration', jarFloatDuration + 'ms');
document.documentElement.style.setProperty('--jar-open-pulse-duration', jarOpenPulseDuration + 'ms');
document.documentElement.style.setProperty('--jar-open-scale-duration', jarOpenScaleDuration + 'ms');
document.documentElement.style.setProperty('--object-float-distance', objectFloatDistance + 'px');
document.documentElement.style.setProperty('--object-reveal-duration', objectRevealDuration + 'ms');

// Place the pigeon just off the right edge of the screen right away,
// so it stays invisible (it also has opacity: 0 in the CSS) until the
// flight animation begins.
pigeon.style.left = (window.innerWidth + pigeonStartXBuffer) + 'px';
pigeon.style.top = (pigeonStartY / 100) * window.innerHeight + 'px';

// Quietly start loading the front-facing pigeon image in the background,
// well before it's ever needed. Once it's loaded we know its natural
// width/height, which lets us size the frozen pigeon correctly the
// very first time it's caught (instead of guessing and correcting later).
let pigeonFrontAspectRatio = null;
const pigeonFrontPreload = new Image();
pigeonFrontPreload.addEventListener('load', () => {
  pigeonFrontAspectRatio = pigeonFrontPreload.naturalHeight / pigeonFrontPreload.naturalWidth;
});
pigeonFrontPreload.src = 'assets/images/pigeon-front.png';


/* --------------------------------------------------------------------
   STATE VARIABLES
   These track what's currently happening, so the rest of the code
   knows whether the pigeon is flying, caught, being dragged, etc.
   -------------------------------------------------------------------- */
let sequenceStarted = false;   // has the opening sequence begun?
let featherReleased = false;   // has the feather separated from the pigeon yet, this flight?
let featherAnimationId = null; // the feather's current requestAnimationFrame id, so its fall can be cancelled

// The pigeon's own flight, lifted out of a single function so it can be
// paused (when caught) and resumed (if released early) instead of only
// ever running start-to-finish in one go.
let flightStartTime = 0;
let flightStartX = 0, flightEndX = 0, flightStartY = 0, flightEndY = 0;
let activeFlightDuration = flightDuration;
let flightAnimationId = null;
let isFlightPaused = false;
let flightPausedElapsed = 0;       // how far into the flight we were, at the moment of catching
let currentPigeonX = 0, currentPigeonY = 0; // the pigeon's last-drawn position (always kept up to date)

// 'idle'   -> not currently flying, can't be caught
// 'flying' -> in the air, catchable
// 'caught' -> frozen and/or being dragged by a pointer
// 'success'-> held for the full 3 seconds, sequence complete
let pigeonState = 'idle';

let activePointerId = null;    // which pointer (finger/mouse) is currently holding the pigeon
let grabOffsetX = 0, grabOffsetY = 0; // where on the pigeon it was grabbed, so it doesn't snap to the pointer
let holdTimer = null;          // the 3-second timer, so it can be cancelled on early release

// The feather's state after it lands, through the wrestler sequence:
// 'idle'     -> still falling, or the pigeon was caught instead (not clickable)
// 'landed'   -> resting, waiting to be clicked to summon the wrestler
// 'rising'   -> wrestler is rising; feather waits, not yet draggable
// 'ready'    -> wrestler has risen; feather floats and can be picked up
// 'dragging' -> being actively dragged by a pointer
// 'done'     -> tickle succeeded; feather is hidden for good
let featherState = 'idle';

let featherActivePointerId = null;
let featherGrabOffsetX = 0, featherGrabOffsetY = 0;
let featherCurrentX = 0, featherCurrentY = 0;

// Tracks whether the feather is being actively moved back and forth
// (not just held still) while overlapping the armpit - see
// updateTickleProgress() in the WRESTLER section below.
let tickleAccumulated = 0;       // ms of valid tickling accumulated so far
let tickleAnimationId = null;
let tickleLastX = 0;
let tickleLastDirection = 0;     // -1, 0, or 1
let tickleLastWiggleTime = 0;    // performance.now() of the last detected direction change
let tickleLastFrameTime = 0;


/* --------------------------------------------------------------------
   STEP 1: TRY TO START THE SEQUENCE AUTOMATICALLY
   Browsers often block audio from playing automatically.
   We try to play the cooing sound right away. If that works, the
   sequence begins immediately. If it's blocked, we wait for a click.
   -------------------------------------------------------------------- */
function tryAutoplay() {
  const playPromise = cooingSound.play();

  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        // Autoplay worked - begin the sequence
        startSequence();
      })
      .catch(() => {
        // Autoplay was blocked - ask the visitor to click anywhere
        showClickMessage();
      });
  }
}

function showClickMessage() {
  clickMessage.classList.add('visible');
  document.addEventListener('click', handleFirstClick);
}

// Mobile Safari only unlocks a given <audio> element the first time
// IT (not some other element) is play()'d directly inside a genuine
// user gesture's call stack. Without this, flappingSound's first real
// play() call - inside startPigeonFlight(), reached via setTimeout -
// happens too far removed from this click to count, and gets silently
// blocked. Playing it here (muted, then immediately stopped and reset)
// "spends" that unlock right away without anything audible, so the
// real play() later in startPigeonFlight() is allowed through.
// "muted" (not just "volume = 0") is what actually keeps this silent -
// iPhone Safari specifically ignores JavaScript's "volume" on <audio>
// elements entirely (it's tied to the hardware volume there instead),
// so the old "volume = 0" alone still played this unlock call at full,
// audible volume on iPhone only - a real flap sound heard right at the
// click, before the pigeon itself ever appears. "muted" is a separate
// property Safari does honour on every device, iPhone included, so
// this unlock stays genuinely silent everywhere - iPad/desktop, where
// "volume = 0" already worked, sound exactly the same as before.
function unlockFlappingSound() {
  const originalVolume = flappingSound.volume;
  flappingSound.volume = 0;
  flappingSound.muted = true;

  const unlockPromise = flappingSound.play();

  function resetAfterUnlock() {
    flappingSound.pause();
    flappingSound.currentTime = 0;
    flappingSound.volume = originalVolume;
    flappingSound.muted = false;
  }

  if (unlockPromise !== undefined) {
    unlockPromise.then(resetAfterUnlock).catch(resetAfterUnlock);
  } else {
    resetAfterUnlock();
  }
}

function handleFirstClick() {
  document.removeEventListener('click', handleFirstClick);
  clickMessage.classList.remove('visible');
  cooingSound.play().catch(() => {});
  unlockFlappingSound();
  startSequence();
}


/* --------------------------------------------------------------------
   STEP 2: START THE SEQUENCE
   Waits "initialDelay", then starts the pigeon's flight.
   -------------------------------------------------------------------- */
function startSequence() {
  if (sequenceStarted) return;
  sequenceStarted = true;

  scheduleTimeout(startPigeonFlight, initialDelay);
}


/* --------------------------------------------------------------------
   STEP 3: PIGEON FLIGHT
   Animates the pigeon flying from outside the right edge to outside
   the left edge, with a subtle natural up/down wobble. The pigeon can
   be caught mid-flight (see the PIGEON CATCHING section below), which
   pauses this same animation rather than replacing it.
   -------------------------------------------------------------------- */
function startPigeonFlight() {
  // Reveal the pigeon at the exact moment the flight begins
  // (it was invisible via CSS opacity: 0 up until now)
  pigeon.style.opacity = '1';
  pigeon.style.pointerEvents = 'auto'; // catchable while flying
  pigeonState = 'flying';

  // Play the wing flapping sound for the duration of the flight.
  // "volume" is reset explicitly here (not just left to
  // unlockFlappingSound()'s own cleanup) in case that unlock is still
  // mid-flight itself when this runs.
  flappingSound.currentTime = 0;
  flappingSound.volume = wingVolume;
  flappingSound.play().catch(() => {});

  flightStartX = window.innerWidth + pigeonStartXBuffer;   // fully off the right edge
  flightEndX = -pigeonSize - pigeonEndXBuffer;              // fully off the left edge
  flightStartY = (pigeonStartY / 100) * window.innerHeight;
  flightEndY = (pigeonEndY / 100) * window.innerHeight;
  activeFlightDuration = flightDuration;

  flightStartTime = performance.now();
  featherReleased = false;
  isFlightPaused = false;

  flightAnimationId = requestAnimationFrame(animateFlight);
}

function animateFlight(now) {
  // If the pigeon has been caught, freeze right here - don't compute a
  // new position and don't schedule another frame.
  if (isFlightPaused) return;

  const elapsed = now - flightStartTime;
  let progress = elapsed / activeFlightDuration; // goes from 0 to 1
  if (progress > 1) progress = 1;

  // Horizontal movement: a straight line from the start point to the end point
  const x = flightStartX + (flightEndX - flightStartX) * progress;

  // Vertical movement: a gentle line from start to end,
  // plus a soft wave so the flight doesn't look mechanical
  const wave = Math.sin(progress * Math.PI * 2) * pigeonWobbleAmount;
  const y = flightStartY + (flightEndY - flightStartY) * progress + wave;

  currentPigeonX = x;
  currentPigeonY = y;
  pigeon.style.left = x + 'px';
  pigeon.style.top = y + 'px';

  // Release the feather once we reach "releasePosition" in the flight.
  // The release point is calculated from the pigeon's CURRENT on-screen
  // position (x, y), plus a small offset into its body - so the feather
  // always comes from the pigeon itself, not a fixed screen location.
  if (!featherReleased && progress >= releasePosition) {
    featherReleased = true;
    const releaseX = x + pigeon.offsetWidth * featherReleaseOffsetX;
    const releaseY = y + pigeon.offsetHeight * featherReleaseOffsetY;
    releaseFeather(releaseX, releaseY);
  }

  if (progress < 1) {
    flightAnimationId = requestAnimationFrame(animateFlight);
  } else {
    // The flight finished naturally - the pigeon has flown off-screen
    // and can't be caught again until it flies once more.
    pigeonState = 'idle';
    pigeon.style.pointerEvents = 'none';
  }
}


/* --------------------------------------------------------------------
   STEP 4: FEATHER RELEASE AND FALL
   The feather appears at the pigeon's current position, then drifts
   and rotates gently down to "landingPosition".
   -------------------------------------------------------------------- */
function releaseFeather(anchorX, anchorY) {
  // The feather's own size, used to center it on the release point
  // instead of anchoring it by its top-left corner.
  const featherWidth = feather.offsetWidth;
  const featherHeight = feather.offsetHeight;

  feather.style.left = (anchorX - featherWidth / 2) + 'px';
  feather.style.top = (anchorY - featherHeight / 2) + 'px';
  feather.style.opacity = '1';

  const fallStartTime = performance.now();
  const fallStartY = anchorY;
  const fallEndY = (landingPosition / 100) * window.innerHeight;

  function animateFall(now) {
    const elapsed = now - fallStartTime;
    let progress = elapsed / featherFallDuration; // goes from 0 to 1
    if (progress > 1) progress = 1;

    // Falling motion: straight down from the release point to the landing spot
    const y = fallStartY + (fallEndY - fallStartY) * progress;

    // Gentle left/right drift, which settles down as the feather gets closer to landing
    const drift = Math.sin(progress * Math.PI * 3) * featherDriftDistance * (1 - progress);
    const x = anchorX + drift;

    // Gentle rotation while falling
    const rotation = Math.sin(progress * Math.PI * 2) * featherRotationAmount;

    feather.style.left = (x - featherWidth / 2) + 'px';
    feather.style.top = (y - featherHeight / 2) + 'px';
    feather.style.transform = 'rotate(' + rotation + 'deg)';

    if (progress < 1) {
      featherAnimationId = requestAnimationFrame(animateFall);
    } else {
      // The feather has landed - fade in the text after a short pause
      scheduleTimeout(fadeInText, textFadeDelay);

      // Remember the exact landing tilt (used later by the "floating"
      // animation, so it doesn't undo this natural-looking angle), and
      // make the feather clickable - this is what makes the wrestler
      // sequence available (see the WRESTLER section further down).
      feather.style.setProperty('--feather-landing-rotation', rotation + 'deg');
      featherState = 'landed';
      feather.style.pointerEvents = 'auto';
      feather.style.cursor = 'pointer';

      // On desktop landscape screens, line the (still-hidden) wrestler up
      // next to where the feather actually landed (see the WRESTLER
      // section below for positionWrestlerNearFeather()).
      positionWrestlerNearFeather(parseFloat(feather.style.left));

      // After a short pause, start a quiet idle float so the landed
      // feather doesn't look completely inert - a hint that it's still
      // clickable. Guarded in case it's already been clicked by then.
      scheduleTimeout(() => {
        if (featherState !== 'landed') return;
        feather.classList.add('floating');
      }, featherLandedFloatDelay);
    }
  }

  featherAnimationId = requestAnimationFrame(animateFall);
}


/* --------------------------------------------------------------------
   STEP 5: FADE IN THE TEXT
   A simple opacity fade, handled by the CSS transition on #opening-text.
   -------------------------------------------------------------------- */
function fadeInText() {
  openingText.style.opacity = '1';
}


/* --------------------------------------------------------------------
   STEP 6: PIGEON CATCHING
   Lets the visitor press-and-hold the flying pigeon. Holding it freezes
   it (front-facing) and lets you drag it around; holding continuously
   for "pigeonHoldDuration" reveals the note. Releasing early sends it
   back into the same flight it was interrupted from.
   -------------------------------------------------------------------- */

// Restarts a one-shot sound from the beginning and plays it, without
// letting a blocked/rejected play() call cause a console error.
function playOneShotSound(audioElement, volume) {
  try {
    audioElement.currentTime = 0;
    audioElement.volume = volume;
    const playResult = audioElement.play();
    if (playResult !== undefined) {
      playResult.catch(() => {});
    }
  } catch (error) {
    // If the sound can't play for any reason, the visual interaction still works.
  }
}

// Works out how wide the frozen front-facing pigeon should be right now -
// capped so it never gets awkwardly large on small screens.
function getPigeonFrontWidth() {
  return Math.min(pigeonFrontSize, window.innerWidth * pigeonFrontMaxViewportPercent);
}

// Keeps the pigeon's current position fully inside the viewport.
// Used both when it's first caught and while it's being dragged.
function clampPigeonPosition() {
  const maxLeft = Math.max(0, window.innerWidth - pigeon.offsetWidth);
  const maxTop = Math.max(0, window.innerHeight - pigeon.offsetHeight);
  currentPigeonX = Math.min(Math.max(currentPigeonX, 0), maxLeft);
  currentPigeonY = Math.min(Math.max(currentPigeonY, 0), maxTop);
}

// Removes the drag/release listeners and clears the hold timer.
// Called whenever a hold ends, whichever way it ends.
function cleanupDragListeners() {
  clearTimeout(holdTimer);
  holdTimer = null;
  pigeon.removeEventListener('pointermove', handlePigeonPointerMove);
  pigeon.removeEventListener('pointerup', handlePigeonPointerUp);
  pigeon.removeEventListener('pointercancel', handlePigeonPointerUp);
  pigeon.removeEventListener('lostpointercapture', handlePigeonPointerUp);
}

function handlePigeonPointerDown(event) {
  if (pigeonState !== 'flying') return;

  // Stop the browser's own image-drag/ghost-image/text-selection behaviour
  event.preventDefault();

  // Freeze the flight animation at its exact current position
  isFlightPaused = true;
  cancelAnimationFrame(flightAnimationId);
  flightPausedElapsed = performance.now() - flightStartTime;
  pigeonState = 'caught';

  flappingSound.pause();

  // Find the pigeon's current on-screen centre using the side-view size,
  // BEFORE switching images, so the front-facing pigeon can be centred
  // on the exact same spot despite having different proportions.
  const oldCenterX = currentPigeonX + pigeon.offsetWidth / 2;
  const oldCenterY = currentPigeonY + pigeon.offsetHeight / 2;

  pigeon.src = 'assets/images/pigeon-front.png';
  const frontWidth = getPigeonFrontWidth();
  const frontHeight = frontWidth * (pigeonFrontAspectRatio || 1);
  pigeon.style.width = frontWidth + 'px';

  currentPigeonX = oldCenterX - frontWidth / 2;
  currentPigeonY = oldCenterY - frontHeight / 2;
  clampPigeonPosition();
  pigeon.style.left = currentPigeonX + 'px';
  pigeon.style.top = currentPigeonY + 'px';

  // Remember exactly where on the pigeon it was grabbed, so dragging
  // moves it without snapping its centre (or corner) to the pointer.
  grabOffsetX = event.clientX - currentPigeonX;
  grabOffsetY = event.clientY - currentPigeonY;

  playOneShotSound(caughtSound, pigeonCaughtVolume);

  // Track this pointer specifically, and keep receiving its events even
  // if it moves quickly or leaves the pigeon's own boundaries.
  activePointerId = event.pointerId;
  pigeon.setPointerCapture(activePointerId);
  pigeon.addEventListener('pointermove', handlePigeonPointerMove);
  pigeon.addEventListener('pointerup', handlePigeonPointerUp);
  pigeon.addEventListener('pointercancel', handlePigeonPointerUp);
  pigeon.addEventListener('lostpointercapture', handlePigeonPointerUp);

  // Start the 3-second hold timer. It begins the moment the catch happens.
  holdTimer = setTimeout(handleHoldSuccess, pigeonHoldDuration);
}

function handlePigeonPointerMove(event) {
  if (pigeonState !== 'caught' || event.pointerId !== activePointerId) return;

  // Follow the pointer directly - no smoothing, easing, or delay -
  // while preserving the original grab offset.
  currentPigeonX = event.clientX - grabOffsetX;
  currentPigeonY = event.clientY - grabOffsetY;
  clampPigeonPosition();
  pigeon.style.left = currentPigeonX + 'px';
  pigeon.style.top = currentPigeonY + 'px';
}

function handlePigeonPointerUp(event) {
  if (pigeonState !== 'caught' || event.pointerId !== activePointerId) return;
  endHold();
}

// Ends a hold that was interrupted (released early, pointer lost, tab
// hidden, window blurred, etc). Safe to call more than once - it does
// nothing unless the pigeon is currently caught.
function endHold() {
  if (pigeonState !== 'caught') return;

  cleanupDragListeners();
  try {
    if (activePointerId !== null) pigeon.releasePointerCapture(activePointerId);
  } catch (error) {
    // the pointer may already be released - that's fine
  }
  activePointerId = null;

  revertToFlying();
}

// Switches the pigeon back to the flying side-view image, centred on
// wherever it was released, and continues the flight from there in the
// same direction it was already travelling - not from the very start.
function revertToFlying() {
  pigeonState = 'flying';

  const oldCenterX = currentPigeonX + pigeon.offsetWidth / 2;
  const oldCenterY = currentPigeonY + pigeon.offsetHeight / 2;

  pigeon.src = 'assets/images/pigeon.png';
  pigeon.style.width = pigeonSize + 'px';
  const newHeight = pigeon.offsetHeight;

  currentPigeonX = oldCenterX - pigeonSize / 2;
  currentPigeonY = oldCenterY - newHeight / 2;
  clampPigeonPosition();
  pigeon.style.left = currentPigeonX + 'px';
  pigeon.style.top = currentPigeonY + 'px';

  flappingSound.play().catch(() => {});

  // Continue toward the same exit point as before, over whatever time
  // was left in the flight (with a minimum, so a long hold doesn't leave
  // an almost-instant flight).
  flightStartX = currentPigeonX;
  flightStartY = currentPigeonY;
  activeFlightDuration = Math.max(flightDuration - flightPausedElapsed, minimumResumeFlightDuration);
  flightStartTime = performance.now();
  isFlightPaused = false;

  flightAnimationId = requestAnimationFrame(animateFlight);
}

// Called automatically when the hold timer reaches "pigeonHoldDuration"
// while the same pointer is still holding the pigeon.
function handleHoldSuccess() {
  if (pigeonState !== 'caught') return;
  pigeonState = 'success';
  holdTimer = null;

  cleanupDragListeners();
  try {
    if (activePointerId !== null) pigeon.releasePointerCapture(activePointerId);
  } catch (error) {
    // the pointer may already be released - that's fine
  }
  activePointerId = null;

  // The pigeon simply disappears - direct and literal, no extra animation.
  pigeon.style.opacity = '0';
  pigeon.style.pointerEvents = 'none';

  // Stop any feather fall still in progress (it may not have landed yet)
  // and hide the feather at the same moment, so it can't keep animating
  // or reappear once the paper is visible. Resetting featherState to
  // 'idle' also makes sure the wrestler sequence (only meant for when
  // the pigeon flies away uncaught) can't be triggered afterwards.
  cancelAnimationFrame(featherAnimationId);
  feather.style.opacity = '0';
  feather.style.pointerEvents = 'none';
  featherState = 'idle';

  // The title's fade-in normally only happens once the feather finishes
  // falling naturally - but cancelling the feather above can skip that
  // before it ever runs. Calling it here guarantees the title is visible
  // once the paper appears, even if the feather was still mid-fall.
  // (If it already faded in, this simply has no effect.)
  fadeInText();

  paperContainer.classList.add('visible');
  playOneShotSound(paperSound, paperOpenVolume);
}

// The pigeon is only catchable while flying; this listener is attached
// once and reused for every flight, rather than being re-added each time.
pigeon.addEventListener('pointerdown', handlePigeonPointerDown);

// Safety nets: if the hold is interrupted in a way that doesn't fire a
// normal pointerup/pointercancel event (losing window focus, switching
// tabs), release the pigeon instead of leaving it stuck frozen forever.
window.addEventListener('blur', () => endHold());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) endHold();
});


/* --------------------------------------------------------------------
   STEP 7: THE WRESTLER
   Clicking the landed feather (only possible once the pigeon has flown
   away uncaught) summons the wrestler up from below the viewport. Once
   risen, the feather can be dragged; wiggling it at the armpit for
   "tickleDuration" makes the wrestler react, then spins the arm one
   full turn, swapping the empty hand for a jar mid-spin.
   -------------------------------------------------------------------- */

// On desktop landscape screens, positions the (still off-screen)
// wrestler so its right edge sits "wrestlerFeatherGap" px to the left
// of the landed feather - instead of the fixed CSS position, which is
// too far left on wide screens. Mobile/portrait screens are left alone,
// keeping the existing --wrestler-horizontal-position from style.css.
function positionWrestlerNearFeather(featherLeftEdge) {
  const isDesktopLandscape =
    window.innerWidth >= desktopLandscapeMinWidth &&
    window.innerWidth > window.innerHeight;
  if (!isDesktopLandscape) return;

  const wrestlerWidth = wrestler.offsetWidth;

  // Defensive: if the wrestler's own width ever reads as 0 (e.g. on a
  // browser where the CSS "aspect-ratio" it relies on isn't supported),
  // computing "left" from it would place the wrestler using a
  // meaningless number instead of leaving it on its correct CSS
  // fallback position (--wrestler-horizontal-position) - skip
  // repositioning entirely rather than risk that. See
  // applyTabletWrestlerWidthFallback() further down for the actual
  // width fix on iPad; this is just a safety net around it.
  if (!wrestlerWidth) return;

  let left = featherLeftEdge - wrestlerFeatherGap - wrestlerWidth;

  // Clamp so neither the wrestler nor the arm's rotation swing can reach
  // past the left or right edge of the screen.
  const minLeft = wrestlerMinLeftMargin;
  const maxLeft = Math.max(minLeft, window.innerWidth * (1 - wrestlerRightClearance) - wrestlerWidth);
  left = Math.min(Math.max(left, minLeft), maxLeft);

  wrestler.style.left = left + 'px';
}

// Points the arrow at the armpit hit area's current on-screen centre.
// Reads its position fresh each time (getBoundingClientRect) instead of
// duplicating any coordinates, so it stays correct however the wrestler
// ends up positioned/sized - including the desktop-landscape repositioning
// above and any viewport resize. The tail is anchored "--arrow-tail-
// offset-x/y" (from style.css) away from that same fixed point, so the
// arrow's length and rotation are simply worked out from the triangle
// between the two (Math.hypot for the length, Math.atan2 for the angle)
// - the tail position is never turned into a separate, hand-picked
// length/rotation pair.
function positionWrestlerArrow() {
  const armpitRect = armpitHitArea.getBoundingClientRect();
  const armpitCenterX = armpitRect.left + armpitRect.width / 2;
  const armpitCenterY = armpitRect.top + armpitRect.height / 2;

  const rootStyle = getComputedStyle(document.documentElement);
  const tailOffsetX = parseFloat(rootStyle.getPropertyValue('--arrow-tail-offset-x'));
  const tailOffsetY = parseFloat(rootStyle.getPropertyValue('--arrow-tail-offset-y'));

  const arrowLength = Math.hypot(tailOffsetX, tailOffsetY);
  const arrowAngle = Math.atan2(-tailOffsetY, -tailOffsetX) * (180 / Math.PI);

  wrestlerArrow.style.width = arrowLength + 'px';
  wrestlerArrow.style.transform = 'rotate(' + arrowAngle + 'deg)';
  wrestlerArrow.style.left = (armpitCenterX - arrowLength) + 'px';
  wrestlerArrow.style.top = (armpitCenterY - 1) + 'px'; // 1 = half the arrow's own 2px height, so it's vertically centred on the target point
}

window.addEventListener('resize', () => {
  if (wrestlerArrow.classList.contains('visible')) positionWrestlerArrow();
});

// A tap/click on the landed feather. Also doubles as the start of a
// drag once the feather is "ready" - see the branches below.
function handleFeatherPointerDown(event) {
  setPortraitFeatherDebugStatus('POINTERDOWN');

  if (featherState === 'landed') {
    // Don't let this reach any page-wide click handler.
    event.stopPropagation();
    startWrestlerEntrance();
    return;
  }

  if (featherState === 'ready') {
    startFeatherDrag(event);
  }
}

function startWrestlerEntrance() {
  if (featherState !== 'landed') return;

  setPortraitFeatherDebugStatus('SCENE TRIGGERED');

  featherState = 'rising';
  feather.style.pointerEvents = 'none'; // not draggable while the wrestler rises
  feather.classList.remove('floating'); // stop the landed-state idle float

  wrestler.classList.add('risen'); // triggers the CSS entrance transition

  scheduleTimeout(() => {
    if (featherState !== 'rising') return; // safety guard, in case something else changed state
    scheduleTimeout(makeFeatherReady, wrestlerReadyDelay);
  }, wrestlerEntranceDuration);
}

function makeFeatherReady() {
  if (featherState !== 'rising') return;

  featherState = 'ready';
  feather.style.pointerEvents = 'auto';
  feather.style.cursor = 'grab';
  feather.classList.add('floating');
  positionWrestlerArrow();
  wrestlerArrow.classList.add('visible');
}


/* --- Dragging the feather (mirrors the pigeon's own drag handling) --- */

function startFeatherDrag(event) {
  event.preventDefault(); // stop native image drag / text selection

  featherState = 'dragging';
  feather.classList.remove('floating');
  feather.style.cursor = 'grabbing';
  wrestlerArrow.classList.remove('visible');

  featherCurrentX = parseFloat(feather.style.left) || 0;
  featherCurrentY = parseFloat(feather.style.top) || 0;

  featherGrabOffsetX = event.clientX - featherCurrentX;
  featherGrabOffsetY = event.clientY - featherCurrentY;

  featherActivePointerId = event.pointerId;
  feather.setPointerCapture(featherActivePointerId);
  feather.addEventListener('pointermove', handleFeatherPointerMove);
  feather.addEventListener('pointerup', handleFeatherPointerUp);
  feather.addEventListener('pointercancel', handleFeatherPointerUp);
  feather.addEventListener('lostpointercapture', handleFeatherPointerUp);

  // Reset the wiggle tracker for this drag and start watching for tickling.
  tickleLastX = featherCurrentX;
  tickleLastDirection = 0;
  tickleLastWiggleTime = 0;
  tickleLastFrameTime = performance.now();
  tickleAnimationId = requestAnimationFrame(updateTickleProgress);
}

// Keeps the feather fully inside the viewport while dragging.
function clampFeatherPosition() {
  const maxLeft = Math.max(0, window.innerWidth - feather.offsetWidth);
  const maxTop = Math.max(0, window.innerHeight - feather.offsetHeight);
  featherCurrentX = Math.min(Math.max(featherCurrentX, 0), maxLeft);
  featherCurrentY = Math.min(Math.max(featherCurrentY, 0), maxTop);
}

function handleFeatherPointerMove(event) {
  if (featherState !== 'dragging' || event.pointerId !== featherActivePointerId) return;

  // Follow the pointer directly, preserving the original grab offset -
  // no smoothing, easing, or delay.
  featherCurrentX = event.clientX - featherGrabOffsetX;
  featherCurrentY = event.clientY - featherGrabOffsetY;
  clampFeatherPosition();
  feather.style.left = featherCurrentX + 'px';
  feather.style.top = featherCurrentY + 'px';
}

function handleFeatherPointerUp(event) {
  setPortraitFeatherDebugStatus('POINTERUP');

  if (featherState !== 'dragging' || event.pointerId !== featherActivePointerId) return;
  endFeatherDrag();
}

function cleanupFeatherDragListeners() {
  feather.removeEventListener('pointermove', handleFeatherPointerMove);
  feather.removeEventListener('pointerup', handleFeatherPointerUp);
  feather.removeEventListener('pointercancel', handleFeatherPointerUp);
  feather.removeEventListener('lostpointercapture', handleFeatherPointerUp);
}

// Ends a drag that didn't complete the tickle (released early, pointer
// lost, tab hidden, window blurred). Safe to call more than once - it
// does nothing unless the feather is currently being dragged. Whatever
// tickle progress was already accumulated is kept, ready to continue
// next time the feather is picked up.
function endFeatherDrag() {
  if (featherState !== 'dragging') return;

  cancelAnimationFrame(tickleAnimationId);
  wrestlerBody.classList.remove('shaking');
  cleanupFeatherDragListeners();
  try {
    if (featherActivePointerId !== null) feather.releasePointerCapture(featherActivePointerId);
  } catch (error) {
    // the pointer may already be released - that's fine
  }
  featherActivePointerId = null;

  featherState = 'ready';
  feather.style.cursor = 'grab';
  feather.classList.add('floating');
  positionWrestlerArrow();
  wrestlerArrow.classList.add('visible');
}


/* --- Tickling the armpit --- */

// True while the feather's box overlaps the armpit hit area's box.
function checkFeatherOverlapsArmpit() {
  const featherRect = feather.getBoundingClientRect();
  const armpitRect = armpitHitArea.getBoundingClientRect();
  return !(
    featherRect.right < armpitRect.left ||
    featherRect.left > armpitRect.right ||
    featherRect.bottom < armpitRect.top ||
    featherRect.top > armpitRect.bottom
  );
}

// Runs every frame while the feather is being dragged. Tickle time only
// accumulates when the feather is both overlapping the armpit AND has
// changed horizontal direction recently (holding it still, or dragging
// it steadily in one direction, doesn't count).
function updateTickleProgress(now) {
  if (featherState !== 'dragging') return;

  const dt = now - tickleLastFrameTime;
  tickleLastFrameTime = now;

  const deltaX = featherCurrentX - tickleLastX;
  tickleLastX = featherCurrentX;

  if (Math.abs(deltaX) > tickleWiggleThreshold) {
    const direction = Math.sign(deltaX);
    if (tickleLastDirection !== 0 && direction !== tickleLastDirection) {
      tickleLastWiggleTime = now; // direction just reversed - this is a "wiggle"
    }
    tickleLastDirection = direction;
  }

  const isWigglingNow = (now - tickleLastWiggleTime) < tickleWiggleWindow;
  const isOverArmpit = checkFeatherOverlapsArmpit();

  if (isWigglingNow && isOverArmpit) {
    tickleAccumulated += dt;
    wrestlerBody.classList.add('shaking');

    if (tickleAccumulated >= tickleDuration) {
      completeTickle();
      return;
    }
  } else {
    wrestlerBody.classList.remove('shaking');
  }

  tickleAnimationId = requestAnimationFrame(updateTickleProgress);
}

// Called once, the moment enough active tickling has been completed.
function completeTickle() {
  featherState = 'done';
  cancelAnimationFrame(tickleAnimationId);
  wrestlerBody.classList.remove('shaking');

  cleanupFeatherDragListeners();
  try {
    if (featherActivePointerId !== null) feather.releasePointerCapture(featherActivePointerId);
  } catch (error) {
    // the pointer may already be released - that's fine
  }
  featherActivePointerId = null;

  // Hide the feather and arrow for good.
  feather.style.opacity = '0';
  feather.style.pointerEvents = 'none';
  wrestlerArrow.classList.remove('visible');

  startArmRotation();
}


/* --- The arm's one full rotation --- */

function startArmRotation() {
  wrestlerArm.classList.add('rotating');

  // Swap the hand for the jar partway through the spin, timed to land
  // while the hand is off-screen (pointing down, behind the viewport).
  scheduleTimeout(() => {
    wrestlerArm.src = 'assets/images/ticklish-wrestler-arm-jar.png';
  }, armRotationDuration * armSwapFraction);

  // Once the rotation finishes, the wrestler stays frozen holding the
  // jar - rotate(-360deg) looks identical to rotate(0deg), so nothing
  // needs to be reset or snapped back - then the jar hands off to its
  // own element and the wrestler leaves (see startWrestlerExit() below).
  scheduleTimeout(startWrestlerExit, armRotationDuration);
}


/* --- The jar hand-off and the wrestler's exit --- */

// Copies the jar image exactly over the jar currently visible inside
// #wrestler-arm, reading that image's own rendered bounding rectangle
// (never a separate/estimated position) - the two images share the
// same artboard, so matching position and size is all it takes to line
// them up pixel-for-pixel with no visible jump. Then swaps #wrestler-arm
// to the "released" (empty cupped hand) image underneath it, so the jar
// appears to detach and rest independently in the hand.
function handOffJar() {
  const armRect = wrestlerArm.getBoundingClientRect();
  wrestlerJar.style.left = armRect.left + 'px';
  wrestlerJar.style.top = armRect.top + 'px';
  wrestlerJar.style.width = armRect.width + 'px';
  wrestlerJar.style.height = armRect.height + 'px';
  wrestlerJar.classList.add('visible');

  wrestlerArm.src = 'assets/images/ticklish-wrestler-arm-released.png';
}

// Hands the jar off to its own independent element, starts #wrestler's
// downward exit slide, and schedules what comes after it finishes -
// the actual body of "startWrestlerExit" below. Pulled into its own
// function so "wrestlerExitDuration" is always measured from the exact
// moment the exit transition truly starts, even on iPhone portrait,
// where that moment can now be a few milliseconds later than usual
// (see "startWrestlerExit"'s own comment on why).
function beginWrestlerExit() {
  handOffJar();
  wrestler.classList.add('exiting'); // triggers the CSS exit transition

  scheduleTimeout(() => {
    // Safety net: #wrestler is already "pointer-events: none", but
    // this makes sure nothing left off-screen can ever be in the way.
    wrestler.style.display = 'none';

    scheduleTimeout(startJarCloseup, jarZoomDelay);
  }, wrestlerExitDuration);
}

// Runs once the arm's rotation has fully finished. Holds the final pose
// for "wrestlerExitDelay", hands off the jar to its own independent
// element, then immediately slides the whole wrestler (body + released
// arm) back down off-screen over "wrestlerExitDuration" - the jar is
// never inside #wrestler, so it stays exactly where it was left behind.
//
// iPhone portrait only: "handOffJar()" swaps "#wrestler-arm"'s own
// image to the released (empty-hand) one in the same instant it hands
// the jar off to its own fixed-position element - but swapping an
// <img>'s "src" only repaints once the new image has actually loaded,
// while "#wrestler" (the arm's own parent) starts sliding down
// immediately. If the released-hand image hasn't loaded yet at that
// exact moment (routine on a phone, where this whole sequence usually
// only ever runs once per visit, so there's no earlier chance for the
// browser to have cached it), "#wrestler-arm" keeps showing its old
// "holding the jar" bitmap for a few frames while it slides down with
// the rest of "#wrestler" - a stale, illusory second jar riding along
// with the exit, even though the real, independent "#wrestler-jar" is
// already correctly fixed in place from the very first frame. Loading
// the released-hand image on a detached "Image()" first, and only
// starting the hand-off/exit once it's actually decoded and ready to
// paint, closes that gap - everywhere else (desktop, iPad, iPhone
// landscape), "beginWrestlerExit()" still runs exactly as it always
// has, synchronously, with no waiting.
function startWrestlerExit() {
  scheduleTimeout(() => {
    if (isPhonePortraitDevice()) {
      const releasedArmImage = new Image();
      releasedArmImage.src = 'assets/images/ticklish-wrestler-arm-released.png';
      if (typeof releasedArmImage.decode === 'function') {
        releasedArmImage.decode().then(beginWrestlerExit).catch(beginWrestlerExit);
      } else {
        beginWrestlerExit();
      }
    } else {
      beginWrestlerExit();
    }
  }, wrestlerExitDelay);
}

// Where the visible jar drawing sits within the shared 2780x4171
// artboard that #wrestler-jar renders (little-things-jar.png, same
// canvas as the wrestler/arm images) - a 377x377px square, measured
// directly from the source file. Fixed facts about that specific
// image, not designer-editable like the timings above.
const jarNativeCanvasWidth = 2780;
const jarNativeLeft = 825;
const jarNativeTop = 31;
const jarNativeSize = 377;

// Works out exactly where the visible jar drawing is on screen right
// now - using #wrestler-jar's current bounding rectangle plus the fixed
// source-image measurements above, never a guessed/separate position.
// #jar-wrapper's resting position is the exact centre of the viewport
// (see #jar-scene/#jar-wrapper in style.css: "left/top: 50%" of the
// full-viewport-sized #jar-scene, plus the wrapper's own permanent
// "translate(-50%, -50%)") - except on touch devices held in portrait,
// where that same CSS instead rests it over on the left half of the
// screen (see "portraitJarXFraction/YFraction" below). Either way, the
// one-time move-and-enlarge animation only needs an EXTRA translate
// (the old jar's centre minus wherever it's actually resting) plus a
// scale-down to the old size, transitioning both back to nothing at
// once - "one simple transition" that both moves and grows the jar
// simultaneously, ending exactly on that permanent resting position.
// Matches "--portrait-jar-x/y" in style.css (the "@media (hover: none)
// and (pointer: coarse) and (orientation: portrait)" block) - kept as
// one pair of numbers here so the one-time move-in animation below
// always ends up exactly on the same resting point the CSS itself
// defines, on both phone and iPad portrait.
const portraitJarXFraction = 0.31;
const portraitJarYFraction = 0.48;

function isPortraitTouch() {
  return window.matchMedia('(hover: none) and (pointer: coarse) and (orientation: portrait)').matches;
}

function startJarCloseup() {
  const jarRect = wrestlerJar.getBoundingClientRect();
  const scaleFactor = jarRect.width / jarNativeCanvasWidth;

  const visibleSize = jarNativeSize * scaleFactor;
  const visibleCenterX = jarRect.left + (jarNativeLeft + jarNativeSize / 2) * scaleFactor;
  const visibleCenterY = jarRect.top + (jarNativeTop + jarNativeSize / 2) * scaleFactor;

  // On touch devices held in portrait, the jar's permanent resting spot
  // is over on the left half of the screen instead of dead centre -
  // see "#jar-wrapper" in style.css.
  const targetCenterX = isPortraitTouch() ? window.innerWidth * portraitJarXFraction : window.innerWidth / 2;
  const targetCenterY = isPortraitTouch() ? window.innerHeight * portraitJarYFraction : window.innerHeight / 2;
  const targetSize = jarWrapper.offsetWidth; // the resolved --closed-jar-size (or --portrait-closed-jar-size in portrait), in px - still the size at this point, the grow to the "open" size only happens later, on click

  const startDeltaX = visibleCenterX - targetCenterX;
  const startDeltaY = visibleCenterY - targetCenterY;
  const startScale = visibleSize / targetSize;

  jarWrapper.style.transition = 'none';
  jarWrapper.style.transform = 'translate(-50%, -50%) translate(' + startDeltaX + 'px, ' + startDeltaY + 'px) scale(' + startScale + ')';
  jarWrapper.classList.add('visible');

  // The enlarged jar now covers the old one exactly - safe to hide it.
  wrestlerJar.classList.remove('visible');

  // Wait a couple of frames so the browser actually paints the starting
  // position/size above before animating away from it - changing the
  // transition and the target transform in the very same tick could
  // otherwise skip the animation entirely.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      jarWrapper.style.transition = 'transform ' + jarZoomDuration + 'ms ease-in-out';
      jarWrapper.style.transform = 'translate(-50%, -50%)'; // back to the permanent resting transform

      scheduleTimeout(() => {
        // Done moving - clear the inline override so the wrapper's
        // resting position is purely the static CSS rule again, then
        // hand off to the idle float (see startJarFloating() below).
        jarWrapper.style.transition = '';
        jarWrapper.style.transform = '';
        startJarFloating();
      }, jarZoomDuration);
    });
  });
}


/* --------------------------------------------------------------------
   STEP 8: THE JAR OPENS
   Once the enlarged closed jar settles at the centre of the screen, it
   gently floats and can be clicked. Clicking swaps in the open-jar
   image with a quick pop, then the four "little things" objects grow
   out of it one after another into their own resting spots, where they
   float gently in place.
   -------------------------------------------------------------------- */

let jarState = 'zooming'; // 'zooming' -> 'floating' (clickable) -> 'opening' -> 'open'

// Starts the jar's idle float and makes it clickable. Called once the
// enlarge-and-move-to-centre animation above has finished.
function startJarFloating() {
  jarVisual.classList.add('floating');
  jarState = 'floating';
}

// A click/tap on the settled, floating closed jar.
function handleJarClick() {
  console.log('enlarged jar clicked'); // temporary - confirms the click/tap is actually reaching this handler
  if (jarState !== 'floating') return; // ignore clicks before it's ready, or once it's already opening
  if (!navigationAssetsReady) return; // the four objects must be fully preloaded/decoded before the jar is allowed to open
  jarState = 'opening';

  // Safety net: makes sure no stale cursor-following tooltip can carry
  // over into the reveal - it isn't allowed to reappear until the
  // objects are ".settled" (see the pointerenter/pointermove guards
  // further down, and the desktop-only pointer-events rule in
  // style.css this backs up).
  hideTooltip();
  objectTooltip.textContent = '';

  jarVisual.classList.remove('floating'); // stops the floating animation immediately

  // A short, direct "pop" instead of anything cinematic - which image
  // is visible swaps partway through it, so the change lands while the
  // jar is at its smallest and least noticeable. "object-fit: contain"
  // on both images (see style.css) means this swap alone can never
  // change the jar's displayed size or centre - the grow to
  // --open-jar-size right after is a separate, deliberate step
  // (".open" below), and stays that size for good.
  jarVisual.classList.add('opening');
  scheduleTimeout(() => {
    jarClosedImg.style.opacity = '0';
    jarOpenImg.style.opacity = '1';
    jarWrapper.classList.add('open'); // grows outward from the jar's fixed centre - never removed, so it stays this size
  }, jarOpenPulseDuration / 2);

  scheduleTimeout(() => {
    startJarFloating(); // the open jar keeps floating too, once settled
    revealObjects();
  }, jarOpenPulseDuration / 2 + jarOpenScaleDuration);
}

jarWrapper.addEventListener('click', handleJarClick);

// The "about the project" overlay - see "#about-overlay" in
// index.html/style.css. Opens in place of navigating to about.html:
// this page's own DOM (the open jar, the four objects, their floating
// animations, every running timer) is never touched by either of
// these, so there is nothing here to reset or reconstruct, before,
// during, or after. Setting "src" fresh each time the overlay opens
// means about.html always starts on its own default tab, same as any
// direct visit; clearing it back to "about:blank" on close stops its
// video/audio (if playing) and releases the loaded page.
function openAboutOverlay() {
  aboutOverlayFrame.src = 'about.html';
  aboutOverlay.hidden = false;
}

function closeAboutOverlay() {
  aboutOverlay.hidden = true;
  aboutOverlayFrame.src = 'about:blank';
}

// Exposed on "window" (an ordinary top-level function declaration
// already is) so about.html's own "little things here now" links can
// call it directly when about.html happens to be running inside this
// overlay's iframe - see about.js, which checks for that case and
// leaves a standalone visit to about.html completely unaffected.
window.closeAboutOverlay = closeAboutOverlay;

// The four objects that grow out of the open jar: the element itself,
// the console message that stands in for its future destination page,
// and the "url" to actually navigate to - "openInOverlay" marks the
// one entry (currently just the paper fortune teller) that should open
// in the overlay above instead of a real navigation; every other entry
// (with only a "url", no "openInOverlay") navigates away normally.
// Their quadrant positions/sizes are static CSS (see ".jar-object-
// wrapper" and the four "#object-*" rules in style.css) - nothing here
// needs to calculate or duplicate those coordinates.
const jarObjects = [
  { element: objectFortuneTeller, label: 'about the project', url: 'about.html', openInOverlay: true },
  { element: objectTapeDispenser, label: 'interventions', url: 'interventions.html' },
  { element: objectBag, label: 'collected little things', url: 'collected.html' },
  { element: objectPortalHand, label: 'take a little thing', url: 'take.html' },
];

// Clicking an object still logs its section name; every one of them
// now has somewhere real to go.
jarObjects.forEach((object) => {
  object.element.addEventListener('click', () => {
    console.log(object.label);

    if (object.openInOverlay && object.url) {
      openAboutOverlay();
      return;
    }

    if (object.url) {
      // Marks (in sessionStorage, so it survives an actual page
      // navigation/reload, not just an in-memory bfcache restore) that
      // this visitor was in the completed navigation state at the
      // moment of leaving - see markReturnToNavigation() further down
      // for why, and beginHomeSequence() for where this is read back.
      markReturnToNavigation();
      window.location.href = object.url;
    }
  });
});

// The one shared name tooltip for all four objects - see #object-tooltip
// in style.css. Sets its text and reveals it, positioned near
// "anchorX/anchorY" (a cursor point on desktop, or a tapped object's own
// corner on touch - see the two call sites below) but nudged back
// inside the viewport if it would otherwise cross the right or bottom
// edge.
function positionTooltip(anchorX, anchorY) {
  const offsetX = 14;
  const offsetY = 18;
  const tooltipWidth = objectTooltip.offsetWidth;
  const tooltipHeight = objectTooltip.offsetHeight;

  let left = anchorX + offsetX;
  let top = anchorY + offsetY;

  if (left + tooltipWidth > window.innerWidth) {
    left = anchorX - offsetX - tooltipWidth; // place it to the left of the anchor instead
  }
  if (top + tooltipHeight > window.innerHeight) {
    top = anchorY - offsetY - tooltipHeight; // place it above the anchor instead
  }

  objectTooltip.style.left = left + 'px';
  objectTooltip.style.top = top + 'px';
}

function showTooltip(label, anchorX, anchorY) {
  objectTooltip.textContent = label;
  positionTooltip(anchorX, anchorY);
  objectTooltip.classList.add('visible');
}

function hideTooltip() {
  objectTooltip.classList.remove('visible');
}

// Desktop/mouse only: follows the cursor while it's over an object, and
// hides the instant it leaves. "pointerType" excludes touch here, since
// touch devices show a persistent label under each object instead (see
// ".jar-object-label" in style.css) rather than anything tied to a
// cursor position or a tap. The ".settled" check is a safety net behind
// style.css's own desktop-only "pointer-events: none until .settled"
// rule, which already stops these events from reaching an object
// mid-flight in the first place - this just guards against relying on
// that alone.
jarObjects.forEach((object) => {
  object.element.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'touch') return;
    if (!jarScene.classList.contains('settled')) return;
    showTooltip(object.label, event.clientX, event.clientY);
  });

  object.element.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    if (!jarScene.classList.contains('settled')) return;
    positionTooltip(event.clientX, event.clientY);
  });

  object.element.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'touch') return;
    hideTooltip();
  });
});

// Reveals all four objects together via ONE class on their shared
// parent, #jar-scene (see "#jar-scene.revealed .jar-object" in
// style.css) - added inside a single requestAnimationFrame so all four
// genuinely start their identical, shared-duration reveal transition on
// the exact same rendered frame. There is no per-object class, delay,
// setTimeout, or loop-over-time anywhere in this function - just the
// one class, added once.
function revealObjects() {
  requestAnimationFrame(() => {
    jarScene.classList.add('revealed');
  });

  // Only once every object has actually finished arriving (not before)
  // does ".settled" (also one shared class on #jar-scene) unlock each
  // one's own idle float - see "#jar-scene.settled #object-*" in
  // style.css.
  scheduleTimeout(() => {
    jarScene.classList.add('settled');
  }, objectRevealDuration);

  jarState = 'open';
}


// The feather only reacts while 'landed' or 'ready' (checked inside the
// handler itself); this one listener is attached once and reused,
// rather than being re-added each time the pigeon flies.
feather.addEventListener('pointerdown', handleFeatherPointerDown);

// TEMPORARY - purely observational, does not call any function. Proves,
// independently of "pointerdown" above, whether a tap on the feather
// reaches it at all - see setPortraitFeatherDebugStatus() above.
feather.addEventListener('click', () => setPortraitFeatherDebugStatus('CLICK'));

// Safety nets, mirroring the pigeon's own: release the feather instead
// of leaving it stuck mid-drag if focus or tab visibility is interrupted.
window.addEventListener('blur', () => endFeatherDrag());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) endFeatherDrag();
});


/* --------------------------------------------------------------------
   TITLE / RESTART CONTROL
   Clicking, tapping, or pressing Enter/Space on "little things here
   now" reloads the page, which naturally puts everything - the
   pigeon, feather, paper, audio, timers, and pointer state - back to
   its original starting condition, without us having to manually
   reset each one by hand.
   -------------------------------------------------------------------- */
function handleTitleReload(event) {
  // Don't let this click reach any other page-wide click handler
  // (such as the "click anywhere to begin" listener) before reloading.
  event.stopPropagation();
  window.location.reload();
}

// A real <button> already fires a "click" event for mouse clicks, touch
// taps, AND keyboard Enter/Space - so one listener covers all of them.
openingText.addEventListener('click', handleTitleReload);


// Every one of the four menu objects' own wrapper/inner/image/label
// elements, grabbed once up front - see resetJarObjectsToBaseState()
// below, used by both resetHomeState() and returnToOpenedJarMenu() so
// there is exactly one place that knows what "a genuinely blank slate"
// means for these elements, shared by every path that needs it.
const jarObjectWrappers = Array.from(document.querySelectorAll('.jar-object-wrapper'));

// Clears every inline style any of the four objects (wrapper, inner,
// image, and label together) could ever end up carrying - position,
// size, transform, opacity, transition, and animation-delay - back to
// nothing, so only the actual CSS classes (".jar-object-wrapper"'s own
// static quadrant position, "#jar-scene.revealed"/".settled" for the
// reveal/float) are ever what decides where the four objects sit.
// None of the code in this file sets an inline style on any of them
// today, but calling this defensively, right before (re-)applying the
// finished open-jar state (see returnToOpenedJarMenu() below) and
// before tearing it down (see resetHomeState() below), costs nothing
// and rules the possibility out completely rather than assuming it.
function resetJarObjectsToBaseState() {
  jarObjectWrappers.forEach((wrapper) => {
    const inner = wrapper.querySelector('.jar-object-inner');
    const image = wrapper.querySelector('.jar-object');
    const label = wrapper.querySelector('.jar-object-label');
    [wrapper, inner, image, label].forEach((el) => {
      if (!el) return;
      el.style.left = '';
      el.style.top = '';
      el.style.width = '';
      el.style.height = '';
      el.style.transform = '';
      el.style.opacity = '';
      el.style.transition = '';
      el.style.animationDelay = '';
    });
  });
}

/* --------------------------------------------------------------------
   RETURNING TO THE OPENED-JAR MENU (arriving from About or Interventions)
   Both the "about the project" heading/paper fortune teller (about.html)
   and the "interventions" heading/tape-dispenser icon (interventions.html)
   link to "index.html?state=open-jar" instead of a plain "index.html",
   so a visitor going back never has to sit through the pigeon/feather/
   wrestler sequence again. When that URL is detected, this ONE shared
   function jumps straight to the exact end state the normal sequence
   itself finishes on - both pages funnel into this exact same function,
   never a separate/duplicated version of it each.
   -------------------------------------------------------------------- */
function returnToOpenedJarMenu() {
  sequenceStarted = true;

  // The pigeon and feather simply never appear - both already start
  // hidden via their own CSS (opacity: 0), so there's nothing to change.
  pigeonState = 'idle';
  featherState = 'done';

  // The wrestler has already "left" - the same end state startWrestlerExit()
  // leaves it in.
  wrestler.style.display = 'none';

  // The title/logo is visible, same as after fadeInText() - but instant,
  // never the 1.5s fade "#opening-text"'s own CSS transition normally
  // gives it (see style.css). That fade is only meant for the genuine
  // first-time reveal (fadeInText(), untouched, still used there); on
  // return the logo must already be showing at its exact final size/
  // position with nothing still settling in front of the visitor -
  // disabling the transition for this one, single synchronous change,
  // then restoring it right after, guarantees that regardless of
  // whatever the browser did or didn't paint before this script ran.
  openingText.style.transition = 'none';
  openingText.style.opacity = '1';
  void openingText.offsetWidth;
  openingText.style.transition = '';

  // A genuinely blank slate: drops #jar-scene's own "revealed"/
  // "settled" classes (any old delayed-reveal state) and clears every
  // inline style any of the four objects could be carrying (position,
  // size, transform, opacity, transition, animation-delay - see
  // resetJarObjectsToBaseState()'s own comment above) before the jar
  // and the four objects are shown again below.
  jarScene.classList.remove('revealed', 'settled');
  resetJarObjectsToBaseState();

  // The jar itself has no reveal delay - it's simply already open, the
  // same end state handleJarClick() leaves it in (see below for why
  // ".opening" itself is deliberately left out of that match).
  jarClosedImg.style.opacity = '0';
  jarOpenImg.style.opacity = '1';

  // The jar's own growth from --closed-jar-size to --open-jar-size
  // (see "#jar-wrapper.open" in style.css) is a width/height CSS
  // TRANSITION, which only ever animates if the browser genuinely
  // observed the smaller "before" size first. On a fresh navigation
  // this shouldn't happen (script.js runs before the first paint), but
  // disabling the transition outright for the one frame this class is
  // added, rather than relying on that timing, removes any doubt:
  // "transition: none" first, then the class (and its target width/
  // height) take effect with nothing to animate between, then a forced
  // reflow commits that before the real transition is restored -
  // exactly the same disable/reflow/restore pattern startJarCloseup()
  // above already uses for the jar's move-in transform.
  jarWrapper.style.transition = 'none';
  jarWrapper.classList.add('visible', 'open');
  void jarWrapper.offsetWidth;
  jarWrapper.style.transition = '';

  // ".floating" only (never ".opening") - ".opening" exists purely to
  // trigger the one-shot "pop" (see "#jar-visual.opening" in style.css,
  // a non-infinite CSS ANIMATION). Unlike a transition, a CSS animation
  // always plays from its first keyframe the moment its class starts
  // matching, with no "was this already present" exception - so on a
  // brand new page instance, adding ".opening" here would genuinely
  // (re)play that pop/squish, which is exactly the unwanted "jar
  // shrinks before settling" this function must never cause. Leaving
  // it off entirely costs nothing: the animation's own last keyframe
  // already returns to the same resting scale(1) the element sits at
  // without it.
  jarVisual.classList.add('floating');

  // Both classes together, synchronously - NOT revealObjects() (the
  // animated version handleJarClick() uses for a genuine first-time
  // open, which stages ".revealed" and ".settled" apart on purpose so
  // the four objects visibly fly out one beat after another). Returning
  // here must land on the finished, fully-settled state immediately,
  // with no "flying out of the jar" animation and no gap where the four
  // objects are visible but not yet in their final positions. On a
  // fresh "?state=open-jar" load these two classes go from absent
  // straight to present before the page's first paint, so nothing here
  // actually transitions into place - it simply starts out that way.
  // On a bfcache-restore, though, resetHomeState() (see further down)
  // may have just REMOVED these same two classes a moment ago, in this
  // same synchronous pass - reading a layout property forces the
  // browser to commit that removal before these are added back, which
  // is what makes each object's idle float (".settled" - an infinite,
  // looping animation, unlike ".revealed"'s one-time, still-before-
  // paint position) genuinely restart instead of a same-tick no-op a
  // browser can otherwise collapse away, silently leaving the objects
  // positioned correctly but never actually floating.
  void jarScene.offsetWidth;
  jarScene.classList.add('revealed', 'settled');

  jarState = 'open';
}


/* --------------------------------------------------------------------
   HOMEPAGE STATE RESET (returning from another page)
   Safari's (and other browsers') back-forward cache (bfcache) can
   restore this exact page - the whole DOM, every "let"/"const" above,
   pending timers, all of it - without re-running this script at all,
   when the visitor returns to it via the Back button (a fresh link
   click, e.g. about.html's own links back here, always reloads
   normally and is unaffected by any of this). If the sequence had
   already run partway or all the way through before they left for
   about.html, that exact stale mid- or post-sequence state comes back
   completely unchanged - nothing resets itself just because the page
   is visible again. This section tears every bit of that state back
   down to the same starting point a genuine fresh load begins from,
   then re-runs the same entry logic a fresh load itself uses (see
   beginHomeSequence(), used both at the very bottom of this file and
   again after a restore).
   -------------------------------------------------------------------- */

// Incremented every time resetHomeState() runs. Most of this file's
// setTimeout calls are for delays inside the sequence (a fifth of a
// second to several seconds) - none of their ids are captured anywhere,
// so a plain clearTimeout() can't reach them from here. scheduleTimeout()
// below is what every one of those call sites uses instead (a plain
// substitute for the raw global): it captures the CURRENT generation
// when scheduled, and checks it's still current before actually doing
// anything - so a callback that was already waiting when a reset
// happens simply becomes a no-op instead of firing later and
// reintroducing stale state on top of the freshly reset page.
let homeStateGeneration = 0;

function scheduleTimeout(callback, delay) {
  const generation = homeStateGeneration;
  return setTimeout(() => {
    if (generation !== homeStateGeneration) return; // resetHomeState() ran since this was scheduled - stale, do nothing
    callback();
  }, delay);
}

function resetHomeState() {
  homeStateGeneration++; // invalidates every still-pending scheduleTimeout() callback above

  // Cancel every animation frame / timer this file keeps an id for.
  cancelAnimationFrame(flightAnimationId);
  cancelAnimationFrame(featherAnimationId);
  cancelAnimationFrame(tickleAnimationId);
  clearTimeout(holdTimer);
  holdTimer = null;

  // --- State variables, back to their initial values ---
  sequenceStarted = false;
  featherReleased = false;
  isFlightPaused = false;
  pigeonState = 'idle';
  activePointerId = null;
  featherState = 'idle';
  featherActivePointerId = null;
  tickleAccumulated = 0;
  jarState = 'zooming';

  // --- Pigeon: back to its pre-flight image/size/position ---
  pigeon.src = 'assets/images/pigeon.png';
  pigeon.style.width = pigeonSize + 'px';
  pigeon.style.opacity = '';
  pigeon.style.pointerEvents = '';
  pigeon.style.left = (window.innerWidth + pigeonStartXBuffer) + 'px';
  pigeon.style.top = (pigeonStartY / 100) * window.innerHeight + 'px';

  // --- Feather ---
  feather.style.opacity = '';
  feather.style.pointerEvents = '';
  feather.style.cursor = '';
  feather.style.transform = '';
  feather.style.removeProperty('--feather-landing-rotation');
  feather.classList.remove('floating');

  // --- Logo / title fade-in ---
  openingText.style.opacity = '';

  // --- Click message, and its one-shot listener in case it was never
  // clicked (showClickMessage() attaches it; handleFirstClick() only
  // removes it once fired) ---
  clickMessage.classList.remove('visible');
  document.removeEventListener('click', handleFirstClick);

  // --- Paper ---
  paperContainer.classList.remove('visible');

  // --- Wrestler ---
  wrestler.classList.remove('risen', 'exiting');
  wrestler.style.display = '';
  wrestler.style.left = ''; // clears positionWrestlerNearFeather()'s inline override - reapplied fresh next time the feather lands
  wrestlerArm.src = 'assets/images/ticklish-wrestler-arm-empty.png';
  wrestlerArm.classList.remove('rotating');
  wrestlerBody.classList.remove('shaking');

  // --- Arrow ---
  wrestlerArrow.classList.remove('visible');
  wrestlerArrow.style.left = '';
  wrestlerArrow.style.top = '';
  wrestlerArrow.style.width = '';
  wrestlerArrow.style.transform = '';

  // --- The jar hand-off element ---
  wrestlerJar.classList.remove('visible');
  wrestlerJar.style.left = '';
  wrestlerJar.style.top = '';
  wrestlerJar.style.width = '';
  wrestlerJar.style.height = '';

  // --- The centred jar ---
  jarWrapper.classList.remove('visible', 'open');
  jarWrapper.style.transition = '';
  jarWrapper.style.transform = '';
  jarVisual.classList.remove('floating', 'opening');
  jarClosedImg.style.opacity = '';
  jarOpenImg.style.opacity = '';

  // --- The four objects ---
  jarScene.classList.remove('revealed', 'settled');
  resetJarObjectsToBaseState();

  // --- Tooltip ---
  hideTooltip();
  objectTooltip.textContent = '';

  // NOTE: applyTabletWrestlerWidthFallback()'s own inline "width" on
  // #wrestler is deliberately left untouched here - it isn't part of
  // the interaction sequence, it's a per-viewport layout fix that
  // stays correct (or corrects itself on the next resize/
  // orientationchange) regardless of scene state.
}

// Marks, in sessionStorage (unlike a plain JS variable, this survives
// an actual page navigation/reload - not only an in-memory bfcache
// restore), that this visitor was in the completed open-jar navigation
// state at the moment of leaving for another page. Read back (and
// consumed) by beginHomeSequence() below. Wrapped in try/catch since
// sessionStorage can throw in some private-browsing configurations -
// if so, this one enhancement (skipping the opening sequence on
// return) just doesn't apply; nothing else on the page depends on it.
const RETURN_TO_NAV_STORAGE_KEY = 'returnToMainNavigation';

function markReturnToNavigation() {
  try {
    sessionStorage.setItem(RETURN_TO_NAV_STORAGE_KEY, '1');
  } catch (error) {
    // sessionStorage unavailable - nothing to do
  }
}

// Reads AND immediately removes the flag, so it only ever applies to
// the one return trip it was set for - a later, unrelated fresh visit
// or reload must still show the normal opening sequence, not silently
// skip it because an old flag was left behind.
function consumeReturnToNavigationFlag() {
  try {
    const shouldRestore = sessionStorage.getItem(RETURN_TO_NAV_STORAGE_KEY) === '1';
    sessionStorage.removeItem(RETURN_TO_NAV_STORAGE_KEY);
    return shouldRestore;
  } catch (error) {
    return false;
  }
}

// ROOT CAUSE of the 437px -> 230px bug: Safari/WebKit can fire
// "pageshow" MORE THAN ONCE for a single bfcache restoration (a known
// WebKit quirk - not something this page can prevent). Each firing ran
// resetHomeState() then beginHomeSequence() in full. The FIRST firing
// correctly found the sessionStorage flag, consumed it, and called
// returnToOpenedJarMenu() - producing the correct 437px open jar. But
// consumeReturnToNavigationFlag() DELETES the flag the moment it's
// read - so the SECOND firing's resetHomeState() wiped that
// just-restored state back to its blank defaults (jarWrapper loses
// ".open" -> falls back to the un-opened "--closed-jar-size", 230px on
// this iPad - matching the reported broken width/height/transform
// exactly), and its beginHomeSequence() then found NO flag left,
// fell through to the plain tryAutoplay() branch instead of
// returnToOpenedJarMenu() again, so nothing re-added ".open".
// The fix: decide ONCE per script execution (this "let" only exists
// for the lifetime of this one script run - a genuinely new page
// instance, e.g. a real future reload, starts with a fresh one) and
// reuse that same decision for every subsequent beginHomeSequence()
// call within it, instead of re-reading (and re-deleting) sessionStorage
// every time. A real second call - from a second "pageshow", or any
// other trigger - now repeats the SAME outcome as the first, rather
// than silently flipping to the opposite one.
let navRestoreDecisionMade = false;
let navRestoreDecisionValue = false;

function shouldRestoreNavigationState() {
  if (!navRestoreDecisionMade) {
    navRestoreDecisionMade = true;
    navRestoreDecisionValue = consumeReturnToNavigationFlag();
  }
  return navRestoreDecisionValue;
}

// The single decision this whole file makes about what to show:
// pulled into its own function so it can be re-run after a bfcache
// restore (see the "pageshow" listener below) without duplicating this
// logic a second time. Two independent signals lead to the SAME
// restored state (returnToOpenedJarMenu() - the one shared function
// both about.html's and interventions.html's own return links lead to,
// reused as-is, not re-implemented or duplicated per page):
//   1. The URL is "?state=open-jar" - about.html's "about the project"
//      heading/fortune-teller link and interventions.html's
//      "interventions" heading/tape-dispenser icon both point here
//      directly (a plain, bookmarkable/shareable way in).
//   2. The sessionStorage flag above is set - covers every OTHER way
//      of returning to this exact page (Safari's Back button, or
//      either page's plain logo link back to "index.html") that isn't
//      itself a special URL.
// Anything else (a genuinely fresh visit, or returning to this page
// without ever having reached the navigation state first) falls
// through to the normal opening sequence.
function beginHomeSequence() {
  refreshTabletLandscapeDetection();

  if (new URLSearchParams(window.location.search).get('state') === 'open-jar') {
    returnToOpenedJarMenu();
    return;
  }

  if (shouldRestoreNavigationState()) {
    returnToOpenedJarMenu();
    return;
  }

  tryAutoplay();
}


/* --------------------------------------------------------------------
   BEGIN
   -------------------------------------------------------------------- */
beginHomeSequence();

// If this exact page is ever restored from a bfcache (e.g. returning
// here via the Back button after visiting about.html), "pageshow"
// fires again with "event.persisted: true" - but none of this script
// re-runs on its own; the whole DOM and every variable above come back
// exactly as they were the moment the visitor left, however far
// through (or past) the sequence that was. "event.persisted" is the
// correct, purpose-built signal for this, but isn't perfectly reliable
// on every past Safari version, so it's cross-checked against the
// Navigation Timing API's own independent "was this a back/forward
// navigation" signal as a fallback, rather than trusting either one
// alone. A normal fresh load (or a fresh link click back here, from
// about.html or anywhere else) already ran beginHomeSequence() once
// above and is unaffected - isBackForwardRestore() returns false for
// those, so this listener does nothing.
function isBackForwardRestore(event) {
  if (event.persisted) return true;
  try {
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries.length && navEntries[0].type === 'back_forward') return true;
  } catch (error) {
    // Navigation Timing API unavailable - "event.persisted" above is the only signal then.
  }
  return false;
}

window.addEventListener('pageshow', (event) => {
  if (!isBackForwardRestore(event)) return;
  resetHomeState();
  beginHomeSequence();
});
