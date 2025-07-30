document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const tripId = params.get("tripId");
    const organizerId = params.get("organizerId");
  
     const currentPagePath = window.location.pathname;
    const currentPageFilename = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1);

    if (!tripId || !organizerId) {
      console.warn("Missing tripId or organizerId in URL for tab navigation.");
      return;
    }
  
    const tabLinks = {
      tabOverview: `../html/trip-overview.html?tripId=${tripId}&organizerId=${organizerId}`,
      tabConditions: `../html/conditions.html?tripId=${tripId}&organizerId=${organizerId}`,
      tabReviews: `../html/review.html?tripId=${tripId}&organizerId=${organizerId}`,
      tabUpdates: `../html/Trail-updates.html?tripId=${tripId}&organizerId=${organizerId}`,
    };
  
    for (const [id, url] of Object.entries(tabLinks)) {
      const el = document.getElementById(id);
      if (el) el.href = url;
    }

    for (const [id, url] of Object.entries(tabLinks)) {
        const tabElement = document.getElementById(id); // Get the tab element by its ID

        if (tabElement) {
            // Set the href for each tab link, including the query parameters
            tabElement.href = url;

            // Extract the filename part of the tab's URL for comparison
            let linkFilename = url.substring(url.lastIndexOf('/') + 1);
            // Remove any query parameters from the link's filename for a clean comparison
            if (linkFilename.includes('?')) {
                linkFilename = linkFilename.substring(0, linkFilename.indexOf('?'));
            }

            // If the current page's filename matches this tab's filename, add the active class
            if (currentPageFilename === linkFilename) {
                tabElement.classList.add('active');
            } else {
                // Ensure other tabs do NOT have the active class
                tabElement.classList.remove('active');
            }
        }
    }
  });
  

  // PWA: Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then(reg => console.log("✅ Service Worker registered:", reg.scope))
      .catch(err => console.error("❌ Service Worker registration failed:", err));
  });
}
