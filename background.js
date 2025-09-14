function makeNotification(message) {
  chrome.notifications.create('AA_NOTIF', {
    type: 'basic',
    iconUrl: 'images/icon-32.png',
    title: 'MIREA AutoApprover',
    message: message
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "REQUEST_SCAN" && sender.tab?.id != null) {
    try {
      chrome.tabs.captureVisibleTab(sender?.tab?.windowId, {}, function (dataUrl) {
        chrome.tabs.sendMessage(sender.tab.id, { type: "SCREENSHOT_READY", dataUrl });
      });
    } catch (e) { }
  } else if (msg?.type === "REQUEST_APPROVE" && msg?.token != null) {
    const token = msg.token;
    const authCookie = chrome.cookies.get({ url: "https://attendance.mirea.ru", name: ".AspNetCore.Cookies" });
    if (!authCookie) {
      makeNotification("No auth! Please, login to pulse.mirea.ru as fast as possible!");
      return;
    }

    fetch("https://attendance.mirea.ru/rtu_tc.attendance.api.StudentService/SelfApproveAttendance", {
      "headers": {
        "content-type": "application/grpc-web+proto",
        "pulse-app-type": "pulse-app",
        "pulse-app-version": "1.5.2+2965",
        "x-grpc-web": "1",
        "x-requested-with": "XMLHttpRequest"
      },
      "referrer": "https://pulse.mirea.ru/",
      "body": "\u0000\u0000\u0000\u0000&\n$" + token,
      "method": "POST",
      "mode": "cors",
      "credentials": "include"
    });

    console.log(`Attendance approved for [${token}]!`);
    makeNotification(`Your attendance approved! ///`);
  }
});