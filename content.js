(() => {
  const SETTINGS = {
    SCAN_INTERVAL: 5000,
    AC_BTN_XPATH: '//*[contains(@class,"ModalTitle") and contains(text(), "Контроль присутствия")]/..//./button[contains(span/span/text(),"Подтверждаю")]'
  };

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
})();
