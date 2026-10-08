let data = [];
let selectedName = "";
let header = [];
let nonExecData = [];
let nonExecHeader = [];
let isDataLoaded = false;

let seniorityOrder = [];
let nonExecSeniorityOrder = [];


const shiftLabels = {
"A":"A Shift","B":"B Shift","C":"C Shift",
"G":"General","OFF":"Rest / Off / Holiday",
"D":"Day Shift","N":"Night Shift",
"L":"Leave","T":"Training / Tour"
};

function updateHeaderDate(){

    let dateElem = document.getElementById("todayDate");
    if(!dateElem) return;

    let now = new Date();

    dateElem.innerText = now.toDateString();

    if(isSpecialDay()){
        dateElem.style.color = "#ffd600";
        dateElem.style.fontWeight = "600";
    } else {
        dateElem.style.color = "";
        dateElem.style.fontWeight = "";
    }
}

function loadSeniority(execText, nonExecText){

    if(execText && execText.trim()){
        seniorityOrder = execText
            .split(/\r?\n/)
            .slice(1)
            .map(x => x.trim())
            .filter(Boolean);
    }

    if(nonExecText && nonExecText.trim()){
        nonExecSeniorityOrder = nonExecText
            .split(/\r?\n/)
            .slice(1)
            .map(x => x.trim())
            .filter(Boolean);
    }

    console.log("Executive seniority loaded:", seniorityOrder);
    console.log("Non-Executive seniority loaded:", nonExecSeniorityOrder);
}

function sortBySeniority(list){
    return list.sort((a,b)=>{
        let ia = seniorityOrder.indexOf(a.trim());
        let ib = seniorityOrder.indexOf(b.trim());
        if(ia === -1) ia = 999;
        if(ib === -1) ib = 999;
        return ia - ib;
    });
}


updateShiftUrls();

Promise.all([
  fetch(shiftUrl).then(r=>r.text()),
  fetchCSV(shiftUrlNext, true),
  fetchCSV(holidayUrl, true),
  fetch(notesUrl).then(r=>r.text()),
  fetch(trainingUrl).then(r=>r.text()),
  fetch(productionPlanUrl).then(r=>r.text()),
  fetch(productionTargetUrl).then(r=>r.text()),
  fetch(nonExecUrl).then(r=>r.text()),
  fetch(nonExecUrlNext).then(r=>r.text()),
  fetch(seniorityExecUrl).then(r=>r.text()),
  fetch(seniorityNonExecUrl).then(r=>r.text())
]).then(([
    shiftTextCurrent,
    shiftTextNext,
    holidayText,
    notesText,
    trainingText,
    productionPlanText,
    productionTargetText,
    nonExecTextCurrent,
    nonExecTextNext,
    seniorityExecText,
    seniorityNonExecText
]) => {

if(!shiftTextCurrent || shiftTextCurrent.trim() === ""){
    document.getElementById("today").innerHTML =
    "<div style='color:red;font-weight:bold;'>SHIFT DATA NOT LOADED</div>";
    return;
}

if(!holidayText) holidayText = "";
if(!notesText) notesText = "";
if(!trainingText) trainingText = "";
if(!productionPlanText) productionPlanText = "";
if(!productionTargetText) productionTargetText = "";
if(!nonExecTextCurrent) nonExecTextCurrent = "";
if(!nonExecTextNext) nonExecTextNext = "";
if(!seniorityExecText) seniorityExecText = "";
if(!seniorityNonExecText) seniorityNonExecText = "";

loadSeniority(seniorityExecText, seniorityNonExecText);

const dataCurrent = parseCSV(shiftTextCurrent);
const dataNext = parseCSV(shiftTextNext);

data = mergeShiftData(dataCurrent, dataNext);

header = data[0].map(x => x.trim());

if(!nonExecTextCurrent) nonExecTextCurrent = "";
if(!nonExecTextNext) nonExecTextNext = "";

const nonExecCurrent = parseCSV(nonExecTextCurrent);
const nonExecNext = parseCSV(nonExecTextNext);

nonExecData = mergeShiftData(nonExecCurrent, nonExecNext);

nonExecHeader = nonExecData[0]?.map(x => x.trim()) || [];

if(!header || header.length < 2){
    console.warn("Shift CSV not available for current period");
    data = [];
    header = [];
}

selectedName = "";

loadHolidayData(holidayText);

loadTrainingData(trainingText);

loadNotesData(notesText);

loadProductionData(
    productionPlanText,
    productionTargetText
);

init();

loadAlerts();

isDataLoaded = true;
updateLastUpdated();

})

.catch(err => {
    console.error("Data load failed:", err);
    document.getElementById("today").innerHTML = 
    "<div style='color:red;font-weight:bold;'>Data load failed (Offline)</div>";
});

function formatDate(d){
return ("0"+d.getDate()).slice(-2)+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+d.getFullYear();
}


function updateLastUpdated(){
    let now = new Date();

    let time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let date = now.toLocaleDateString([], { day: '2-digit', month: 'short' });

    document.getElementById("lastUpdated").innerText =
        "Last Sync: " + date + " • " + time;
}

function getCurrentShiftInfo() {
    let now = new Date();

    let hours = now.getHours();
    let minutes = now.getMinutes();

    let currentDate = formatDate(now);

    // previous date
    let prev = new Date(now);
    prev.setDate(prev.getDate() - 1);
    let prevDate = formatDate(prev);

    // A Shift: 06:00–14:00
    if(hours >= 6 && hours < 14){
        return { shift: "A", date: currentDate };
    }

    // B Shift: 14:00–22:00
    if(hours >= 14 && hours < 22){
        return { shift: "B", date: currentDate };
    }

    // C Shift split logic
    if(hours >= 22){
        // same day C
        return { shift: "C", date: currentDate };
    }

    if(hours < 6){
        // 🔴 IMPORTANT: after midnight → previous date C shift
        return { shift: "C", date: prevDate };
    }

    return null;
}

function updatePresentShiftIncharge(){

    const current = getCurrentShiftInfo();

    const element =
        document.getElementById("presentShiftIncharge");

    if(!element){
        return;
    }

    if(!current){
        element.innerText = "—";
        return;
    }

    const shifts = getData(current.date);

    const list = shifts[current.shift] || [];

    if(!list.length){
        element.innerText = "—";
        return;
    }

    const firstExecutive = sortBySeniority(
        list.map(x => x.name)
    )[0];

    element.innerText = firstExecutive || "—";
}

function initTheme(){

    let toggle = document.getElementById("toggleCheckbox");
    if(!toggle) return;
    let savedTheme = localStorage.getItem("theme");

    // Load saved theme
    if(savedTheme === "dark"){
        document.body.classList.add("dark");
        toggle.checked = true;
    }

    // Toggle event
    toggle.addEventListener("change", function(){

        if(this.checked){
            document.body.classList.add("dark");
            localStorage.setItem("theme","dark");
        } else {
            document.body.classList.remove("dark");
            localStorage.setItem("theme","light");
        }

    });
}

function init(){ 

    initTheme(); 

    document.getElementById("today").innerHTML = "Loading..."; 

    updateHeaderDate();

    let savedCategory = localStorage.getItem("selectedCategory"); 
    if(savedCategory){ 
        document.getElementById("categorySelector").value = savedCategory; 
    } 

    populateNames();

    setTimeout(() => {
        let savedName = localStorage.getItem("ppu_name");
        if(savedName){
            selectedName = savedName;
            document.getElementById("nameSelector").value = savedName;
    }
    
    refresh();
    renderNext7Days();

}, 0);

    document.getElementById("todayNote").innerHTML = getTodayNote(); 

    updateHeaderDate();    

    renderAlerts();
    updateTrainingHeader(); 
    renderTraining();

    calcHoliday(); 
    refresh(); 
}

function getFirstName(fullName){
    if(!fullName) return "";
    return fullName.trim().split(/\s+/)[0];
}

function populateNames(){

let sel=document.getElementById("nameSelector");
let category = document.getElementById("categorySelector")?.value;
if(!category) return;

let names=[];

if(category === "exec"){
    for(let i=1;i<data.length;i++){
        let n=data[i][0]?.trim();
        if(n) names.push(n);
    }
    names = sortBySeniority(names);
}else{
    for(let i=1;i<nonExecData.length;i++){
        let n=nonExecData[i][0]?.trim();
        if(n) names.push(n);
    }
    names = names.sort((a,b)=>{
        let ia = nonExecSeniorityOrder.indexOf(a);
        let ib = nonExecSeniorityOrder.indexOf(b);
        if(ia === -1) ia = 999;
        if(ib === -1) ib = 999;
        return ia - ib;
    });
}

sel.innerHTML = "";
sel.add(new Option("Select Name",""));

names.forEach(n => sel.add(new Option(getFirstName(n), n)));
}

function refresh(){
    let calendarToday = formatDate(new Date());

    const currentShiftInfo = getCurrentShiftInfo();
    let today = currentShiftInfo ? currentShiftInfo.date : calendarToday;

    let shift = selectedName ? (getShift(today, selectedName) || "-") : "Select Name";

    const [day, month, year] = today.split("-");
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    document.getElementById("todayTitle").innerText =
    `Today's Shift (${monthNames[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year})`;

let badge = document.getElementById("todayShiftBadge");

/* TEXT */
if(!selectedName){
    badge.innerText = "Select a name to view shift";
}else{
    badge.innerText = "Today's Shift: " + shift;
}

/* RESET CLASS */
badge.className = "badge";

/* APPLY COLOR */
if(shift && shift !== "-" && shift !== "Select Name"){

    let primary;

    if(shift.includes("C")) primary = "C";
    else if(shift.includes("B")) primary = "B";
    else if(shift.includes("A")) primary = "A";
    else primary = shift;

    if(primary === "O") primary = "OFF";

    badge.classList.add(primary);
}

render("today", today);

updatePresentShiftIncharge();

renderProductionPlan();
}

function getShift(date,name){

    let category =
        document.getElementById("categorySelector")?.value;

    if(!category || !date || !name){
        return null;
    }

    let localData =
        (category === "exec") ? data : nonExecData;

    let localHeader =
        (category === "exec") ? header : nonExecHeader;

    if(!localData || !localData.length){
        return null;
    }

    if(!localHeader || !localHeader.length){
        return null;
    }

    let col = localHeader.indexOf(date);

    if(col === -1){
        return null;
    }

    for(let i = 1; i < localData.length; i++){

        let row = localData[i];

        if(!row || !row.length){
            continue;
        }

        let rowName = row[0]?.trim();

        if(rowName === name){

            return row[col]?.trim() || null;
        }
    }

    return null;
}

function parseShift(shift){

    if(!shift) return [];

    shift = shift.trim();

    // Keep OFF as single unit
    if(shift === "OFF") return ["OFF"];

    // Split A, B, C, etc.
    return shift.match(/[A-Z]/g) || [];
}

function getData(date){
    let col = header.indexOf(date);
    if(col === -1) return {};
    let shifts={};

for(let i=1;i<data.length;i++){

    let name=data[i][0]?.trim();
    let shift=data[i][col]?.trim();
    if(!shift) continue;

    if(shift==="OFF"){
    if(!shifts["OFF"]) shifts["OFF"]=[];
    shifts["OFF"].push({name:name,multi:false});
    continue;
}

let isMulti = (shift !== "OFF" && shift.length > 1);

    parseShift(shift).forEach(s=>{
    if(!shifts[s]) shifts[s]=[];
    shifts[s].push({name:name,multi:isMulti});
    });
}
return shifts;
}

function getNonExecData(date){

    let col = nonExecHeader.indexOf(date);
    if(col === -1) return {};

    let shifts={};

    for(let i=1;i<nonExecData.length;i++){

        let name=nonExecData[i][0]?.trim();
        let shift=nonExecData[i][col]?.trim();
        if(!shift) continue;

        if(shift === "OFF"){
            if(!shifts["OFF"]) shifts["OFF"] = [];
            shifts["OFF"].push({name:name,multi:false});
            continue;
        }

        let isMulti = (shift !== "OFF" && shift.length > 1);

        parseShift(shift).forEach(s=>{
            if(!shifts[s]) shifts[s]=[];
            shifts[s].push({name:name,multi:isMulti});
        });
    }

    return shifts;
}

function render(id,date){

    console.log("Render called for:", id, date);
    let box=document.getElementById(id);
    box.innerHTML="";

let shifts = (header.indexOf(date) === -1) ? {} : getData(date);

if(Object.keys(shifts).length === 0){

    let msg = (id === "today")
        ? "Shift schedule is not available for today"
        : "Shift schedule is not available for selected date";

    box.innerHTML += `<div style="color:#777;font-weight:bold; margin-bottom:10px;">
    ${msg}
    </div>`;
}

let hasExec = Object.values(shifts).some(arr => arr.length > 0);

if(hasExec){
    box.innerHTML += `<div class="section-header exec-header">Executive</div>`;
}

/* MAIN */
["A","B","C","G","OFF","L","T"].forEach(s=>{

let list=shifts[s]||[];
if(list.length === 0) return;

list = sortBySeniority(list.map(x=>x.name))
       .map(n => list.find(x=>x.name===n));

let alert=(["A","B","C"].includes(s)&&list.length<=2)?" ❗":"";

let chips=list.map(obj=>{
let sel=(selectedName && obj.name===selectedName)?"selected":"";
let multi=obj.multi?" ❕":"";
let active = "";
let current = getCurrentShiftInfo();

if(current && s === current.shift && date === current.date){
    active = "active-shift";
}

return `<span class="chip ${s} ${sel} ${active}">${getFirstName(obj.name)}${multi}</span>`;
}).join("");

let activeClass = "";
let current = getCurrentShiftInfo();

if(current && s === current.shift && date === current.date){
    activeClass = "shift-active-box";
}

box.innerHTML += `
<div class="${activeClass}">
    <div class="shift-title">${shiftLabels[s]} (${list.length})${alert}</div>
    ${chips || "-"}
</div>`;
});

/* D N */
["D","N"].forEach(s=>{

let list=shifts[s]||[];
if(list.length===0) return;

list = sortBySeniority(list.map(x=>x.name))
       .map(n => list.find(x=>x.name===n));

let chips=list.map(obj=>{
let sel=(selectedName && obj.name===selectedName)?"selected":"";
let multi=obj.multi?" ❕":"";
let active = "";
let current = getCurrentShiftInfo();

if(current && s === current.shift && date === current.date){
    active = "active-shift";
}

return `<span class="chip ${s} ${sel} ${active}">${getFirstName(obj.name)}${multi}</span>`;
}).join("");

box.innerHTML+=`<div class="shift-title">${shiftLabels[s]} (${list.length})</div>${chips}`;
});

// ================= NON-EXEC (FIXED - SINGLE RENDER) =================

let nonExecShifts = (nonExecHeader.indexOf(date) === -1) ? {} : getNonExecData(date);

let hasNonExec = Object.values(nonExecShifts).some(arr => arr.length > 0);

if(hasNonExec){

    box.innerHTML += `<hr><div class="section-header nonexec-header">Non-Executive</div>`;

    ["A","B","C","G","OFF","L","T","D","N"].forEach(s=>{

        let list = nonExecShifts[s] || [];
        if(list.length === 0) return;

        list = list.sort((a,b)=>{
            let ia = nonExecSeniorityOrder.indexOf(a.name);
            let ib = nonExecSeniorityOrder.indexOf(b.name);
            if(ia === -1) ia = 999;
            if(ib === -1) ib = 999;
            return ia - ib;
        });

        let alert = (["A","B","C"].includes(s) && list.length <= 2) ? " ❗" : "";
        let chips = list.map(obj=>{
            let sel=(selectedName && obj.name===selectedName)?"selected":"";
            let multi=obj.multi?" ❕":"";
            return `<span class="chip ${s} ${sel}">${getFirstName(obj.name)}${multi}</span>`;
        }).join("");

        let activeClass = "";
let current = getCurrentShiftInfo();

if(current && s === current.shift && date === current.date){
    activeClass = "shift-active-box";
}

box.innerHTML += `
<div class="${activeClass}">
    <div class="shift-title">${shiftLabels[s]} (${list.length})${alert}</div>
    ${chips}
</div>`;
    });
}
}
function renderSelected(){
    let val=document.getElementById("datePicker").value;
    if(!val) return;

    let d=new Date(val);
    let formatted = d.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric"
    });

let renderDate = formatDate(d);

document.getElementById("selectedTitle").innerText =
"Selected Date Shift ("+formatted+")";

render("selected",renderDate);
}

function renderNext7Days(){ 
 
        let box = document.getElementById("next7Days"); 
        if(!box) return; 
 
        if(!header || header.length === 0 || !data || data.length === 0){
            box.innerHTML = "<div style='color:#777;font-weight:bold;'>Shift schedule is not available</div>";
            return;
        }

        if(!selectedName){ 
            box.innerHTML = "<div style='color:#777;'>Select name to view upcoming shifts</div>"; 
            return; 
        } 
        let today = new Date();
        let html = "";

        for(let i=0;i<7;i++){

        let d = new Date(today);
        d.setDate(today.getDate() + i);
        let dayNames = ["S","M","T","W","T","F","S"];
        let dayLabel = dayNames[d.getDay()];

        let dd = String(d.getDate()).padStart(2,'0');
        let mm = String(d.getMonth()+1).padStart(2,'0');
        let yyyy = d.getFullYear();

        let dateStr = `${dd}-${mm}-${yyyy}`;

        let rawShift = getShift(dateStr, selectedName) || "-";

        let shiftClass;
        if(rawShift === "-"){
            shiftClass = "NA";
        } else if(rawShift === "OFF"){
            shiftClass = "OFF";
        } else {
            shiftClass = rawShift.match(/[A-Z]/)?.[0] || "";
        }

        let shiftText = rawShift;

        html += ` 
        <div class="day-card">
            <div class="day-name">${dayLabel}</div> 
            <div class="day-date">${dd}</div> 
            <div class="day-shift ${shiftClass}"> 
                ${shiftText} 
            </div> 
        </div> 
        `;
    }

    box.innerHTML = html;
}

function onNameChange(){
    selectedName=document.getElementById("nameSelector").value;
    localStorage.setItem("ppu_name",selectedName);
    refresh();
    if(document.getElementById("datePicker").value){
    renderSelected();
}
renderNext7Days();
}

function onCategoryChange(){

    let category = document.getElementById("categorySelector").value;
    localStorage.setItem("selectedCategory", category);

    selectedName = "";

    localStorage.removeItem("ppu_name");

    document.getElementById("nameSelector").innerHTML = '<option value="">Select Name</option>';

    document.getElementById("today").innerHTML = "";
    document.getElementById("selected").innerHTML = "";

    populateNames();

    refresh();
    renderNext7Days();
}

function autoRefreshData(){

    console.log("🔄 Auto refresh triggered");

    updateShiftUrls();

    Promise.all([
        fetchCSV(shiftUrl),
        fetchCSV(shiftUrlNext, true),
        fetchCSV(holidayUrl, true),
        fetchCSV(notesUrl, true),
        fetchCSV(trainingUrl, true),
        fetchCSV(productionPlanUrl, true),
        fetchCSV(productionTargetUrl, true),
        fetchCSV(nonExecUrl),
        fetchCSV(nonExecUrlNext, true),
        fetchCSV(seniorityExecUrl, true),
        fetchCSV(seniorityNonExecUrl, true),
        fetchCSV(alertsUrl, true)
    ])

    .then(([
        shiftTextCurrent,
        shiftTextNext,
        holidayText,
        notesText,
        trainingText,
        productionPlanText,
        productionTargetText,
        nonExecTextCurrent,
        nonExecTextNext,
        seniorityExecText,
        seniorityNonExecText,
        alertsText
    ]) => {

        updateHeaderDate();

        loadSeniority(
            seniorityExecText,
            seniorityNonExecText
        );

/* =========================
   ALERT DATA
   ========================= */

if(alertsText !== undefined){

    alertsData = parseCSV(alertsText)
        .slice(1)
        .map(row => {

            return {
                from: row[0]?.trim(),
                to: row[1]?.trim(),
                repeat: row[2]?.trim(),
                text: row[3]?.trim()
            };

        })
        .filter(r =>
            r.from &&
            r.to &&
            r.repeat &&
            r.text
        );

}


        /* =========================
           EXECUTIVE DATA
           ========================= */

        const dataCurrent = parseCSV(shiftTextCurrent);
        const dataNext = parseCSV(shiftTextNext);

        data = mergeShiftData(dataCurrent, dataNext);

        header = data[0]?.map(x => x.trim()) || [];



        loadHolidayData(holidayText);

        loadTrainingData(trainingText);


loadProductionData(
    productionPlanText,
    productionTargetText
);


        loadNotesData(notesText);


        /* =========================
           NON-EXECUTIVE DATA
           ========================= */

        const nonExecCurrent = parseCSV(nonExecTextCurrent);
        const nonExecNext = parseCSV(nonExecTextNext);

        nonExecData = mergeShiftData(
            nonExecCurrent,
            nonExecNext
        );

        nonExecHeader =
            nonExecData[0]?.map(x => x.trim()) || [];


        /* =========================
           REFRESH DISPLAY
           ========================= */

        document.getElementById("todayNote").innerHTML =
            getTodayNote();

        let alertBox =
            document.getElementById("alertSection");

        renderAlerts();
        updateTrainingHeader();
        renderTraining();

        refresh();
        renderNext7Days();

        if(document.getElementById("datePicker").value){
            renderSelected();
        }

        calcHoliday();

        console.log("✅ Data refreshed successfully");

    })

    .catch(err => {

        console.error("Auto refresh failed:", err);

        const status = document.getElementById("todayNote");

        if(status){
        status.innerText = "";
        }

    });
}


if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js?v=1')
    .then(() => console.log("Service Worker Registered"));
}

// ⏱ Auto refresh every 2 minutes
setInterval(() => {
    if(isDataLoaded) autoRefreshData();
}, 120000);

document.addEventListener("visibilitychange", function(){
    if(document.visibilityState === "visible" && isDataLoaded){
        autoRefreshData();
    }
});
