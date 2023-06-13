chrome.browsingData.remove(
  {
    // unregister service workers for known websites to block that use them
    origins: ['https://applyingto.college'],
  },
  {
    serviceWorkers: true,
  }
);

const BLOCK_URLS = [
  'collegeconfidential.com',
  'www.reddit.com/r/ApplyingToCollege/',
  'cornell',
  // 'linkedin.com',
];

const REDIRECT = 'www.cs.umd.edu/';

const newRules = [
  {
    id: 1,
    priority: 2,
    action: {
      type: 'allow',
    },
    condition: {
      isUrlFilterCaseSensitive: false,
      urlFilter: REDIRECT,
      resourceTypes: ['main_frame'],
    },
  },
];

const offset = newRules.length + 1;

BLOCK_URLS.forEach((domain, index) => {
  const id = index + offset;

  newRules.push({
    id: id,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: {
        url: `https://${REDIRECT}`,
      },
    },
    condition: { urlFilter: domain, resourceTypes: ['main_frame'] },
  });
});
chrome.declarativeNetRequest.getDynamicRules((previousRules) => {
  const previousRuleIds = previousRules.map((rule) => rule.id);
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: previousRuleIds,
    addRules: newRules,
  });
});
