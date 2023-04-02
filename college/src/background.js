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
  'www.reddit.com/r/ApplyingToCollege/',
  'linkedin.com',
];

blockUrls.forEach((domain, index) => {
  const id = index + 3;

  chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [
      {
        id: id,
        priority: 1,
        action: {
          type: 'redirect',
          redirect: {
            url: 'https://rutgers.edu/',
          },
        },
        condition: {
          isUrlFilterCaseSensitive: false,
          urlFilter: domain,
          resourceTypes: ['main_frame'],
        },
      },
    ],
    removeRuleIds: [id],
  });
});
