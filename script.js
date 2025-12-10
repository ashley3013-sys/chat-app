// -------------------------
// Firebase Initialization
// -------------------------
const firebaseConfig = {
  apiKey: "AIzaSyAHLfu2gN-FRYyyXxnVWCwpKNvibC5s7Sg",
  authDomain: "chat-app-274e3.firebaseapp.com",
  projectId: "chat-app-274e3",
  storageBucket: "chat-app-274e3.firebasestorage.app",
  messagingSenderId: "695289736732",
  appId: "1:695289736732:web:5f38506a9a5eeef3f839d9",
  measurementId: "G-SRLH7JPG9V"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// -------------------------
// Global Variables
// -------------------------
let currentUser = "";
let currentPhone = "";
let currentFriend = "";
let friends = [];

let unsubscribe = null; // chat listener

const loginContainer = document.getElementById("login-container");
const chatContainer = document.getElementById("chat-container");
const friendSelect = document.getElementById("friendSelect");
const messagesDiv = document.getElementById("messages");

// -------------------------
// Reload: Auto Login
// -------------------------
const savedName = localStorage.getItem("username");
const savedPhone = localStorage.getItem("phone");
const savedFriend = localStorage.getItem("currentFriend");

if (savedName && savedPhone) {
  currentUser = savedName;
  currentPhone = savedPhone;

  loginContainer.style.display = "none";
  chatContainer.style.display = "block";

  loadFriends(() => {
    currentFriend = savedFriend || "";
    if (!currentFriend && friends.length > 0) {
      currentFriend = friends[0].username;
    }
    friendSelect.value = currentFriend;
    startChat(currentFriend);
  });
}

// -------------------------
// LOGIN BUTTON
// -------------------------
document.getElementById("loginBtn").onclick = async () => {
  const username = document.getElementById("usernameInput").value.trim();
  const phone = document.getElementById("phoneInput").value.trim();

  if (!username || !phone) return alert("Please enter username AND phone number.");

  currentUser = username;
  currentPhone = phone;

  // Save login locally
  localStorage.setItem("username", currentUser);
  localStorage.setItem("phone", currentPhone);

  // Save user in Firestore
  await db.collection("users").doc(currentPhone).set({
    username: currentUser,
    phone: currentPhone
  }, { merge: true });

  loginContainer.style.display = "none";
  chatContainer.style.display = "block";

  loadFriends(() => {
    currentFriend = friends.length ? friends[0].username : "";
    friendSelect.value = currentFriend;
    startChat(currentFriend);
  });
};

// -------------------------
// LOAD REAL FRIENDS
// -------------------------
function loadFriends(callback) {
  db.collection("users").onSnapshot(snapshot => {
    friends = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.phone !== currentPhone) friends.push(data);
    });

    updateFriendDropdown();

    if (callback) callback();
  });
}

// -------------------------
// UPDATE FRIEND SELECT UI
// -------------------------
function updateFriendDropdown() {
  friendSelect.innerHTML = "";

  friends.forEach(f => {
    const opt = document.createElement("option");
    opt.value = f.username;
    opt.textContent = `${f.username} (${f.phone})`;
    friendSelect.appendChild(opt);
  });
}

// -------------------------
// FRIEND CHANGED
// -------------------------
friendSelect.onchange = () => {
  currentFriend = friendSelect.value;
  localStorage.setItem("currentFriend", currentFriend);
  startChat(currentFriend);
};

// -------------------------
// START CHAT WITH FRIEND
// -------------------------
function startChat(friendName) {
  if (!friendName) return;

  // Stop old listener
  if (unsubscribe) unsubscribe();

  messagesDiv.innerHTML = "";

  const chatId = getChatId(currentUser, friendName);
  const messagesRef = db.collection("chats").doc(chatId).collection("messages");

  // Listen for messages
  unsubscribe = messagesRef.orderBy("time").onSnapshot(snapshot => {
    messagesDiv.innerHTML = "";

    snapshot.forEach(doc => {
      const data = doc.data();

      const bubble = document.createElement("div");
      bubble.className = data.senderName === currentUser ? "msg you" : "msg friend";

      bubble.innerHTML = `
        <strong>${data.senderName} (${data.senderPhone})</strong><br>
        ${data.text}
      `;

      messagesDiv.appendChild(bubble);
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });

  // SEND BUTTON
  document.getElementById("sendBtn").onclick = () => {
    const text = document.getElementById("msgInput").value.trim();
    if (!text) return;

    messagesRef.add({
      senderName: currentUser,
      senderPhone: currentPhone,
      text: text,
      time: Date.now()
    });

    document.getElementById("msgInput").value = "";
  };
}

// -------------------------
// Generate Chat ID
// -------------------------
function getChatId(user1, user2) {
  return [user1, user2].sort().join("_");
}

document.getElementById("logoutBtn").onclick = () => {
  // Clear saved data
  localStorage.removeItem("username");
  localStorage.removeItem("phone");
  localStorage.removeItem("currentFriend");

  // Reload to show login page again
  location.reload();
};
