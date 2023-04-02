chrome.browsingData.remove(
  {
    // unregister service workers for known websites to block that use them
    origins: ['https://applyingto.college'],
  },
  {
    serviceWorkers: true,
  }
);

const blockUrls = [
  'collegeconfidential.com',
  // 'www.reddit.com/r/ApplyingToCollege/',
  'linkedin.com',
];

const newRules = [];

blockUrls.forEach((domain, index) => {
  const id = index + 3;

  newRules.push({
    id: id,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: {
        url: 'https://rutgers.edu/',
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
