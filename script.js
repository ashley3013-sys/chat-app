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
// Element refs
// -------------------------
const loginContainer = document.getElementById("login-container");
const chatContainer = document.getElementById("chat-container");
const loginBtn = document.getElementById("loginBtn");
const usernameInput = document.getElementById("usernameInput");
const phoneInput = document.getElementById("phoneInput");
const meLabel = document.getElementById("meLabel");
const mePhone = document.getElementById("mePhone");
const usersList = document.getElementById("usersList");
const messagesDiv = document.getElementById("messages");
const sendBtn = document.getElementById("sendBtn");
const msgInput = document.getElementById("msgInput");
const logoutBtn = document.getElementById("logoutBtn");

// -------------------------
// App state
// -------------------------
let currentUser = "";
let currentPhone = "";
let currentFriend = "";      // friend username (string)
let currentFriendPhone = ""; // friend phone
let friends = [];            // array of { username, phone }
let unsubscribeMessages = null;
let usersUnsub = null;

// -------------------------
// Helpers
// -------------------------
function getChatId(a, b){
  return [a, b].sort().join("_");
}

function showLogin(){
  loginContainer.style.display = "block";
  chatContainer.style.display = "none";
}

function showChat(){
  loginContainer.style.display = "none";
  chatContainer.style.display = "block";
  meLabel.textContent = currentUser;
  mePhone.textContent = currentPhone;
}

// -------------------------
// Persisted auto-login on reload
// -------------------------
const savedName = localStorage.getItem("username");
const savedPhone = localStorage.getItem("phone");
const savedFriend = localStorage.getItem("currentFriend");

if (savedName && savedPhone){
  currentUser = savedName;
  currentPhone = savedPhone;
  showChat();
  // subscribe users and then restore friend
  subscribeUsers(() => {
    currentFriend = savedFriend || (friends[0] && friends[0].username) || "";
    if (currentFriend) {
      const f = friends.find(x => x.username === currentFriend);
      currentFriendPhone = f ? f.phone : "";
      selectFriendInUI(currentFriend);
      startChat();
    }
  });
} else {
  showLogin();
  subscribeUsers(); // optional: keep seeing users list even before login
}

// -------------------------
// Save/register user on login
// -------------------------
loginBtn.onclick = async () => {
  const username = usernameInput.value.trim();
  const phone = phoneInput.value.trim();

  if (!username || !phone) return alert("Please enter username and phone.");

  currentUser = username;
  currentPhone = phone;

  // save locally
  localStorage.setItem("username", currentUser);
  localStorage.setItem("phone", currentPhone);

  // write user record to Firestore (doc id = phone)
  await db.collection("users").doc(currentPhone).set({
    username: currentUser,
    phone: currentPhone
  }, { merge: true });

  showChat();

  // subscribe to users list and start chat
  subscribeUsers(() => {
    currentFriend = (friends[0] && friends[0].username) || "";
    if (currentFriend) {
      const f = friends.find(x => x.username === currentFriend);
      currentFriendPhone = f ? f.phone : "";
      selectFriendInUI(currentFriend);
      startChat();
    }
  });
};

// -------------------------
// Subscribe to users collection (live)
// -------------------------
function subscribeUsers(callback){
  // detach previous
  if (usersUnsub) usersUnsub();

  usersUnsub = db.collection("users").onSnapshot(snapshot => {
    friends = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // include everyone except currentPhone (if we have it)
      if (currentPhone && data.phone === currentPhone) return;
      // ensure proper shape
      if (data.username && data.phone) friends.push({ username: data.username, phone: data.phone });
    });

    renderUsers();

    if (callback) callback();
  });
}

function renderUsers(){
  usersList.innerHTML = "";
  friends.forEach(f => {
    const li = document.createElement("li");
    li.textContent = `${f.username} (${f.phone})`;
    li.dataset.username = f.username;
    li.dataset.phone = f.phone;
    li.onclick = () => {
      currentFriend = f.username;
      currentFriendPhone = f.phone;
      localStorage.setItem("currentFriend", currentFriend);
      selectFriendInUI(currentFriend);
      startChat();
    };
    if (f.username === currentFriend) li.classList.add("selected");
    usersList.appendChild(li);
  });
}

function selectFriendInUI(username){
  // highlight selection
  Array.from(usersList.children).forEach(li => {
    li.classList.toggle("selected", li.dataset.username === username);
  });
}

// -------------------------
// Chat: start listening for messages for current pair
// -------------------------
function startChat(){
  if (!currentUser || !currentFriend) return;

  // unsubscribe previous
  if (unsubscribeMessages) unsubscribeMessages();

  messagesDiv.innerHTML = "";

  const chatId = getChatId(currentUser, currentFriend);
  const messagesRef = db.collection("chats").doc(chatId).collection("messages");

  // listen
  unsubscribeMessages = messagesRef.orderBy("time").onSnapshot(snapshot => {
    messagesDiv.innerHTML = "";
    snapshot.forEach(doc => {
      const d = doc.data();
      const div = document.createElement("div");
      div.className = d.senderName === currentUser ? "msg you" : "msg friend";
      div.innerHTML = `<strong>${escapeHtml(d.senderName)} (${escapeHtml(d.senderPhone)})</strong>
                       ${escapeHtml(d.text)}`;
      messagesDiv.appendChild(div);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

// -------------------------
// Send message
// -------------------------
sendBtn.onclick = () => {
  const text = msgInput.value.trim();
  if (!text) return;
  if (!currentUser || !currentFriend) return alert("Select a friend first.");

  const chatId = getChatId(currentUser, currentFriend);
  const messagesRef = db.collection("chats").doc(chatId).collection("messages");

  messagesRef.add({
    senderName: currentUser,
    senderPhone: currentPhone,
    text: text,
    time: Date.now()
  });

  msgInput.value = "";
};

// -------------------------
// Logout
// -------------------------
logoutBtn.onclick = () => {
  localStorage.removeItem("username");
  localStorage.removeItem("phone");
  localStorage.removeItem("currentFriend");
  // detach listeners
  if (unsubscribeMessages) unsubscribeMessages();
  if (usersUnsub) usersUnsub();

  currentUser = "";
  currentPhone = "";
  currentFriend = "";
  friends = [];
  messagesDiv.innerHTML = "";
  usersList.innerHTML = "";
  usernameInput.value = "";
  phoneInput.value = "";
  showLogin();
  // re-subscribe to users if you want non-logged view (optional)
  subscribeUsers();
};

// -------------------------
// Simple HTML escape to avoid basic injection
// -------------------------
function escapeHtml(str){
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
