// Organizer.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

// ✅ Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCUV-8E2w3Td_TyYo52LAvhb2WA9CnVaLY",
  authDomain: "trial-quest-45442.firebaseapp.com",
  databaseURL: "https://trial-quest-45442-default-rtdb.firebaseio.com",
  projectId: "trial-quest-45442",
  storageBucket: "trail-quest-45442.appspot.com",
  messagingSenderId: "780796401639",
  appId: "1:780796401639:web:b3bfb178ff7450ac3c0f42",
  measurementId: "G-MC6VBKFG01",
};

// ✅ Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ✅ Auth state listener
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("You must be logged in as an organizer to view this page.");
    window.location.href = "login.html";
    return;
  }

  const organizerId = user.uid;
  const tripListRef = collection(db, "trips", organizerId, "tripList");

  try {
    const snapshot = await getDocs(tripListRef);
    const tripListContainer = document.getElementById("trip-list");
    const banner = document.getElementById("no-trips-banner");
    tripListContainer.innerHTML = "";

    if (snapshot.empty) {
      if (banner) banner.style.display = "block";
      return;
    } else {
      if (banner) banner.style.display = "none";
    }

    snapshot.forEach((docSnap) => {
      const trip = docSnap.data();
      const tripId = docSnap.id;

      const firstPhoto =
        (trip.photoURLs && trip.photoURLs.length > 0 && trip.photoURLs[0]) ||
        "https://picsum.photos/300/200";

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${firstPhoto}" alt="${trip.tripName || "Trip Image"}" class="card-image">
        <div class="card-content">
          <h3>${trip.tripName || "Unnamed Trip"}</h3>
          <p>${trip.cityPlace || "Unknown Location"} • ${trip.difficulty || "Difficulty N/A"}</p>
          <button onclick="window.location.href='event-detail.html?tripId=${tripId}&organizerId=${organizerId}'">Details</button>
          <button class="delete-btn">Delete</button>
        </div>
      `;

      // ✅ Add delete button event
      const deleteBtn = card.querySelector(".delete-btn");
      deleteBtn.addEventListener("click", async () => {
        const confirmDelete = confirm("Are you sure you want to delete this trip?");
        if (!confirmDelete) return;

        try {
          await deleteDoc(doc(db, "trips", organizerId, "tripList", tripId));
          card.remove();
          if (tripListContainer.children.length === 0 && banner) {
            banner.style.display = "block";
          }
          alert("Trip deleted successfully.");
        } catch (err) {
          console.error("Failed to delete trip:", err);
          alert("Failed to delete trip.");
        }
      });

      tripListContainer.appendChild(card);
    });
  } catch (err) {
    console.error("Error fetching trips:", err);
    alert("Something went wrong while loading trips.");
  }
});

// ✅ Mobile menu toggle logic
document.addEventListener("DOMContentLoaded", () => {
  const menuModal = document.getElementById("menuModal");
  const closeMenuBtn = document.getElementById("closeMenuBtn");

  document.querySelector(".mobile-nav-toggle")?.addEventListener("click", () => {
    menuModal.classList.add("active");
  });

  closeMenuBtn?.addEventListener("click", () => {
    menuModal.classList.remove("active");
  });
});


// PWA: Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then(reg => console.log("✅ Service Worker registered:", reg.scope))
      .catch(err => console.error("❌ Service Worker registration failed:", err));
  });
}
