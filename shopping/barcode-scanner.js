const CODE_128 = 4;
const DATA_MATRIX = 5;
const EAN_8 = 6;
const EAN_13 = 7;

let store = "ww";
function changeStore(btn) {
  store = btn.dataset.type;
  document.querySelector(".selected").classList.remove("selected");
  btn.classList.add("selected");
}

let info;
window.onload = () => {
  info = document.querySelector("#info");
};

function formatDateTime(datetime) {
  let [_, year, month, day, hour, min, sec] = datetime.match(
    /(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
  );
  return `${day}/${month}/${year} ${hour}:${min}:${sec}`;
}
function formatPrice(cents) {
  return "$" + (parseInt(cents) / 100).toFixed(2);
}

function renderRow(key, val, indent) {
  let div = document.createElement("div");
  div.className = indent ? "row indent" : "row";
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
  for (let [key, val] of data) {
    let indent = false;
    if (key[0] == '>') {
      key = key.slice(1);
      indent = true;
    }
    renderRow(key, val, indent);
  }
}

function parseWoolworths(format, string) {
  let parseCustomEAN = (ean) => {
    let match = ean.match(/2(\d{6})(\d{5})\d/);
    if (match) {
      let [_, id, price] = match;
      return [
        [">Internal Product ID", id],
        [">Original Price", formatPrice(price)],
      ]
    } else {
      return [];
    }
  }

  if (format == EAN_8) {
    return renderTable(["GTIN", string]);
  } else if (format == EAN_13) {
    return renderTable([
      ["GTIN", string],
      ...parseCustomEAN(string),
    ]);
  } else if (format == CODE_128) {
    let [_, GTIN, price, check] = string.match(/^91(\d{13})(\d{6})(\d)$/);
    return renderTable([
      ["GTIN", GTIN],
      ...parseCustomEAN(GTIN),
      ["Price", formatPrice(price)],
      ["Check Digit", check],
    ]);
  }

  string = string.replace(/^\x1D/, "");
  let { parsedCodeItems } = parseBarcode(string);

  let output = [];
  for (let codeItem of parsedCodeItems) {
    let { ai, dataTitle, data } = codeItem;
    if (ai == "01") {
      data = data.replace(/^0+/, "");
      output.push(
        [dataTitle, data],
        ...parseCustomEAN(data),
      );
    } else if (ai >= "11" && ai <= "17") {
      output.push([dataTitle, data.toLocaleDateString()]);
    } else if (ai == "30") {
      output.push([dataTitle, data.replace(/^0+/, "")]);
    } else if (ai.startsWith("392")) {
      output.push([dataTitle, "$" + data.toFixed(2)]);
    } else if (ai == "8008") {
      output.push([dataTitle, formatDateTime(data)]);
    } else if (ai == "91") {
      output.push(["Was Price", formatPrice(data)]);
    } else {
      output.push([dataTitle, data]);
    }
  }

  renderTable(output);
}

function parseColes(format, string) {
  let parseCustomEAN = (ean) => {
    let match = ean.match(/^02(\d{5})\d(\d{4})\d$/);
    if (match) {
      let [_, id, price] = match;
      return [
        [">Internal Product ID", id],
        [">Original Price", formatPrice(price)],
      ]
    } else {
      return [];
    }
  }

  if (format == EAN_8) {
    return renderTable(["GTIN", string]);
  } else if (format == EAN_13) {
    return renderTable([
      ["GTIN", string],
      ...parseCustomEAN(string),
    ]);
  }

  let [_, GTIN, price, year, month, day, check] = string.match(
    /^910(\d{13})(\d{5})(\d{2})(\d{2})(\d{2})(\d)$/,
  );
  return renderTable([
    ["GTIN", GTIN],
    ...parseCustomEAN(GTIN),
    ["Price", formatPrice(price)],
    ["Sell By", `${year}/${month}/${day}`],
    ["Check Digit", check],
  ]);
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
  let { format, text } = await codeReader.decodeOnceFromStream(stream);
  console.log(text);
  if (store == "ww") {
    parseWoolworths(format, text);
  } else { //coles
    parseColes(format, text);
  }
  videoElement.src = "";
}
