(() => {
  const SETTINGS = {
    SCAN_INTERVAL:        1000 * 20,      // Scan for QR codes and AC every 20 seconds
    COOLDOWN_PERIOD:      1000 * 60 * 10, // Send approval requests not often than once a 10 minute period after a successful approval
    AC_BTN_APPROVE_XPATH: '//*[contains(@class,"ModalTitle") and contains(text(), "Контроль присутствия")]/..//./button[contains(span/span/text(), "Подтверждаю")]',
    AC_BTN_CLOSE_XPATH:   '//*[contains(@class,"ModalContent")]/..//./button[contains(span/text(), "Закрыть")]'
  };

  var cooldownPeriod = false;

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.type === "APPROVAL_STATUS" && msg?.status) {
      cooldownPeriod = true;
      setTimeout(() => {
        cooldownPeriod = false;
      }, SETTINGS.COOLDOWN_PERIOD);
    }
    return true;
  });

  const canvas = new OffscreenCanvas(0, 0);
  const canvasContext = canvas.getContext("2d", { willReadFrequently: true });

  function captureFrame(video) {
    if (video.videoWidth === 0 || video.videoHeight === 0)
      return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvasContext.drawImage(video, 0, 0);
    return {
      width: video.videoWidth,
      height: video.videoHeight,
      imageData: canvasContext.getImageData(0, 0, video.videoWidth, video.videoHeight).data
    }
  }

  function qrScanApprove() {
    const videos = document.getElementsByTagName("video");
    Array.from(videos)
      .map((v) => captureFrame(v))
      .filter((e) => e !== null)
      .forEach(s => processScreenshot(s));
  }

  async function processScreenshot({ width, height, imageData }) {
    try {
      const code = jsQR(imageData, width, height, { inversionAttempts: "dontInvert" });
      if (code) {
        const url = String.fromCharCode(...code.binaryData);
        if (url.includes("mirea.ru") && url.includes("token")) {
          const urlParams = new URLSearchParams(url.split('?')[1]);
          const token = urlParams.get("token");
          console.log(`Approving attendance with token: ${token}`);
          chrome.runtime.sendMessage({ type: "REQUEST_APPROVE", token: token });
        }
      } else {
        console.log("No QR found...");
      }
    } catch (e) { console.error(e); }
  }

  const scanLoop = () => {
    if (!cooldownPeriod)
      qrScanApprove();
    acScanApprove();

    setTimeout(scanLoop, SETTINGS.SCAN_INTERVAL);
  };
  setTimeout(scanLoop, SETTINGS.SCAN_INTERVAL);

  function acScanApprove() {
    getElementsByXPath(SETTINGS.AC_BTN_XPATH, document).forEach(e1 => {
      e1.click();
      console.log("Approve button found on page! Clicked!");
      setTimeout(() => {
        getElementsByXPath(SETTINGS.AC_BTN_CLOSE_XPATH, document).forEach(e2 => {
          e2.click();
          console.log("Modal closed!");
        });
      }, 500);
    });
  }

  function getElementsByXPath(xPath, contextNode) {
    let results = [];
    try {
      let evaluator = new XPathEvaluator();
      let expression = evaluator.createExpression(xPath);
      if (expression) {
        let query = expression.evaluate(contextNode, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);
        for (let i = 0; i < query.snapshotLength; ++i) {
          results.push(query.snapshotItem(i));
        }
      }
    } catch (e) { }
    return results;
  }
})();
