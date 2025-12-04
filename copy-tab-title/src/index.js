const plainCopyButton = document.getElementById('plainCopyButton');
const mdCopyButton = document.getElementById('mdCopyButton');

const copyAllButton = document.getElementById('copyAllButton');
const pasteButton = document.getElementById('pasteButton');
const linkInput = document.getElementById('linkInput');

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

pasteButton.addEventListener('click', async function () {
  await openLinksFromInput();
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

// Parse markdown links from input and open them in new windows
async function openLinksFromInput() {
  const inputText = linkInput.value;

  // Split by double line breaks to get windows
  const windows = inputText.split('\n\n').filter((w) => w.trim());

  for (const windowContent of windows) {
    // Extract all markdown links [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const urls = [];
    let match;

    while ((match = linkRegex.exec(windowContent)) !== null) {
      urls.push(match[2]);
    }

    // Open all URLs from this window group
    if (urls.length > 0) {
      const newWindow = await chrome.windows.create({ url: urls[0] });

      // Open remaining URLs in the same window
      for (let i = 1; i < urls.length; i++) {
        await chrome.tabs.create({ windowId: newWindow.id, url: urls[i] });
      }
    }
  }

  showNotification(`Opened ${windows.length} window(s)`);
  linkInput.value = '';
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

function showNotification(message) {
  notif.textContent = message;
  timeouts.forEach((timeout) => clearTimeout(timeout));
  const timeout = setTimeout(function () {
    notif.textContent = '';
  }, 1500);
  timeouts.push(timeout);
}
