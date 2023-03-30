const clearDownloads = function () {
  const S_TO_MS = 1000;
  const clearFreq = 30 * S_TO_MS;

  setTimeout(function () {
    chrome.downloads.erase({ state: 'complete' });
  }, clearFreq);
};

chrome.downloads.onChanged.addListener(function (e) {
  if (typeof e.state !== 'undefined') {
    if (e.state.current === 'complete') {
      clearDownloads();
    }
  }
});
