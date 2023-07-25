const copyButton = document.getElementById('copyButton');

copyButton.addEventListener('click', function () {
  chrome.tabs.query(
    { active: true, currentWindow: true },
    function ([activeTab]) {
      const { title } = activeTab;
      copyToClipboard(title);
    }
  );
});

function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(function () {
      console.log('Copied to clipboard:', text);
      copyButton.textContent = 'Copied!';
      setTimeout(function () {
        copyButton.textContent = 'Copy';
      }, 1500);
    })
    .catch(function (error) {
      console.error('Unable to copy to clipboard:', error);
    });
}
