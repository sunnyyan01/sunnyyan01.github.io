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
function formatPrice(cents) {
  return "$" + (parseInt(cents) / 100).toFixed(2);
}

function renderRow(key, val) {
  let div = document.createElement("div");
  div.className = "row";
  let b = document.createElement("b");
  b.textContent = key;
  let p = document.createElement("p");
  p.textContent = val;
  div.replaceChildren(b, p);
  info.appendChild(div);
  return [div, b, p];
}
function renderTable(data) {
  info.replaceChildren();
  for (let [key, val] of Object.entries(data)) {
    renderRow(key, val);

    if (key == "GTIN" && val[0] == "2") {
      let [_, id, price] = data.GTIN.match(/2([0-9]{6})([0-9]{5})[0-9]/);

      let [div] = renderRow("Internal Product ID", id);
      div.classList.add("indent");
      ([div] = renderRow("Original Price", formatPrice(price)));
      div.classList.add("indent");
    }
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
      data = formatPrice(data);
    }

    output[dataTitle] = data;
  }

  renderTable(output);
}

function parseWoolworths128(string) {
  let [_, GTIN, price, check] = string.match(/^91([0-9]{13})([0-9]{5,6})([0-9])$/);
  renderTable({
    GTIN,
    Price: formatPrice(price),
    "Check Digit": check,
  });
}

function parseColes128(string) {
  let [_, GTIN, price, year, month, day, check] = string.match(
    /^910([0-9]{13})([0-9]{5})([0-9]{2})([0-9]{2})([0-9]{2})([0-9])$/,
  );
  renderTable({
    GTIN,
    Price: formatPrice(price),
    "Sell By": `${day}/${month}/${year}`,
    "Check Digit": check,
  });
}

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
  } else { //coles-128
    parseColes128(text);
  }
  videoElement.src = "";
}
