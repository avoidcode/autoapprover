const btnLogin = document.getElementById("btn-login");
const txtStatus = document.getElementById("txt-status");

(async () => {
	fetch("https://attendance.mirea.ru/rtu_tc.rtu_attend.app.UserService/GetMeInfo", {
		"headers": {
			"content-type": "application/grpc-web+proto",
			"pulse-app-type": "pulse-app",
			"x-requested-with": "XMLHttpRequest"
		},
		"referrer": "https://attendance-app.mirea.ru/",
		"body": "\u0000\u0000\u0000\u0000F\n\u001fhttps://attendance-app.mirea.ru\u0012!\n\u001fhttps://attendance-app.mirea.ru\u0018\u0001",
		"method": "POST",
		"mode": "cors",
		"credentials": "include",
		"cache": "no-cache"
	}).then(async (r) => {
		const decoded = decodeProto(new Uint8Array(await (await r.blob()).arrayBuffer()), false).parts;
		console.log(decoded);
		txtStatus.innerText = "authorized" + decoded;
        txtStatus.style = "color: #00b837ff;";
        btnLogin.style = "visibility: hidden;";
	}).catch((e) => {
		txtStatus.innerText = "unauthorized";
        txtStatus.style = "color: #b80000ff;";
        btnLogin.style = "visibility: visible;";
	})
})();

btnLogin.onclick = () => {
    window.open("https://pulse.mirea.ru", "_blank");
};
