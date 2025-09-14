const SCAN_INTERVAL = 5000;

var scanLoop = () => {
  chrome.runtime.sendMessage({ type: "REQUEST_SCAN" });
  setTimeout(scanLoop, SCAN_INTERVAL);
};
setTimeout(scanLoop, SCAN_INTERVAL);

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

const sentTokensMap = [];

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