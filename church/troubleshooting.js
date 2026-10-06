let PAGES = {};
let main, content, options;
let idx;

async function getData() {
    let resp = await fetch("troubleshooting.json");
    PAGES = await resp.json();
}

function renderText([en,zh]) {
    let span1 = document.createElement("span");
    span1.className = "en";
    span1.textContent = en;

    let span2 = document.createElement("span");
    span2.className = "zh";
    span2.textContent = zh;

    let p = document.createElement("p");
    p.replaceChildren(span1, span2);
    return p;
}

function renderSubPage(name) {
    let page = PAGES[name];
    let div = document.createElement("div");
    div.className = "subpage";
    if (page.text) {
        div.appendChild(renderText(page.text));
    }
    if (page.img) {
        let imgDiv = document.createElement("div");
        imgDiv.className = "image";

        let img = document.createElement("img");
        img.src = "images/" + page.img;
        imgDiv.appendChild(img);

        if (page.overlay) {
            let overlay = document.createElement("img");
            overlay.src = "images/" + page.overlay;
            overlay.className = "overlay";
            imgDiv.appendChild(overlay);
        }

        div.appendChild(imgDiv);
    }
    return div;
}

function renderPage(name) {
    let page = PAGES[name];
    content.replaceChildren();
    if (page.options) {
        content.appendChild(renderText(page.text));
        options.replaceChildren();
        main.dataset.pageType = "options";
        for (let option of page.options) {
            let div = document.createElement("div");
            div.className = "button";
            div.replaceChildren(renderText(option));
            div.onclick = () => renderPage(option[2]);
            options.appendChild(div);
        }
    } else if (page.list) {
        content.appendChild(renderText(page.text));
        list = page.list;
        main.dataset.pageType = "list";

        for (let subpage of page.list) {
            content.appendChild(renderSubPage(subpage));
        }
        idx = 1;
        content.children[idx].classList.add("show");
    } else {
        main.dataset.pageType = "content";
        let subpage = renderSubPage(name);
        subpage.classList.add("show");
        content.appendChild(subpage);
    }
}

function prev() {
    if (idx == 1) return;
    content.children[idx].classList.remove("show");
    content.children[--idx].classList.add("show");
}
function next() {
    if (idx + 1 >= content.children.length) return;
    content.children[idx].classList.remove("show");
    content.children[++idx].classList.add("show");
}

function mainMenu() {
    window.location = "technical-guide.html";
}
function restart() {
    renderPage("main-menu");
}

window.onload = async () => {
    let searchParams = new URLSearchParams(window.location.search);
    document.body.dataset.lang = searchParams.get("lang") || "en";

    main = document.querySelector("main");
    content = document.querySelector("#content");
    options = document.querySelector("#option-buttons");

    await getData();
    renderPage("main-menu");
}