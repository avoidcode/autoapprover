(() => {
  const SETTINGS = {
    SCAN_INTERVAL:        1000 * 10, // Every 10 seconds
    AC_BTN_APPROVE_XPATH: '//*[contains(@class,"ModalTitle") and contains(text(), "Контроль присутствия")]/..//./button[contains(span/span/text(), "Подтверждаю")]',
    AC_BTN_CLOSE_XPATH:   '//*[contains(@class,"ModalContent")]/..//./button[contains(span/text(), "Закрыть")]'
  };

  const scanLoop = () => {
    chrome.runtime.sendMessage({ type: "REQUEST_SCAN" });
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
