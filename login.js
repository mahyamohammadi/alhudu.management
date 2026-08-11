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


// Initialize Firebase only once
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();


// USERNAME → EMAIL
const users = {
  mahya: "m.mohammadi.7994@gmail.com",
  user2: "mahyamohammadi115@gmail.com"
};


// LOGIN
async function login() {

  const username = document
    .getElementById("username")
    .value
    .trim()
    .toLowerCase();

  const password = document
    .getElementById("password")
    .value;

  const errorBox = document.getElementById("error");

  errorBox.textContent = "";


  // Check username
  if (!users[username]) {
    errorBox.textContent = "Username is incorrect";
    return;
  }


  // Check password
  if (!password) {
    errorBox.textContent = "Enter password";
    return;
  }


  try {

    const email = users[username];


    // Firebase Authentication
    const credential =
      await auth.signInWithEmailAndPassword(
        email,
        password
      );


    const uid = credential.user.uid;

    console.log("Logged in UID:", uid);


    // Get profile from Firestore
    const userDoc =
      await db
        .collection("user")
        .doc(uid)
        .get();


    if (!userDoc.exists) {

      await auth.signOut();

      errorBox.textContent =
        "User profile not found";

      return;
    }


    const data = userDoc.data();

    console.log("User profile:", data);


    // Normalize Firestore username
    const firestoreUsername =
      String(data.username || "")
        .trim()
        .toLowerCase();


    // Compare username
    if (firestoreUsername !== username) {

      console.log(
        "Login username:",
        username
      );

      console.log(
        "Firestore username:",
        firestoreUsername
      );

      await auth.signOut();

      errorBox.textContent =
        "User profile does not match";

      return;
    }


    // Normalize role
    const role =
      String(data.role || "")
        .trim()
        .toLowerCase();


    if (
      role !== "admin" &&
      role !== "viewer"
    ) {

      await auth.signOut();

      errorBox.textContent =
        "Invalid user role";

      return;
    }


    // Save login information
    localStorage.setItem(
      "alhuduLogin",
      "true"
    );

    localStorage.setItem(
      "username",
      username
    );

    localStorage.setItem(
      "role",
      role
    );

    localStorage.setItem(
      "uid",
      uid
    );


    // Go to dashboard
    window.location.href =
      "dashboard.html";


  } catch (error) {

    console.error(
      "Login Error:",
      error
    );


    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/user-not-found"
    ) {

      errorBox.textContent =
        "Username or password is incorrect";

    } else {

      errorBox.textContent =
        "Login error: " +
        (error.code || error.message);

    }

  }

}


// LOGIN WITH ENTER
document.addEventListener(
  "keydown",
  function(event) {

    if (event.key === "Enter") {
      login();
    }

  }
);
