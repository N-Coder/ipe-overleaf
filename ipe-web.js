window.addEventListener("message", async (event) => {
    if (event.source === window && event?.data?.command === "upload-to-overleaf") {
        await chrome.runtime.sendMessage(event.data);
    }
});
