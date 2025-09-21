importScripts('api.js');

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
  checkAuth((auth) => {
    if (auth) {
      requestApprove(token, (approved) => {
        if (approved) {
          console.log(`Attendance approved for [${token}]!`);
          makeNotification(`Your attendance approved! ///`);
          sendResponse({ success: true });
        }
      });
    } else {
      makeNotification("No auth! Please, login to pulse.mirea.ru as fast as possible!", () => {
        chrome.tabs.create({ url: "https://pulse.mirea.ru" });
      });
      sendResponse({ success: false });
    }
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "REQUEST_SCAN" && sender.tab != null) {
    processScan(sender.tab);
  } else if (msg?.type === "REQUEST_APPROVE" && msg?.token != null) {
    processApprove(msg.token, sendResponse);
  }
  return true;
});
