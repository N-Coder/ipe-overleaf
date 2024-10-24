chrome.runtime.onMessage.addListener(async (data, sender) => {
    if (data?.command === "open-in-ipe") {
        window.postMessage(data, "*",);
    }
    return false;
});

window.addEventListener("message", async (event) => {
    if (event.source === window && event?.data?.command === "upload-to-overleaf") {
        await chrome.runtime.sendMessage(event.data);
    }
});
