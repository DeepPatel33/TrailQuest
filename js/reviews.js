// ✅ Import Firebase + Supabase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// ✅ Supabase Setup
const supabase = createClient(
  "https://kfsiwdkqyapfoztpnqph.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
);

// ✅ Firebase Setup
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
const auth = getAuth(app);

// ✅ DOM
const reviewForm = document.getElementById("reviewForm");
const reviewsContainer = document.getElementById("reviewsContainer");
const noReviewsMessage = document.getElementById("noReviewsMessage");
const openReviewFormBtn = document.getElementById("openReviewFormBtn");
const reviewSection = document.getElementById("reviewSubmissionSection");
const reviewTextInput = document.getElementById("reviewText");
const reviewRatingInputContainer = document.getElementById("reviewRatingInput");
const selectedRatingInput = document.getElementById("selectedRating");

const urlParams = new URLSearchParams(window.location.search);
const tripId = urlParams.get("tripId");
const organizerId = urlParams.get("organizerId");

let currentRating = 0;
let currentUser = null;
let currentUserData = null;

// ✅ User Auth
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    reviewSection.innerHTML = `<p style="text-align: center;">Please <a href="login.html">log in</a> to leave a review.</p>`;
  } else {
    currentUser = user;
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    currentUserData = userDoc.exists() ? userDoc.data() : null;
    loadReviews();
  }
});

// ⭐ Star Interactions
reviewRatingInputContainer.addEventListener("click", (e) => {
  const star = e.target.closest(".fa-star");
  if (star) {
    currentRating = parseInt(star.dataset.value);
    updateStars(currentRating);
  }
});
reviewRatingInputContainer.addEventListener("mouseover", (e) => {
  const star = e.target.closest(".fa-star");
  if (star) updateStars(parseInt(star.dataset.value), true);
});
reviewRatingInputContainer.addEventListener("mouseout", () =>
  updateStars(currentRating)
);

function updateStars(rating, isHover = false) {
  const stars = reviewRatingInputContainer.querySelectorAll(".fa-star");
  stars.forEach((star) => {
    const val = parseInt(star.dataset.value);
    star.classList[val <= rating ? "add" : "remove"]("fas");
    star.classList[val > rating ? "add" : "remove"]("far");
  });
  if (!isHover) selectedRatingInput.value = rating;
}

// ✅ Submit Review
reviewForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return;

  const text = reviewTextInput.value.trim();
  if (!text || currentRating === 0)
    return alert("Please fill out all fields and select a rating");

  const name =
    currentUserData?.fullName || currentUser.displayName || currentUser.email;
  const profileImageUrl =
    currentUserData?.profileImageUrl ||
    `https://placehold.co/50x50/green/white?text=${name[0] || "U"}`;
  let imageUrl = "";

  // 📷 Upload image to Supabase
  const imageInput = document.getElementById("reviewImage");
  if (imageInput && imageInput.files.length > 0) {
    const file = imageInput.files[0];
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${tripId}/${Date.now()}_${safeName}`;
    const { data, error } = await supabase.storage
      .from("review")
      .upload(path, file, { upsert: false });

    if (error || !data?.path) {
      console.error("Upload error:", error);
      alert("Image upload failed");
      return;
    }

    const { data: urlData } = supabase.storage
      .from("review")
      .getPublicUrl(data.path);
    imageUrl = urlData?.publicUrl || "";
  }

  const review = {
    name,
    uid: currentUser.uid,
    rating: currentRating,
    text,
    date: new Date().toISOString(),
    imageUrl,
    profileImageUrl,
  };

  const reviewsRef = collection(
    db,
    `trips/${organizerId}/tripList/${tripId}/reviews`
  );
  await addDoc(reviewsRef, review);

  reviewForm.reset();
  updateStars(0);
  reviewSection.style.display = "none";
  loadReviews();
});

// ✅ Load & Render Reviews
async function loadReviews() {
  const reviewsRef = collection(
    db,
    `trips/${organizerId}/tripList/${tripId}/reviews`
  );
  const q = query(reviewsRef, orderBy("date", "desc"));
  const snapshot = await getDocs(q);

  reviewsContainer.innerHTML = "";
  const reviews = [];
  snapshot.forEach((docSnap) =>
    reviews.push({ ...docSnap.data(), id: docSnap.id })
  );

  if (reviews.length === 0) {
    noReviewsMessage.style.display = "block";
    return;
  }

  noReviewsMessage.style.display = "none";
  reviews.forEach(renderReviewCard);
  updateRatingSummary(reviews);
}

// ⭐ Render individual review
function renderReviewCard(review) {
  const div = document.createElement("div");
  div.classList.add("individual-review-card");

  let starsHTML = "";
  for (let i = 1; i <= 5; i++) {
    starsHTML += `<i class="fa-star ${
      i <= review.rating ? "fas" : "far"
    }"></i>`;
  }

  div.innerHTML = `
    <div class="review-header">
      <div class="reviewer-info">
        <img src="${review.profileImageUrl}" class="reviewer-avatar" />
        <div class="reviewer-details">
          <div class="name-rating">
            <span class="reviewer-name">${review.name}</span>
            <span class="stars-small">${starsHTML}</span>
          </div>
          <span class="review-timestamp">${new Date(
            review.date
          ).toLocaleDateString()}</span>
        </div>
      </div>
      ${
        currentUser?.uid === review.uid
          ? `<div class="review-actions-dropdown">
               <button class="more-btn" onclick="toggleDropdown(this)">⋮</button>
               <div class="dropdown-menu" style="display: none;">
                 <button onclick="deleteReview('${review.id}')">Delete</button>
               </div>
             </div>`
          : ""
      }
    </div>
    <p class="review-text">${review.text}</p>
    ${
      review.imageUrl
        ? `<div class="review-photos-grid"><img src="${review.imageUrl}" /></div>`
        : ""
    }
  `;
  reviewsContainer.appendChild(div);
}

// ✅ Delete Review
window.deleteReview = async (reviewId) => {
  if (!confirm("Are you sure you want to delete this review?")) return;
  const ref = doc(
    db,
    `trips/${organizerId}/tripList/${tripId}/reviews/${reviewId}`
  );
  await deleteDoc(ref);
  loadReviews();
};

// ✅ Dropdown logic
window.toggleDropdown = (btn) => {
  const menu = btn.nextElementSibling;
  const isOpen = menu.style.display === "block";
  document
    .querySelectorAll(".dropdown-menu")
    .forEach((m) => (m.style.display = "none"));
  menu.style.display = isOpen ? "none" : "block";
};

document.addEventListener("click", (e) => {
  if (!e.target.closest(".review-actions-dropdown")) {
    document
      .querySelectorAll(".dropdown-menu")
      .forEach((m) => (m.style.display = "none"));
  }
});

// ✅ Summary Stars + Count
function updateRatingSummary(reviews) {
  const ratingDisplay = document.querySelector(".rating-value");
  const countDisplay = document.querySelector(".review-count");
  const bars = document.querySelectorAll(".star-row .progress-bar");

  const total = reviews.length;
  const sum = reviews.reduce((acc, cur) => acc + cur.rating, 0);
  const avg = (sum / total).toFixed(1);

  ratingDisplay.textContent = avg;
  countDisplay.textContent = `${total} Reviews`;

  const breakdown = [0, 0, 0, 0, 0];
  reviews.forEach((r) => breakdown[r.rating - 1]++);

  bars.forEach((bar, i) => {
    const percent = (breakdown[4 - i] / total) * 100;
    bar.style.width = `${percent}%`;
  });
}

// ✅ Toggle Form
if (openReviewFormBtn) {
  openReviewFormBtn.addEventListener("click", () => {
    reviewSection.style.display =
      reviewSection.style.display === "block" ? "none" : "block";
    if (reviewSection.style.display === "block") {
      reviewSection.scrollIntoView({ behavior: "smooth" });
    }
  });
}

// PWA: Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then(reg => console.log("✅ Service Worker registered:", reg.scope))
      .catch(err => console.error("❌ Service Worker registration failed:", err));
  });
}
