const btnLogin = document.getElementById("btn-login");
const txtStatus = document.getElementById("txt-status");

checkAuth((auth) => {
  if (auth) {
    txtStatus.innerText = "authorized";
    txtStatus.style = "color: #00b837ff;";
    btnLogin.style = "visibility: hidden;";
  } else {
    txtStatus.innerText = "unauthorized";
    txtStatus.style = "color: #b80000ff;";
    btnLogin.style = "visibility: visible;";
  }
});

btnLogin.onclick = () => {
  window.open("https://pulse.mirea.ru", "_blank");
};
