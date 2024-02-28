function calcUtilisation() {
    for (let calcCell of document.getElementsByClassName("util-calc")) {
        let rostered = calcCell.parentElement.children[calcCell.dataset.rostered].textContent;
        let fleet = calcCell.parentElement.children[calcCell.dataset.fleet].textContent;
            console.log(rostered, fleet);
        calcCell.textContent = (rostered / fleet * 100).toFixed(0) + "%";
    }
}

window.addEventListener("load", () => {
    calcUtilisation();
})