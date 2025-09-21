const mimic_headers = {
  "content-type": "application/grpc-web+proto",
  "pulse-app-type": "pulse-app",
  "x-requested-with": "XMLHttpRequest"
};
const common_fetch_params = {
  "headers": mimic_headers,
  "referrer": "https://pulse.mirea.ru/",
  "method": "POST",
  "mode": "cors",
  "credentials": "include",
  "cache": "no-cache"
};

function checkAuth(statusCallback) {
  fetch("https://attendance.mirea.ru/rtu_tc.rtu_attend.app.UserService/GetMeInfo", {
    ...common_fetch_params,
    "body": "\u0000\u0000\u0000\u0000F\n\u001fhttps://attendance-app.mirea.ru\u0012!\n\u001fhttps://attendance-app.mirea.ru\u0018\u0001",
  }).then(async (r) => {
    const resp = await r.text();
    if (resp.includes("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")) {
      statusCallback(true);
    } else {
      statusCallback(false);
    }
  }).catch((e) => {
    statusCallback(false);
  });
}

function requestApprove(token, statusCallback) {
  fetch("https://attendance.mirea.ru/rtu_tc.attendance.api.StudentService/SelfApproveAttendance", {
    ...common_fetch_params,
    "body": "\u0000\u0000\u0000\u0000&\n$" + token,
  }).then((r) => statusCallback(true)).catch((e) => statusCallback(false));
}
