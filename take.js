/* ==========================================================================
   TAKE A LITTLE THING PAGE - SCRIPT
   This page is intentionally blank otherwise - only the top-left
   heading (a plain link, no JS needed) and the top-right logo (which
   does need JS - see below) are interactive. The downloadable souvenir
   content is a later pass.
   ========================================================================== */

// Matches script.js's (and about.js's/interventions.js's/collected.js's)
// own iPad/tablet-landscape detection exactly - duplicated here rather
// than sharing a file, since this page only needs this one small
// piece: applying the same ".tablet-landscape" class to <html> that
// the logo's own sizing (--logo-width in style.css, shared by every
// page) already keys off. Without this, this page's own <html> never
// gets the class, so on a real iPad in landscape its logo would use
// the smaller general touch-landscape sizing (style.css's own "(hover:
// none) and (pointer: coarse) and (orientation: landscape)" rule,
// which a real iPad also matches) instead of the iPad-corrected one -
// visibly different from the homepage and every other page.
function isTabletLandscapeDevice() {
  const isTouchCapable = navigator.maxTouchPoints > 0;
  const isLandscape = window.innerWidth > window.innerHeight;
  const isTabletWidth = window.innerWidth >= 900 && window.innerWidth <= 1400;
  const isTabletHeight = window.innerHeight >= 600;
  return isTouchCapable && isLandscape && isTabletWidth && isTabletHeight;
}

function updateTabletLandscapeClass() {
  document.documentElement.classList.toggle('tablet-landscape', isTabletLandscapeDevice());
}

updateTabletLandscapeClass();
window.addEventListener('resize', updateTabletLandscapeClass);
window.addEventListener('orientationchange', updateTabletLandscapeClass);

// The logo means "start over", the same thing it means everywhere else
// on the site (see handleTitleReload() in script.js) - not just a
// plain navigation back to "index.html". Reaching this page from the
// jar's own portal-hand icon sets a sessionStorage flag (see
// markReturnToNavigation() in script.js) so that a genuine "back"
// jumps straight to the finished jar state instead of replaying the
// opening sequence - but that same flag would just as wrongly make a
// deliberate restart via this logo jump back to the jar too, instead
// of actually restarting. Clearing it first (same fix as collected.js's
// own logo-click handler, and about.js's own overlay-scoped one, minus
// the iframe/overlay parts neither this page needs - it's never opened
// inside one) guarantees a genuine restart every time.
/* --------------------------------------------------------------------
   THE PORTAL/HAND COMPOSITION - DESKTOP / MAC ONLY (for now)
   Cycles jar -> burning heart -> wounded heart -> jar -> ... each time
   "i don't want this" is clicked - no page reload, no animation (an
   abrupt swap is intentional here, see take.css). "#take-portal-hand"
   itself is never touched; only "#take-object" (its image and its
   position/size class - see "#take-object"/".take-object-jar"/
   ".take-object-heart" in take.css), "#take-description"'s text, and
   "#take-download"'s visibility change.
   -------------------------------------------------------------------- */
const takeObject = document.getElementById('take-object');
const takeDescription = document.getElementById('take-description');
const takeDecline = document.getElementById('take-decline');
const takeDownload = document.getElementById('take-download');

// The jar state's own description breaks at a different point on
// iPhone portrait ("you got the little things" / "jar paper model!")
// than everywhere else ("you got" / "the little things jar paper
// model!") - matched to that breakpoint's own Figma reference. Reuses
// the exact same media query take.css's own "IPHONE PORTRAIT" section
// is scoped by, so both always agree on which breakpoint is active.
const takePhonePortraitQuery = window.matchMedia('(pointer: coarse) and (orientation: portrait) and (max-width: 600px)');

function getJarDescription() {
  return takePhonePortraitQuery.matches
    ? 'you got the little things\njar paper model!'
    : 'you got\nthe little things jar paper model!';
}

// Each state's own image, position/size class, description text (a
// "\n" between the two lines - see "white-space: pre-line" on
// "#take-description" in take.css), and whether the download line
// should be showing. The jar state's own "description" is a function
// (re-evaluated on every state switch - see "showTakeState" below)
// instead of a plain string, since it's the one that differs by
// breakpoint; the other two are plain strings, unchanged either way.
const takeStates = [
  {
    image: 'assets/images/take-jar.png',
    objectClass: 'take-object-jar',
    description: getJarDescription,
    showDownload: true,
  },
  {
    image: 'assets/images/take-burning-heart.png',
    objectClass: 'take-object-burning-heart',
    description: 'you got a\nburning heart',
    showDownload: false,
  },
  {
    image: 'assets/images/take-wounded-heart.png',
    objectClass: 'take-object-heart',
    description: 'you got a\nwounded heart',
    showDownload: false,
  },
];

// Preloads (and, where supported, fully decodes) all three object
// images up front, before the visitor can click anything - see
// "showTakeState" below for why this matters: without it, the very
// first time a given object is shown, its image can still be loading
// at the moment its size/position class is applied.
takeStates.forEach((state) => {
  const preloadImage = new Image();
  preloadImage.src = state.image;
});

let takeStateIndex = 0;

// Swaps to a new state's image and its own size/position class
// together, only once the new image is actually ready to paint - never
// separately. Previously, "takeObject.src" and "takeObject.className"
// were set back-to-back on the same (still-visible, old) <img>: the
// class change takes effect on the very next frame, but loading a new
// "src" does not - so for however long the new image took to load
// (usually imperceptible once cached, but not always the very first
// time an object is shown), the OLD image was rendered at the NEW
// object's size/position, producing a visible flash at the wrong size
// before the new image finally appeared (e.g. the wounded heart
// briefly shrinking to the jar's size just before the jar image
// itself showed up). Loading the new image on a detached "Image()"
// first, then only touching the real "#take-object" once it's decoded
// and ready, means the old image+class stay paired until the exact
// instant they're both replaced together - the swap itself is still
// just as immediate/abrupt as before (no fade, no transition), just
// no longer split across two visible frames.
function showTakeState(index) {
  const state = takeStates[index];

  const applyState = () => {
    takeObject.src = state.image;
    takeObject.className = state.objectClass;
  };

  const nextImage = new Image();
  nextImage.src = state.image;
  if (typeof nextImage.decode === 'function') {
    nextImage.decode().then(applyState).catch(applyState);
  } else {
    applyState();
  }

  takeDescription.textContent = typeof state.description === 'function' ? state.description() : state.description;
  takeDownload.classList.toggle('take-hidden', !state.showDownload);
}

if (takeObject && takeDescription && takeDecline && takeDownload) {
  showTakeState(takeStateIndex); // matches take.html's own default (the jar) - keeps this the single source of truth either way

  takeDecline.addEventListener('click', () => {
    takeStateIndex = (takeStateIndex + 1) % takeStates.length;
    showTakeState(takeStateIndex);
  });
}

const takeLogoLink = document.getElementById('take-logo-link');
if (takeLogoLink) {
  takeLogoLink.addEventListener('click', (event) => {
    event.preventDefault();
    try {
      sessionStorage.removeItem('returnToMainNavigation');
    } catch (error) {
      // sessionStorage unavailable - nothing to clear
    }
    window.location.href = 'index.html';
  });
}
