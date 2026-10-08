let seniorityOrder = [];
let nonExecSeniorityOrder = [];


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


    console.log(
        "Executive seniority loaded:",
        seniorityOrder
    );

    console.log(
        "Non-Executive seniority loaded:",
        nonExecSeniorityOrder
    );
}


function sortBySeniority(list){

    return list.sort((a,b) => {

        let ia =
            seniorityOrder.indexOf(a.trim());

        let ib =
            seniorityOrder.indexOf(b.trim());


        if(ia === -1)
            ia = 999;

        if(ib === -1)
            ib = 999;


        return ia - ib;
    });
}
