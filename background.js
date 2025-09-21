importScripts('api.js', 'lib/jsQR.min.js');

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

async function getImageData(dataURL) {
  const blob = await fetch(dataURL).then(r => r.blob());
  const img = await createImageBitmap(blob);
  const offscreen = new OffscreenCanvas(img.width, img.height);
  const ctx = offscreen.getContext('2d');
  ctx.drawImage(img, 0, 0);
  return {
    width: img.width,
    height: img.height,
    imageData: ctx.getImageData(0, 0, img.width, img.height).data
  };
}

const sentTokensMap = [];

async function processScreenshot(dataUrl) {
  const { width, height, imageData } = await getImageData(dataUrl);
  const code = jsQR(imageData, width, height, { inversionAttempts: "attemptBoth" });
  if (code) {
    const url = String.fromCharCode(...code.binaryData);
    if (url.includes("mirea.ru") && url.includes("token")) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const token = urlParams.get("token");
      if (sentTokensMap.includes(token)) {
        console.log(`Token already used: ${token}`);
        return;
      }
      console.log(`Approving attendance with token: ${token}`);
      chrome.runtime.sendMessage({ type: "REQUEST_APPROVE", token: token }, (response) => {
        if (response && response.success)
          sentTokensMap.push(token);
      });
    }
  } else {
    console.log("No QR found...");
  }
}

function processScan(tab) {
  try {
    chrome.tabs.captureVisibleTab(tab?.windowId, {}, function (dataUrl) {
      if (dataUrl)
        processScreenshot(dataUrl);
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
  }
  return true;
});
