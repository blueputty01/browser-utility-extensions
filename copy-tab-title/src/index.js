const plainCopyButton = document.getElementById('plainCopyButton');
const mdCopyButton = document.getElementById('mdCopyButton');

const copyAllButton = document.getElementById('copyAllButton');

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

copyAllButton.addEventListener('click', async function () {
  copyToClipboard(await getTabs(), 'markdown');
});

// Get the current window's tabs and display them to id tabsList in popup.html in markdown format
async function getTabs() {
  const window = await chrome.windows.getCurrent();

  const tabs = await chrome.tabs.query({ windowId: window.id });

  const tabList = document.getElementById('tabsList');

  console.log(tabs);

  let markdown = '';
  tabs.forEach((tab) => {
    markdown += `[${tab.title}](${tab.url})\n`;
  });
  tabList.textContent = markdown;

  return markdown;
}

(async () => {
  getTabs();
})();

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
