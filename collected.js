/* ==========================================================================
   COLLECTED LITTLE THINGS PAGE - SCRIPT
   This page is intentionally blank otherwise - only the top-left
   heading (a plain link, no JS needed) and the top-right logo (which
   does need JS - see below) are interactive.
   ========================================================================== */

// Matches script.js's (and about.js's/interventions.js's) own iPad/
// tablet-landscape detection exactly - duplicated here rather than
// sharing a file, since this page only needs this one small piece:
// applying the same ".tablet-landscape" class to <html> that the
// logo's own sizing (--logo-width in style.css, shared by every page)
// already keys off. Without this, this page's own <html> never gets
// the class, so on a real iPad in landscape its logo would use the
// smaller general touch-landscape sizing (style.css's own "(hover:
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

// ======================================
// EDITABLE VARIABLES
// ======================================
// The tag's own text after a successful drop - "\n" marks each forced
// line break (see "white-space: pre-line" on "#collected-tag-text" in
// collected.css, which is what makes these breaks actually render).
let collectedSuccessTagText = 'thank you.\nwould you like to see more little things,\nor share one you found?';

/* --------------------------------------------------------------------
   DRAGGING THE CLUSTER INTO THE BAG
   Pointer Events (not separate mouse/touch handlers) so the same code
   drives both a mouse drag on desktop and a finger drag on touch -
   mirrors the grab-offset/follow-the-pointer-directly pattern the
   homepage's own pigeon/feather drag uses in script.js, without
   literally sharing code (this project's own per-page-file convention).
   The bag is the drop target: releasing the cluster with its complete
   bounding box inside the bag's own locks it there permanently and
   swaps the tag's text; releasing it anywhere else returns it to its
   original position and leaves the tag exactly as it was.
   -------------------------------------------------------------------- */
const collectedCluster = document.getElementById('collected-cluster');
const collectedBag = document.getElementById('collected-bag');
const collectedTagText = document.getElementById('collected-tag-text');
const collectedLinkSeeMore = document.getElementById('collected-link-see-more');
const collectedLinkShareOne = document.getElementById('collected-link-share-one');

let clusterDragging = false;
let clusterLocked = false;
let clusterActivePointerId = null;
let clusterGrabOffsetX = 0;
let clusterGrabOffsetY = 0;

if (collectedCluster && collectedBag && collectedTagText) {
  collectedCluster.addEventListener('pointerdown', startClusterDrag);
}

function startClusterDrag(event) {
  if (clusterLocked) return;

  event.preventDefault(); // stops native image drag / text selection

  // Switches from the CSS-var/"translate(-50%, -50%)"-centred position
  // to an explicit pixel "left"/"top" matching exactly where the
  // cluster already visibly is, so the switch itself causes no jump -
  // dragging from here on just moves these two values directly.
  const startRect = collectedCluster.getBoundingClientRect();
  collectedCluster.style.transform = 'none';
  collectedCluster.style.left = startRect.left + 'px';
  collectedCluster.style.top = startRect.top + 'px';

  clusterGrabOffsetX = event.clientX - startRect.left;
  clusterGrabOffsetY = event.clientY - startRect.top;

  clusterDragging = true;
  clusterActivePointerId = event.pointerId;
  collectedCluster.style.cursor = 'grabbing';
  collectedCluster.setPointerCapture(clusterActivePointerId);
  collectedCluster.addEventListener('pointermove', handleClusterPointerMove);
  collectedCluster.addEventListener('pointerup', handleClusterPointerUp);
  collectedCluster.addEventListener('pointercancel', handleClusterPointerUp);
  collectedCluster.addEventListener('lostpointercapture', handleClusterPointerUp);
}

function handleClusterPointerMove(event) {
  if (!clusterDragging || event.pointerId !== clusterActivePointerId) return;

  // Follows the pointer/finger directly - no smoothing, easing, or delay.
  collectedCluster.style.left = (event.clientX - clusterGrabOffsetX) + 'px';
  collectedCluster.style.top = (event.clientY - clusterGrabOffsetY) + 'px';
}

function handleClusterPointerUp(event) {
  if (!clusterDragging || event.pointerId !== clusterActivePointerId) return;
  endClusterDrag();
}

function endClusterDrag() {
  collectedCluster.removeEventListener('pointermove', handleClusterPointerMove);
  collectedCluster.removeEventListener('pointerup', handleClusterPointerUp);
  collectedCluster.removeEventListener('pointercancel', handleClusterPointerUp);
  collectedCluster.removeEventListener('lostpointercapture', handleClusterPointerUp);

  clusterDragging = false;
  collectedCluster.style.cursor = 'grab';

  if (isClusterFullyInsideBag()) {
    lockClusterInBag();
  } else {
    returnClusterToStartPosition();
  }
}

// Success requires the cluster's COMPLETE visible bounding box to sit
// inside the bag's own - any partial overlap on any side does not count.
function isClusterFullyInsideBag() {
  const clusterRect = collectedCluster.getBoundingClientRect();
  const bagRect = collectedBag.getBoundingClientRect();

  return (
    clusterRect.left >= bagRect.left &&
    clusterRect.right <= bagRect.right &&
    clusterRect.top >= bagRect.top &&
    clusterRect.bottom <= bagRect.bottom
  );
}

// Clearing these inline overrides (rather than storing/restoring the
// original left/top in JS) lets the cluster fall straight back to its
// CSS-rule-driven position - already correct for whatever viewport
// size is current, with nothing extra to track.
function returnClusterToStartPosition() {
  collectedCluster.style.left = '';
  collectedCluster.style.top = '';
  collectedCluster.style.transform = '';
}

function lockClusterInBag() {
  clusterLocked = true;
  collectedCluster.style.cursor = 'default';
  collectedTagText.textContent = collectedSuccessTagText;
  collectedLinkSeeMore.classList.add('visible');
  collectedLinkShareOne.classList.add('visible');
}

// The logo means "start over", the same thing it means everywhere else
// on the site (see handleTitleReload() in script.js) - not just a
// plain navigation back to "index.html". Reaching this page from the
// jar's own bag icon sets a sessionStorage flag (see
// markReturnToNavigation() in script.js) so that a genuine "back"
// jumps straight to the finished jar state instead of replaying the
// opening sequence - but that same flag would just as wrongly make a
// deliberate restart via this logo jump back to the jar too, instead
// of actually restarting. Clearing it first (same fix as about.js's
// own logo-click handler, minus the iframe/overlay parts that page
// alone needs - this page is never opened inside one) guarantees a
// genuine restart every time.
const collectedLogoLink = document.getElementById('collected-logo-link');
if (collectedLogoLink) {
  collectedLogoLink.addEventListener('click', (event) => {
    event.preventDefault();
    try {
      sessionStorage.removeItem('returnToMainNavigation');
    } catch (error) {
      // sessionStorage unavailable - nothing to clear
    }
    window.location.href = 'index.html';
  });
}
