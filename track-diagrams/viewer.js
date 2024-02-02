const COLOUR_MAP = {
    "G": "green",
    "g": "green small",
    "Y": "yellow",
    "y": "yellow small",
    "R": "red",
    "r": "red small",
    "_": "blank",
}
function renderLamps(str) {
    let lamps = []
    for (let char of str) {
        let lamp = document.createElement("div");
        lamp.className = "lamp " + COLOUR_MAP[char];
        lamps.push(lamp);
    }
    return lamps;
}

let nameDisp = null;
let signalDisp = null;
function handleClick(e, object) {
    if (object.type == "signal") {
        nameDisp.textContent = `Signal ${object.id}`;

        signalDisp.dataset.dwarf = !!(object.dwarf);

        // Upper Head
        let upperStr = (
            object.upper_lamps ||
            (object.turnout ? "GYR" : "GR")
        );
        signalDisp.children[0].replaceChildren(
            ...renderLamps(upperStr)
        );

        // Lower Head
        let lowerStr = (
            (object.lower_lamps || "GYR") +
            (object.low_speed ? "g" : "")
        );
        if (object.dwarf && !object.lower_lamps)
            lowerStr = "";
        signalDisp.children[1].replaceChildren(
            ...renderLamps(lowerStr)
        );
        signalDisp.children[1].dataset.offset = !object.absolute;

        // Subsidiary Head
        let subsidStr = object.subsidiary ? "y" : "";
        signalDisp.children[2].replaceChildren(
            ...renderLamps(subsidStr)
        );
    }
}

function parseParams(params) {
    let out = {};
    for (let param of params) {
        let [key, val] = param.split("=");
        out[key] = val || true;
    }
    return out;
}

function render(objects, from, to) {
    let renderArea = document.getElementById("render-area");
    let scale = window.innerWidth / (to - from) * 0.9;
    let trackInfo = {};

    for (let object of objects) {
        let [km, track, type, id, ...params] = object;

        params = parseParams(params);
        if (type === "track") {
            trackInfo[id] = params;
        }

        let element = document.createElement("div");
        element.id = id;
        element.className = type;
        element.style.left = (km - from) * scale + "px";
        element.style.top = trackInfo[track].render_pos + "px";
        element.title = params.label || element.id;

        if (type == "signal" || type == "speed") {
            let offset = trackInfo[track].direction == "up" ? 20 : -20;
            if (params.position == "right") {
                offset *= -1;
            }
            element.style.transform = `translate(0px, ${offset}px)`;
        }

        if (params.style) {
            for (let sName of params.style.split("|"))
                element.classList.add(sName);
        }

        if (type == "track") {
            element.style.width = (params.end - km) * scale + "px";
        } else if (type == "signal") {
        } else if (type == "speed") {

        } else if (type == "points") {
            let horizLen = (params.b_end - km) * scale;
            let vertLen = trackInfo[params.b_track].render_pos - trackInfo[track].render_pos;
            vertLen += vertLen > 0 ? 20 : -20;
            let diagLen = Math.sqrt(horizLen * horizLen + vertLen * vertLen);
            console.log(horizLen, vertLen, diagLen);
            element.style.width = diagLen + "px";

            let angle = Math.atan2(vertLen, diagLen);
            element.style.transform = `rotate(${angle}rad)`;
        }

        element.addEventListener(
            "click", e => handleClick(e, {km, track, type, id, ...params})
        );

        renderArea.appendChild(element);
    }

    renderArea.style.height = "300px";
}

async function getCsv(name) {
    let resp = await fetch(name);
    let text = await resp.text();
    let lines = text.trim().split("\r\n");
    let objects = lines.map(line => line.split(","));
    return objects;
}

window.addEventListener("load", async e => {
    render(await getCsv("banks.csv"), 10.266, 11.625);

    nameDisp = document.getElementById("name-display");
    signalDisp = document.getElementById("signal-display");
})