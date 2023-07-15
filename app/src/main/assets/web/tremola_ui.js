// tremola_ui.js

"use strict";

let overlayIsActive = false;

let display_or_not = [
    'div:qr', 'div:back',
    'core', 'lst:chats', 'lst:posts', 'lst:contacts', 'lst:members', 'the:connex', 'eventList',
    'div:footer', 'div:textarea', 'div:confirm-members', 'plus',
    'div:settings'
];

let prev_scenario = 'chats';
let curr_scenario = 'chats';

// Array of the scenarios that have a button in the footer
const main_scenarios = ['chats', 'contacts', 'connex', 'scheduling'];

const buttonList = ['btn:chats', 'btn:posts', 'btn:contacts', 'btn:connex', 'btn:scheduling'];

/**
 * The elements contained by each scenario.
 * It is assumed that each scenario containing 'div:footer' has a
 * corresponding button in tremola.html#div:footer
 */
let scenarioDisplay = {
    'chats': ['div:qr', 'core', 'lst:chats', 'div:footer', 'plus'],
    'contacts': ['div:qr', 'core', 'lst:contacts', 'div:footer', 'plus'],
    'posts': ['div:back', 'core', 'lst:posts', 'div:textarea'],
    'connex': ['div:qr', 'core', 'the:connex', 'div:footer', 'plus'],
    'scheduling': ['div:qr', 'core', 'eventList', 'div:footer', 'plus'],
    'members': ['div:back', 'core', 'lst:members', 'div:confirm-members'],
    'settings': ['div:back', 'div:settings']
}

let scenarioMenu = {
    'chats': [['New conversation', 'menu_new_conversation'],
        ['Settings', 'menu_settings'],
        ['About', 'menu_about']],
    'contacts': [['New contact', 'menu_new_contact'],
        ['Settings', 'menu_settings'],
        ['About', 'menu_about']],
    'connex': [['New SSB pub', 'menu_new_pub'],
        ['Redeem invite code', 'menu_invite'],
        ['Settings', 'menu_settings'],
        ['About', 'menu_about']],
    'scheduling': [['New Event', 'menu_new_scheduling'],
            ['Delete All (locally)', 'delete_all_Events'],
            ['Settings', 'menu_settings'],
            ['About', 'menu_about']],
    'posts': [['Rename', 'menu_edit_convname'],
        ['(un)Forget', 'menu_forget_conv'],
        ['Settings', 'menu_settings'],
        ['About', 'menu_about']],
    'members': [['Settings', 'menu_settings'],
        ['About', 'menu_about']],

    'settings': []
}

function onBackPressed() {
    if (overlayIsActive) {
        closeOverlay();
        return;
    }
    if (main_scenarios.indexOf(curr_scenario) >= 0) {
        if (curr_scenario === 'chats')
            backend("onBackPressed");
        else
            setScenario('chats')
    } else {
        if (curr_scenario === 'settings') {
            document.getElementById('div:settings').style.display = 'none';
            document.getElementById('core').style.display = null;
            document.getElementById('div:footer').style.display = null;
        }
        setScenario(prev_scenario);
    }
}

function setScenario(new_scenario) {
    // console.log('setScenario ' + new_scenario)
    let list_of_elements = scenarioDisplay[new_scenario];
    if (list_of_elements) {
        // if (new_scenario != 'posts' && curr_scenario != "members" && curr_scenario != 'posts') {

        // Activate and deactivate the buttons in the footer
        if (scenarioDisplay[curr_scenario].indexOf('div:footer') >= 0) {
            let cl = document.getElementById('btn:' + curr_scenario).classList;
            cl.toggle('active', false);
            cl.toggle('passive', true);
        }
        // Cycle throw the list of elements and check against the list in
        // scenarioDisplay to display it or not
        display_or_not.forEach(function (gui_element) {
            var element = document.getElementById(gui_element);
            if (element) {
                if (list_of_elements.indexOf(gui_element) < 0) {
                    element.style.display = 'none';
                } else {
                    element.style.display = null;
                }
            }
        });

        // Display the red TREMOLA title or another one
        if (new_scenario === "posts" || new_scenario === "settings") {
            document.getElementById('tremolaTitle').style.display = 'none';
            document.getElementById('conversationTitle').style.display = null;
        } else {
            document.getElementById('tremolaTitle').style.display = null;
            document.getElementById('conversationTitle').style.display = 'none';
        }
        if (main_scenarios.indexOf(new_scenario) >= 0) {
            prev_scenario = new_scenario;
        }
        curr_scenario = new_scenario;
        if (scenarioDisplay[curr_scenario].indexOf('div:footer') >= 0) {
            var cl = document.getElementById('btn:' + curr_scenario).classList;
            cl.toggle('active', true);
            cl.toggle('passive', false);
        }
    }
}


function btnBridge(element) {
    element = element.id;
    let menu = '';
    if (buttonList.indexOf(element) >= 0) {
        setScenario(element.substring(4));
    }
    if (element === 'btn:menu') {
        if (scenarioMenu[curr_scenario].length === 0)
            return;
        document.getElementById("menu").style.display = 'initial';
        document.getElementById("overlay-trans").style.display = 'initial';
        scenarioMenu[curr_scenario].forEach(function (e) {
            menu += "<button class=menu_item_button ";
            menu += "onclick='" + e[1] + "();'>" + e[0] + "</button><br>";
            console.log(`Scenario menu: ${menu}`);
        })
        menu = menu.substring(0, menu.length - 4);
        document.getElementById("menu").innerHTML = menu;

    }
    // if (typeof Android != "undefined") { Android.onFrontendRequest(element); }
}

function menu_settings() {
    closeOverlay();
    setScenario('settings')
    /*
    prev_scenario = curr_scenario;
    curr_scenario = 'settings';
    document.getElementById('core').style.display = 'none';
    document.getElementById('div:footer').style.display = 'none';
    document.getElementById('div:settings').style.display = null;

    document.getElementById("tremolaTitle").style.display = 'none';
    */
    var c = document.getElementById("conversationTitle");
    c.style.display = null;
    c.innerHTML = "<div style='text-align: center;'><font size=+1><strong>Settings</strong></font></div>";
}

function new_ui_scheduling(){
    setScenario('scheduling');
    backend('new_menu_scheduling hello!');
    defaultEventGUI();
    backend("loadAllEvents");
    // Add this line in an appropriate location
}

function createNewEvent() {
  // validate the form
  if (!validateForm()) {
    return; // stop here if the form is invalid
  }

  var eventNameInput = document.getElementById("eventName");
  var eventName = eventNameInput.value.replace(/\s+/g, "*_"); // Replace spaces with underscores (_)

  console.log(eventName);

  const selectedTime = document.querySelector('#timeTable td.selected');
  if (selectedTime) {
    console.log(`The selected time is ${selectedTime.innerText}`);
    selectedTime.classList.remove('selected'); // Deselect the time
  }

  // Get current date
  var currentDate = new Date();
  var day = currentDate.getDate();
  var month = currentDate.toLocaleString('default', { month: 'long' }); // Get the full month name as a string
  var year = currentDate.getFullYear();
  var date = day + "." + month + "." + year;

  // Get description
  var descriptionInput = document.getElementById("description");
  var description = descriptionInput.value.replace(/\s+/g, "*_"); // Replace spaces with underscores (_)

  backend("add:event " + eventName + " " + selectedTime.innerText + " " + date + " " + description);

  console.log(`The selected date is ${day}-${month}-${year}`);

  eventNameInput.value = ''; // Clear the input field

  // Clear selected date
  document.getElementById('day').value = day;
  document.getElementById('month').value = month;
  document.getElementById('year').value = year;

  closeOverlay();
}

function closeOverlay() {
    document.getElementById('event-clicked').style.display = 'none';
    document.getElementById('scd-overlay').style.display = 'none';
    document.getElementById('overlay-bg').style.display = 'none';
    document.getElementById('menu').style.display = 'none';
    document.getElementById('qr-overlay').style.display = 'none';
    document.getElementById('preview-overlay').style.display = 'none';
    document.getElementById('new_chat-overlay').style.display = 'none';
    document.getElementById('new_contact-overlay').style.display = 'none';
    document.getElementById('confirm_contact-overlay').style.display = 'none';
    document.getElementById('overlay-bg').style.display = 'none';
    document.getElementById('overlay-trans').style.display = 'none';
    document.getElementById('about-overlay').style.display = 'none';
    document.getElementById('edit-overlay').style.display = 'none';
    document.getElementById('old_contact-overlay').style.display = 'none';
    overlayIsActive = false;
}

function showPreview() {
    var draft = escapeHTML(document.getElementById('draft').value);
    if (draft.length === 0) return;
    if (!getSetting("enable_preview")) {
        new_post(draft);
        return;
    }
    var draft2 = draft.replace(/\n/g, "<br>\n");
    var to = recps2display(tremola.chats[curr_chat].members)
    document.getElementById('preview').innerHTML = "To: " + to + "<hr>" + draft2 + "&nbsp;<hr>";
    var s = document.getElementById('preview-overlay').style;
    s.display = 'initial';
    s.height = '80%'; // 0.8 * docHeight;
    document.getElementById('overlay-bg').style.display = 'initial';
    overlayIsActive = true;
}

function menu_about() {
    closeOverlay()
    document.getElementById('about-overlay').style.display = 'initial';
    document.getElementById('overlay-bg').style.display = 'initial';
    overlayIsActive = true;
}

function plus_button() {
    closeOverlay();
    if (curr_scenario === 'chats') {
        menu_new_conversation();
    } else if (curr_scenario === 'contacts') {
        menu_new_contact();
    } else if (curr_scenario === 'connex') {
        menu_new_pub();
    } else if (curr_scenario === 'scheduling') {
        menu_new_scheduling();
    }
}

function launch_snackbar(txt) {
    var sb = document.getElementById("snackbar");
    sb.innerHTML = txt;
    sb.className = "show";
    setTimeout(function () {
        sb.className = sb.className.replace("show", "");
    }, 3000);
}

// --- QR display and scan

function showQR() {
    generateQR('did:ssb:ed25519:' + myId.substring(1).split('.')[0])
}

function generateQR(s) {
    document.getElementById('qr-overlay').style.display = 'initial';
    document.getElementById('overlay-bg').style.display = 'initial';
    document.getElementById('qr-text').innerHTML = s;
    if (!qr) {
        var w, e, arg;
        w = window.getComputedStyle(document.getElementById('qr-overlay')).width;
        w = parseInt(w, 10);
        e = document.getElementById('qr-code');
        arg = {
            height: w,
            width: w,
            text: s,
            correctLevel: QRCode.CorrectLevel.M // L, M, Q, H
        };
        qr = new QRCode(e, arg);
    } else {
        qr.clear();
        qr.makeCode(s);
    }
    overlayIsActive = true;
}

function qr_scan_start() {
    // test if Android is defined ...
    backend("qrscan.init");
    closeOverlay();
}

function qr_scan_success(s) {
    closeOverlay();
    var t = "did:ssb:ed25519:";
    if (s.substring(0, t.length) === t) {
        s = '@' + s.substring(t.length) + '.ed25519';
    }
    var b = '';
    try {
        b = atob(s.substr(1, s.length - 9));
        // FIXME we should also test whether it is a valid ed25519 public key ...
    } catch (err) {
    }
    if (b.length !== 32) {
        launch_snackbar("unknown format or invalid identity");
        return;
    }
    new_contact_id = s;
    // console.log("tremola:", tremola)
    if (new_contact_id in tremola.contacts) {
        launch_snackbar("This contact already exists");
        return;
    }
    // FIXME: do sanity tests
    menu_edit('new_contact_alias', "Assign alias to new contact:<br>(only you can see this alias)", "");
}

function qr_scan_failure() {
    launch_snackbar("QR scan failed")
}

function qr_scan_confirmed() {
    var a = document.getElementById('alias_text').value;
    var s = document.getElementById('alias_id').innerHTML;
    // c = {alias: a, id: s};
    var i = (a + "?").substring(0, 1).toUpperCase()
    var c = {"alias": a, "initial": i, "color": colors[Math.floor(colors.length * Math.random())]};
    tremola.contacts[s] = c;
    persist();
    backend("add:contact " + s + " " + btoa(a))
    load_contact_item([s, c]);
    closeOverlay();
}

/**
 * Check that entered ShortName follows the correct pattern.
 * Upper cases are accepted, and the minus in 6th position is optional.
 * We use z-base32: char '0', 'l', 'v' and '2' are replaced with
 * 'o', '1', 'u' and 'z' for less confusion.
 */
function look_up(shortname) {
    const shortnameLength = 10; // Cannot be coded into the regEx
    console.log(`shortname: ${shortname}`)
    shortname = shortname.toLowerCase()
        .replace(/0/g, "o")
        .replace(/l/g, "1")
        .replace(/v/g, "u")
        .replace(/2/g, "z");

    if (shortname.search("^[a-z1-9]{5}[a-z1-9]{5}$") !== -1)
        shortname = shortname.slice(0, shortnameLength / 2) + '-' + shortname.slice(shortnameLength / 2, shortnameLength)
    if (shortname.search("^[a-z1-9]{5}-[a-z1-9]{5}$") !== -1) {
        closeOverlay()
        backend("look_up " + shortname);
    } else {
        launch_snackbar(`"${shortname}" is not a valid Shortname`)
    }
}

function eventTime(time) {
  // Deselect any previously selected time
  const selectedTime = document.querySelector('#timeTable td.selected');
  if (selectedTime) {
    selectedTime.classList.remove('selected');
  }

  // Select the clicked time
  const timeCells = document.querySelectorAll('#timeTable td');
  timeCells.forEach(function(timeCell) {
    if (timeCell.innerText === time) {
      timeCell.classList.add('selected');
    }
  });
}

function fillDateOptions() {
    // Get today's date
    var today = new Date();

    // Get the date dropdowns
    var dayDropdown = document.getElementById('day');
    var monthDropdown = document.getElementById('month');
    var yearDropdown = document.getElementById('year');

    // Clear current options
    dayDropdown.innerHTML = '';
    monthDropdown.innerHTML = '';
    yearDropdown.innerHTML = '';

    // Define months
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // Fill the day dropdown
    for (var i = 1; i <= 31; i++) {
        var option = document.createElement('option');
        option.text = i;
        dayDropdown.add(option);
    }

    // Fill the month dropdown
    for (var i = 0; i < 12; i++) {
        var option = document.createElement('option');
        option.text = months[i];
        monthDropdown.add(option);
    }

    // Fill the year dropdown
    for (var i = today.getFullYear(); i <= today.getFullYear() + 100; i++) {
        var option = document.createElement('option');
        option.text = i;
        yearDropdown.add(option);
    }

    // Set the default day, month and year to today's date
    dayDropdown.value = today.getDate();  // Note: getDate() returns the day of the month
    monthDropdown.value = months[today.getMonth()];  // Note: getMonth() returns the month index starting at 0
    yearDropdown.value = today.getFullYear();
}

function validateForm() {
  var eventNameInput = document.getElementById("eventName");
  const selectedTime = document.querySelector('#timeTable td.selected');
  var daySelect = document.getElementById("day");
  var monthSelect = document.getElementById("month");
  var yearSelect = document.getElementById("year");

  // Mandatory: Get the description input
  var descriptionInput = document.getElementById("description");

  // validate the inputs
  if (
    !eventNameInput.value.trim() ||
    !selectedTime ||
    !daySelect.value ||
    !monthSelect.value ||
    !yearSelect.value ||
    !descriptionInput.value.trim()
  ) {
    // if any required field is empty or the time is not selected, or the description is empty, show the error message
    document.getElementById("errorMessage").style.display = "block";
    return false;
  }

  // if all fields are valid, hide the error message and return true
  document.getElementById("errorMessage").style.display = "none";
  return true;
}


document.addEventListener("DOMContentLoaded", function() {
    var btn = document.getElementById("minimizeTable");
    var table = document.getElementById("timeTable");

    btn.addEventListener("click", function() {
        if(table.style.display !== "table") {
            table.style.display = "table"; // This makes the table visible
            btn.textContent = "Close Timetable";
        } else {
            table.style.display = "none";
            btn.textContent = "Open Timetable";
        }
    });
    fillDateOptions();
});

// Retrieve the event list container element
const eventListContainer = document.getElementById('eventList');

// ---