browser.runtime.onMessage.addListener((data, sender) => {
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
                    browser.tabs.sendMessage(tabId, data);
                    chrome.tabs.onUpdated.removeListener(listener);
                }
            };
            chrome.tabs.onUpdated.addListener(listener, {tabId: tab.id, properties: ["status"]});
        });

    } else if (data.command === "upload-to-overleaf") {
        browser.tabs.sendMessage(data.return_tab_id, data);
    } else {
        console.log("unknown command")
    }
    return false;
});
