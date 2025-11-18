"use strict";
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'displayCount') {
        chrome.action.setBadgeText({ text: message.data.blockedCount.toString() });
        setTimeout(() => {
            chrome.action.setBadgeText({ text: '' });
        }, 2000);
        sendResponse({ result: 'Blocked element count displayed successfully' });
    }
});
