// ----------------------
// Firebase config
// ----------------------
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


// ----------------------
// Login system
// ----------------------
let currentUser = null;

document.getElementById("loginBtn").onclick = async () => {
  const username = document.getElementById("usernameInput").value.trim();
  const phone = document.getElementById("phoneInput").value.trim();

  if (!username || !phone) {
    alert("Please enter username and phone.");
    return;
  }

  // Save user in Firestore
  await db.collection("users").doc(phone).set({
    username,
    phone,
    lastActive: Date.now()
  });

  currentUser = { username, phone };

  // Switch to chat UI
  document.getElementById("loginPage").style.display = "none";
  document.getElementById("chatPage").style.display = "block";

  loadUsers();
};


// ----------------------
// Load user list (REAL users)
// ----------------------
function loadUsers() {
  db.collection("users").onSnapshot(snapshot => {
    const list = document.getElementById("userList");
    list.innerHTML = "";

    snapshot.forEach(doc => {
      const user = doc.data();

      // Skip yourself
      if (user.phone === currentUser.phone) return;

      const option = document.createElement("option");
      option.value = user.phone;
      option.textContent = `${user.username} (${user.phone})`;
      list.appendChild(option);
    });
  });
}


// ----------------------
// Chat ID generator (private chat)
// ----------------------
function getChatId(phoneA, phoneB) {
  return [phoneA, phoneB].sort().join("_");
}

let activeChatId = null;
let messagesRef = null;


// ----------------------
// When selecting a user to chat with
// ----------------------
document.getElementById("userList").onchange = () => {
  const otherPhone = document.getElementById("userList").value;

  activeChatId = getChatId(currentUser.phone, otherPhone);
  messagesRef = db
    .collection("chats")
    .doc(activeChatId)
    .collection("messages");

  loadMessages();
};


// ----------------------
// Send a message
// ----------------------
document.getElementById("sendBtn").onclick = () => {
  if (!messagesRef) {
    alert("Select a user to chat with first.");
    return;
  }

  const text = document.getElementById("msgInput").value;

  if (text.trim() === "") return;

  messagesRef.add({
    senderName: currentUser.username,
    senderPhone: currentUser.phone,
    text,
    time: Date.now()
  });

  document.getElementById("msgInput").value = "";
};


// ----------------------
// Load messages (live)
// ----------------------
function loadMessages() {
  messagesRef.orderBy("time").onSnapshot(snapshot => {
    const msgDiv = document.getElementById("messages");
    msgDiv.innerHTML = "";

    snapshot.forEach(doc => {
      const data = doc.data();

      const box = document.createElement("div");
      box.style.marginBottom = "14px";

      // Username + phone (grey small)
      const header = document.createElement("div");
      header.textContent = `${data.senderName} (${data.senderPhone})`;
      header.style.fontSize = "12px";
      header.style.color = "#666";
      header.style.marginBottom = "2px";

      // Main message text (black bigger)
      const messageText = document.createElement("div");
      messageText.textContent = data.text;
      messageText.style.fontSize = "16px";
      messageText.style.color = "#000";
      messageText.style.fontWeight = "500";

      // Timestamp (grey tiny)
      const time = document.createElement("div");
      const d = new Date(data.time);
      time.textContent = d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
      time.style.fontSize = "11px";
      time.style.color = "#999";
      time.style.marginTop = "4px";

      box.appendChild(header);
      box.appendChild(messageText);
      box.appendChild(time);
      msgDiv.appendChild(box);
    });

    msgDiv.scrollTop = msgDiv.scrollHeight;
  });
}
