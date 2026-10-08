function parseCSV(text){

    if(!text) return [];

    return text
        .split(/\r?\n/)
        .filter(row => row.trim() !== "")
        .map(row => {

            const result = [];
            let current = "";
            let insideQuotes = false;

            for(let i = 0; i < row.length; i++){

                const char = row[i];

                if(char === '"'){
                    insideQuotes = !insideQuotes;
                    continue;
                }

                if((char === "," || char === ";") && !insideQuotes){
                    result.push(current.trim());
                    current = "";
                }else{
                    current += char;
                }
            }

            result.push(current.trim());

            return result;
        });
}

function mergeShiftData(current, next) {

    if(!current || !current.length){
        return next && next.length ? next : [];
    }

    if(!next || !next.length){
        return current;
    }

    const merged = [];

    merged.push([
        ...current[0],
        ...next[0].slice(1)
    ]);

    const currentNames = new Set();

    for(let i = 1; i < current.length; i++){

        const currentRow = current[i] || [];
        const name = currentRow[0]?.trim();

        if(!name){
            continue;
        }

        currentNames.add(name);

        const nextRow = next.find(row =>
            row?.[0]?.trim() === name
        ) || [];

        merged.push([
            ...currentRow,
            ...nextRow.slice(1)
        ]);
    }

    for(let i = 1; i < next.length; i++){

        const nextRow = next[i] || [];
        const name = nextRow[0]?.trim();

        if(!name){
            continue;
        }

        // Skip employees already added
        if(currentNames.has(name)){
            continue;
        }

        const blankCurrentColumns =
            new Array(current[0].length).fill("");

        blankCurrentColumns[0] = name;

        merged.push([
            ...blankCurrentColumns,
            ...nextRow.slice(1)
        ]);
    }

    return merged;
}

function fetchCSV(url, optional = false){

    return fetch(url, { cache: "no-store" })
        .then(response => {

            if(!response.ok){
                throw new Error("CSV not found: " + url);
            }

            return response.text();
        })
        .catch(err => {

            console.warn("CSV load failed:", url, err);

            if(optional){
                return "";
            }

            throw err;
        });
}
