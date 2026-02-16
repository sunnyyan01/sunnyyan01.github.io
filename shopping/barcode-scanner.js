const CODE_128 = 4;
const DATA_MATRIX = 5;

let type = "ww-dm";
function changeType(btn) {
  type = btn.dataset.type;
  document.querySelector(".selected").classList.remove("selected");
  btn.classList.add("selected");
}

let info;
window.onload = () => {
  info = document.querySelector("#info");
};

function formatDateTime(datetime) {
  let [_, year, month, day, hour, min, sec] = datetime.match(
    /([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})/,
  );
  return `${day}/${month}/${year} ${hour}:${min}:${sec}`;
}

function renderTable(data) {
  info.replaceChildren();
  for (let [key, val] of Object.entries(data)) {
    let div = document.createElement("div");
    div.className = "row";
    let b = document.createElement("b");
    b.textContent = key;
    let p = document.createElement("p");
    p.textContent = val;
    div.replaceChildren(b, p);
    info.appendChild(div);
  }
}

function parseWoolworthsDM(string) {
  string = string.replace(/^\x1D/, "");
  let { parsedCodeItems } = parseBarcode(string);

  let output = {};
  for (let codeItem of parsedCodeItems) {
    let { ai, dataTitle, data } = codeItem;
    if (ai == "01") {
      data = data.replace(/^0+/, "");
    } else if (ai >= "11" && ai <= "17") {
      data = data.toLocaleDateString();
    } else if (ai == "30") {
      data = data.replace(/^0+/, "");
    } else if (ai.startsWith("392")) {
      data = "$" + data.toFixed(2);
    } else if (ai == "8008") {
      data = formatDateTime(data);
    } else if (ai == "91") {
      dataTitle = "Was Price";
      data = "$" + (parseInt(data) / 100).toFixed(2);
    }

    output[dataTitle] = data;
  }

  renderTable(output);
}

function parseWoolworths128(string) {
  let [_, GTIN, price, check] = string.match(/91([0-9]{13})([0-9]{5})([0-9])/);
  renderTable({
    GTIN,
    Price: "$" + (parseInt(price) / 100).toFixed(2),
    "Check Digit": check,
  });
}

function parseColes128(string) {
  let [_, GTIN, price, year, month, day, check] = string.match(
    /910([0-9]{13})([0-9]{5})([0-9]{2})([0-9]{2})([0-9]{2})([0-9])/,
  );
  renderTable({
    GTIN,
    Price: "$" + (parseInt(price) / 100).toFixed(2),
    "Sell By": `${day}/${month}/${year}`,
    "Check Digit": check,
  });
}

let interval;
async function startScanner() {
  let stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" },
    audio: false,
  });

  let videoElement = document.getElementById("preview");
  videoElement.srcObject = stream;
  videoElement.play();

  let codeReader = new ZXingBrowser.BrowserMultiFormatReader();
  codeReader.possibleFormats = ["DATA_MATRIX", "CODE_128"];
  let { format, text } = await codeReader.decodeOnceFromStream(stream);
  if (type == "ww-dm") {
    parseWoolworthsDM(text);
  } else if (type == "ww-128") {
    parseWoolworths128(text);
  } else {
    //coles-128
    parseColes128(text);
  }
  videoElement.src = "";
}
