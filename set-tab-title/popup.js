const setTitleButton = document.getElementById('setTitleButton');
const titleInput = document.getElementById('titleInput');

const setTitleAndClose = async () => {
  const newTitle = titleInput.value;

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (title) => {
      document.title = title;
    },
    args: [newTitle],
  });
  window.close();
};

setTitleButton.addEventListener('click', setTitleAndClose);
titleInput.focus();

titleInput.addEventListener('keypress', (evt) => {
  if (evt.key === 'Enter') {
    setTitleAndClose();
  }
});
