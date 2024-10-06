chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  var iframe = Array.from(document.getElementsByTagName('iframe')).find(
    (x) => x.allowFullscreen
  );
  if (!iframe) {
    return alert('Please open a file before clicking the extension');
  }
  window.open(iframe.src);
});
