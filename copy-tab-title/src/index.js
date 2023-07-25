const plainCopyButton = document.getElementById('plainCopyButton');
const mdCopyButton = document.getElementById('mdCopyButton');
const notif = document.getElementById('notif');

const timeouts = [];

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  return tab;
}

plainCopyButton.addEventListener('click', async function () {
  const { title } = await getActiveTab();
  copyToClipboard(title, 'plain');
});

mdCopyButton.addEventListener('click', async function () {
  const { title, url } = await getActiveTab();
  copyToClipboard(`[${title}](${url})`, 'markdown');
});

function copyToClipboard(text, type) {
  navigator.clipboard
    .writeText(text)
    .then(function () {
      console.log('Copied to clipboard:', text);
      notif.textContent = `Copied ${type}`;

      timeouts.forEach((timeout) => clearTimeout(timeout));

      const timeout = setTimeout(function () {
        notif.textContent = '';
      }, 1500);
      timeouts.push(timeout);
    })
    .catch(function (error) {
      console.error('Unable to copy to clipboard:', error);
    });
}
