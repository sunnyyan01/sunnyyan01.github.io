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
function renderRouteLamps(routes) {
    let route_lamps = [];
    for (let route of routes) {
        let lamp = document.createElement("div");
        if (route === "\\") lamp.className = "left";
        else if (route === "/") lamp.className = "right";
        else lamp.textContent = route;
        route_lamps.push(lamp);
    }
    return route_lamps;
}
function renderFeatherLamps(routes) {
    let lamps = [];
    for (let route of routes) {
        let casing = document.createElement("div");
        casing.className = "casing";
        for (let i = 0; i < 5; i++) {
            let lamp = document.createElement("div");
            lamp.className = "lamp small white";
            casing.appendChild(lamp);
        }
        if (route === "\\")
            casing.classList.add("left");
        else if (route === "/")
            casing.classList.add("right");
        lamps.push(casing);
    }
    return lamps;
}
function renderSignalHead(type, lamps) {
    let head = document.createElement("div");
    head.classList.add("signal-head");
    head.classList.add(type);

    head.replaceChildren(...lamps);

    return head;
}
let signalDisp = null;
function renderSignal(e, object) {
    let isDwarf = object.dwarf || (object.ground && !object.shunt === "triangular");
    signalDisp.dataset.dwarf = isDwarf;
    signalDisp.dataset.ground = object.ground;
    signalDisp.replaceChildren();

    // Route Repeater
    if (object.route_repeater) {
        signalDisp.appendChild(
            renderSignalHead(
                "route-ind",
                renderRouteLamps(object.route_repeater)
            )
        )
    } else if (object.feather_route_repeater) {
        signalDisp.appendChild(
            renderSignalHead(
                "feather-route-ind",
                renderFeatherLamps(object.feather_route_repeater)
            )
        )
    }

    // Route Indicator
    if (object.route_ind) {
        signalDisp.appendChild(
            renderSignalHead(
                "route-ind",
                renderRouteLamps(object.route_ind.split("|"))
            )
        )
    }

    // Upper Head
    let hasUpperAsp = !object.shunt && !object.ground;
    if (hasUpperAsp) {
        let upperStr;
        if (object.upper_lamps) {
            upperStr = object.upper_lamps;
        } else if (object.turnout) {
            upperStr = "GYR";
        } else {
            upperStr = "GR";
        }
        signalDisp.appendChild(
            renderSignalHead("upper", renderLamps(upperStr))
        );
    }

    // Lower Head
    if (!object.shunt) {
        let lowerStr = (
            (object.lower_lamps || "GYR") +
            (object.low_speed ? "g" : "")
        );
        let lowerHead = renderSignalHead("lower", renderLamps(lowerStr));
        if (hasUpperAsp && !object.absolute)
            lowerHead.dataset.offset = "right";
        signalDisp.appendChild(lowerHead);
    }

    // Shunt Route Indicator
    if (object.shunt_route_ind) {
        let routes = object.shunt_route_ind.split("|");
        if (
            (object.shunt === "triangular" || !isDwarf) &&
            routes.length % 2
        ) {
            routes.push("");
        }
        signalDisp.appendChild(
            renderSignalHead("shunt-route-ind", renderRouteLamps(routes))
        )
        
    }

    // Subsidiary Head
    if (object.subsidiary || object.shunt) {
        let subsidStr = "y";
        if (object.shunt) subsidStr = "RYR"
        else if (object.ground) subsidStr = "Y";
        let head = renderSignalHead("subsidiary", renderLamps(subsidStr));
        if (object.shunt === "triangular")
            head.classList.add("triangular");
        if (object.subsidiary !== true)
            head.dataset.offset = object.subsidiary;
        signalDisp.appendChild(head);
    }
}

let speedSignDisplay = null;
let SIGN_TYPES = {
    "newGen": ["square", "yellow"],
    "newMed": ["square", "blue"],
    "newHigh": ["square", "white"],
    "gen": ["arrow", "yellow"],
    "mu": ["arrow", "white"],
    "high": ["arrow", "white"],
    "genX": ["arrow", "yellow", "x"],
    "muX": ["arrow", "white", "x"],
    "highX": ["arrow", "white", "x"],
};
SVG_NS = "http://www.w3.org/2000/svg"
function renderSpeedSign(e, object) {
    let signs = [];
    for (let [type, classes] of Object.entries(SIGN_TYPES)) {
        let speed = object[type];
        if (!speed) continue;

        let width = (speed.length == 2 ? 55 : 77);
        if (type.includes("new"))
            width += 14;
        else
            width += 25 + 7;
        if (type.includes("X")) width += 27;
        if (type.includes("mu")) width += 27;

        let sign = document.createElementNS(SVG_NS, "svg");
        sign.setAttribute("width", width);
        sign.setAttribute("height", 62);

        let bg = document.createElementNS(SVG_NS, "polygon");
        let bgPoints = type.includes("new") ? "0,0 74,0 74,62 0,62" : `0,31 25,0 ${width},0 ${width},62 25,62`;
        bg.setAttribute("points", bgPoints);
        let bgColor = (
            type.includes("gen") ? "#FFDE00" :
            (type.includes("med") ? "#0C4CA1" :
            "white")
        );
        bg.setAttribute("fill", bgColor);
        bg.setAttribute("stroke", "black");
        sign.appendChild(bg);

        let speedText = document.createElementNS(SVG_NS, "text");
        speedText.textContent = (type.includes("X") ? "X" : "") + speed;
        speedText.setAttribute("x", type.includes("new") ? 37 : (width - 32) / 2 + 25);
        speedText.setAttribute("y", 50);
        speedText.setAttribute("font-size", "48px");
        speedText.setAttribute("text-anchor", "middle");

        if (type.includes("mu")) {
            let mu = document.createElementNS(SVG_NS, "tspan");
            mu.textContent = "MU";
            mu.setAttribute("dx", -27);
            mu.setAttribute("dy", -22);
            mu.setAttribute("font-size", "24px");
            mu.style.writingMode = "tb";
            mu.style.textOrientation = "upright";
            speedText.appendChild(mu);
        }

        sign.appendChild(speedText);

        signs.push(sign);
    }
    speedSignDisplay.replaceChildren(...signs);
}

let nameDisp = null;
let infobox = null;
let noteDisplay = null;
function handleClick(e, object) {
    infobox.dataset.section = object.type;

    if (object.type == "signal") {
        nameDisp.textContent = `Signal ${object.id} @ ${object.km}km`;
        renderSignal(e, object);
    } else if (object.type == "speed") {
        nameDisp.textContent = `Speed Sign @ ${object.km}km`;
        renderSpeedSign(e, object);
    } else if (object.type == "track") {
        let {lineStart, scale} = e.target.parentElement.dataset;
        let lineName = object.label || object.id;
        let clickKm = e.offsetX / parseFloat(scale) + parseFloat(lineStart);
        nameDisp.textContent = `${lineName} @ ${clickKm.toFixed(3)}km`;
    }
    
    noteDisplay.textContent = object.note || "";
}

function parseParams(params) {
    let out = {};
    for (let param of params) {
        let [key, val] = param.split("=");
        out[key] = val || true;
    }
    return out;
}

function render(objects, scale) {
    let renderArea = document.getElementById("render-area");
    renderArea.replaceChildren();
    let lineStart = -1;
    let maxHeight = 0;
    let trackInfo = {};

    for (let object of objects) {
        let [km, track, type, id, ...params] = object;

        params = parseParams(params);
        if (type === "track") {
            trackInfo[id] = params;
            if (maxHeight < params.render_pos)
                maxHeight = parseInt(params.render_pos);
        }

        if (lineStart == -1) lineStart = km;

        let element = document.createElement("div");
        element.id = id;
        element.className = type;
        element.style.left = (km - lineStart) * scale + "px";
        element.style.top = trackInfo[track].render_pos + "px";
        element.title = params.label || element.id;

        if (type == "signal" || type == "speed") {
            let facing = params.facing || trackInfo[track].direction;

            let offset = facing == "up" ? 20 : -20;
            if (params.position == "right") {
                offset *= -1;
            }
            element.style.transform = `translate(0px, ${offset}px)`;

            element.dataset.facing = facing;
        }

        if (params.style) {
            for (let sName of params.style.split("|"))
                element.classList.add(sName);
        }

        if (type == "track" || type == "platform") {
            element.style.width = (params.end - km) * scale + "px";
        }
        
        if (type == "points") {
            let horizLen = (params.b_end - km) * scale;
            let vertLen = trackInfo[params.b_track].render_pos - trackInfo[track].render_pos;
            let diagLen = Math.sqrt(horizLen * horizLen + vertLen * vertLen);
            element.style.width = diagLen + "px";

            let angle = Math.atan2(vertLen, horizLen);
            element.style.transform = `rotate(${angle}rad)`;
        }
        
        if (type == "platform") {
            element.textContent = id;

            let direction = trackInfo[track].direction;
            if (
                (params.left && direction == "up") ||
                (params.right && direction == "down")
            ) {
                element.dataset.facing = "up";
            } else {
                element.dataset.facing = "down";
            }
        }

        element.addEventListener(
            "click", e => handleClick(e, {km, track, type, id, ...params})
        );

        renderArea.appendChild(element);
    }

    renderArea.style.height = maxHeight + 100 + "px";
    
    renderArea.dataset.lineStart = lineStart;
    renderArea.dataset.scale = scale;
}

async function getCsv(name) {
    let resp = await fetch(name);
    let text = await resp.text();
    let newline = text.includes("\r") ? "\r\n" : "\n";
    let lines = text.trim().split(newline);
    let objects = lines.map(line => line.split(","));
    return objects;
}

let lineSelector = null;
let lineInfo;
let SCALE = 1600;
async function changeLine() {
    let lineInfo = await getCsv(lineSelector.value);
    render(lineInfo, SCALE);
}

window.addEventListener("load", e => {
    lineSelector = document.getElementById("line-selector");
    changeLine()

    nameDisp = document.getElementById("name-display");
    infobox = document.getElementById("infobox");
    signalDisp = document.getElementById("signal-display");
    speedSignDisplay = document.getElementById("speed-sign-display");
    noteDisplay = document.getElementById("note-display");
})