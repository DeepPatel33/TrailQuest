// Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onChildAdded,
  push,
  set,
  get,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import {
  getFirestore,
  getDoc,
  getDocs,
  doc,
  collection,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCUV-8E2w3Td_TyYo52LAvhb2WA9CnVaLY",
  authDomain: "trial-quest-45442.firebaseapp.com",
  databaseURL: "https://trial-quest-45442-default-rtdb.firebaseio.com",
  projectId: "trial-quest-45442",
  storageBucket: "trail-quest-45442.appspot.com",
  messagingSenderId: "780796401639",
  appId: "1:780796401639:web:b3bfb178ff7450ac3c0f42",
};

// PWA: Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then(reg => console.log("✅ Service Worker registered:", reg.scope))
      .catch(err => console.error("❌ Service Worker registration failed:", err));
  });
}


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const firestore = getFirestore(app);

// Globals
let currentUserId = null;
let currentRole = null;
let activeChatId = null;
let activeReceiverId = null;
let chatListenerUnsub = null;

// DOM Elements
const chatListDiv = document.getElementById("chatList");
const chatBody = document.getElementById("chatBody");
const chatUsername = document.getElementById("chatUsername");
const sendBtn = document.getElementById("sendBtn");
const messageInput = document.getElementById("messageInput");

// Generate consistent chat ID
function getChatId(uid1, uid2) {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

// Display message in chat window
function displayMessage(message) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add(
    "message",
    message.senderId === currentUserId ? "sent" : "received"
  );
  msgDiv.textContent = message.text;
  chatBody.appendChild(msgDiv);

  // Smooth scroll to latest message
  chatBody.scrollTo({
    top: chatBody.scrollHeight,
    behavior: "smooth"
  });
}


// Load chat with a specific user
function loadChatWithUser(receiverId, receiverName) {
  try {
    if (chatListenerUnsub) chatListenerUnsub();

    activeChatId = getChatId(currentUserId, receiverId);
    activeReceiverId = receiverId;
    chatUsername.textContent = receiverName;
    chatBody.innerHTML = "";

    // Mark messages as read
    set(ref(db, `readStatus/${activeChatId}/${currentUserId}`), Date.now());

    const messagesRef = ref(db, `messages/${activeChatId}`);
    chatListenerUnsub = onChildAdded(messagesRef, (snapshot) => {
      displayMessage(snapshot.val());
    });
  } catch (error) {
    console.error("Error loading chat:", error);
  }
}

// Send a message
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !activeChatId || !activeReceiverId) return;

  const timestamp = Date.now();
  const newMessageRef = push(ref(db, `messages/${activeChatId}`));
  set(newMessageRef, {
    senderId: currentUserId,
    text,
    timestamp,
  });

  set(ref(db, `readStatus/${activeChatId}/${currentUserId}`), timestamp);
  messageInput.value = "";
}

// Event listeners
sendBtn?.addEventListener("click", sendMessage);

messageInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Determine current user's role
async function getUserRole(uid) {
  const orgDoc = await getDoc(doc(firestore, "organizer", uid));
  if (orgDoc.exists()) return { role: "organizer", data: orgDoc.data() };

  const userDoc = await getDoc(doc(firestore, "users", uid));
  if (userDoc.exists()) return { role: "hiker", data: userDoc.data() };

  return { role: null };
}

// Create chat list item
async function createChatItem(uid, displayName, chatId) {
  const div = document.createElement("div");
  div.className = "chat-item";
  div.textContent = displayName;

  try {
    const messagesSnap = await get(ref(db, `messages/${chatId}`));
    const readSnap = await get(ref(db, `readStatus/${chatId}/${currentUserId}`));
    const lastSeen = readSnap.exists() ? readSnap.val() : 0;

    if (messagesSnap.exists()) {
      const messages = Object.values(messagesSnap.val());
      const hasUnread = messages.some(
        (msg) => msg.senderId !== currentUserId && msg.timestamp > lastSeen
      );
      if (hasUnread) div.classList.add("unread");
    }

    div.addEventListener("click", () => {
      document.querySelectorAll(".chat-item").forEach(item =>
        item.classList.remove("selected")
      );
      div.classList.add("selected");
      loadChatWithUser(uid, displayName);

      // Mobile transition
      if (window.innerWidth <= 768) {
        document.getElementById("chatListPanel")?.classList.remove("active");
        document.getElementById("chatWindowPanel")?.classList.add("active");
      }
    });

    chatListDiv.appendChild(div);
  } catch (error) {
    console.error("Error creating chat item:", error);
  }
}

// Load chat list
async function loadChatList() {
  const { role } = await getUserRole(currentUserId);
  currentRole = role;

  if (role === "hiker") {
    const organizerDocs = await getDocs(collection(firestore, "organizer"));
    organizerDocs.forEach((docSnap) => {
      const org = docSnap.data();
      const uid = docSnap.id;
      if (uid !== currentUserId) {
        const chatId = getChatId(currentUserId, uid);
        createChatItem(uid, org.fullName || org.email, chatId);
      }
    });

  } else if (role === "organizer") {
    const messagesRef = ref(db, "messages");
    const snapshot = await get(messagesRef);
    const messageGroups = snapshot.exists() ? snapshot.val() : {};
    const hikerIds = new Set();

    for (const [chatId, messages] of Object.entries(messageGroups)) {
      if (!chatId.includes(currentUserId)) continue;

      const [uid1, uid2] = chatId.split("_");
      const otherId = uid1 === currentUserId ? uid2 : uid1;

      const msgs = Object.values(messages);
      const hasUserMessage = msgs.some((msg) => msg.senderId === otherId);
      if (hasUserMessage) {
        hikerIds.add(otherId);
      }
    }

    const usersSnap = await getDocs(collection(firestore, "users"));
    usersSnap.forEach((userDoc) => {
      const uid = userDoc.id;
      const user = userDoc.data();
      if (hikerIds.has(uid)) {
        const chatId = getChatId(currentUserId, uid);
        createChatItem(uid, user.fullName || user.email, chatId);
      }
    });
  }
}

// Init on login
onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  currentUserId = user.uid;
  await loadChatList();

  // Auto open chat if redirected
  const urlParams = new URLSearchParams(window.location.search);
  const withId = urlParams.get("with");
  if (withId) {
    const doc1 = await getDoc(doc(firestore, "users", withId));
    const doc2 = await getDoc(doc(firestore, "organizer", withId));
    const data = doc1.exists() ? doc1.data() : doc2.exists() ? doc2.data() : null;

    if (data) {
      loadChatWithUser(withId, data.fullName || data.email);
      document.getElementById("chatListPanel")?.classList.remove("active");
      document.getElementById("chatWindowPanel")?.classList.add("active");
    }
  }
});

// Mobile back to home from chat list
document.getElementById("mobileHomeBtn")?.addEventListener("click", () => {
  window.history.back();
});
