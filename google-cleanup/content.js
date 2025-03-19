// content.js

// Function to inject the script when the trigger string is found
function injectScript() {
  // Check if the current URL contains the trigger string in the query

  const url = window.location.href;

  if (url.includes(`www.google.com/search?q`)) {
    if (url.includes("timer")) {
      const ele = document.querySelector("[data-use-timer-ui]");
      document.body.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          isolateWidget(ele.parentElement);
        }
      });
    } else if (url.includes("weather")) {
      const ele = document.querySelector("[data-ve-view]");
      document.body.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          isolateWidget(ele.parentElement);
        }
      });
    }

    function isolateWidget(ele) {
      ele.style.position = "fixed";
      ele.style.top = 0;
      ele.style.left = "50%";
      ele.style.transform = "translateX(-50%)";
      ele.style.zIndex = 999999;

      const background = document.createElement("div");
      background.style.position = "fixed";
      background.style.inset = 0;
      background.style.backgroundColor = "#e4edff";
      background.style.zIndex = 999998;
      document.body.appendChild(background);

      document.body.style.overflow = "hidden";
    }
  }
}

// Execute the script injection function
injectScript();
