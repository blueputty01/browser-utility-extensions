const rules = [
  {
    id: 36,
    priority: 2,
    action: {
      type: 'modifyHeaders',
      requestHeaders: [
        {
          header: 'user-agent',
          operation: 'set',
          value: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 Edg/111.0.100.0`,
        },
      ],
    },
    condition: {
      urlFilter: 'bing.com',
      resourceTypes: ['main_frame', 'xmlhttprequest'],
    },
  },
];

chrome.declarativeNetRequest.getDynamicRules((previousRules) => {
  const previousRuleIds = previousRules.map((rule) => rule.id);
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: previousRuleIds,
    addRules: rules,
  });
});
