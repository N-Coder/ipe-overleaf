function openInIpe(data) {
    console.log("Got data!", data);
    window.setTimeout(() => {
        const FS = window.ipeui.ipe.FS;
        const folder = `/home/ipe/overleaf/${data.project_id}/${data.folder_id}`;
        FS.mkdirTree(folder);
        const file = `${folder}/${data.file_name}`;
        FS.writeFile(file, new Uint8Array(data.blob));
        window.ipeui.openFile(file);

        const button = document.createElement("button");
        button.class = "mainmenu";
        button.innerHTML = "Upload to Overleaf";
        button.onclick = function () {
            data.command = "upload-to-overleaf";
            data.blob = FS.readFile(file);
            window.postMessage(data, "*")
        };
        document.querySelector("div#mainmenu").appendChild(button);
    }, 1000);
}

function installListener() {
    window.addEventListener("message", async (event) => {
        if (event.source === window && event?.data?.command === "upload-to-overleaf") {
            console.log("Got upload request", event.data);
            await chrome.runtime.sendMessage(event.data);
        }
    });
}

chrome.runtime.onMessage.addListener(async (data, sender) => {
    console.log("Got data!", data, sender);

    if (data.command === "open-in-ipe") {
        data.return_tab_id = sender.tab.id;
        if (!data.folder_id) {
            // the content script cannot access the page's global overleaf variable, but we can
            data.folder_id = (await chrome.scripting.executeScript({
                func: () => overleaf.unstable.store.get("project").rootFolder[0]._id,
                target: {tabId: sender.tab.id},
                world: chrome.scripting.ExecutionWorld.MAIN
            }))[0].result;
            console.log("Resolved root folder id", data);
        }

        chrome.tabs.create({
            url: "https://ipe-web.otfried.org/index.html",
        }).then((tab) => {
            console.log("Created tab!", tab);
            const listener = (tabId, changeInfo, tabInfo) => {
                console.log("Tab updated!", tabId, changeInfo, tabInfo);
                if (tabInfo.status === "complete") {
                    chrome.tabs.onUpdated.removeListener(listener);

                    data.blob = Array.from(data.blob);
                    chrome.scripting.executeScript({
                        args: [data],
                        func: openInIpe,
                        target: {tabId: tabId},
                        world: chrome.scripting.ExecutionWorld.MAIN
                    }).then(
                        (result) => console.log("Script injection result", result),
                        (error) => console.log("Script injection failed", error),
                    )
                    chrome.scripting.executeScript({
                        func: installListener,
                        target: {tabId: tabId},
                        world: chrome.scripting.ExecutionWorld.ISOLATED
                    }).then(
                        (result) => console.log("Script injection 2 result", result),
                        (error) => console.log("Script injection 2 failed", error),
                    )
                }
            };
            chrome.tabs.onUpdated.addListener(listener, {tabId: tab.id, properties: ["status"]});
        });

    } else if (data.command === "upload-to-overleaf") {
        console.log("Got upload request", data);
        chrome.tabs.sendMessage(data.return_tab_id, data);
    } else {
        console.log("unknown command", data);
    }
    return false;
});
