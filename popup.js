const btnLogin = document.getElementById("btn-login");
const txtStatus = document.getElementById("txt-status");

(async () => {
    const authCookie = await chrome.cookies.get({ url: "https://attendance.mirea.ru", name: ".AspNetCore.Cookies" });
    if (authCookie) {
        txtStatus.innerText = "authorized";
        txtStatus.style = "color: #00b837ff;";
        btnLogin.style = "visibility: hidden;";
    } else {
        txtStatus.innerText = "unauthorized";
        txtStatus.style = "color: #b80000ff;";
        btnLogin.style = "visibility: visible;";
    }
})();

btnLogin.onclick = () => {
    window.open("https://pulse.mirea.ru", "_blank");
};