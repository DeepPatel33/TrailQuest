import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCUV-8E2w3Td_TyYo52LAvhb2WA9CnVaLY",
  authDomain: "trial-quest-45442.firebaseapp.com",
  databaseURL: "https://trial-quest-45442-default-rtdb.firebaseio.com",
  projectId: "trial-quest-45442",
  storageBucket: "trail-quest-45442.appspot.com",
  messagingSenderId: "780796401639",
  appId: "1:780796401639:web:b3bfb178ff7450ac3c0f42",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ Get trip/organizer IDs from URL
const urlParams = new URLSearchParams(window.location.search);
const tripId = urlParams.get("tripId");
const organizerId = urlParams.get("organizerId");

// ✅ DOM references
const modal = document.getElementById("editModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const form = document.getElementById("editForm");
const container = document.getElementById("event-detail-container");
const tabs = document.querySelectorAll(".tab");
const tabSections = document.querySelectorAll(".tab-section");
const viewHikersBtn = document.getElementById("viewHikersBtn");

let tripData = null;

// ✅ Tab behavior
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tabSections.forEach((s) => s.classList.remove("active"));

    tab.classList.add("active");
    document.getElementById(`${tab.dataset.tab}Tab`).classList.add("active");
  });
});

// ✅ Load trip from Firestore
(async function () {
  if (!tripId || !organizerId) {
    container.innerHTML =
      "<p>Invalid trip. Please return to your dashboard.</p>";
    return;
  }

  try {
    const ref = doc(db, "trips", organizerId, "tripList", tripId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      container.innerHTML = "<p>Trip not found.</p>";
      return;
    }

    renderTrip(snap.data());
  } catch (err) {
    console.error("Failed to load trip:", err);
    container.innerHTML = "<p>Error loading trip. Try again later.</p>";
  }
})();

// ✅ Render trip content
function renderTrip(trip) {
  tripData = trip;

  // Set title
  document.getElementById("tripTitle").textContent =
    trip.tripName || "Untitled Trip";

  // DETAILS tab
  document.getElementById("tripLocation").textContent = trip.cityPlace || "N/A";
  document.getElementById("tripLength").textContent = trip.length || "N/A";
  document.getElementById("tripTime").textContent = trip.estimatedTime || "N/A";
  document.getElementById("tripDifficulty").textContent =
    trip.difficulty || "N/A";
  document.getElementById("tripType").textContent = trip.tripType || "N/A";
  document.getElementById("tripFeatures").textContent =
    (trip.features || []).join(", ") || "N/A";
  document.getElementById("tripActivities").textContent =
    trip.activities || "N/A";
  document.getElementById("tripWeather").textContent =
    trip.weatherConditions || "N/A";
  document.getElementById("tripTrailInfo").textContent =
    trip.trailInfo || "N/A";
  document.getElementById("tripOtherDescriptions").textContent =
    trip.otherDescriptions || "None";
  document.getElementById("tripComments").textContent = trip.comments || "None";

  // CONTACT tab
  const contact = trip.contactDetails || {};
  document.getElementById("organizerName").textContent =
    contact.fullName || "N/A";
  document.getElementById("organizerEmail").textContent =
    contact.email || "N/A";
  document.getElementById("organizerPhone").textContent =
    contact.phone || "N/A";
  document.getElementById("groupSize").textContent = contact.groupSize || "N/A";

  // PHOTOS tab
  const photoContainer = document.getElementById("tripPhotos");
  photoContainer.innerHTML = "";
  (trip.photoURLs || []).forEach((url) => {
    const img = document.createElement("img");
    img.src = url;
    img.alt = "Trip Photo";
    photoContainer.appendChild(img);
  });

  // Edit button
  document.getElementById("editBtn").addEventListener("click", () => {
    populateForm(trip);
    modal.style.display = "flex";
  });

  // View Hikers button
  viewHikersBtn.addEventListener("click", () => {
    window.location.href = `registered-hikers.html?tripId=${tripId}&organizerId=${organizerId}`;
  });
}

// ✅ Populate modal form for editing
function populateForm(trip) {
  form.tripName.value = trip.tripName || "";
  form.cityPlace.value = trip.cityPlace || "";
  form.length.value = trip.length || "";
  form.estimatedTime.value = trip.estimatedTime || "";
  form.difficulty.value = trip.difficulty || "";
  form.tripType.value = trip.tripType || "";
  form.features.value = (trip.features || []).join(", ");
  form.activities.value = trip.activities || "";
  form.weatherConditions.value = trip.weatherConditions || "";
  form.trailInfo.value = trip.trailInfo || "";
  form.otherDescriptions.value = trip.otherDescriptions || "";
  form.comments.value = trip.comments || "";
  form.fullName.value = trip.contactDetails?.fullName || "";
  form.email.value = trip.contactDetails?.email || "";
  form.phone.value = trip.contactDetails?.phone || "";
  form.groupSize.value = trip.contactDetails?.groupSize || "";
}

// ✅ Submit edit form
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const updatedTrip = {
    ...tripData,
    tripName: form.tripName.value,
    cityPlace: form.cityPlace.value,
    length: Number(form.length.value),
    estimatedTime: form.estimatedTime.value,
    difficulty: form.difficulty.value,
    tripType: form.tripType.value,
    features: form.features.value.split(",").map((f) => f.trim()),
    activities: form.activities.value,
    weatherConditions: form.weatherConditions.value,
    trailInfo: form.trailInfo.value,
    otherDescriptions: form.otherDescriptions.value,
    comments: form.comments.value,
    contactDetails: {
      fullName: form.fullName.value,
      email: form.email.value,
      phone: form.phone.value,
      groupSize: Number(form.groupSize.value),
    },
  };

  try {
    const ref = doc(db, "trips", organizerId, "tripList", tripId);
    await updateDoc(ref, updatedTrip);
    modal.style.display = "none";
    renderTrip(updatedTrip);
    alert("Trip updated successfully!");
  } catch (err) {
    console.error("Update failed:", err);
    alert("Failed to update. Please try again.");
  }
});

// ✅ Close modal
closeModalBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

// PWA: Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then(reg => console.log("✅ Service Worker registered:", reg.scope))
      .catch(err => console.error("❌ Service Worker registration failed:", err));
  });
}
