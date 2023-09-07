// content.js

// Function to inject the script when the trigger string is found
function injectScript() {
  // Check if the current URL contains the trigger string in the query

  const url = window.location.href;

  if (url.includes(`www.google.com/search?q`)) {
    if (url.includes('timer')) {
      isolateWidget('#timer-stopwatch-container');
    } else if (url.includes('weather')) {
      isolateWidget('#wob_wc');
    }

    function isolateWidget(id) {
      $(id).show().parentsUntil('body').andSelf().siblings().hide();

      document.getElementById('main').style.minWidth = 0;
      document.getElementById('rcnt').style.maxWidth = '100vw';
      document.getElementById('center_col').style.marginLeft = 'auto';
      document.getElementById('center_col').style.marginRight = 'auto';

      const cnt = document.getElementById('cnt');
      cnt.style.display = 'flex';
      cnt.style.justifyContent = 'center';
      cnt.style.alignItems = 'center';
    }
  }
}

// Execute the script injection function
injectScript();
