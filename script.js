const firebaseConfig = {
  apiKey: "AIzaSyAHLfu2gN-FRYyyXxnVWCwpKNvibC5s7Sg",
  authDomain: "chat-app-274e3.firebaseapp.com",  
  projectId: "chat-app-274e3",
  storageBucket: "chat-app-274e3.firebasestorage.app",
  messagingSenderId: "695289736732",
  appId: "1:695289736732:web:5f38506a9a5eeef3f839d9"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

const messagesRef = db.collection("messages");

document.getElementById("sendBtn").onclick = () => {
  const text = document.getElementById("msgInput").value;

  if (text.trim() === "") return;

  messagesRef.add({
    text: text,
    time: Date.now()
  });

  document.getElementById("msgInput").value = "";
};

messagesRef.orderBy("time").onSnapshot(snapshot => {
  const msgDiv = document.getElementById("messages");
  msgDiv.innerHTML = "";

  snapshot.forEach(doc => {
    const data = doc.data();
    const p = document.createElement("p");
    p.textContent = data.text;
    msgDiv.appendChild(p);
  });
});
