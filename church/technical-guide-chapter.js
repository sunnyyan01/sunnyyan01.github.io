let CHAPTERS = {};
let STEPS = [];
let cur = 0;
let LANGUAGE = "en";
let nextBtn, prevBtn;
async function fetchChapters() {
    let resp = await fetch("technical-guide.json");
    CHAPTERS = await resp.json();
}

function renderStep(idx) {
    let step = STEPS[idx];
    let stepDiv = document.querySelector("#step");
    stepDiv.replaceChildren(...step.map(item => {
        if (item[LANGUAGE]) {
            let p = document.createElement("p");
            p.textContent = item[LANGUAGE];
            return p;
        }
        if (item.link) {
            let div = document.createElement("div");
            let a = document.createElement("a");
            a.href = item.link;
            a.textContent = item.link;
            div.className = "link";
            div.appendChild(a);
            return div;
        }
        if (item.textarea) {
            let textarea = document.createElement("textarea");
            textarea.cols = 80;
            textarea.value = item.textarea;
            return textarea;
        }
        if (item.img) {
            let div = document.createElement("div");
            div.className = "image";

            let img = document.createElement("img");
            img.src = item.img;
            div.appendChild(img);

            if (item.overlay) {
                let overlay = document.createElement("img");
                overlay.src = item.overlay;
                overlay.className = "overlay";
                div.appendChild(overlay);
            }

            return div;
        }
    }))

    prevBtn.dataset.show = idx > 0;
    nextBtn.dataset.show = idx < STEPS.length - 1;
}

function next() {
    if (cur < STEPS.length - 1)
        renderStep(++cur);
}
function prev() {
    if (cur > 0)
        renderStep(--cur);
}
function back() {
    window.history.back();
}
function copyLink() {
    let searchParams = new URLSearchParams(window.location.search);
    searchParams.set("step", cur);
    let url = new URL(window.location);
    url.search = "?" + searchParams.toString();
    window.navigator.clipboard.writeText(url.toString());
}

window.onload = async () => {
    prevBtn = document.getElementById("prev");
    nextBtn = document.getElementById("next");

    await fetchChapters();
    let searchParams = new URLSearchParams(window.location.search);
    let {title_en, title_zh, steps} = CHAPTERS[searchParams.get("chapter")];
    STEPS = steps;
    LANGUAGE = searchParams.get("lang");
    cur = searchParams.get("step") || 0;
    document.querySelector("#title").textContent = LANGUAGE == "en" ? title_en : title_zh;
    renderStep(cur);
}

window.onkeydown = e => {
    if (e.key == "ArrowLeft") {
        prev();
    } else if (e.key == "ArrowRight") {
        next();
    }
}