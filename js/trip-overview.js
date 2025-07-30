import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCUV-8E2w3Td_TyYo52LAvhb2WA9CnVaLY",
  authDomain: "trial-quest-45442.firebaseapp.com",
  projectId: "trial-quest-45442",
  storageBucket: "trail-quest-45442.appspot.com",
  messagingSenderId: "780796401639",
  appId: "1:780796401639:web:b3bfb178ff7450ac3c0f42",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Get tripId and organizerId from URL
const params = new URLSearchParams(window.location.search);
const tripId = params.get("tripId");
const organizerId = params.get("organizerId");

document.addEventListener("DOMContentLoaded", async () => {
  if (!tripId || !organizerId) {
    console.error("Missing tripId or organizerId in URL");
    return;
  }

  try {
    const ref = doc(db, "trips", organizerId, "tripList", tripId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      console.warn("Trip not found:", tripId);
      return;
    }

    const trip = snap.data();
    console.log("Loaded trip:", trip); // Debug

    // === UI Population ===
    document.title = `Trailquest - ${trip.tripName}`;
    document.getElementById("mainTrailName").textContent = trip.tripName;
    document.getElementById("sidebarTrailName").textContent = trip.tripName;
    document.getElementById("organizerName").textContent = `Organized by ${
      trip.organizerName || "Trail Organizer"
    }`;

    document.getElementById("trailLength").textContent = trip.length || "N/A";
    document.getElementById("trailDuration").textContent =
      trip.estimatedTime || "N/A";
    document.getElementById("trailDifficulty").textContent =
      trip.difficulty || "N/A";
    document.getElementById("trailDescription").textContent =
      trip.description ||
      trip.otherDescriptions ||
      "Explore this amazing trail...";

    fillList("recommendationList", trip.recommendations || []);
    fillList("infoTrail", trip.trailInfo || []);
    fillList("infoFeatures", trip.features || []);
    fillList("infoActivities", trip.activities || []);

    const photos = trip.photoURLs || [];
    document.getElementById("mainTrailImage").src =
      photos[0] || "https://picsum.photos/id/1043/400/250";
    document.getElementById("photoCount").textContent = photos.length;

    const imageGrid = document.getElementById("imageGrid");
    imageGrid.innerHTML = `
      <div class="large-image-placeholder">
        <img src="${photos[1] || photos[0] || ''}" alt="Large trail image">
      </div>
      <div class="small-image-placeholder">
        <img src="${photos[2] || photos[0] || ''}" alt="Small trail image 1">
      </div>
      <div class="small-image-placeholder">
        <img src="${photos[3] || photos[0] || ''}" alt="Small trail image 2">
      </div>
    `;

    // ✅ Set chat link (check if organizerUID is present)
    const chatLink = document.getElementById("chatLink");
    if (trip.organizerUID) {
      console.log("Using organizerUID for chat:", trip.organizerUID);
      chatLink.href = `chat.html?with=${trip.organizerUID}`;
    } else {
      console.warn("Missing organizerUID, falling back to organizerId:", organizerId);
      chatLink.href = `chat.html?with=${organizerId}`;
    }

    // ✅ Set star rating
    const starRating = generateStars(trip.rating || 4);
    document.getElementById("starRating").innerHTML = starRating;
    document.getElementById("ratingText").textContent = `${
      trip.rating?.toFixed(1) || "4.0"
    } (${trip.reviewCount || 0})`;

    // ✅ Update tab navigation links
    document.getElementById("overviewTab").href = `trip-overview.html?tripId=${tripId}&organizerId=${organizerId}`;
    document.getElementById("conditionsTab").href = `conditions.html?tripId=${tripId}&organizerId=${organizerId}`;
    document.getElementById("reviewsTab").href = `review.html?tripId=${tripId}&organizerId=${organizerId}`;
    document.getElementById("trailUpdatesTab").href = `Trail-updates.html?tripId=${tripId}&organizerId=${organizerId}`;
    
  } catch (err) {
    console.error("Error loading trip data:", err);
  }
});

function fillList(id, items) {
  const list = document.getElementById(id);
  if (!list) return;
  list.innerHTML = "";
  (Array.isArray(items) ? items : [items]).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });
}

function generateStars(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    '<i class="fas fa-star"></i>'.repeat(full) +
    '<i class="fas fa-star-half-alt"></i>'.repeat(half) +
    '<i class="far fa-star"></i>'.repeat(empty)
  );
}

// PWA: Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then(reg => console.log("✅ Service Worker registered:", reg.scope))
      .catch(err => console.error("❌ Service Worker registration failed:", err));
  });
}
