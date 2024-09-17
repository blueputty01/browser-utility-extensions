chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  var iframe =
    document.getElementsByClassName('ef-file-preview-frame')[0] ||
    Array.from(document.getElementsByTagName('iframe')).find(function (x) {
      return !x.id && !x.className;
    });
  if (!iframe) {
    return alert('Please open a file before clicking the extension');
  }
  window.open(iframe.src);
});
