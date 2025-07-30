import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCUV-8E2w3Td_TyYo52LAvhb2WA9CnVaLY",
  authDomain: "trial-quest-45442.firebaseapp.com",
  projectId: "trial-quest-45442",
  storageBucket: "trail-quest-45442.appspot.com",
  messagingSenderId: "780796401639",
  appId: "1:780796401639:web:b3bfb178ff7450ac3c0f42",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("registerModal");
  const hitTrailBtn = document.getElementById("hitTrailBtn");
  const submitBtn = document.getElementById("submitRegistration");
  const closeModalBtn = document.getElementById("closeModal");

  if (!modal || !hitTrailBtn || !submitBtn || !closeModalBtn) {
    console.error("Registration elements not found.");
    return;
  }

  // Show modal if authenticated
  hitTrailBtn.addEventListener("click", () => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        modal.style.display = "flex";
      } else {
        alert("Please sign in to register for the trail.");
        window.location.href = "auth.html";
      }
    });
  });

  // Submit registration
  submitBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be signed in to register.");
      return;
    }

    const fullName = document.getElementById("fullName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const emergency = document.getElementById("emergencyContact").value.trim();
    const groupSize = document.getElementById("groupSize").value.trim();
    const location = document.getElementById("location").value.trim();

    if (!fullName || !phone || !emergency || !groupSize || !location) {
      alert("Please fill in all fields.");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const tripId = params.get("tripId");
    const organizerId = params.get("organizerId");

    if (!tripId || !organizerId) {
      alert("Trip information is missing.");
      return;
    }

    const registrationData = {
      fullName,
      phone,
      emergencyContact: emergency,
      groupSize: parseInt(groupSize),
      location,
      email: user.email,
      userId: user.uid,
      tripId,
      organizerId,
      timestamp: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, "registrations"), registrationData);
      alert("You have successfully registered for the trail!");
      modal.style.display = "none";
    } catch (err) {
      console.error("Registration error:", err);
      alert("Failed to register. Please try again.");
    }
  });

  // Close modal on ✖
  closeModalBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Optional: Close modal when clicking outside of modal-content
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
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
