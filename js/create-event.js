// ✅ Import Firebase app and services
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// ✅ Supabase for photo uploads
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabase = createClient(
  "https://kfsiwdkqyapfoztpnqph.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtmc2l3ZGtxeWFwZm96dHBucXBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTgzNjcsImV4cCI6MjA2Njg5NDM2N30.Tp2QG3mq8cW62PY_7DHTgqxWnLeyEf_k5wlM9Ma6yCE"
);

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".organiser-form");
  const tripTypeRadios = document.querySelectorAll('input[name="trip-type"]');
  const groupSizeWrapper = document.getElementById("group-size-wrapper");
  const groupSizeInput = document.getElementById("group-size");

  function toggleGroupSizeVisibility() {
    const isGroupTrip = document.getElementById("group-trip").checked;
    groupSizeWrapper.style.display = isGroupTrip ? "block" : "none";
    groupSizeInput.required = isGroupTrip;
  }

  // Bind to radio buttons and call once on load
  tripTypeRadios.forEach(radio => {
    radio.addEventListener("change", toggleGroupSizeVisibility);
  });
  toggleGroupSizeVisibility();

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("Please login as an organizer to create a trip.");
      window.location.href = "auth.html";
      return;
    }

    let fullName = "", email = "", phone = "";
    try {
      const docRef = doc(db, "organizer", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        fullName = data.fullName || "";
        email = data.email || "";
        phone = data.phone || "";

        document.getElementById("organizer-full-name").value = fullName;
        document.getElementById("organizer-email").value = email;
        document.getElementById("organizer-phone").value = phone;
      }
    } catch (err) {
      console.error("Error fetching organizer data:", err);
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const isGroupTrip = document.getElementById("group-trip").checked;

      if (isGroupTrip) {
        const groupSize = parseInt(groupSizeInput.value);
        if (isNaN(groupSize) || groupSize < 2 || groupSize > 50) {
          alert("Group size must be between 2 and 50.");
          groupSizeInput.focus();
          return;
        }
      }

      const photoFiles = document.getElementById("photos").files;
      const photoURLs = [];

      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i];
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const path = `${user.uid}/${Date.now()}_${safeName}`;

        const { data, error } = await supabase.storage
          .from("trip-images")
          .upload(path, file, { upsert: false });

        if (error || !data?.path) {
          console.error("Photo upload error:", error);
          alert(`Upload failed for ${file.name}`);
          return;
        }

        const { data: urlData } = supabase.storage
          .from("trip-images")
          .getPublicUrl(data.path);

        if (!urlData?.publicUrl) {
          alert(`Could not get URL for ${file.name}`);
          return;
        }

        photoURLs.push(urlData.publicUrl);
      }

      const formData = {
        tripName: document.getElementById("trip-name").value,
        organiserName: document.getElementById("organiser-name").value,
        cityPlace: document.getElementById("city-place").value,
        length: document.getElementById("length").value,
        estimatedTime: document.getElementById("estimated-time").value,
        tripDate: document.getElementById("trip-date").value,
        tripTime: document.getElementById("trip-time").value,
        trailInfo: document.getElementById("trail-info").value,
        difficulty:
          document.querySelector('input[name="difficulty"]:checked')?.value || "",
        tripType:
          document.querySelector('input[name="trip-type"]:checked')?.value || "",
        features: Array.from(
          document.querySelectorAll('input[name="features[]"]:checked')
        ).map((el) => el.value),
        activities: document.getElementById("activities").value,
        weatherConditions: document.getElementById("weather-conditions").value,
        otherDescriptions: document.getElementById("other-descriptions").value,
        createdAt: new Date().toISOString(),
        photoURLs,
        contactDetails: {
          fullName,
          email,
          phone,
          groupSize: isGroupTrip ? groupSizeInput.value : null,
        },
        organizerId: user.uid,
      };

      try {
        const tripRef = collection(db, "trips", user.uid, "tripList");
        await addDoc(tripRef, formData);
        alert("Trip created successfully!");
        form.reset();
        document.getElementById("photos").value = "";
        toggleGroupSizeVisibility(); // Reset visibility
      } catch (err) {
        console.error("Trip save error:", err);
        alert("Failed to create trip.");
      }
    });
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
