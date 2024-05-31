
document.getElementById("theMath").addEventListener("pointerenter", () => {
    document.querySelector("dialog").showModal();
});

document.querySelector("button").addEventListener("click", () => {
    document.querySelector("dialog").close();
});
