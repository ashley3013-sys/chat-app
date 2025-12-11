document.addEventListener("DOMContentLoaded", () => {
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

// Initialize Firebase
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
let currentUser = null;
let activeChatId = null;
let messagesRef = null;

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

  try {
    // Save/update user
    await db.collection("users").doc(phone).set({
      username: username,
      phone: phone,
      lastActive: Date.now(),
      isOnline: true
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
logoutBtn.onclick = async function () {
  if (currentUser) {
    // On logout
    await db.collection("users").doc(currentUser.phone).update({
      isOnline: false
    });
  }

  currentUser = null;
  activeChatId = null;
  messagesRef = null;

  usernameInput.value = "";
  phoneInput.value = "";
  meLabel.textContent = "";
  mePhone.textContent = "";
  loginPage.style.display = "block";
  chatPage.style.display = "none";
  messagesDiv.innerHTML = "";
  usersList.innerHTML = "";
};

// ================================
// Set offline status on window close
// ================================
window.addEventListener("beforeunload", () => {
  if (currentUser) {
    navigator.sendBeacon(
      `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${currentUser.phone}`,
      JSON.stringify({ isOnline: false })
    );
  }
});
// ================================
// Load users list
// ================================
function loadUsers() {
  db.collection("users").onSnapshot(function (snapshot) {
    usersList.innerHTML = "";

    snapshot.forEach(function (doc) {
      const user = doc.data();

      if (user.phone === currentUser.phone) return;

      const li = document.createElement("li");
      li.dataset.phone = user.phone;
      li.dataset.username = user.username;
      li.style.cursor = "pointer";
      li.style.padding = "5px 10px";
      li.style.borderRadius = "5px";
      li.style.marginBottom = "4px";
      li.style.display = "flex";
      li.style.alignItems = "center";
      li.style.justifyContent = "space-between";

      // Username + phone text
      const textSpan = document.createElement("span");
      textSpan.textContent = `${user.username} (${user.phone})`;
      li.appendChild(textSpan);

      // Online/Offline dot
      const dot = document.createElement("span");
      dot.style.width = "10px";
      dot.style.height = "10px";
      dot.style.borderRadius = "50%";
      dot.style.backgroundColor = user.isOnline ? "#4CAF50" : "#999";
      li.appendChild(dot);

      // Click to start chat
      li.onclick = function () {
        Array.from(usersList.children).forEach(c => {
          c.style.backgroundColor = "";
          c.style.color = "";
        });
        li.style.backgroundColor = "#4CAF50";
        li.style.color = "#fff";

        startChat({ username: user.username, phone: user.phone });
      };

      usersList.appendChild(li);
    });

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
  activeChatId = [currentUser.phone, otherPhone].sort().join("_");
  messagesRef = db.collection("chats").doc(activeChatId).collection("messages");

  // Load messages
  loadMessages();

  // Typing indicator for other users
  db.collection("chats").doc(activeChatId).collection("typing")
    .onSnapshot(snapshot => {
      const otherTyping = [];
      snapshot.forEach(doc => {
        if (doc.id !== currentUser.phone) {
          otherTyping.push(doc.data().username);
        }
      });

      let typingDiv = document.getElementById("typingIndicator");
      if (!typingDiv) {
        typingDiv = document.createElement("div");
        typingDiv.id = "typingIndicator";
        typingDiv.style.fontSize = "12px";
        typingDiv.style.color = "#666";
        typingDiv.style.marginTop = "4px";
        messagesDiv.parentNode.appendChild(typingDiv);
      }

      if (otherTyping.length > 0) {
        typingDiv.textContent = `${otherTyping.join(", ")} is typing...`;
      } else {
        typingDiv.textContent = "";
      }
    });
}

// ================================
// Typing indicator listener
// ================================
msgInput.addEventListener("input", () => {
  if (!activeChatId || !currentUser) return;

  const typingRef = db.collection("chats").doc(activeChatId).collection("typing").doc(currentUser.phone);

  if (msgInput.value.trim() !== "") {
    typingRef.set({ username: currentUser.username });
  } else {
    typingRef.delete().catch(() => {});
  }
});

// ================================
// Send message
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

  messagesRef.add({
    senderName: currentUser.username,
    senderPhone: currentUser.phone,
    text: text,
    time: Date.now()
  });

  msgInput.value = "";
};

// ================================
// Load messages
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

      if (data.senderPhone === currentUser.phone) {
        msgBox.style.backgroundColor = "#4CAF50";
        msgBox.style.color = "#fff";
        msgBox.style.marginLeft = "auto";
      } else {
        msgBox.style.backgroundColor = "#e0e0e0";
        msgBox.style.color = "#000";
        msgBox.style.marginRight = "auto";
      }

      const header = document.createElement("div");
      header.textContent = `${data.senderName} (${data.senderPhone})`;
      header.style.fontSize = "12px";
      header.style.color = data.senderPhone === currentUser.phone ? "#dcefdc" : "#666";
      header.style.marginBottom = "2px";

      const textLine = document.createElement("div");
      textLine.textContent = data.text;
      textLine.style.fontSize = "16px";
      textLine.style.fontWeight = "500";

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

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}
});
