const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  databaseURL: "...",     
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
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
