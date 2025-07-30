import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc as docRef,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Firebase Config
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

const urlParams = new URLSearchParams(window.location.search);
const tripId = urlParams.get("tripId");
const organizerId = urlParams.get("organizerId");

const hikerList = document.getElementById("hikerList");
const searchInput = document.getElementById("searchInput");

let allHikers = [];

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    hikerList.innerHTML = `<div class="error">You must be logged in to view this page.</div>`;
    return;
  }

  if (user.uid !== organizerId) {
    hikerList.innerHTML = `<div class="error">Access denied. You are not the organizer for this trip.</div>`;
    return;
  }

  loadHikers();
});

async function loadHikers() {
  try {
    const regRef = collection(db, "registrations");
    const q = query(
      regRef,
      where("tripId", "==", tripId),
      where("organizerId", "==", organizerId)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      hikerList.innerHTML = `<p>No hikers have registered for this trip yet.</p>`;
      return;
    }

    const hikers = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      hikers.push({ ...data, docId: docSnap.id });
    });

    allHikers = hikers;
    renderHikers(hikers);
    addCSVDownloadButton(hikers);
  } catch (err) {
    console.error("Error loading registrations:", err);
    hikerList.innerHTML = `<div class="error">Failed to load registered hikers. Please try again later.</div>`;
  }
}

function renderHikers(hikers) {
  hikerList.innerHTML = `
    <p><strong>Total Registered Hikers:</strong> ${hikers.length}</p>
    <p><strong>Total Group Size:</strong> ${hikers.reduce(
      (sum, h) => sum + (Number(h.groupSize) || 1),
      0
    )}</p>
  `;

  hikers.forEach((data) => {
    const card = document.createElement("div");
    card.classList.add("hiker-card");

    card.innerHTML = `
      <p><strong>Name:</strong> ${data.fullName || "N/A"}</p>
      <p><strong>Email:</strong> ${data.email || "N/A"}</p>
      <p><strong>Phone:</strong> ${data.phone || "N/A"}</p>
      <p><strong>Emergency Contact:</strong> ${
        data.emergencyContact || "N/A"
      }</p>
      <p><strong>Location:</strong> ${data.location || "N/A"}</p>
      <p><strong>Group Size:</strong> ${data.groupSize || 1}</p>
      <p><strong>Registered At:</strong> ${formatDate(data.timestamp)}</p>
      <p><button class="delete-btn" data-id="${
        data.docId
      }">🗑️ Remove</button></p>
    `;

    card.querySelector(".delete-btn").addEventListener("click", async () => {
      const confirmDelete = confirm(`Remove ${data.fullName}?`);
      if (!confirmDelete) return;

      try {
        await deleteDoc(docRef(db, "registrations", data.docId));
        alert("Hiker removed.");
        loadHikers(); // refresh
      } catch (err) {
        console.error("Failed to delete:", err);
        alert("Failed to delete registration.");
      }
    });

    hikerList.appendChild(card);
  });
}

function formatDate(value) {
  if (!value) return "N/A";
  if (typeof value.toDate === "function") {
    return value.toDate().toLocaleString();
  }
  const parsed = new Date(value);
  return isNaN(parsed) ? "Invalid date" : parsed.toLocaleString();
}

function addCSVDownloadButton(hikers) {
  const existing = document.querySelector(".download-btn");
  if (existing) existing.remove(); // avoid duplicates

  const btn = document.createElement("button");
  btn.textContent = "Download as CSV";
  btn.classList.add("download-btn");

  btn.addEventListener("click", () => {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Emergency Contact",
      "Location",
      "Group Size",
      "Registered At",
    ];

    const rows = hikers.map((h) => [
      h.fullName || "",
      h.email || "",
      h.phone || "",
      h.emergencyContact || "",
      h.location || "",
      h.groupSize || 1,
      formatDate(h.timestamp),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((val) => `"${val}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "registered_hikers.csv";
    link.click();
  });

  hikerList.prepend(btn);
}

// 🔍 Live search
document.getElementById("searchInput")?.addEventListener("input", (e) => {
  const search = e.target.value.trim().toLowerCase();

  const filtered = allHikers.filter(
    (h) =>
      (h.fullName || "").toLowerCase().includes(search) ||
      (h.email || "").toLowerCase().includes(search)
  );

  renderHikers(filtered);
});

// PWA: Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then(reg => console.log("✅ Service Worker registered:", reg.scope))
      .catch(err => console.error("❌ Service Worker registration failed:", err));
  });
}
