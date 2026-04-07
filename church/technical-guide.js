function changeLanguage(lang) {
    document.body.dataset.lang = lang;
    updateLinks();
}

function updateLinks() {
    for (let a of document.querySelectorAll(".chapters a")) {
        let params = new URLSearchParams({
            lang: document.body.dataset.lang,
            chapter: a.id,
        })
        a.href = "technical-guide-chapter.html?" + params.toString();
    }
}

function onSectionClick(e) {
    let prev = document.querySelector(".section[data-expanded=true]")
    if (prev) {
        prev.dataset.expanded = false;
        prev.querySelector(".expand-button").textContent = "🔼";
    }
    e.currentTarget.parentElement.dataset.expanded = true;
    e.currentTarget.parentElement.querySelector(".expand-button").textContent = "🔽";
}

window.onload = () => {
    document.querySelector("#lang-sel-en").addEventListener("click", () => changeLanguage("en"));
    document.querySelector("#lang-sel-zh").addEventListener("click", () => changeLanguage("zh"));
    document.querySelectorAll(".section .title").forEach(
        title => title.addEventListener("click", onSectionClick)
    )
    updateLinks();
}