// ===============================
// DATE & UPCOMING SHIFT VIEWS
// ===============================

function renderSelected(){

    let val = document.getElementById("datePicker").value;

    if(!val) return;

    let d = new Date(val);

    let formatted = d.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric"
    });

    let renderDate = formatDate(d);

    document.getElementById("selectedTitle").innerText =
        "Selected Date Shift (" + formatted + ")";

    render("selected", renderDate);
}


function renderNext7Days(){

    let box = document.getElementById("next7Days");

    if(!box) return;

    if(!header || header.length === 0 || !data || data.length === 0){

        box.innerHTML =
            "<div style='color:#777;font-weight:bold;'>Shift schedule is not available</div>";

        return;
    }

    if(!selectedName){

        box.innerHTML =
            "<div style='color:#777;'>Select name to view upcoming shifts</div>";

        return;
    }

    let today = new Date();
    let html = "";

    for(let i = 0; i < 7; i++){

        let d = new Date(today);

        d.setDate(today.getDate() + i);

        let dayNames = ["S","M","T","W","T","F","S"];
        let dayLabel = dayNames[d.getDay()];

        let dd = String(d.getDate()).padStart(2,"0");
        let mm = String(d.getMonth() + 1).padStart(2,"0");
        let yyyy = d.getFullYear();

        let dateStr = `${dd}-${mm}-${yyyy}`;

        let rawShift =
            getShift(dateStr, selectedName) || "-";

        let shiftClass;

        if(rawShift === "-"){

            shiftClass = "NA";

        }else if(rawShift === "OFF"){

            shiftClass = "OFF";

        }else{

            shiftClass =
                rawShift.match(/[A-Z]/)?.[0] || "";
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
