function login(){

const username =
document.getElementById("username").value.trim();

const password =
document.getElementById("password").value;

if(
username==="mahya" &&
password==="11223344"
){

localStorage.setItem(
"alhuduLogin",
"true"
);

localStorage.setItem(
"alhuduUser",
username
);

window.location.href="dashboard.html";

return;

}

alert("Wrong Username or Password");

}


if(localStorage.getItem("alhuduLogin")==="true"){

window.location.href="dashboard.html";

}
