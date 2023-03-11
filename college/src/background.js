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
  'Princeton.edu',
  'purdue.edu',
  'umich.edu',
  'uci.edu',
  'UCLA',
  'case.edu/admission/apply',
  'ucsb.edu',
  'Brown.edu',
  'cornell.edu',
  'Berkeley.edu',
  'ucsd',
  'cmu.edu',
  'duke.edu',
  'riceadmission.rice.edu',
  'Stanford.edu',
  'upenn.edu',
  // 'rutgers',
  'illinois',
  'umd',
  'gatech',
  'utexas',
  '1GyIUED23YvZp3Z7VBxOEE-qP2lkO7Ii-8lAifjiiawM', //application manger spreadsheet
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
