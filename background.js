importScripts('api.js', 'lib/jsQR.min.js');

const RESET_PERIOD = 1000 * 60 * 10; // Every 10 minutes

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

const approvedTabIds = [];

const resetLoop = () => {
  approvedTabIds.splice(0, approvedTabIds.length);
  setTimeout(resetLoop, RESET_PERIOD);
};
setTimeout(resetLoop, RESET_PERIOD);

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

async function getImageData(dataURL) {
  const blob = await fetch(dataURL).then(r => r.blob());
  const img = await createImageBitmap(blob);
  const offscreen = new OffscreenCanvas(img.width, img.height);
  const ctx = offscreen.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return {
    width: img.width,
    height: img.height,
    imageData: ctx.getImageData(0, 0, img.width, img.height).data
  };
}

function processScan(tab) {
  try {
    chrome.tabs.captureVisibleTab(tab?.windowId, {}, function (dataUrl) {
      if (!approvedTabIds.includes(tab.id) && dataUrl)
        processScreenshot(dataUrl, tab.id);
    });
  } catch (e) { }
}

async function processScreenshot(dataUrl, source) {
  const { width, height, imageData } = await getImageData(dataUrl);
  const code = jsQR(imageData, width, height, { inversionAttempts: "attemptBoth" });
  if (code) {
    const url = String.fromCharCode(...code.binaryData);
    if (url.includes("mirea.ru") && url.includes("token")) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const token = urlParams.get("token");
      console.log(`Approving attendance with token: ${token}`);
      processApprove(token, source);
    }
  } else {
    console.log("No QR found...");
  }
}

async function processApprove(token, source) {
  checkAuth((auth) => {
    if (auth) {
      requestApprove(token, (approved) => {
        if (approved) {
          console.log(`Attendance approved for [${token}]!`);
          makeNotification(`Your attendance approved! ///`);
          approvedTabIds.push(source);
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
  if (msg?.type === "REQUEST_SCAN" && sender.tab != null) {
    processScan(sender.tab);
  }
  return true;
});
