// AL HUDU LOGIN

const firebaseConfig = {
  apiKey: "AIzaSyDZ-NCetZ4D7QR-wv4JKhKM4JV7JkPeI54",
  authDomain: "al-hudu-management.firebaseapp.com",
  projectId: "al-hudu-management",
  storageBucket: "al-hudu-management.firebasestorage.app",
  messagingSenderId: "1045649803744",
  appId: "1:1045649803744:web:bc6ead0755d196c020c385",
  measurementId: "G-S5GYCV7RGD"
};

// Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();


// username → email
const users = {
  mahya: "m.mohammadi.7994@gmail.com",
  user2: "mahyamohammadi115@gmail.com"
};


async function login() {

  const username =
    document.getElementById("username").value.trim().toLowerCase();

  const password =
    document.getElementById("password").value;

  const errorBox =
    document.getElementById("error");


  errorBox.textContent = "";


  if (!users[username]) {
    errorBox.textContent = "Username is incorrect";
    return;
  }


  if (!password) {
    errorBox.textContent = "Enter password";
    return;
  }


  try {

    const email = users[username];

    const credential =
      await auth.signInWithEmailAndPassword(email, password);

    const uid = credential.user.uid;


    const userDoc =
      await db.collection("user").doc(uid).get();


    if (!userDoc.exists) {

      await auth.signOut();

      errorBox.textContent = "User profile not found";

      return;
    }


    const data = userDoc.data();


    if (
      !data.username ||
      data.username.toLowerCase() !== username
    ) {

      await auth.signOut();

      errorBox.textContent = "User profile does not match";

      return;
    }


    localStorage.setItem("username", username);
    localStorage.setItem("role", data.role);


    if (data.role === "admin") {

      window.location.href = "dashboard.html";

    } else if (data.role === "viewer") {

      window.location.href = "dashboard.html";

    } else {

      await auth.signOut();

      errorBox.textContent = "Invalid user role";

    }


  } catch (error) {

    console.error(error);

    errorBox.textContent =
      "Username or password is incorrect";

  }

}


// Login with Enter
document.addEventListener("keydown", function(event) {

  if (event.key === "Enter") {
    login();
  }

});
