/* ==========================================================================
   INTERVENTIONS PAGE - SCRIPT
   Switches between the two section tabs/panels. The default active
   one ("try one") is set directly in interventions.html (its tab
   starts "aria-selected=true", its panel starts without "hidden") -
   this only handles switching away from that default. Both panels are
   still empty at this stage (page shell only); content comes later.
   ========================================================================== */

// Matches script.js's (and about.js's) own iPad/tablet-landscape
// detection exactly - duplicated here rather than sharing a file,
// since this page only needs this one small piece: applying the same
// ".tablet-landscape" class to <html> that the logo's own sizing
// (--logo-width in style.css, shared by every page) already keys off.
// Without this, this page's own <html> never gets the class, so on a
// real iPad in landscape its logo would use the smaller general
// touch-landscape sizing (style.css's own "(hover: none) and
// (pointer: coarse) and (orientation: landscape)" rule, which a real
// iPad also matches) instead of the iPad-corrected one - visibly
// different from the homepage and the about page.
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
let tapeFadeDuration = 250; // ms - how long the tape-peel crossfade takes (both layers fade against each other at once, not one after the other)
let longTaskWordThreshold = 9; // a task with more words than this wraps as a left-aligned block instead of staying on one line - see updateInterventionTaskText()

// This file is the source of truth for this timing, same convention as
// script.js's own "--wrestler-entrance-duration" etc - pushed into the
// matching CSS custom property (see "#instruction-tape-wrapper" in
// interventions.css) so the two can never drift out of sync.
document.documentElement.style.setProperty('--tape-fade-duration', tapeFadeDuration + 'ms');

const interventionsTabs = Array.from(document.querySelectorAll('.interventions-tab'));

function activateInterventionsTab(selectedTab) {
  interventionsTabs.forEach((tab) => {
    const isSelected = tab === selectedTab;
    tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');

    const panel = document.getElementById(tab.getAttribute('aria-controls'));
    if (panel) panel.hidden = !isSelected;
  });
}

interventionsTabs.forEach((tab) => {
  tab.addEventListener('click', () => activateInterventionsTab(tab));
});


/* --------------------------------------------------------------------
   TRY ONE - INSTRUCTION TAPE + TASK TEXT
   A two-step cycle, toggled by "tapeOpen" below:
     - Tape CLOSED (flat/intact image, no task text) -> click ->
       tape OPENS (peeled image) and reveals a new, randomly chosen
       task.
     - Tape OPEN (peeled image, one task showing) -> click -> tape
       CLOSES (back to flat/intact) and the task text is simply hidden
       - no new task is chosen yet; that only happens the next time the
       tape opens again.
   "instruction-tape-intact.png" and "instruction-tape-peeled.png" are
   two stacked images at one shared position/size (see "#instruction-
   tape-wrapper" in interventions.css) - toggling ".peeled" is all that
   ever moves between the two; the crossfade itself (each layer's own
   "opacity" transition) is entirely CSS, the same technique the
   homepage's own closed/open jar images already use - simple and
   "low-tech" on purpose, with no extra motion added on top of it.
   A plain "click" listener (not a separate touch handler) already
   fires for a touch tap too, same as every other clickable element on
   this site (the tab buttons above, the homepage's jar/objects) -
   nothing extra is needed for that.
   -------------------------------------------------------------------- */
// The full set of "try one" tasks - one is chosen at random (see
// pickNextTaskIndex() below) each time the tape opens, never shown as
// a list, number, or progress indicator anywhere.
let interventionTasks = [
  'look at the least important corner of the room.',
  'find an object that looks like it is waiting.',
  'follow a sound until it changes.',
  'look up while you are waiting.',
  'look at the same thing from lower down.',
  'find a colour that does not quite belong there.',
  'notice what someone tried to hide.',
  'look at one sign as if you have never learned what it means. decide what it means instead.',
  'take a photo of something you would normally walk past.',
  'take a different route home.',
  'turn around once before you leave.',
  'write down one thing that made no sense today.',
  'find something that looks better from the side.',
  'find an object that looks tired.',
  'look at something that has been left behind.',
  'find a place where one colour has faded differently.',
  'find an object that seems to have a job it was not designed for.',
  'look at the back of something usually seen from the front.',
  'find something that is trying to stay upright.',
  'find a surface that has been touched many times.',
  'look for something held together by tape, string, or hope.',
  'look for a place where someone has made themselves comfortable temporarily.',
  'look for a sign that has been changed by time.',
  'find an object that looks full of energy.',
];

const instructionTapeWrapper = document.getElementById('instruction-tape-wrapper');
const interventionTaskText = document.getElementById('intervention-task-text');
let tapeOpen = false;
let currentTaskIndex = null; // no task chosen yet - the tape has never been opened

// Never the same task twice in a row (whenever more than one exists) -
// reroll on an exact repeat rather than special-casing the "remove the
// current one, then pick" approach, since the array is short and this
// reads just as simply.
function pickNextTaskIndex() {
  if (interventionTasks.length <= 1) return 0;
  let nextIndex;
  do {
    nextIndex = Math.floor(Math.random() * interventionTasks.length);
  } while (nextIndex === currentTaskIndex);
  return nextIndex;
}

// Sets the task text and decides, purely by word count, whether it
// needs the left-aligned "long-task" wrapping (see "#intervention-
// task-text.long-task" in interventions.css) instead of the default
// single line - a plain, generic check rather than special-casing any
// specific task, so it keeps working correctly for every task in the
// array above, including any added later.
function updateInterventionTaskText(text) {
  interventionTaskText.textContent = text;
  const wordCount = text.trim().split(/\s+/).length;
  interventionTaskText.classList.toggle('long-task', wordCount > longTaskWordThreshold);
}

function handleTapeClick() {
  if (tapeOpen) {
    // OPEN -> CLOSED: hide the task, choose nothing new yet.
    tapeOpen = false;
    instructionTapeWrapper.classList.remove('peeled');
    interventionTaskText.classList.remove('visible');
    return;
  }

  // CLOSED -> OPEN: choose a new task, then reveal both it and the
  // peeled tape at the same time.
  tapeOpen = true;
  currentTaskIndex = pickNextTaskIndex();
  updateInterventionTaskText(interventionTasks[currentTaskIndex]);
  instructionTapeWrapper.classList.add('peeled');
  interventionTaskText.classList.add('visible');
}

instructionTapeWrapper.addEventListener('click', handleTapeClick);


/* --------------------------------------------------------------------
   THINGS SOMEONE DID - SQUARE FRAME PHOTO CYCLE
   Each tap/click on the square Polaroid advances "#did-square-photo"
   to the next image in this list, wrapping back to the first after the
   last - the frame itself (".did-polaroid-square" in interventions.css)
   never changes size or position, only which image is showing.
   -------------------------------------------------------------------- */
const didSquareTowelImages = [
  'assets/images/intervention-green-towel-01.png',
  'assets/images/intervention-green-towel-02.png',
  'assets/images/intervention-green-towel-03.png',
];

const didSquarePolaroid = document.getElementById('did-square-polaroid');
const didSquarePhoto = document.getElementById('did-square-photo');
let didSquareTowelIndex = 0; // starts on the first image above; each click moves to the next, wrapping after the last

function handleDidSquareClick() {
  didSquareTowelIndex = (didSquareTowelIndex + 1) % didSquareTowelImages.length;
  didSquarePhoto.src = didSquareTowelImages[didSquareTowelIndex];
}

didSquarePolaroid.addEventListener('click', handleDidSquareClick);


/* --------------------------------------------------------------------
   THINGS SOMEONE DID - LANDSCAPE FRAME PHOTO GALLERY
   Same click-to-advance interaction as the square frame above - each
   tap/click on the landscape Polaroid moves "#did-landscape-photo" to
   the next image in this list, wrapping back to the first after the
   last - the frame itself (".did-polaroid-landscape" in
   interventions.css) never changes size or position, only which image
   is showing.
   -------------------------------------------------------------------- */
const didLandscapeGalleryImages = [
  'assets/images/intervention-polaroid-02-photo-01.png',
  'assets/images/intervention-polaroid-02-photo-02.png',
  'assets/images/intervention-polaroid-02-photo-03.png',
  'assets/images/intervention-polaroid-02-photo-04.png',
  'assets/images/intervention-polaroid-02-photo-05.png',
  'assets/images/intervention-polaroid-02-photo-06.png',
  'assets/images/intervention-polaroid-02-photo-07.png',
  'assets/images/intervention-polaroid-02-photo-08.png',
];

const didLandscapePolaroid = document.getElementById('did-landscape-polaroid');
const didLandscapePhoto = document.getElementById('did-landscape-photo');
let didLandscapeGalleryIndex = 0; // starts on the first image above; each click moves to the next, wrapping after the last

function handleDidLandscapeClick() {
  didLandscapeGalleryIndex = (didLandscapeGalleryIndex + 1) % didLandscapeGalleryImages.length;
  didLandscapePhoto.src = didLandscapeGalleryImages[didLandscapeGalleryIndex];
}

didLandscapePolaroid.addEventListener('click', handleDidLandscapeClick);


/* --------------------------------------------------------------------
   THINGS SOMEONE DID - TALL PORTRAIT FRAME PHOTO GALLERY
   Same click-to-advance interaction as the square/landscape frames
   above - each tap/click on the tall portrait Polaroid moves
   "#did-tall-photo" to the next image in this list, wrapping back to
   the first after the last - the frame itself (".did-polaroid-tall"
   in interventions.css) never changes size or position, only which
   image is showing.
   -------------------------------------------------------------------- */
const didTallGalleryImages = [
  'assets/images/intervention-polaroid-01-photo-01.jpeg',
  'assets/images/intervention-polaroid-01-photo-02.jpeg',
  'assets/images/intervention-polaroid-01-photo-03.jpeg',
  'assets/images/intervention-polaroid-01-photo-04.jpeg',
  'assets/images/intervention-polaroid-01-photo-05.jpeg',
  'assets/images/intervention-polaroid-01-photo-06.jpeg',
];

const didTallPolaroid = document.getElementById('did-tall-polaroid');
const didTallPhoto = document.getElementById('did-tall-photo');
let didTallGalleryIndex = 0; // starts on the first image above; each click moves to the next, wrapping after the last

function handleDidTallClick() {
  didTallGalleryIndex = (didTallGalleryIndex + 1) % didTallGalleryImages.length;
  didTallPhoto.src = didTallGalleryImages[didTallGalleryIndex];
}

didTallPolaroid.addEventListener('click', handleDidTallClick);
