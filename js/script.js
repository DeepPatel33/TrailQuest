// === FIREBASE TRIP FETCHING LOGIC ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore,
  collectionGroup,
  getDocs,
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

// Load all trips dynamically
async function loadAllTrips() {
  const tripListRef = collectionGroup(db, "tripList");
  const snapshot = await getDocs(tripListRef);
  const container = document.getElementById("trip-list");

  if (!container) return;
  container.innerHTML = "";

  if (snapshot.empty) {
    container.innerHTML = "<p>No trips found.</p>";
    return;
  }

  let tripCardsHTML = "";
  let cardCount = 0; // Initialize a counter for cards

  snapshot.forEach((doc) => {
    if (cardCount >= 8) { // Stop if 5 cards have already been processed
      return;
    }

    const data = doc.data();
    const image =
      (data.photoURLs && data.photoURLs[0]) ||
      "https://picsum.photos/300/200?random=1";

    const tripId = doc.id;
    const organizerId = doc.ref.parent.parent.id;

    tripCardsHTML += `
      <div class="card">
       <img src="${image}" alt="${
      data.tripName || "Trip Image"
    }" class="card-image">
        <div class="card-header">
          <h3><strong>${data.tripName}</strong></h3>
          ${data.organiserName ? ` ${data.organiserName}</p>`: ""}
        </div>
        
        <div class="card-content">
          
          ${data.cityPlace ? `<p><strong>Location:</strong> ${data.cityPlace}</p>`: ""}
          ${data.length ? `<p><strong>Length:</strong> ${data.length}</p>` : ""}
          ${data.tripType ? `<p><strong>Trip Type:</strong> ${data.tripType}</p>`: ""}
          ${data.difficulty ? `<p><strong>Difficulty:</strong> ${data.difficulty}</p>`: ""}
          ${data.tripDate ? `<p><strong>Date:</strong> ${data.tripDate}</p>`: ""}
          ${data.tripTime ? `<p><strong>Time:</strong> ${data.tripTime}</p>`: ""}
          <button onclick="joinTrip('${tripId}', '${organizerId}')">Explore</button>
        </div>
      </div>
    `;
    cardCount++; // Increment the counter
  });

  container.innerHTML = tripCardsHTML;
}

document.addEventListener("DOMContentLoaded", loadAllTrips);

// ✅ Join trip button handler
window.joinTrip = function (tripId, organizerId) {
  window.location.href = `trip-overview.html?tripId=${tripId}&organizerId=${organizerId}`;
};

// --- Existing Modal JavaScript Logic ---
document.addEventListener("DOMContentLoaded", () => {
  const openFiltersBtn = document.getElementById("openFiltersBtn");
  const closeFiltersBtn = document.getElementById("closeFiltersBtn");
  const filterModal = document.getElementById("filterModal");

  if (openFiltersBtn && filterModal) {
    openFiltersBtn.addEventListener("click", () => {
      filterModal.style.display = "flex";
    });
  }

  if (closeFiltersBtn && filterModal) {
    closeFiltersBtn.addEventListener("click", () => {
      filterModal.style.display = "none";
    });
  }

  if (filterModal) {
    filterModal.addEventListener("click", (event) => {
      if (event.target === filterModal) {
        filterModal.style.display = "none";
      }
    });
  }

  const openMenuBtn = document.getElementById("openMenuBtn");
  const closeMenuBtn = document.getElementById("closeMenuBtn");
  const menuModal = document.getElementById("menuModal");

  if (openMenuBtn && menuModal) {
    openMenuBtn.addEventListener("click", (event) => {
      event.preventDefault();
      menuModal.classList.add("active");
    });
  }

  if (closeMenuBtn && menuModal) {
    closeMenuBtn.addEventListener("click", () => {
      menuModal.classList.remove("active");
    });
  }

  const cardsGrid = document.querySelector(".cards-grid");
  const carouselDots = document.querySelectorAll(".hero-section .dots .dot");
  let currentCarouselSlide = 0;

  function updateCarousel() {
    if (cardsGrid && carouselDots.length > 0) {
      const cardWidth = cardsGrid.children[0].offsetWidth;
      cardsGrid.style.transform = `translateX(-${
        currentCarouselSlide * cardWidth
      }px)`;
      carouselDots.forEach((dot, index) => {
        dot.classList.toggle("active", index === currentCarouselSlide);
      });
    }
  }

  let autoScrollInterval;

  function startAutoScroll() {
    autoScrollInterval = setInterval(() => {
      if (cardsGrid && carouselDots.length > 0) {
        currentCarouselSlide = (currentCarouselSlide + 1) % carouselDots.length;
        updateCarousel();
      }
    }, 9000); // Change slide every 3 seconds (3000ms)
  }

  function stopAutoScroll() {
    clearInterval(autoScrollInterval);
  }

  if (cardsGrid && carouselDots.length > 0) {
    carouselDots.forEach((dot) => {
      dot.addEventListener("click", (e) => {
        stopAutoScroll(); // Stop auto-scroll when a dot is clicked
        currentCarouselSlide = parseInt(e.target.dataset.slideTo);
        updateCarousel();
        startAutoScroll(); // Restart auto-scroll after a manual click
      });
    });
    updateCarousel(); // Initial update
    startAutoScroll(); // Start auto-scroll on load
  }

  const reviewDots = document.querySelectorAll(".hikers-reviews .dots .dot");
  if (reviewDots.length > 0) {
    reviewDots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        reviewDots.forEach((d) => d.classList.remove("active"));
        dot.classList.add("active");
      });
    });
  }
});

document.getElementById("signUpButton")?.addEventListener("click", () => {
  document.getElementById("signIn").style.display = "none";
  document.getElementById("signup").style.display = "block";
});

document.getElementById("signInButton")?.addEventListener("click", () => {
  document.getElementById("signup").style.display = "none";
  document.getElementById("signIn").style.display = "block";
});

document.getElementById("signup").style.display = "none";

// PWA: Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then(reg => console.log("✅ Service Worker registered:", reg.scope))
      .catch(err => console.error("❌ Service Worker registration failed:", err));
  });
}
