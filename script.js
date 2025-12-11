// ===========================
// Firebase config
// ===========================
const firebaseConfig = {
  apiKey: "AIzaSyAHLfu2gN-FRYyyXxnVWCwpKNvibC5s7Sg",
  authDomain: "chat-app-274e3.firebaseapp.com",
  projectId: "chat-app-274e3",
  storageBucket: "chat-app-274e3.firebasestorage.app",
  messagingSenderId: "695289736732",
  appId: "1:695289736732:web:5f38506a9a5eeef3f839d9",
  measurementId: "G-SRLH7JPG9V"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ===========================
// DOM Elements
// ===========================
const loginPage = document.getElementById("loginPage");
const chatPage = document.getElementById("chatPage");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const usernameInput = document.getElementById("usernameInput");
const phoneInput = document.getElementById("phoneInput");
const meLabel = document.getElementById("meLabel");
const mePhone = document.getElementById("mePhone");
const usersList = document.getElementById("usersList");
const messagesDiv = document.getElementById("messages");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");

// ===========================
// Variables
// ===========================
let currentUser = null;         // Current logged-in user
let activeChatId = null;        // Current chat ID
let messagesRef = null;         // Reference to Firestore collection of messages

// ===========================
// LOGIN / REGISTER
// ===========================
loginBtn.onclick = async () => {
  const username = usernameInput.value.trim();
  const phone = phoneInput.value.trim();

  if (!username || !phone) {
    alert("Please enter both username and phone number.");
    return;
  }

  currentUser = { username, phone };

  // Save or update user in Firestore
  await db.collection("users").doc(phone).set({
    username,
    phone,
    lastActive: Date.now()
  });

  // Update UI
  meLabel.textContent = username;
  mePhone.textContent = phone;
  loginPage.style.display = "none";
  chatPage.style.display = "block";

  // Load users list
  loadUsers();
};

// ===========================
// LOAD USERS LIST
// ===========================
function loadUsers() {
  db.collection("users").onSnapshot(snapshot => {
    usersList.innerHTML = ""; // Clear previous list

    snapshot.forEach(doc => {
      const user = doc.data();

      // Skip current user
      if (user.phone === currentUser.phone) return;

      // Create user element
      const li = document.createElement("li");
      li.textContent = `${user.username} (${user.phone})`;
      li.dataset.phone = user.phone;
      li.dataset.username = user.username;

      // Click to start chat
      li.onclick = () => {
        startChat(user);
      };

      usersList.appendChild(li);
    });

    // If no other users, show placeholder
    if (usersList.innerHTML === "") {
      const li = document.createElement("li");
      li.textContent = "No other users online";
      li.style.color = "#999";
      usersList.appendChild(li);
    }
  });
}

// ===========================
// START CHAT
// ===========================
function startChat(user) {
  const otherPhone = user.phone;

  // Generate consistent chat ID
  activeChatId = [currentUser.phone, otherPhone].sort().join("_");

  // Reference to messages
  messagesRef = db.collection("chats").doc(activeChatId).collection("messages");

  // Load chat messages
  loadMessages();
}

// ===========================
// SEND MESSAGE
// ===========================
sendBtn.onclick = () => {
  if (!currentUser) {
    alert("No user signed in!");
    return;
  }

  if (!messagesRef) {
    alert("Select a user to chat with first.");
    return;
  }

  const text = msgInput.value.trim();
  if (text === "") return;

  messagesRef.add({
    senderName: currentUser.username,
    senderPhone: currentUser.phone,
    text,
    time: Date.now()
  });

  msgInput.value = "";
};

// ===========================
// LOAD MESSAGES LIVE
// ===========================
function loadMessages() {
  messagesRef.orderBy("time").onSnapshot(snapshot => {
    messagesDiv.innerHTML = ""; // Clear old messages

    snapshot.forEach(doc => {
      const data = doc.data();

      const msgBox = document.createElement("div");
      msgBox.style.marginBottom = "14px";

      // Username + phone (grey small)
      const header = document.createElement("div");
      header.textContent = `${data.senderName} (${data.senderPhone})`;
      header.style.fontSize = "12px";
      header.style.color = "#666";
      header.style.marginBottom = "2px";

      // Main message text (black, bigger)
      const textLine = document.createElement("div");
      textLine.textContent = data.text;
      textLine.style.fontSize = "16px";
      textLine.style.color = "#000";
      textLine.style.fontWeight = "500";

      // Timestamp on new line
      const timeLine = document.createElement("div");
      const d = new Date(data.time);
      timeLine.textContent = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      timeLine.style.fontSize = "11px";
      timeLine.style.color = "#999";
      timeLine.style.marginTop = "3px";

      msgBox.appendChild(header);
      msgBox.appendChild(textLine);
      msgBox.appendChild(timeLine);

      messagesDiv.appendChild(msgBox);
    });

    // Auto-scroll to bottom
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

// ===========================
// LOGOUT
// ===========================
logoutBtn.onclick = () => {
  currentUser = null;
  activeChatId = null;
  messagesRef = null;

  usernameInput.value = "";
  phoneInput.value = "";
  meLabel.textContent = "";
  mePhone.textContent = "";

  loginPage.style.display = "block";
  chatPage.style.display = "none";
};
