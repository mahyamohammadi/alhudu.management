function login(){


let username = document.getElementById("username").value;

let password = document.getElementById("password").value;



if(username === "admin" && password === "1234"){


localStorage.setItem("alhuduLogin","true");


window.location.href = "dashboard.html";


}

else{


alert("Wrong username or password");


}


}
