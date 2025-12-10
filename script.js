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

// -------------------
// Step 1: Define your users
// -------------------
// For demo purposes, hardcode users
const currentUser = "Thong";
const friendUser = "Friend1";

// Generate a consistent chat ID for this pair
function getChatId(user1, user2) {
  return [user1, user2].sort().join("_"); // e.g. "Ashley_Friend1"
}

const chatId = getChatId(currentUser, friendUser);
const messagesRef = db.collection("chats").doc(chatId).collection("messages");

// -------------------
// Step 2: Send a message
// -------------------
document.getElementById("sendBtn").onclick = () => {
  const text = document.getElementById("msgInput").value;

  if (text.trim() === "") return;

  messagesRef.add({
    sender: currentUser,
    text: text,
    time: Date.now()
  });

  document.getElementById("msgInput").value = "";
};

// -------------------
// Step 3: Listen for new messages
// -------------------
messagesRef.orderBy("time").onSnapshot(snapshot => {
  const msgDiv = document.getElementById("messages");
  msgDiv.innerHTML = "";

  snapshot.forEach(doc => {
    const data = doc.data();
    const p = document.createElement("p");
    p.textContent = `${data.sender}: ${data.text}`;
    msgDiv.appendChild(p);
  });

  // Scroll to bottom on new message
  msgDiv.scrollTop = msgDiv.scrollHeight;
});
