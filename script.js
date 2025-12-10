// Firebase config (same as before)
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let currentUser = "";
let currentPhone = "";
let currentFriend = ""; // selected friend
let friends = [
  { name: "Friend1", phone: "0123456789" },
  { name: "Friend2", phone: "0987654321" },
  { name: "Friend3", phone: "0112233445" }
];

const messagesDiv = document.getElementById("messages");

// -------------------
// Step 0: Check localStorage for saved login
// -------------------
const savedName = localStorage.getItem("username");
const savedPhone = localStorage.getItem("phone");

if (savedName && savedPhone) {
  currentUser = savedName;
  currentPhone = savedPhone;
  showChatContainer();
  populateFriendSelect();
  startChat();
}

// -------------------
// Step 1: Login
// -------------------
document.getElementById("loginBtn").onclick = () => {
  const username = document.getElementById("usernameInput").value.trim();
  const phone = document.getElementById("phoneInput").value.trim();

  if (!username || !phone) return alert("Enter username and phone.");

  currentUser = username;
  currentPhone = phone;

  localStorage.setItem("username", currentUser);
  localStorage.setItem("phone", currentPhone);

  showChatContainer();
  populateFriendSelect();
  startChat();
};

// -------------------
// Helper: show chat container
// -------------------
function showChatContainer() {
  document.getElementById("login-container").style.display = "none";
  document.getElementById("chat-container").style.display = "block";
}

// -------------------
// Step 2: Populate friend dropdown
// -------------------
function populateFriendSelect() {
  const select = document.getElementById("friendSelect");
  select.innerHTML = "";

  friends.forEach(friend => {
    const option = document.createElement("option");
    option.value = friend.name;
    option.textContent = `${friend.name} (${friend.phone})`;
    select.appendChild(option);
  });

  // Select first friend by default
  currentFriend = select.value;
  select.onchange = () => {
    currentFriend = select.value;
    startChat(); // reload messages for the selected friend
  };
}

// -------------------
// Step 3: Chat logic
// -------------------
let unsubscribe = null; // for detaching previous listener

function startChat() {
  // Detach previous listener if any
  if (unsubscribe) unsubscribe();

  messagesDiv.innerHTML = "";
  const friend = friends.find(f => f.name === currentFriend);
  const chatId = getChatId(currentUser, currentFriend);
  const messagesRef = db.collection("chats").doc(chatId).collection("messages");

  // Send message
  document.getElementById("sendBtn").onclick = () => {
    const text = document.getElementById("msgInput").value.trim();
    if (!text) return;

    messagesRef.add({
      senderName: currentUser,
      senderPhone: currentPhone,
      text,
      time: Date.now()
    });

    document.getElementById("msgInput").value = "";
  };

  // Listen for messages
  unsubscribe = messagesRef.orderBy("time").onSnapshot(snapshot => {
    messagesDiv.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const bubble = document.createElement("div");
      bubble.classList.add("message");
      bubble.classList.add(data.senderName === currentUser ? "you" : "friend");
      bubble.textContent = `${data.senderName} (${data.senderPhone}): ${data.text}`;
      messagesDiv.appendChild(bubble);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

// -------------------
// Utility: generate consistent chat ID
// -------------------
function getChatId(user1, user2) {
  return [user1, user2].sort().join("_");
}
