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

function renderSignal(e, object) {
    let signalDisp = document.createElement("div");
    signalDisp.className = "signal-display";

    let isDwarf = object.dwarf || (object.ground && object.shunt !== "triangular");
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

    return signalDisp;
}

function displayOverlap(e, object) {
    // Remove previous strips
    let overlapStrips = renderArea.getElementsByClassName("overlap-strip");
    while (overlapStrips[0])
        renderArea.removeChild(overlapStrips[0]);

    let signal = e.currentTarget;

    // Find current speed limit
    let facing = object.facing || diagram.by_id(object.track).direction;
    let direction = facing === "up" ? 1 : -1;
    let lastSpeed = diagram.linearSearch(object.idx, direction, obj => (
        obj.track === object.track &&
        obj.isRegSpeedSign()
    ));
    console.log(lastSpeed);
    if (!lastSpeed) return;

    for (let [key, val] of Object.entries(lastSpeed)) {
        let match = key.match(/(gen|med|high|mu)([^X]|$)/);
        if (!match) continue;
        let type = match[1];

        // Create strip and place at same position as signal
        let overlapStrip = document.createElement("div");
        overlapStrip.className = `overlap-strip ${type} ${facing}`;
        overlapStrip.style.left = signal.style.left;
        overlapStrip.style.top = signal.style.top;

        // Calculate and set length
        let overlapLen = BRAKE_CURVES[type][val / 5];
        overlapStrip.style.width = overlapLen / 1000 * renderArea.dataset.scale + "px";
        overlapStrip.title = `Overlap for signal ${object.id}: ${overlapLen}m`
        renderArea.appendChild(overlapStrip);
    }
}

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

    let speedSignDisplay = document.createElement("div");
    speedSignDisplay.className = "speed-sign-display";
    speedSignDisplay.replaceChildren(...signs);
    return speedSignDisplay;
}

let hoverInfobox = null;
let detailInfobox = null;
function openInfobox(e, object, type) {
    let infobox = type === "hover" ? hoverInfobox : detailInfobox;
    infobox.replaceChildren();

    if (type === "hover") {
        infobox.style.left = e.pageX + "px";
        infobox.style.top = e.pageY + "px";
    }

    let nameDisp = document.createElement("h3");
    infobox.appendChild(nameDisp);

    if (object.type == "signal") {
        if (type === "click") displayOverlap(e, object);
        nameDisp.textContent = `Signal ${object.id} @ ${object.km}km`;
        infobox.appendChild(renderSignal(e, object));
    } else if (object.type == "speed") {
        nameDisp.textContent = `Speed Sign @ ${object.km}km`;
        infobox.appendChild(renderSpeedSign(e, object));
    } else if (object.type == "track") {
        let {lineStart, scale} = e.target.parentElement.dataset;
        let lineName = object.label || object.id;
        let clickKm = e.offsetX / parseFloat(scale) + parseFloat(lineStart);
        nameDisp.textContent = `${lineName} @ ${clickKm.toFixed(3)}km`;
    }
    
    if (object.note) {
        let noteDisplay = document.createElement("p");
        noteDisplay.textContent = object.note;
        infobox.appendChild(noteDisplay);
    }

    if (type === "hover")
        infobox.dataset.show = true;
}
function closeInfobox() {
    hoverInfobox.dataset.show = false;
}

function render(diagram, scale) {
    renderArea.replaceChildren();
    let lineStart = diagram.by_idx(0).km;
    let maxHeight = 0;

    for (let object of diagram.list) {
        let {km, track, type, id, idx} = object;

        if (type === "track") {
            if (maxHeight < object.render_pos)
                maxHeight = parseInt(object.render_pos);
        }

        let element = document.createElement("div");
        element.id = id;
        element.dataset.idx = idx;
        element.className = type;
        element.style.left = (km - lineStart) * scale + "px";
        element.style.top = diagram.by_id(track).render_pos + "px";

        if (type == "signal" || type == "speed") {
            let facing = object.facing || diagram.by_id(track).direction;

            let offset = facing == "up" ? 20 : -20;
            if (object.position == "right") {
                offset *= -1;
            }
            element.style.transform = `translate(0px, ${offset}px)`;

            element.dataset.facing = facing;
        }

        if (object.style) {
            for (let sName of object.style.split("|"))
                element.classList.add(sName);
        }

        if (type == "track" || type == "platform") {
            element.style.width = (object.end - km) * scale + "px";
        }
        
        if (type == "points") {
            let horizLen = (object.b_end - km) * scale;
            let vertLen = diagram.by_id(object.b_track).render_pos - diagram.by_id(track).render_pos;
            let diagLen = Math.sqrt(horizLen * horizLen + vertLen * vertLen);
            element.style.width = diagLen + "px";

            let angle = Math.atan2(vertLen, horizLen);
            element.style.transform = `rotate(${angle}rad)`;
        }
        
        if (type == "platform") {
            element.textContent = id;

            let direction = diagram.by_id(track).direction;
            if (
                (object.left && direction == "up") ||
                (object.right && direction == "down")
            ) {
                element.dataset.facing = "up";
            } else {
                element.dataset.facing = "down";
            }
        }

        if (type == "signal" || type == "speed") {
            element.addEventListener(
                "mouseenter", e => openInfobox(e, object, "hover")
            );
            element.addEventListener("mouseout", closeInfobox);
        }
        element.addEventListener(
            "click", e => openInfobox(e, object, "click")
        );

        renderArea.appendChild(element);
    }

    renderArea.style.height = maxHeight + 100 + "px";
    
    renderArea.dataset.lineStart = lineStart;
    renderArea.dataset.scale = scale;
}

class Diagram {
    constructor() {
        this.list = [];
        this.dict = {};
    }

    addObject(object) {
        this.list.push(object);
        object.idx = this.list.length - 1;
        this.dict[object.id] = object;
    }

    by_id(id) {
        return this.dict[id];
    }
    by_idx(idx) {
        return this.list[idx];
    }

    linearSearch(start, direction, pred) {
        for (let i = start; i >= 0 && i < this.list.length; i += direction) {
            if (pred(this.list[i])) return this.list[i];
        }
        return null;
    }
}

class DiagramObject {
    constructor(km, track, type, id, params) {
        this.km = km;
        this.track = track;
        this.type = type;
        this.id = id;
        this.idx = -1;
        for (let [key,val] of Object.entries(params)) {
            this[key] = val;
        }
    }

    static fromCsv(line) {
        let [km, track, type, id, ...rawParams] = line.split(",");
        let params = {};
        for (let param of rawParams) {
            let [key, val] = param.split("=");
            params[key] = val || true;
        }
        return new DiagramObject(km, track, type, id, params);
    }

    isRegSpeedSign() {
        for (let key of Object.keys(this)) {
            if (key.match(/(gen|med|high|mu)([^X]|$)/))
                return true;
        }
        return false;
    }
}

async function getCsv(name) {
    let resp = await fetch(name);
    let text = await resp.text();
    let newline = text.includes("\r") ? "\r\n" : "\n";
    let lines = text.trim().split(newline);
    let diagram = new Diagram();
    for (let line of lines) {
        diagram.addObject(DiagramObject.fromCsv(line));
    }
    return diagram;
}

let lineSelector = null;
let diagram;
let SCALE = 1600;
async function changeLine() {
    diagram = await getCsv(lineSelector.value);
    render(diagram, SCALE);
}

let renderArea;
window.addEventListener("load", e => {
    renderArea = document.getElementById("render-area");

    lineSelector = document.getElementById("line-selector");
    changeLine()

    detailInfobox = document.getElementById("detail-infobox");
    hoverInfobox = document.getElementById("hover-infobox");
})