const clearDownloads = function () {
  const MS_TO_S = 1000;
  const S_TO_M = 60;
  const clearFreq = 1 * S_TO_M * MS_TO_S;

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
