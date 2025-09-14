(() => {
  const SETTINGS = {
    SCAN_INTERVAL: 5000,
    AC_BTN_XPATH: '//*[contains(@class,"ModalTitle") and contains(text(), "Контроль присутствия")]/..//./button[contains(span/span/text(),"Подтверждаю")]'
  };

  const sentTokensMap = [];

  var scanLoop = () => {
    chrome.runtime.sendMessage({ type: "REQUEST_SCAN" });
    acScanApprove();

    setTimeout(scanLoop, SETTINGS.SCAN_INTERVAL);
  };
  setTimeout(scanLoop, SETTINGS.SCAN_INTERVAL);

  function acScanApprove() {
    const foundElements = getElementsByXPath(SETTINGS.AC_BTN_XPATH);
    if (foundElements.length > 0) {
      foundElements.forEach(e => {
        e.click();
      })
    }
  }

  function getElementsByXPath(xPath, contextNode) {
    let results = [];
    let evaluator = new XPathEvaluator();
    try {
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

  function getRGBAArrayFromDataURL(dataURL) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve({
          width: img.width,
          height: img.height,
          imageData: imageData.data
        });
      };
      img.onerror = (error) => {
        reject(error);
      };
      img.src = dataURL;
    });
  }

  chrome.runtime.onMessage.addListener(async (msg) => {
    if (msg?.type === "SCREENSHOT_READY" && msg.dataUrl) {
      const { width, height, imageData } = await getRGBAArrayFromDataURL(msg.dataUrl);
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
          chrome.runtime.sendMessage({ type: "REQUEST_APPROVE", token: token });
          sentTokensMap.push(token);
        }
      } else {
        console.log("No QR found...");
      }
    }
  });

})();
