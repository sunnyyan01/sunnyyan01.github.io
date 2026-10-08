window.onload = () => {
    let searchParams = new URLSearchParams(window.location.search);
    document.body.dataset.lang = searchParams.get("lang") || "en";
}