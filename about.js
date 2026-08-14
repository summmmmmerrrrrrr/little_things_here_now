/* ==========================================================================
   ABOUT PAGE - SCRIPT
   Switches between the four section tabs/panels. The default active
   section ("a short film") is set directly in about.html (its tab
   starts "aria-selected=true", its panel starts without "hidden") -
   this only handles switching away from that default.
   ========================================================================== */

// Matches script.js's own iPad/tablet-landscape detection exactly (see
// "TABLET / IPAD LANDSCAPE DETECTION" there for the full reasoning) -
// duplicated here rather than loading the whole of script.js on this
// page (which grabs many homepage-only elements that don't exist
// here), since this page only needs this one small piece: applying
// the same ".tablet-landscape" class to <html> that the logo's own
// sizing (--logo-width in style.css, shared by this page and the
// homepage) already keys off. Without this, this page's own <html>
// never gets the class, so its logo would use the smaller general
// touch-landscape sizing instead of the iPad-corrected one - visibly
// different from the homepage, whether visited standalone or inside
// the homepage's About overlay.
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

const aboutTabs = Array.from(document.querySelectorAll('.about-tab'));
const aboutFilm = document.getElementById('about-film');

// The phone-portrait swipe gallery (see ".mobile-about-gallery" in
// about.css - this element exists regardless of screen size/orientation,
// CSS just hides it outside phone portrait) - centred on its "curtain"
// slide the first time the "what is this?" panel becomes visible, and
// never again after that, so it doesn't fight with the visitor's own
// swiping on a later visit to the tab.
const aboutGallery = document.querySelector('.mobile-about-gallery');
const aboutGalleryInitialSlide = aboutGallery ? aboutGallery.querySelector('.mobile-about-slide.is-initial') : null;
let aboutGalleryCentered = false;

function centerAboutGallery() {
  if (aboutGalleryCentered || !aboutGallery || !aboutGalleryInitialSlide) return;
  aboutGalleryCentered = true;

  aboutGallery.scrollLeft =
    aboutGalleryInitialSlide.offsetLeft -
    (aboutGallery.clientWidth - aboutGalleryInitialSlide.clientWidth) / 2;
}

function activateAboutTab(selectedTab) {
  aboutTabs.forEach((tab) => {
    const isSelected = tab === selectedTab;
    tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');

    const panel = document.getElementById(tab.getAttribute('aria-controls'));
    if (panel) panel.hidden = !isSelected;
  });

  // Leaving the film section pauses the video rather than leaving it
  // playing behind the newly active panel - "pause()" alone, never
  // touching "currentTime", so returning to it later resumes from the
  // same spot instead of restarting. Nothing here ever calls play(),
  // so returning to the film section never autoplays it either - the
  // visitor resumes manually via the native controls.
  if (selectedTab.id !== 'tab-film' && aboutFilm) {
    aboutFilm.pause();
  }

  // The gallery is "display: none" (via its panel's "hidden") until
  // this exact moment, so its scroll width/positions only become
  // measurable once the browser has laid it out - one
  // requestAnimationFrame after unhiding it is enough to wait for that.
  if (selectedTab.id === 'tab-what') {
    requestAnimationFrame(centerAboutGallery);
  }
}

aboutTabs.forEach((tab) => {
  tab.addEventListener('click', () => activateAboutTab(tab));
});

// If this page is running inside another page's iframe - the
// homepage's "about the project" overlay, see "#about-overlay" in
// index.html/script.js - its own two links back to "little things
// here now" mean two DIFFERENT things, and would otherwise both just
// navigate this iframe's own nested browsing context to a second,
// nested copy of the homepage inside the overlay box. A standalone
// visit to this page (window.self === window.top, the "else" branch
// below) needs its own version of the logo fix instead - same goal,
// simpler since there's no iframe/overlay to account for; the
// heading/fortune-teller link needs no such fix either way, since its
// plain "index.html?state=open-jar" href already works correctly on
// its own in both contexts.
if (window.self !== window.top) {
  // The heading/fortune-teller link ("back to the jar, already open")
  // just closes the overlay - the homepage underneath was never
  // touched, so there's nothing to restore; it's already showing
  // exactly the completed navigation state this link means to return to.
  const aboutJarLink = document.getElementById('about-jar-link');
  if (aboutJarLink && window.parent && typeof window.parent.closeAboutOverlay === 'function') {
    aboutJarLink.addEventListener('click', (event) => {
      event.preventDefault();
      window.parent.closeAboutOverlay();
    });
  }

  // The logo means something different: "start over", the same thing
  // it means everywhere else on the site (see handleTitleReload() in
  // script.js). So instead of merely closing the overlay, this clears
  // the sessionStorage flag that would otherwise make the reloaded
  // homepage jump straight back to the navigation state (see
  // markReturnToNavigation()/beginHomeSequence() in script.js - same
  // key string, "returnToMainNavigation"), then sends the actual
  // homepage (window.top, not this iframe) to a plain, param-free
  // URL - a genuine restart, the same destination handleTitleReload()
  // itself now also navigates to directly, rather than an approximation
  // of one.
  const aboutLogoLink = document.getElementById('about-logo-link');
  if (aboutLogoLink) {
    aboutLogoLink.addEventListener('click', (event) => {
      event.preventDefault();
      try {
        sessionStorage.removeItem('returnToMainNavigation');
      } catch (error) {
        // sessionStorage unavailable - nothing to clear
      }
      window.top.location.href = 'index.html';
    });
  }
} else {
  // A standalone visit to this page (not inside the homepage's overlay
  // iframe) - the logo means the same "start over" thing here as it
  // does everywhere else on the site (see handleTitleReload() in
  // script.js), which a plain "<a href="index.html">" (this link's own
  // HTML) doesn't reliably do on its own: a stale "return to the open
  // jar" flag (set when this page is reached from the jar's own
  // fortune-teller icon) would otherwise make the loaded homepage jump
  // straight back to the navigation state instead of genuinely
  // restarting. Clearing it first, then navigating - same fix as
  // collected.js's/take.js's/interventions.js's own logo-click
  // handlers, and this same file's own iframe-embedded case just
  // above, minus the "window.top"/overlay parts this standalone case
  // doesn't need - guarantees a genuine restart every time.
  const aboutLogoLink = document.getElementById('about-logo-link');
  if (aboutLogoLink) {
    aboutLogoLink.addEventListener('click', (event) => {
      event.preventDefault();
      try {
        sessionStorage.removeItem('returnToMainNavigation');
      } catch (error) {
        // sessionStorage unavailable - nothing to clear
      }
      window.location.href = 'index.html';
    });
  }
}
