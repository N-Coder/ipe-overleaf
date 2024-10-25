function openInIpe(data) {
    console.log("Got data!", data);
    window.setTimeout(() => {
        const FS = window.ipeui.ipe.FS;
        const folder = `/home/overleaf/${data.project_id}/${data.folder_id}`;
        FS.mkdirTree(folder);
        const file = `${folder}/${data.file_name}`;
        FS.writeFile(file, new Uint8Array(data.blob));
        window.ipeui.openFile(file);
        window.ipeui.addReturnToOverleaf(() => {
            const updated = ipeui.ipe.FS.readFile(file);
			data.command = "upload-to-overleaf";
			data.blob = new Blob([updated.buffer]);
            console.log("Now sending message");
            window.postMessage(data);
        });
    }, 1000);
}

chrome.runtime.onMessage.addListener((data, sender) => {
    console.log("Got data!", data, sender);

    if (data.command === "open-in-ipe") {
        data.return_tab_id = sender.tab.id;
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
                }
            };
            chrome.tabs.onUpdated.addListener(listener, {tabId: tab.id, properties: ["status"]});
        });

    } else if (data.command === "upload-to-overleaf") {
        console.log("Sending data back to Overleaf");
        chrome.tabs.sendMessage(data.return_tab_id, data);
    } else {
        console.log("unknown command")
    }
    return false;
});
