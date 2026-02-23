let gcs;

window.addEventListener("message", e => {
    if (e.origin !== window.origin) return;

    let barcode = e.data.rawValue;
    document.querySelector("#add-gift-card input[name=gc-num]").value = barcode;
})

async function scanGiftCard() {
    changeTab("cam");

    let stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
    });

    let videoElement = document.getElementById("gift-card-cam");
    videoElement.srcObject = stream;
    videoElement.play();

    let codeReader = new ZXingBrowser.BrowserMultiFormatReader();
    let { text } = await codeReader.decodeOnceFromStream(stream);
    document.querySelector("#add-gift-card input[name=gc-num]").value = text;
    onGcNumChange();

    changeTab("add");
}

let GC_TYPE_REGEXES = [
    ["Coles Group + Myer", /(9800935396700)([0-9]{17})/],
    ["Coles", /(9801935396600)([0-9]{17})/],
    ["Woolworths", /(\d{13})?(628000)(721)(\d{10})/],
    ["EG", /(\d{13})?(628000)(551)(\d{10})/],
    ["Everyday Wish", /(\d{13})?(628000)(561)(\d{10})/],
    ["Woolworths & Big W", /(\d{13})?(628000)(961)(\d{10})/],
];
function onGcNumChange() {
    let cardNum = document.querySelector("#add-gift-card input[name=gc-num]").value;
    for (let [type, regex] of GC_TYPE_REGEXES) {
        if (cardNum.match(regex)) {
            document.querySelector("#add-gift-card input[name=gc-type]").value = type;
        }
    }
}

function addGiftCard() {
    let gc = {
        type: document.querySelector("#add-gift-card input[name=gc-type]").value,
        num: document.querySelector("#add-gift-card input[name=gc-num]").value,
        balance: parseFloat(document.querySelector("#add-gift-card input[name=gc-bal]").value),
        pin: document.querySelector("#add-gift-card input[name=gc-pin]").value,
    };
    gcs[gc.num] = gc;
    document.querySelector("#gift-cards").appendChild(
        renderGiftCard(gc)
    );
    saveGiftCards();
    document.querySelector("#add-gift-card").reset();
}

function changeTab(tab) {
    if (tab != "view") {
        document.querySelector(".gift-card.selected")?.classList.remove("selected");
    }
    document.getElementById("panel2").dataset.tab = tab;
}

function balFormat(cents) {
    return "$" + cents.toFixed(2);
}

function encodeBarcode(num) {
    let out = String.fromCodePoint(205); // Start code C
    let sum = 105;
    let weight = 1;
    for (let i = 0; i < num.length - 1; i += 2) {
        let pair = (num[i] - '0') * 10 + (num[i + 1] - '0');
        let offset = pair <= 94 ? 32 : 100;
        out += String.fromCodePoint(pair + offset);
        sum += pair * weight++;
    }
    if ((num.length % 2) == 1) {
        out += String.fromCodePoint(200); // Switch code B
        sum += 100 * weight++;
        out += num.at(-1); // Add final number in code B
        sum += (num.at(-1) - '0' + 16) * weight++;
    }
    // Add check digit
    sum %= 103;
    let offset = sum <= 94 ? 32 : 100;
    out += String.fromCodePoint(sum + offset);
    return out + String.fromCodePoint(206); // Stop
}

function renderGiftCard({type, num, balance}) {
    let div = document.getElementById("gift-card-sample").cloneNode(true);
    div.id = "";
    div.dataset.gcNum = num;
    div.getElementsByClassName("gc-type")[0].textContent = `${type} ${num.slice(-4)}`;
    div.getElementsByClassName("gc-balance")[0].textContent = balFormat(balance);
    div.addEventListener("click", openGiftCard);
    return div;
}
function loadGiftCards() {
    gcs = JSON.parse(localStorage.getItem("gift-cards") || "{}");
    let list = document.getElementById("gift-cards");
    for (let gc of Object.values(gcs)) {
        list.appendChild(renderGiftCard(gc));
    }
}
function openGiftCard(e) {
    let prev = document.querySelector(".gift-card.selected")
    if (prev)
        prev.classList.remove("selected");
    e.currentTarget.classList.add("selected");

    let num = e.currentTarget.dataset.gcNum;
    let {type, balance, pin} = gcs[num];

    let barcode = encodeBarcode(num);

    let match = num.match(GC_TYPE_REGEXES.find(x => x[0] == type)[1]);
    let numGroups = [];
    for (let group of match.slice(1)) {
        if (!group) continue;
        for (let i = 0; i < group.length; i += 4) {
            numGroups.push(group.slice(i, i+4));
        }
    }

    document.querySelector("#view-gift-card").dataset.gcNum = num;
    document.querySelector("#view-gift-card .type").textContent = `${type} ${balFormat(balance)}`
    document.querySelector("#view-gift-card .barcode").textContent = barcode;
    document.querySelector("#view-gift-card .num").textContent = numGroups.join(" ");
    document.querySelector("#view-gift-card .pin span").textContent = pin;

    changeTab("view");
}
function saveGiftCards() {
    localStorage.setItem("gift-cards", JSON.stringify(gcs));
}
function spendGiftCard() {
    let num = document.querySelector("#view-gift-card").dataset.gcNum;
    let input = document.querySelector("#view-gift-card input[name=spend]");
    let spendVal = parseFloat(input.value);

    if (spendVal > gcs[num].balance) {
        alert("Insufficient balance");
        return;
    }

    gcs[num].balance -= spendVal;
    saveGiftCards();

    let tile = document.querySelector(`.gift-card[data-gc-num="${num}"]`);
    let newTile = tile.insertAdjacentElement("afterend", renderGiftCard(gcs[num]));
    tile.remove();
    newTile.click();

    input.value = "";
}
function deleteGiftCard() {
    if (!confirm("Are you sure you wish to delete this gift card?"))
        return;

    let num = document.querySelector("#view-gift-card").dataset.gcNum;
    delete gcs[num];
    saveGiftCards();
    document.querySelector(`.gift-card[data-gc-num="${num}"]`).remove();

    changeTab("none");
}

window.addEventListener("load", () => {
    loadGiftCards();
});