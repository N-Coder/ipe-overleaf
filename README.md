# Notes
Installation ist erst mal vermutlich über nen lokalen Checkout und den [developer mode](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension#installing) am einfachsten.

Die Extension gibt dir auf Rechtsklick im Overleaf Dateimanager ne "Open in ipe-web" Option.
Das öffnet dann nen neuen ipe-web Tab, der über [`window.addEventListener`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts#communicating_with_the_web_page) dann folgende Nachricht bekommt:
```json
{
	command: "open-in-ipe",
	file_id: "66d7382182960b0b92a66e63",
	file_name: "complexity-landscape.ipe",
	folder_id: undefined,
	folder_name: undefined,
	project_id: "65afaf769f6c76bfd820d1fd",
	blob: Blob { size: 58737, type: "" },
	return_tab_id: 320
}
```

Über [`window.postMessage`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts#communicating_with_the_web_page) müsste die Seite beim Speichern dann einfach nur das selbe JSON mit aktualisiertem `blob` file und `command = "upload-to-overleaf"` zurück schicken, damit das wieder auf Overleaf hochgeladen  wird.

# ToDo

- folder_id/name is currently empty
- menu also appears for .tex / other files (and sometimes is missing the ipe-web entry)
- add further button in "file cannot be displayed" window
- how should we store the files for ipe? maybe `~/.ipe/overleaf/${project_id}/${folder_id}/${file_name}`
- what to do when "Open in ipe-web" is clicked a second time? Maybe compare timestamps in ipe files and ask whether we should overwrite?
- instead of opening a new tab for "ipe-web", check whether the file is already open
- do not fail the upload if the overleaf tab was closed in the meantime
- when uploading an ipe file, we should probably also upload the pdf version
- check whether we can also message the native ipe installation
