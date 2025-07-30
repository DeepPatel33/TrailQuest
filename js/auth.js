// Import Firebase App and Services
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// Firebase Config (replace with your real credentials)
const firebaseConfig = {
  apiKey: "AIzaSyCUV-8E2w3Td_TyYo52LAvhb2WA9CnVaLY",
  authDomain: "trial-quest-45442.firebaseapp.com",
  projectId: "trial-quest-45442",
  storageBucket: "trial-quest-45442.appspot.com",
  messagingSenderId: "780796401639",
  appId: "1:780796401639:web:b3bfb178ff7450ac3c0f42",
  measurementId: "G-MC6VBKFG01",
};

// PWA: Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then(reg => console.log("✅ Service Worker registered:", reg.scope))
      .catch(err => console.error("❌ Service Worker registration failed:", err));
  });
}


// Initialize Firebase Services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Toggle between Login and Signup Forms
window.toggleForms = function (form) {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  if (loginForm) loginForm.style.display = form === "login" ? "block" : "none";
  if (signupForm) signupForm.style.display = form === "signup" ? "block" : "none";
};

// Register a New User
window.registerUser = function () {
  const fullName = document.getElementById("signupFullName")?.value;
  const email = document.getElementById("signupEmail")?.value;
  const password = document.getElementById("signupPassword")?.value;
  const phone = document.getElementById("signupPhone")?.value;
  const userType = document.getElementById("signupUserType")?.value;

  if (!fullName || !email || !password || !phone || !userType) {
    alert("Please fill in all fields.");
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;
      const collectionName = userType === "organizer" ? "organizer" : "users";

      await setDoc(doc(db, collectionName, user.uid), {
        fullName,
        email,
        phone,
        userType,
        createdAt: new Date(),
      });

      await sendEmailVerification(user);
      alert("Registration successful! Check your email for verification.");
      toggleForms("login");
    })
    .catch((error) => {
      alert("Registration failed: " + error.message);
      console.error(error);
    });
};

// Login a User and Redirect Based on Role
window.loginUser = function () {
  const email = document.getElementById("loginEmail")?.value;
  const password = document.getElementById("loginPassword")?.value;

  if (!email || !password) {
    alert("Please enter both email and password.");
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;

      // Check "organizer" collection
      const organizerDoc = await getDoc(doc(db, "organizer", user.uid));
      if (organizerDoc.exists()) {
        const data = organizerDoc.data();
        sessionStorage.setItem("fullName", data.fullName);
        sessionStorage.setItem("email", data.email);
        sessionStorage.setItem("phone", data.phone);
        sessionStorage.setItem("role", "organizer");

        alert("Login successful as Organizer!");
        setTimeout(() => {
          window.location.href = "../html/Organizer.html";
        }, 1000);
        return;
      }

      // Check "users" collection
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        sessionStorage.setItem("fullName", data.fullName);
        sessionStorage.setItem("email", data.email);
        sessionStorage.setItem("phone", data.phone);
        sessionStorage.setItem("role", "hiker");

        alert("Login successful as Hiker!");
        setTimeout(() => {
          window.location.href = "../html/index.html";
        }, 1000);
        return;
      }

      alert("Login failed: User role not found.");
      signOut(auth); // safety logout
    })
    .catch((error) => {
      alert("Login failed: " + error.message);
      console.error(error);
    });
};

// Logout the User
window.logoutUser = function () {
  signOut(auth)
    .then(() => {
      alert("Logged out!");
      sessionStorage.clear();
      window.location.href = "../html/index.html";
    })
    .catch((error) => {
      console.error("Logout error:", error);
      alert("Logout failed: " + error.message);
    });
};

// Auth State Listener for Header and UI Updates
onAuthStateChanged(auth, (user) => {
  const authLinks = document.getElementById("auth-links");
  const logoutBtn = document.getElementById("logoutBtn");

  if (authLinks) {
    if (user) {
      authLinks.innerHTML = `
        
        <a href="chat.html"><i class="fas fa-comment-dots"></i></a>
        <a href="profile.html"><i class="fas fa-user-circle"></i></a>
        <a href="#" id="logoutLink" class="logout-button">Logout</a>
      `;
      const logoutLink = document.getElementById("logoutLink");
      if (logoutLink) {
        logoutLink.addEventListener("click", (e) => {
          e.preventDefault();
          window.logoutUser();
        });
      }
    } else {
      authLinks.innerHTML = `<a href="../html/auth.html" class="login-button">Login</a>`;
    }
  }

  if (logoutBtn) {
    logoutBtn.style.display = user ? "inline-block" : "none";
    logoutBtn.onclick = window.logoutUser;
  }
});

// Menu Modal UI Handling
document.addEventListener("DOMContentLoaded", () => {
  const openMenuBtn = document.getElementById("openMenuBtn");
  const menuModal = document.getElementById("menuModal");
  const closeMenuBtn = document.getElementById("closeMenuBtn");

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

  if (menuModal) {
    menuModal.addEventListener("click", (event) => {
      if (event.target === menuModal) {
        menuModal.classList.remove("active");
      }
    });
  }
});
