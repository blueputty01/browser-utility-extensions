// ==UserScript==
// @name        Testudo+
// @author      tybug, minermaniac447
// @license     GPL3
// @match       *://app.testudo.umd.edu/soc/*
// @grant       GM_addStyle
// @grant       GM_setClipboard
// @grant       GM_getResourceURL
// @grant       GM_getResourceText
// @run-at      document-start
// @resource    aliases https://raw.githubusercontent.com/tybug/testudoplus/master/alias.json
// @resource    css https://raw.githubusercontent.com/tybug/testudoplus/master/style.css
// @version     0.1.14
// @description Improve the Testudo Schedule of Classes
// @namespace   tybug
// @source      https://github.com/tybug/testudoplus
// ==/UserScript==

const DATA = {
  rmp: {},
  pt: {},
};
let ALIAS = {};
const FULLURLS = [
  '&_openSectionsOnly=on&creditCompare=%3E%3D&credits=0.0&courseLevelFilter=ALL&instructor=&_facetoface=on&_blended=on&_online=on&courseStartCompare=&courseStartHour=&courseStartMin=&courseStartAM=&courseEndHour=&courseEndMin=&courseEndAM=&teachingCenter=ALL&_classDay1=on&_classDay2=on&_classDay3=on&_classDay4=on&_classDay5=on',
  '&_openSectionsOnly=on&creditCompare=&credits=&courseLevelFilter=ALL&instructor=&_facetoface=on&_blended=on&_online=on&courseStartCompare=&courseStartHour=&courseStartMin=&courseStartAM=&courseEndHour=&courseEndMin=&courseEndAM=&teachingCenter=ALL&_classDay1=on&_classDay2=on&_classDay3=on&_classDay4=on&_classDay5=on',
];
// List of gened codes for CORE and Gen-Ed
const CORECODES = [
  'D',
  'CS',
  'HA',
  'HL',
  'HO',
  'IE',
  'LL',
  'PL',
  'LS',
  'MS',
  'PS',
  'SB',
  'SH',
];
const GENEDCODES = [
  'FSAW',
  'FSAR',
  'FSMA',
  'FSOC',
  'FSPW',
  'DSHS',
  'DSHU',
  'DSNS',
  'DSNL',
  'DSSP',
  'DVCC',
  'DVUP',
  'SCIS',
];
// This is basically just for pattern matching partial courses/departments
const CDPATTERN = /^([a-zA-Z]{4})([0-9]{1,3}|(?:[0-9]{3}[a-zA-Z]?))?$/g;
const COURSEPATTERN = /((?!Fall)[a-zA-Z]{4}[0-9]{3}[a-zA-Z]?)/g;
const sortBtn = document.createElement('button');
const resetBtn = document.createElement('button');
const reloadRatingsBtn = document.createElement('button');
const lastSemBtn = document.createElement('button');
const nextSemBtn = document.createElement('button');

// Runs before DOM content is loaded to handle URL shortening without refreshing page
function preDOMMain() {
  shortenLongURL();
}

// Runs after DOM content is loaded so everything else runs at the proper time
function postDOMMain() {
  generateButtons();
  loadAliasTable().then(() => {
    // First load
    loadPTData();
    loadRateData();
  });
  createShareLinks();
  linkifyCourses();
  linkifyGeneds();
  createSectionObserver();
}

// ---------- Link Creation Methods ---------- //

// Specifically generates course share links
function genShareLink(courseId) {
  return genShortLink(courseId.substring(0, 4), courseId);
}

// A more abstract link generator
function genShortLink(
  courseDept,
  courseId,
  termId = getTermId(window.location.href)
) {
  const baseURL = 'https://app.testudo.umd.edu/soc';
  // if courseId is the same as coursedept, don't include that portion of the link
  return (
    baseURL +
    '/' +
    termId +
    '/' +
    courseDept.toUpperCase() +
    (courseId == courseDept ? '' : '/' + courseId).toUpperCase()
  );
}

// An even more abstract TermID getter, from a url
function getTermId(url) {
  if (url.includes('termId=')) {
    // for most URLs, this will return the term id
    return url.split('termId=')[1].split('&')[0];
  } else if (url.includes('/gen-ed/')) {
    // the geneds page has the term id after the /gen-ed/ address portion, similar to how individual courses or depts do it
    return url.split('/gen-ed/')[1].split('/')[0];
  } else if (url.includes('/core/')) {
    // same with the /core/ page
    return url.split('/core/')[1].split('/')[0];
  } else {
    // if it's another shortlink
    return url.split('/soc/')[1].split('/')[0];
  }
}

// Two functions to increment and decrement to the next termids, counting only fall and spring, and substitute them into given URLs
function diffTerm(term = getTermId(window.location.href), diff = 0) {
  let year = Number(term.substring(0, 4));
  const mon = term.substring(4, 6);
  year += Math.floor(diff / 2);
  switch (diff % 2) {
    case 1:
      if (mon == '08') {
        return year + 1 + '01';
      } else {
        return year + '08';
      }
    case 0:
      return year + mon;
    case -1:
      if (mon == '08') {
        return year + 1 + '01';
      } else {
        return year + '08';
      }
  }
}

function diffTermURL(url, diff) {
  return url.replace(getTermId(url), diffTerm(getTermId(url), diff));
}

// Generates a direct link to a term's page for a given gened
function getGenedLink(
  code,
  termId = getTermId(window.location.href),
  iscore = false
) {
  return (
    'https://app.testudo.umd.edu/soc/' +
    (!iscore ? 'gen-ed' : 'core') +
    '/' +
    termId +
    '/' +
    code
  );
}

// ---------- Normal Methods ---------- //

// If this is a super long search URL with all default params, replace it with a direct URL if possible
function shortenLongURL() {
  const currURL = window.location.href;
  let matchesFull = false;
  FULLURLS.forEach((ending) => {
    if (currURL.includes(ending)) matchesFull = true;
  });
  // Matches one of any of an arbitrary number of 'full url's (since different pages have default searches)
  const params = new URLSearchParams(window.location.search);
  if (matchesFull && params.has('courseId')) {
    console.log(params.get('courseId'));
    // If this is a long url and there is a course ID, extract it
    const match = [...params.get('courseId').matchAll(CDPATTERN)][0];
    if (typeof match !== undefined) {
      // Should successfully generate a short link for either a department (1 capture group) or course/course partial (2 cap groups)
      // if it matches the course pattern, replace it with a course link
      window.location.replace(genShortLink(match[1], match[0]));
    }
  }
}

// Generates and inserts the course sort buttons
function generateButtons() {
  // add GPA sort button
  sortBtn.addEventListener('click', function () {
    sortCourseElements((courseElem, otherCourseElem) => {
      if (!DATA.pt[courseElem.id] || !DATA.pt[courseElem.id].avgGPA) {
        return 100;
      } else if (
        !DATA.pt[otherCourseElem.id] ||
        !DATA.pt[otherCourseElem.id].avgGPA
      ) {
        return -100;
      } else {
        return (
          DATA.pt[otherCourseElem.id].avgGPA - DATA.pt[courseElem.id].avgGPA
        );
      }
    });
  });
  sortBtn.disabled = true;
  sortBtn.textContent =
    'Sort By Average GPA Descending (Loading data, please wait)';
  document
    .querySelector('#content-wrapper > div')
    .insertBefore(sortBtn, document.querySelector('#courses-page'));

  // add reset (course title) sort button
  resetBtn.style.cssText = 'margin-left: 20px;';
  resetBtn.addEventListener('click', function () {
    sortCourseElements((course1, course2) =>
      course1.id.toLowerCase().localeCompare(course2.id.toLowerCase())
    );
  });
  resetBtn.textContent = 'Reset Sort';
  document
    .querySelector('#content-wrapper > div')
    .insertBefore(resetBtn, document.querySelector('#courses-page'));

  // add pt reload button
  reloadRatingsBtn.style.cssText = 'margin-left: 20px;';
  reloadRatingsBtn.addEventListener('click', function () {
    loadAliasTable().then(() => {
      loadPTData();
      loadRateData();
    });
  });
  reloadRatingsBtn.textContent = 'Reload Ratings';
  document
    .querySelector('#content-wrapper > div')
    .insertBefore(reloadRatingsBtn, document.querySelector('#courses-page'));

  // add last and next semester buttons
  lastSemBtn.style.cssText = 'margin-left: 20px;';
  lastSemBtn.addEventListener('click', function () {
    window.location.replace(diffTermURL(window.location.href, -1));
  });
  lastSemBtn.textContent = 'View Last Semester';
  document
    .querySelector('#content-wrapper > div')
    .insertBefore(lastSemBtn, document.querySelector('#courses-page'));

  nextSemBtn.style.cssText = 'margin-left: 20px;';
  nextSemBtn.addEventListener('click', function () {
    window.location.replace(diffTermURL(window.location.href, 1));
  });
  nextSemBtn.textContent = 'View Next Semester';
  document
    .querySelector('#content-wrapper > div')
    .insertBefore(nextSemBtn, document.querySelector('#courses-page'));
}

// A generic course sorting function. If there are multiple department headers, it will remove them all
// Takes a comparison function as a parameter
function sortCourseElements(sorter) {
  const coursesContainer = document.querySelector('.courses-container');
  const allCourses = [...document.querySelectorAll('div.course')];
  const headerList = document.querySelectorAll('.course-prefix-container');

  allCourses.sort(sorter);
  allCourses.forEach((courseElem) => {
    coursesContainer.append(courseElem);
  });

  if (headerList.length > 1) {
    const headerParent = document.querySelector('#courses-page');
    // create a "Sorted" header to replace the others, which all have to be deleted
    const genericHeader = document.createElement('div');
    genericHeader.innerHTML =
      '<div class="course-prefix-info"><div class="row"><div class="eight columns"><span class="course-prefix-name">Sorted Courses</span></div></div></div>';
    genericHeader.setAttribute('class', 'course-prefix-container');
    genericHeader.setAttribute('id', 'Sorted');
    headerParent.insertBefore(genericHeader, headerList[0]);
    genericHeader.append(coursesContainer); // move the coursesContainer element to the new header

    headerList.forEach((e) => e.remove());
  }
}

// Generates the share link button under each course
function createShareLinks() {
  const courseElements = document.querySelectorAll('.course');

  // Local function to handle the copy link action
  function copyLink(courseId) {
    const link = genShareLink(courseId);
    navigator.clipboard.writeText(link);
  }

  courseElements.forEach((courseElem) => {
    // uses a div and an a element to provide the button "click" functionality
    const shareLink = document.createElement('a');
    shareLink.className = 'share-course-link';
    shareLink.innerText = 'Share';
    shareLink.title = 'Copy Course Link\n' + genShareLink(courseElem.id);

    const shareDiv = document.createElement('div');
    shareDiv.className = 'share-course-div';
    shareDiv.setAttribute('data-tooltip', 'Click to Copy');
    shareDiv.appendChild(shareLink);
    shareDiv.addEventListener('click', function (e) {
      copyLink(courseElem.id);
    });
    courseElem.querySelector('.course-id-container').appendChild(shareDiv);
  });
}

// For course descriptions and titles, automatically replace any course pattern match with a link to that course (assumes the course is valid)
// A 'course pattern match' is as follows: [4 letters][1-3 numbers] OR [4 letters][3 numbers][1 letter]
function linkifyCourses() {
  // This is the prerequisites, restrictions, 'credit only granted for', and formerly sections
  // This can be nested divs, which will be handled later in the function
  const allCourseTexts = [
    ...document.querySelectorAll('div.approved-course-text'),
  ];
  // This is the long paragraph description, and it's just plain text
  const allDescs = [...document.querySelectorAll('div.course-text')];
  // This is the course ids/titles in the top left of each course section
  const allIDs = [...document.querySelectorAll('div.course-id')];

  // Since the CourseTexts section can have nested divs, each potential subdiv needs to be added to the process list
  let allInnerCTs = [];
  allCourseTexts.forEach((ctDiv) => {
    // If there are nested divs, there are 3 layers of divs exactly; collect all of them
    if (ctDiv.innerHTML.includes('<div>')) {
      allInnerCTs.push(...Array.from(ctDiv.children[0].children[0].children));
    } else {
      // Otherwise, just collect the top level div
      allInnerCTs.push(ctDiv);
    }
  });
  // Then, combine all the arrays that need to be processed and run the match on all of them
  [...allInnerCTs, ...allDescs, ...allIDs].forEach((toLinkify) => {
    toLinkify.innerHTML = toLinkify.innerHTML.replaceAll(
      COURSEPATTERN,
      (match) =>
        `<a class="linkified-course" href=${genShareLink(match)}>${match}</a>`
    );
  });
}

// Replaces fake links in course elements to gened types with real links
function linkifyGeneds() {
  // Get all courses
  const allCourses = [...document.querySelectorAll('div.course')];
  const term = getTermId(window.location.href);

  // For each course, update any links in their core and in their gen-ed sections
  allCourses.forEach((courseDiv) => {
    const coreGroup = courseDiv.querySelector('div.core-codes-group');
    if (coreGroup != null) {
      // Get links, and for each one update their href
      const links = [...coreGroup.getElementsByTagName('a')];
      links.forEach((link) => {
        let content = link.textContent;
        if (CORECODES.includes(content)) {
          link.setAttribute('href', getGenedLink(content, term, true));
          link.setAttribute('target', '_blank');
          link.replaceWith(link.cloneNode(true));
        }
      });
    }
    const genedGroup = courseDiv.querySelector('div.gen-ed-codes-group');
    if (genedGroup != null) {
      // Get links, and for each one update their href
      const links = [...genedGroup.getElementsByTagName('a')];
      links.forEach((link) => {
        let content = link.textContent;
        if (GENEDCODES.includes(content)) {
          link.setAttribute('href', getGenedLink(content, term, false));
          link.setAttribute('target', '_blank');
          link.replaceWith(link.cloneNode(true));
        }
      });
    }
  });
}

// This function adds a MutationObserver to the courses-page upper div, looking for sections-container divs to be created
// If it sees one of those created, it reloads the rating boxes
function createSectionObserver() {
  const coursesDiv = document.querySelector('#courses-page');
  const obs = new MutationObserver(function (mutations, self) {
    for (const mutation of mutations) {
      if (
        mutation.type === 'childList' &&
        mutation.target.querySelector('.sections-container') != null
      ) {
        loadPTData();
        loadRateData();
      }
    }
  });

  obs.observe(coursesDiv, { childList: true, subtree: true });
}

// ---------- API Stuff ---------- //

// Pulls the most recent alias table from the github repo
async function loadAliasTable() {
  // const response = await fetch(GM_getResourceURL('aliases'), {
  //   method: 'GET',
  // });
  // if (response.status != 200)
  //   throw new Error('ERROR: aliases table request failed.');
  // ALIAS = await response.json();
  return {};
}

function getInstructorName(elem) {
  const container = elem.childNodes[0];
  if (container instanceof HTMLAnchorElement) {
    return container.innerText;
  }
  return container.wholeText;
}

function updateInstructorRating() {
  const instructorElements = document.querySelectorAll('.section-instructor');
  instructorElements.forEach((elem) => {
    const instructorName = getInstructorName(elem);
    if (DATA.rmp[instructorName]) {
      const oldElem = elem.querySelector('.rmp.rating-box');
      if (oldElem) {
        oldElem.remove();
      }
      const rating = DATA.rmp[instructorName].rating;
      const ratingElem = document.createElement('a');
      ratingElem.className = 'rmp rating-box';
      if (DATA.rmp[instructorName].recordId) {
        ratingElem.href = `https://www.ratemyprofessors.com/ShowRatings.jsp?tid=${DATA.rmp[instructorName].recordId}`;
      } else {
        // don't underline on hover if there's no link to click
        ratingElem.className += ' no-underline';
      }
      ratingElem.title = instructorName;
      ratingElem.target = '_blank';
      ratingElem.innerText = rating ? rating.toFixed(1) : 'N/A';
      elem.appendChild(ratingElem);
    }
  });

  updatePTData();
}

// Attempt to pull RMP rating for a given professor, substituting their alias if needed
async function getInstructor(name) {
  // return {};

  if (ALIAS[name]) {
    name = ALIAS[name].rmp_name;
  }
  const response = await fetch(
    `https://search-production.ratemyprofessors.com/solr/rmp/select?q=${encodeURIComponent(
      name
    )}&defType=edismax&qf=teacherfullname_t%5E1000%20autosuggest&bf=pow%28total_number_of_ratings_i%2C2.1%29&siteName=rmp&rows=20&start=0&fl=pk_id%20teacherfirstname_t%20teacherlastname_t%20total_number_of_ratings_i%20schoolname_s%20averageratingscore_rf%20averageclarityscore_rf%20averagehelpfulscore_rf%20averageeasyscore_rf%20chili_i%20schoolid_s%20teacherdepartment_s&fq=schoolid_s%3A1270&wt=json`,
    {
      method: 'GET',
    }
  );
  if (response.status != 200)
    throw new Error('ERROR: professor request for ' + name + ' failed.');

  const json = await response.json();
  const instructors = json.response.docs;
  console.log(instructors);
  if (instructors) {
    instructors.forEach((instructor) => {
      // if any of the returned profs match our name exactly, use that
      if (
        `${instructor.teacherfirstname_t} ${instructor.teacherlastname_t}` ==
        name
      ) {
        return instructor;
      }
    });
    // otherwise, just take the first one
    return instructors[0];
  } else throw new Error('ERROR: no professors found for ' + name);
}

function loadRateData() {
  const instructorElements = document.querySelectorAll('.section-instructor');
  instructorElements.forEach((elem) => {
    const instructorName = getInstructorName(elem);
    if (!DATA.rmp[instructorName]) {
      DATA.rmp[instructorName] = {
        name: instructorName,
      };
      getInstructor(instructorName)
        .then((instructor) => {
          DATA.rmp[instructorName].recordId = instructor.pk_id;
          DATA.rmp[instructorName].rating = instructor.averageratingscore_rf;

          updateInstructorRating();
        })
        .catch(() => {
          updateInstructorRating();
        });
    }
  });
}

async function planetterpAPI(endpoint, parameters) {
  const params = new URLSearchParams(parameters).toString();
  try {
    const response = await fetch(
      `https://planetterp.com/api/v1/${endpoint}?${params}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }
    );
    if (response.status != 200) throw new Error();
    return response.json();
  } catch {
    throw new Error(
      'ERROR: ' +
        endpoint +
        ' request failed. Parameters: ' +
        JSON.stringify(parameters)
    );
  }
  return {};
}

async function getPTCourseData(courseId) {
  var courseSchema;
  try {
    courseSchema = await planetterpAPI('course', { name: courseId });
  } catch (error) {
    console.log(`${courseId} not found`);
    courseSchema = { professors: [], average_gpa: null };
  }
  const courseData = {
    courseId,
    instructors: {},
    avgGPA: courseSchema.average_gpa,
  };

  await Promise.all(
    courseSchema.professors.map(async (professor) => {
      var profSchema;
      try {
        profSchema = await planetterpAPI('professor', { name: professor }, {});
      } catch (error) {
        console.log(`${professor} not found`);
        profSchema = { professor, slug: 'error', average_rating: null };
      }
      courseData.instructors[professor] = {
        name: professor,
        id: profSchema.slug,
        rating: profSchema.average_rating,
      };
    })
  );
  return courseData;
}

function updatePTData() {
  const allCourseElem = document.querySelectorAll('#courses-page .course');
  allCourseElem.forEach((courseElem) => {
    const courseIdElem = courseElem.querySelector('.course-id');
    const courseId = courseIdElem.innerText;
    const courseIdContainer = courseIdElem.parentNode;

    const oldElem = courseElem.querySelector('.pt.gpa-box');
    if (oldElem) {
      oldElem.remove();
    }

    if (DATA.pt[courseId]) {
      const avgGPA = DATA.pt[courseId].avgGPA;

      const avgGPAElem = document.createElement('a');
      avgGPAElem.className = 'pt gpa-box';
      avgGPAElem.href = `https://planetterp.com/course/${courseId}`;
      avgGPAElem.setAttribute('data-tooltip', 'Open in PlanetTerp');
      avgGPAElem.title = courseId;
      avgGPAElem.target = '_blank';
      avgGPAElem.innerText = avgGPA ? `avg gpa: ${avgGPA.toFixed(2)}` : 'N/A';

      const shareCourseElem =
        courseIdContainer.querySelector('.share-course-div');
      if (shareCourseElem) {
        shareCourseElem.before(avgGPAElem);
      } else {
        courseIdContainer.appendChild(avgGPAElem);
      }
    }

    const instructorElemList = courseElem.querySelectorAll(
      '.section-instructor'
    );
    instructorElemList.forEach((elem) => {
      const instructorName = getInstructorName(elem);
      if (DATA?.pt?.[courseId]?.instructors?.[instructorName]) {
        const oldElem = elem.querySelector('.pt.rating-box');
        if (oldElem) {
          oldElem.remove();
        }

        const instructor = DATA.pt[courseId].instructors[instructorName];
        const rating = instructor.rating;
        const ratingElem = document.createElement('a');
        ratingElem.className = 'pt rating-box';
        if (instructor.id) {
          ratingElem.href = `https://planetterp.com/professor/${instructor.id}`;
        } else {
          ratingElem.className += ' no-underline';
        }
        ratingElem.title = instructorName;
        ratingElem.target = '_blank';
        ratingElem.innerText = rating ? rating.toFixed(2) : 'N/A';
        elem.appendChild(ratingElem);
      }
    });
  });
}

async function loadPTData() {
  const courseIdElements = Array.from(document.querySelectorAll('.course-id'));

  let numLoaded = 0;

  function tryUpdateUI() {
    updatePTData();
    sortBtn.textContent = `Sort By Average GPA Descending (Loading ${numLoaded}/${courseIdElements.length})`;

    if (numLoaded === courseIdElements.length) {
      sortBtn.textContent = 'Sort By Average GPA Descending';
      sortBtn.disabled = false;
    }
  }

  await Promise.allSettled(
    courseIdElements.map(async (elem) => {
      const courseId = elem.innerText;
      if (!DATA.pt[courseId]) {
        DATA.pt[courseId] = {
          courseId,
        };
        const courseData = await getPTCourseData(courseId);
        DATA.pt[courseId] = courseData;
        numLoaded += 1;
        tryUpdateUI();
      }
    })
  );
}

preDOMMain();
window.addEventListener
  ? window.addEventListener('load', postDOMMain, false)
  : window.attachEvent && window.attachEvent('onload', postDOMMain);
