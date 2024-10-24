function extract_file_info(selected_file) {
    const file_id = selected_file.querySelector("div.entity").getAttribute("data-file-id");
    const file_name = selected_file.querySelector("button.item-name-button > span").innerHTML;
    return {file_id, file_name};
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
            const {file_id, file_name} = extract_file_info(selected_file);
            const selected_folder = selected_file.parentElement.previousElementSibling;
            const {folder_id, folder_name} = extract_file_info(selected_folder);

            const response = await fetch(`/project/${project_id}/file/${file_id}`);
            if (response.ok) {
                await chrome.runtime.sendMessage({
                    command: "open-in-ipe",
                    project_id: project_id,
                    file_id: file_id,
                    file_name: file_name,
                    folder_id: folder_id,
                    folder_name: folder_name,
                    blob: await response.blob()
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
    fetch(`/project/${data.project_id}/upload?folder_id=${data.folder_id}`, {
        method: "POST",
        body: data.blob,
        headers: {
            "Content-Type": "application/octet-stream",
            "Content-Disposition": `attachment; filename="${data.file_name}"`
        },
    }).then(
        (response) => {
            if (response.ok) {
                alert("Uploaded!");
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
