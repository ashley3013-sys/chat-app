// Firebase config
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

let currentUser = ""; // Will be set after login
let currentPhone = ""; // Store the phone number
let friendUser = "Friend1"; // Keep default friend for demo
let friendPhone = "0123456789"; // optional default friend phone for demo

// -------------------
// Step 0: Login form
// -------------------
document.getElementById("loginBtn").onclick = () => {
  const username = document.getElementById("usernameInput").value.trim();
  const phone = document.getElementById("phoneInput").value.trim();

  if (username === "" || phone === "") {
    alert("Please enter both username and phone number.");
    return;
  }

  // Set current user info
  currentUser = username;
  currentPhone = phone;

  // Hide login, show chat
  document.getElementById("login-container").style.display = "none";
  document.getElementById("chat-container").style.display = "block";

  initChat(); // start the chat logic
};

// -------------------
// Step 1: Chat logic in a function
// -------------------
function initChat() {
  const chatId = getChatId(currentUser, friendUser);
  const messagesRef = db.collection("chats").doc(chatId).collection("messages");

  // Send message
  document.getElementById("sendBtn").onclick = () => {
    const text = document.getElementById("msgInput").value;

    if (text.trim() === "") return;

    messagesRef.add({
      senderName: currentUser,
      senderPhone: currentPhone,
      text: text,
      time: Date.now()
    });

    document.getElementById("msgInput").value = "";
  };

  // Listen for messages
  messagesRef.orderBy("time").onSnapshot(snapshot => {
    const msgDiv = document.getElementById("messages");
    msgDiv.innerHTML = "";

    snapshot.forEach(doc => {
      const data = doc.data();
      const p = document.createElement("p");
      p.textContent = `${data.senderName} (${data.senderPhone}): ${data.text}`;
      msgDiv.appendChild(p);
    });

    msgDiv.scrollTop = msgDiv.scrollHeight;
  });
}

// -------------------
// Utility function: generate chatId
// -------------------
function getChatId(user1, user2) {
  return [user1, user2].sort().join("_"); // e.g. "Ashley_Friend1"
}
