// ================================
// Firebase configuration
// ================================
const firebaseConfig = {
  apiKey: "AIzaSyAHLfu2gN-FRYyyXxnVWCwpKNvibC5s7Sg",
  authDomain: "chat-app-274e3.firebaseapp.com",
  projectId: "chat-app-274e3",
  storageBucket: "chat-app-274e3.firebasestorage.app",
  messagingSenderId: "695289736732",
  appId: "1:695289736732:web:5f38506a9a5eeef3f839d9",
  measurementId: "G-SRLH7JPG9V"
};

// Initialize Firebase app
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ================================
// DOM elements
// ================================
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

// ================================
// Variables
// ================================
let currentUser = null;       // Object {username, phone}
let activeChatId = null;      // Chat ID for private conversation
let messagesRef = null;       // Firestore collection reference

// ================================
// Login button click
// ================================
loginBtn.onclick = async function () {
  const username = usernameInput.value.trim();
  const phone = phoneInput.value.trim();

  if (!username || !phone) {
    alert("Please enter both username and phone number.");
    return;
  }

  currentUser = { username: username, phone: phone };

  // Save or update user in Firestore
  try {
    await db.collection("users").doc(phone).set({
      username: username,
      phone: phone,
      lastActive: Date.now()
    });
  } catch (err) {
    console.error("Error saving user:", err);
    alert("Failed to save user info.");
    return;
  }

  // Update UI
  meLabel.textContent = username;
  mePhone.textContent = phone;
  loginPage.style.display = "none";
  chatPage.style.display = "block";

  // Load users list
  loadUsers();
};

// ================================
// Logout button click
// ================================
logoutBtn.onclick = function () {
  // Clear current user and active chat
  currentUser = null;
  activeChatId = null;
  messagesRef = null;

  // Reset UI
  usernameInput.value = "";
  phoneInput.value = "";
  meLabel.textContent = "";
  mePhone.textContent = "";
  loginPage.style.display = "block";
  chatPage.style.display = "none";

  // Clear messages and users list
  messagesDiv.innerHTML = "";
  usersList.innerHTML = "";
};

// ================================
// Load users list
// ================================
function loadUsers() {
  db.collection("users").onSnapshot(function (snapshot) {
    usersList.innerHTML = "";

    snapshot.forEach(function (doc) {
      const user = doc.data();

      // Skip current user
      if (user.phone === currentUser.phone) return;

      // Create user list item
      const li = document.createElement("li");
      li.textContent = `${user.username} (${user.phone})`;
      li.dataset.phone = user.phone;
      li.dataset.username = user.username;
      li.style.cursor = "pointer";
      li.style.padding = "5px 10px";
      li.style.borderRadius = "5px";
      li.style.marginBottom = "4px";

      // Click to select user for chat
      li.onclick = function () {
        // Remove highlight from all users
        Array.from(usersList.children).forEach(c => {
          c.style.backgroundColor = "";
          c.style.color = "";
        });

        // Highlight selected user
        li.style.backgroundColor = "#4CAF50"; // Green
        li.style.color = "#fff";

        // Start chat with selected user
        startChat({ username: user.username, phone: user.phone });
      };

      usersList.appendChild(li);
    });

    // If no other users
    if (usersList.innerHTML === "") {
      const li = document.createElement("li");
      li.textContent = "No other users online";
      li.style.color = "#999";
      usersList.appendChild(li);
    }
  });
}

// ================================
// Start chat with selected user
// ================================
function startChat(user) {
  const otherPhone = user.phone;
  // Generate consistent chat ID
  activeChatId = [currentUser.phone, otherPhone].sort().join("_");

  // Reference messages collection
  messagesRef = db.collection("chats").doc(activeChatId).collection("messages");

  // Load messages
  loadMessages();
}

// ================================
// Send message button
// ================================
sendBtn.onclick = function () {
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

  // Add message to Firestore
  messagesRef.add({
    senderName: currentUser.username,
    senderPhone: currentUser.phone,
    text: text,
    time: Date.now()
  });

  msgInput.value = "";
};

// ================================
// Load messages in real-time
// ================================
function loadMessages() {
  messagesRef.orderBy("time").onSnapshot(function (snapshot) {
    messagesDiv.innerHTML = "";

    snapshot.forEach(function (doc) {
      const data = doc.data();

      const msgBox = document.createElement("div");
      msgBox.style.marginBottom = "12px";
      msgBox.style.maxWidth = "70%";
      msgBox.style.padding = "8px 12px";
      msgBox.style.borderRadius = "10px";
      msgBox.style.wordBreak = "break-word";

      // Align right for current user
      if (data.senderPhone === currentUser.phone) {
        msgBox.style.backgroundColor = "#4CAF50";
        msgBox.style.color = "#fff";
        msgBox.style.marginLeft = "auto";
      } else {
        msgBox.style.backgroundColor = "#e0e0e0";
        msgBox.style.color = "#000";
        msgBox.style.marginRight = "auto";
      }

      // Username + phone
      const header = document.createElement("div");
      header.textContent = `${data.senderName} (${data.senderPhone})`;
      header.style.fontSize = "12px";
      header.style.color = data.senderPhone === currentUser.phone ? "#dcefdc" : "#666";
      header.style.marginBottom = "2px";

      // Message text
      const textLine = document.createElement("div");
      textLine.textContent = data.text;
      textLine.style.fontSize = "16px";
      textLine.style.fontWeight = "500";

      // Timestamp
      const timeLine = document.createElement("div");
      const d = new Date(data.time);
      timeLine.textContent = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      timeLine.style.fontSize = "11px";
      timeLine.style.color = data.senderPhone === currentUser.phone ? "#cce5cc" : "#999";
      timeLine.style.marginTop = "3px";

      msgBox.appendChild(header);
      msgBox.appendChild(textLine);
      msgBox.appendChild(timeLine);

      messagesDiv.appendChild(msgBox);
    });

    // Auto-scroll
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}
