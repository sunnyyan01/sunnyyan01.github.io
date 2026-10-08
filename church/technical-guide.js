function changeLanguage(lang) {
    document.body.dataset.lang = lang;
    updateLinks();
}

function updateLinks() {
    let lang = document.body.dataset.lang;
    for (let a of document.querySelectorAll(".chapters a")) {
        if (a.parentElement.parentElement.id == "step-by-step") {
            let params = new URLSearchParams({
                lang,
                chapter: a.id,
            })
            a.href = "technical-guide-chapter.html?" + params.toString();
        } else if (a.parentElement.parentElement.id == "technical-details") {
            a.href = `details/${a.id}.html?lang=${lang}`;
        }
    }
}

function onSectionClick(e) {
    if (e.currentTarget.id == "troubleshooting") {
        window.location = `troubleshooting.html?lang=${document.body.dataset.lang}`;
        return;
    }

    let prev = document.querySelector(".section[data-expanded=true]")
    if (prev) {
        prev.dataset.expanded = false;
        prev.querySelector(".expand-button").textContent = "🔼";
    }
    e.currentTarget.dataset.expanded = true;
    e.currentTarget.querySelector(".expand-button").textContent = "🔽";
}

window.onload = () => {
    document.querySelector("#lang-sel-en").addEventListener("click", () => changeLanguage("en"));
    document.querySelector("#lang-sel-zh").addEventListener("click", () => changeLanguage("zh"));
    document.querySelectorAll(".section").forEach(
        title => title.addEventListener("click", onSectionClick)
    )
    updateLinks();
}