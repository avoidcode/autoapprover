function makeNotification(message, clickCallback = null) {
  chrome.notifications.create(null, {
    type: 'basic',
    iconUrl: 'images/icon-32.png',
    title: 'MIREA AutoApprover',
    message: message
  }, (notificationId) => {
    chrome.notifications.onClicked.addListener((clickedNotificationId) => {
      if (clickedNotificationId === notificationId)
        clickCallback();
    });
  });
}

function processScan(tab) {
  try {
    chrome.tabs.captureVisibleTab(tab?.windowId, {}, function (dataUrl) {
      chrome.tabs.sendMessage(tab.id, { type: "SCREENSHOT_READY", dataUrl });
    });
  } catch (e) { }
}

async function processApprove(token, sendResponse) {
  const authCookie = await chrome.cookies.get({ url: "https://attendance.mirea.ru", name: ".AspNetCore.Cookies" });
  if (!authCookie) {
    makeNotification("No auth! Please, login to pulse.mirea.ru as fast as possible!", () => {
      chrome.tabs.create({ url: "https://pulse.mirea.ru" });
    });
    sendResponse({ success: false });
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
  sendResponse({ success: true });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "REQUEST_SCAN" && sender.tab != null) {
    processScan(sender.tab);
  } else if (msg?.type === "REQUEST_APPROVE" && msg?.token != null) {
    processApprove(msg.token, sendResponse);
  }
  return true;
});
