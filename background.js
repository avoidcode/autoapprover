importScripts('api.js');

chrome.runtime.onInstalled.addListener(async () => {
  const rule = {
    id: 1,
    priority: 1,
    action: {
      type: "modifyHeaders",
      requestHeaders: [{ header: "Origin", operation: "remove" }]
    },
    condition: {
      initiatorDomains: [chrome.runtime.id],
      resourceTypes: ["xmlhttprequest"],
      requestMethods: ["get", "post", "put", "patch", "delete"]
    }
  };

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [rule.id],
    addRules: [rule]
  });
});

function makeNotification(message, clickCallback = null) {
  chrome.notifications.create(null, {
    type: "basic",
    iconUrl: "images/icon-32.png",
    title: "MIREA AutoApprover",
    message: message
  }, (notificationId) => {
    chrome.notifications.onClicked.addListener((clickedNotificationId) => {
      if (clickedNotificationId === notificationId)
        clickCallback();
    });
  });
}

async function processApprove(token, successCallback) {
  checkAuth((auth) => {
    if (auth) {
      requestApprove(token, (approved) => {
        if (approved) {
          console.log(`Attendance approved for [${token}]!`);
          makeNotification(`Your attendance approved! ///`);
          successCallback();
        }
      });
    } else {
      makeNotification("No auth! Please, login to pulse.mirea.ru as fast as possible!", () => {
        chrome.tabs.create({ url: "https://pulse.mirea.ru" });
      });
    }
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "REQUEST_APPROVE" && msg?.token) {
    processApprove(msg.token, () => sendResponse({ type: "APPROVE_STATUS", status: true }));
  }
  return true;
});
