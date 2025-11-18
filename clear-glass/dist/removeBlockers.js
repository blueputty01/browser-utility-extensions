"use strict";
/* removeBlockers.js

- Hide obstructive elements from glassdoor.com, teamblind.com, and repvue.com by overriding styles
- Block restrictive scroll functions from preventing page navigation

*/
class RemoveBlockers {
    constructor() {
        // for interviews page
        this.enableFilters = () => {
            const filterDropDown = document.querySelector('div[data-test="filterDropdown"]');
            if (!filterDropDown) {
                return;
            }
            const input = filterDropDown.querySelector('div[data-test="ContentFiltersJobTitleACContainer"] input');
            const findInterviewsButton = filterDropDown.querySelector('button[data-test="ContentFiltersFindBtn"]');
            const span = document.createElement('span');
            span.innerText = this.eyeIcon;
            span.setAttribute('style', 'color: green; padding-left: 5px; font-size: 1rem;');
            setTimeout(() => {
                findInterviewsButton.children[0].appendChild(span);
            });
            findInterviewsButton === null || findInterviewsButton === void 0 ? void 0 : findInterviewsButton.addEventListener('click', () => {
                if (input.value) {
                    const interviewsButton = document.querySelector('#interviews > a');
                    const url = interviewsButton.href;
                    const filter = input.value.replace(' ', '-');
                    window.location.href = `${url}?filter.jobTitleExact=${filter}`;
                }
            });
            const filterButton = filterDropDown.querySelector('button[data-test="ContentFiltersFilterToggleBtn"]');
            for (const interactive of [input, findInterviewsButton]) {
                if (interactive) {
                    console.log({ interactive });
                    interactive.removeAttribute('disabled');
                    interactive.removeAttribute('aria-disabled');
                }
            }
        };
        this.fromGlassDoor = () => {
            const style = `
            body {
                overflow: visible !important;
                position: static !important;
            }

            /* div[data-test="authModalContainerV2"], */
            div#ContentHardsell,
            div#ContentWallHardsell,
            div#ContentHardsellOverlay,
            div#HardsellOverlay,
            div#LapsedContentHardsell,
            div#UserAlert,
            dialogue#SmarterBannerContainer
            {
                display: none !important;
                --blocker-tag: 1; 
            }

            div#ReviewsFeed span {
                white-space: normal !important;
            }

            div[class^=" FilterLockCTA"] {
                display: none !important
            }

            div#ReviewsFeed p {
                display: block !important;
                max-height: none;
                --limit: 0 !important;
            }

            div#ReviewsFeed [class^="review-details_showMoreButton"] {
                display: none;
            }

            div#ReviewsFeed [class^="review-details_fullWidth"] {
                pointer-events: none;
            }

            span[data-test^="review-text-"] {
                display: block !important;
                overflow: auto !important;
                max-height: none;
            }

            p[class^="truncated-text"] {
                display: block !important;
                overflow: auto !important;
                max-height: none;
            }

            div[class^="review-details_showMoreButton"] {
                display: none !important;
            }
        `;
            this.attachStyle(style);
            this.preventScrollLock();
            this.enableFilters();
            setTimeout(() => this.replaceShowMoreButtons(), 1000);
        };
        this.removeJoinBlindBanner = () => {
            var _a;
            const targetString = 'Join the conversation on Blind';
            const divs = document.querySelectorAll('div');
            for (const div of divs) {
                for (const node of div.childNodes) {
                    if (node.nodeType === Node.TEXT_NODE &&
                        ((_a = node === null || node === void 0 ? void 0 : node.textContent) === null || _a === void 0 ? void 0 : _a.trim().includes(targetString))) {
                        const parent = div.parentNode;
                        if (parent)
                            parent.remove();
                        break;
                    }
                }
            }
        };
        this.fromBlind = () => {
            const style = `
            body {
                overflow: visible !important;
            }
            div.backdrop-blur-sm {
                display: none !important;
                --blocker-tag: 1; 
            }
            div.z-10,
            div.z-20,
            div.z-30,
            div.z-40 {
                display: none !important;
                --blocker-tag: 1; 
            }
        `;
            this.attachStyle(style);
            // console.log('removing blind banner');
            // this.removeJoinBlindBanner();
        };
        this.fromRepVue = () => {
            const style = `
            div[class^="LimitedAccess_wrapper"] {
                --blur: 0 !important;
                --blocker-tag: 1; 
            }
            div[class^="LimitedAccess_wrapper"]::before {
                display:none !important;
                --blocker-tag: 1; 
            }
            div[class^="LimitedAccess_companyWrapper"] {
                display: none !important;
                --blocker-tag: 1; 
            }
        `;
            this.attachStyle(style);
        };
        this.countHiddenElements = () => {
            const elements = document.querySelectorAll('div');
            let hiddenCount = 0;
            elements.forEach((element) => {
                if (window.getComputedStyle(element).getPropertyValue('--blocker-tag')) {
                    hiddenCount += 1;
                }
            });
            return hiddenCount;
        };
        this.showBlockedCount = () => {
            const count = this.countHiddenElements();
            if (count === 0) {
                return;
            }
            chrome.runtime.sendMessage({ action: 'displayCount', data: { blockedCount: count } }, (response) => { });
        };
        this.mount = () => {
            console.log('Clear Glass loaded.');
            const lambdas = {
                glassdoor: removeBlockers.fromGlassDoor,
                teamblind: removeBlockers.fromBlind,
                repvue: removeBlockers.fromRepVue,
            };
            if (this.url) {
                const domain = this.url.replace(/.+\/\/|www.|\..+/g, '');
                if (domain in lambdas) {
                    console.log(`Removing blockers from ${domain}`);
                    document.addEventListener('DOMContentLoaded', () => {
                        lambdas[domain]();
                        this.showBlockedCount();
                    });
                }
            }
        };
        this.url = window.location.href;
        this.eyeIcon = '𓁹';
        this.green = 'color:#085';
        this.message = 'Full text made visible by ClearGlass';
    }
    // for glassdoor review section
    replaceShowMoreButtons() {
        const showMoreButtons = document.querySelectorAll('div#ReviewsFeed [class^="review-details_showMoreButton"], div[class^="review-details_showMoreButton"]');
        for (const button of showMoreButtons) {
            const div = document.createElement('div');
            const span = document.createElement('span');
            const eye = document.createElement('span');
            eye.innerText = this.eyeIcon;
            span.innerText = this.message;
            div.appendChild(span);
            div.appendChild(eye);
            div.setAttribute('style', 'color:#085; padding-bottom: 5px;');
            eye.setAttribute('style', 'color:#085; font-weight: bold; font-size: 24px; padding-left: 5px;');
            button.replaceWith(div);
        }
    }
    attachStyle(style) {
        const styleElement = document.createElement('style');
        styleElement.textContent = style;
        document.head.prepend(styleElement);
    }
    preventScrollLock() {
        const hardsellLoggedIn = document.getElementById('ContentWallHardsell');
        // seems to appear independent of hardsell's presence now
        if (true) {
            window.addEventListener('scroll', (e) => {
                e.stopPropagation();
            }, { capture: true });
        }
    }
}
const removeBlockers = new RemoveBlockers();
removeBlockers.mount();
