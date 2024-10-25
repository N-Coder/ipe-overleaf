function extract_file_info(file) {
    const file_id = file.querySelector("div.entity").getAttribute("data-file-id");
    const file_name = file.querySelector("button.item-name-button > span").innerHTML;
    return [file_id, file_name];
}

const observer = new MutationObserver(mutations => {
    observer.disconnect();
    window.setTimeout(() =>
            observer.observe(document.body, {childList: true}),
        100);

    const dropdown = document.querySelector("div.context-menu.dropdown > ul.dropdown-menu");
    let ipe_web_li = document.querySelector("a#ipe-web-li");
    if (dropdown && !ipe_web_li) {
        // dropdown.getAttribute("aria-labelledby") == "dropdown-file-tree-context-menu"
        dropdown.insertAdjacentHTML("afterbegin",
            '<li role="presentation" class=""><a id="ipe-web-li" role="menuitem" tabindex="-1" href="#">Edit with ipe-web</a></li>');
        ipe_web_li = dropdown.querySelector("a#ipe-web-li");
        ipe_web_li.addEventListener("click", async (e) => {
            const project_id = document.querySelector("head > meta[name='ol-project_id']").getAttribute("content");
            const selected_file = document.querySelector("div.file-tree li.selected");
            const [file_id, file_name] = extract_file_info(selected_file);
            const selected_folder = selected_file.parentElement.previousElementSibling;
            let folder_id = null, folder_name = null;
            if (selected_folder && selected_folder.role === "treeitem") {
                [folder_id, folder_name] = extract_file_info(selected_folder);
            } // not setting a folder ID in the request means it goes to the root folder

            const response = await fetch(`/project/${project_id}/file/${file_id}`);
            if (response.ok) {
                await chrome.runtime.sendMessage({
                    command: "open-in-ipe",
                    project_id,
                    file_id,
                    file_name,
                    folder_id,
                    folder_name,
                    blob: await (await response.blob()).bytes()
                });
            } else {
                alert(`Could not download file: ${response.statusText} (${response.status})`);
            }
        });
        observer.observe(
            document.querySelector("div.context-menu.dropdown"),
            {attributes: true, childList: true});
    }
});

// If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
observer.observe(document.body, {childList: true});

chrome.runtime.onMessage.addListener(async (data, sender) => {
    const bytes = await data.blob.bytes();
    const blob = new Blob([bytes.buffer], {type: "application/octet-stream"});
    const form = new FormData();
    form.append("relativePath", "null");
    form.append("name", data.file_name);
    form.append("type", "application/octet-stream");
    form.append("qqfile", blob, data.file_name);
    let url = `/project/${data.project_id}/upload`;
    if (data.folder_id) {
        form.append("targetFolderId", data.folder_id);
        url = `${url}?folder_id=${data.folder_id}`;
    }
    const csrf_token = document.querySelector("meta[name='ol-csrfToken']").getAttribute("content");
    fetch(url, {
        method: "POST",
        body: form,
        headers: {
            "Accept": "application/json",
            "Cache-Control": "no-cache",
            "Referer": `https://www.overleaf.com/project/${data.project_id}`,
            "x-csrf-token": csrf_token,
        },
    }).then(
        (response) => {
            if (response.ok) {
                response.json().then(
                    (rdata) => {
                        if (rdata.success === true) {
                            alert("Uploaded!");
                        } else {
                            alert(`Upload error from server: ${rdata}`);
                        }
                    },
                    (error) => {
                        alert(`Broken upload response: ${error}`);
                    }
                );

            } else {
                alert(`Could not upload file: ${response.statusText} (${response.status})`);
            }
        },
        (error) => {
            alert(`Could not upload file: ${error}`);
        },
    );
    return false;
});
