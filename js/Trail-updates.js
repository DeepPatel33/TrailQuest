// ✅ Supabase Config
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const supabase = createClient(
  "https://kfsiwdkqyapfoztpnqph.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtmc2l3ZGtxeWFwZm96dHBucXBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTgzNjcsImV4cCI6MjA2Njg5NDM2N30.Tp2QG3mq8cW62PY_7DHTgqxWnLeyEf_k5wlM9Ma6yCE"
);

// ✅ Firebase Config
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore,
  getDoc,
  doc,
  collection,
  addDoc,
  query,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCUV-8E2w3Td_TyYo52LAvhb2WA9CnVaLY",
  authDomain: "trial-quest-45442.firebaseapp.com",
  projectId: "trial-quest-45442",
  storageBucket: "trail-quest-45442.appspot.com",
  messagingSenderId: "780796401639",
  appId: "1:780796401639:web:b3bfb178ff7450ac3c0f42",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

let currentUser = null;
let currentStream = null;
let uploadedFiles = [];

window.onload = () => {
  const params = new URLSearchParams(window.location.search);
  const tripId = params.get("tripId");
  const organizerId = params.get("organizerId");

  if (!tripId || !organizerId) {
    alert("Missing trail ID or organizer ID.");
    return;
  }

  const addPhotoBtn = document.getElementById("addPhotoBtn");
  const modal = document.getElementById("uploadChoiceModal");
  const closeBtn = modal.querySelector(".close-button");
  const captureBtn = document.getElementById("captureImageBtn");
  const uploadBtn = document.getElementById("uploadLocalBtn");
  const photoInput = document.getElementById("photoInput");
  const cameraFeed = document.getElementById("cameraFeed");
  const takePhotoBtn = document.getElementById("takePhotoBtn");
  const stopCameraBtn = document.getElementById("stopCameraBtn");
  const canvas = document.getElementById("photoCanvas");
  const photoPreview = document.getElementById("photoPreview");
  const commentInput = document.getElementById("commentInputModal");
  const submitBtn = document.getElementById("submitUpdateBtn");
  const updatesGrid = document.querySelector(".updates-grid");

  const cameraSection = modal.querySelector(".camera-section");
  const previewSection = modal.querySelector(".preview-comment-section");

  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (tripId && organizerId) loadTrailUpdates();
  });

  addPhotoBtn.onclick = () => {
    modal.style.display = "block";
    cameraSection.style.display = "none";
    previewSection.style.display = "none";
    uploadedFiles = [];
  };

  closeBtn.onclick = () => {
    modal.style.display = "none";
    stopCamera();
    photoPreview.src = "";
    commentInput.value = "";
  };

  captureBtn.onclick = async () => {
    cameraSection.style.display = "block";
    previewSection.style.display = "none";
    try {
      currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraFeed.srcObject = currentStream;
    } catch (err) {
      alert("Camera access denied");
      modal.style.display = "none";
    }
  };

  stopCameraBtn.onclick = () => {
    stopCamera();
    modal.style.display = "none";
  };

  takePhotoBtn.onclick = () => {
    canvas.width = cameraFeed.videoWidth;
    canvas.height = cameraFeed.videoHeight;
    canvas.getContext("2d").drawImage(cameraFeed, 0, 0);
    canvas.toBlob((blob) => {
      const file = new File([blob], `captured_${Date.now()}.png`, { type: "image/png" });
      uploadedFiles = [file];
      photoPreview.src = URL.createObjectURL(file);
      cameraSection.style.display = "none";
      previewSection.style.display = "block";
    });
    stopCamera();
  };

  uploadBtn.onclick = () => photoInput.click();

  photoInput.onchange = (e) => {
    uploadedFiles = [...e.target.files];
    if (uploadedFiles.length > 0) {
      photoPreview.src = URL.createObjectURL(uploadedFiles[0]);
      previewSection.style.display = "block";
      cameraSection.style.display = "none";
    }
  };

  submitBtn.onclick = async () => {
    if (!currentUser) return alert("Please log in to post.");
    if (!tripId || !organizerId) return alert("Missing trail ID or organizer ID.");

    let imageUrl = null;
    if (uploadedFiles.length > 0) {
      const file = uploadedFiles[0];
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `trail_updates_images/${currentUser.uid}/${tripId}/${Date.now()}_${safeName}`;
      const { error } = await supabase.storage.from("trail-updates-photos").upload(path, file);
      if (error) return alert("Image upload failed");
      imageUrl = supabase.storage.from("trail-updates-photos").getPublicUrl(path).data.publicUrl;
    }

    const comment = commentInput.value.trim();
    if (!comment && !imageUrl) return alert("Please provide a comment or image");

    const updateRef = collection(firestore, "trips", organizerId, "tripList", tripId, "trailUpdates");
    try {
      await addDoc(updateRef, {
        comment,
        imageUrl: imageUrl || null,
        userId: currentUser.uid,
        createdAt: new Date().toISOString()
      });

      alert("Update shared!");
      modal.style.display = "none";
      uploadedFiles = [];
      commentInput.value = "";
      photoPreview.src = "";
      loadTrailUpdates();
    } catch (err) {
      console.error("Failed to save update:", err);
      alert("Failed to post update.");
    }
  };

  function stopCamera() {
    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop());
      cameraFeed.srcObject = null;
      currentStream = null;
    }
  }

  async function loadTrailUpdates() {
    const updatesRef = collection(firestore, "trips", organizerId, "tripList", tripId, "trailUpdates");
    const updatesQuery = query(updatesRef, orderBy("createdAt", "desc"));

    try {
      const snapshot = await getDocs(updatesQuery);
      const updates = [];
      snapshot.forEach((doc) => {
        updates.push({ id: doc.id, ...doc.data() });
      });

      const uniqueUserIds = [...new Set(updates.map(u => u.userId))];
      const userMap = new Map();

      for (const uid of uniqueUserIds) {
        try {
          const userDoc = await getDoc(doc(firestore, "users", uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            userMap.set(uid, data.fullName || "Anonymous");
          } else {
            userMap.set(uid, "Anonymous");
          }
        } catch {
          userMap.set(uid, "Anonymous");
        }
      }

      updatesGrid.innerHTML = "";
      updates.forEach((u) => {
        const name = userMap.get(u.userId);
        const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
        const time = new Date(u.createdAt).toLocaleString();

        const card = document.createElement("div");
        card.className = "update-card";
        card.innerHTML = `
          <div class="update-header">
            <img src="${avatar}" class="profile-pic-small">
            <div class="poster-info">
              <span class="poster-name">${name}</span>
              <span class="timestamp">${time}</span>
            </div>
          </div>
          ${u.comment ? `<p class="update-comment">${u.comment}</p>` : ""}
          ${u.imageUrl ? `<img src="${u.imageUrl}" class="update-map-image-placeholder">` : ""}
        `;
        updatesGrid.appendChild(card);
      });
    } catch (err) {
      console.error("Error loading trail updates:", err);
      updatesGrid.innerHTML = "<p>Error loading updates.</p>";
    }
  }
};

// PWA: Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then(reg => console.log("✅ Service Worker registered:", reg.scope))
      .catch(err => console.error("❌ Service Worker registration failed:", err));
  });
}
