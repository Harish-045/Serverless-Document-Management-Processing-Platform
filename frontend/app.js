// ============================================================
// API CONFIGURATION
// ============================================================

const UPLOAD_URL_API =
    "https://699e46mtjk.execute-api.ap-south-1.amazonaws.com/documents/upload-url";

const DOCUMENTS_API =
    "https://rjoagei2sa.execute-api.ap-south-1.amazonaws.com/documents";

const DOWNLOAD_URL_API =
    "https://rjoagei2sa.execute-api.ap-south-1.amazonaws.com/documents";

const DELETE_API =
    "https://kndzaq09c5.execute-api.ap-south-1.amazonaws.com/documents";

const UPDATE_DOCUMENT_API =
    "https://735gk7k9h1.execute-api.ap-south-1.amazonaws.com/documents";


// ============================================================
// TEXT FILE TYPES
// ============================================================

const TEXT_MIME_TYPES = [

    "text/plain",

    "text/csv",

    "text/html",

    "text/css",

    "text/javascript",

    "application/javascript",

    "application/json",

    "application/xml",

    "text/xml",

    "application/xhtml+xml",

    "text/markdown",

    "application/sql",

    "text/yaml",

    "application/yaml"

];

const TEXT_EXTENSIONS = [

    "txt",

    "csv",

    "json",

    "xml",

    "md",

    "markdown",

    "html",

    "htm",

    "css",

    "js",

    "java",

    "py",

    "c",

    "cpp",

    "h",

    "hpp",

    "sql",

    "yaml",

    "yml",

    "properties",

    "log",

    "ini",

    "conf"

];


// ============================================================
// EDIT STATE
// ============================================================

let currentEditDocument = null;

let originalTextContent = "";


// ============================================================
// PAGE LOAD
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadDocuments();

        setupReplaceFileListener();

        setupModalCloseHandler();

    }
);


// ============================================================
// LOAD DOCUMENTS
// ============================================================

async function loadDocuments() {

    const container =
        document.getElementById(
            "documentsContainer"
        );

    container.innerHTML =
        '<p class="loading">Loading documents...</p>';

    try {

        const response =
            await fetch(
                DOCUMENTS_API
            );

        const responseText =
            await response.text();

        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status +
                ": " +
                responseText
            );
        }

        let data = [];

        if (
            responseText &&
            responseText.trim() !== ""
        ) {

            try {

                data =
                    JSON.parse(
                        responseText
                    );

            } catch (error) {

                console.error(
                    "Invalid JSON:",
                    responseText
                );

                throw new Error(
                    "Invalid response from server."
                );
            }
        }

        let documents = [];

        if (Array.isArray(data)) {

            documents = data;

        } else if (
            data &&
            Array.isArray(
                data.documents
            )
        ) {

            documents =
                data.documents;

        } else if (
            data &&
            Array.isArray(
                data.items
            )
        ) {

            documents =
                data.items;
        }

        displayDocuments(
            documents
        );

    } catch (error) {

        console.error(
            "Load documents error:",
            error
        );

        container.innerHTML =
            '<p class="error">' +
            "Failed to load documents: " +
            escapeHtml(
                error.message
            ) +
            "</p>";
    }
}


// ============================================================
// DISPLAY DOCUMENTS
// ============================================================

function displayDocuments(
    documents
) {

    const container =
        document.getElementById(
            "documentsContainer"
        );

    if (
        !documents ||
        documents.length === 0
    ) {

        container.innerHTML =
            '<p class="loading">' +
            "No documents found." +
            "</p>";

        return;
    }

    container.innerHTML = "";

    documents.forEach(
        function (doc) {

            const element =
                createDocumentElement(
                    doc
                );

            container.appendChild(
                element
            );

        }
    );
}


// ============================================================
// CREATE DOCUMENT CARD
// ============================================================

function createDocumentElement(
    doc
) {

    const card =
        document.createElement(
            "div"
        );

    card.className =
        "document-card";


    const fileName =
        doc.fileName ||
        "Unknown file";


    const documentId =
        doc.documentId ||
        "";


    const fileType =
        doc.fileType ||
        "Unknown";


    const fileSize =
        formatFileSize(
            doc.fileSize
        );


    const status =
        doc.status ||
        "UNKNOWN";


    const uploadedAt =
        doc.uploadedAt ||
        "";


    card.innerHTML = `

        <div class="document-info">

            <div class="document-name">
                ${escapeHtml(fileName)}
            </div>

            <div class="document-meta">

                <span>
                    Type:
                    ${escapeHtml(fileType)}
                </span>

                <span>
                    Size:
                    ${escapeHtml(fileSize)}
                </span>

                ${
                    uploadedAt
                    ? `
                        <span>
                            Uploaded:
                            ${escapeHtml(
                                formatDate(
                                    uploadedAt
                                )
                            )}
                        </span>
                      `
                    : ""
                }

            </div>

            <div class="status-badge">
                ${escapeHtml(status)}
            </div>

        </div>


        <div class="document-actions">

            <button
                    class="download-button"
                    onclick="downloadDocument(
                        '${escapeJs(documentId)}'
                    )"
            >
                Download
            </button>


            <button
                    class="edit-button"
                    onclick="openEditModal(
                        '${escapeJs(documentId)}',
                        '${escapeJs(fileName)}',
                        '${escapeJs(fileType)}'
                    )"
            >
                Edit
            </button>


            <button
                    class="delete-button"
                    onclick="deleteDocument(
                        '${escapeJs(documentId)}'
                    )"
            >
                Delete
            </button>

        </div>
    `;

    return card;
}


// ============================================================
// UPLOAD DOCUMENT
// ============================================================

async function uploadDocument() {

    const fileInput =
        document.getElementById(
            "fileInput"
        );

    const uploadButton =
        document.getElementById(
            "uploadButton"
        );

    const uploadStatus =
        document.getElementById(
            "uploadStatus"
        );


    if (
        !fileInput.files ||
        fileInput.files.length === 0
    ) {

        uploadStatus.innerHTML =
            '<span class="error">' +
            "Please select a file first." +
            "</span>";

        return;
    }


    const file =
        fileInput.files[0];


    try {

        uploadButton.disabled =
            true;


        uploadStatus.innerHTML =
            "Generating upload URL...";


        // ====================================================
        // STEP 1
        // GET PRESIGNED URL
        // ====================================================

        const response =
            await fetch(
                UPLOAD_URL_API,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            fileName:
                                file.name,

                            contentType:
                                file.type ||
                                "application/octet-stream"
                        })
                }
            );


        const responseText =
            await response.text();


        if (!response.ok) {

            throw new Error(
                "Failed to generate upload URL. HTTP " +
                response.status +
                " " +
                responseText
            );
        }


        if (
            !responseText ||
            responseText.trim() === ""
        ) {

            throw new Error(
                "Upload API returned an empty response."
            );
        }


        const uploadData =
            JSON.parse(
                responseText
            );


        if (
            !uploadData.uploadUrl
        ) {

            throw new Error(
                "Upload URL was not returned by the server."
            );
        }


        uploadStatus.innerHTML =
            "Uploading file to S3...";


        // ====================================================
        // STEP 2
        // DIRECT UPLOAD TO S3
        // ====================================================

        const uploadResponse =
            await fetch(
                uploadData.uploadUrl,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            file.type ||
                            "application/octet-stream"
                    },

                    body: file
                }
            );


        if (
            !uploadResponse.ok
        ) {

            throw new Error(
                "S3 upload failed. HTTP " +
                uploadResponse.status
            );
        }


        uploadStatus.innerHTML =
            '<span class="success">' +
            "Document uploaded successfully! " +
            "Processing..." +
            "</span>";


        fileInput.value = "";


        // Allow S3 trigger to process
        setTimeout(
            function () {

                loadDocuments();

            },
            2500
        );


    } catch (error) {

        console.error(
            "Upload error:",
            error
        );

        uploadStatus.innerHTML =
            '<span class="error">' +
            "Upload failed: " +
            escapeHtml(
                error.message
            ) +
            "</span>";

    } finally {

        uploadButton.disabled =
            false;
    }
}


// ============================================================
// OPEN EDIT MODAL
// ============================================================

async function openEditModal(
    documentId,
    fileName,
    fileType
) {

    const modal =
        document.getElementById(
            "editModal"
        );

    const documentIdInput =
        document.getElementById(
            "editDocumentId"
        );

    const fileNameInput =
        document.getElementById(
            "editFileName"
        );

    const textEditorSection =
        document.getElementById(
            "textEditorSection"
        );

    const textEditor =
        document.getElementById(
            "textEditor"
        );

    const editStatus =
        document.getElementById(
            "editStatus"
        );

    const replaceFile =
        document.getElementById(
            "replaceFile"
        );

    const replacementInfo =
        document.getElementById(
            "replacementInfo"
        );


    currentEditDocument = {

        documentId:
            documentId,

        fileName:
            fileName,

        fileType:
            fileType

    };


    originalTextContent = "";


    documentIdInput.value =
        documentId;


    fileNameInput.value =
        fileName;


    replaceFile.value =
        "";


    replacementInfo.innerHTML =
        "";


    editStatus.innerHTML =
        "";


    textEditor.value =
        "";


    textEditorSection.style.display =
        "none";


    modal.style.display =
        "flex";


    // ========================================================
    // SHOW TEXT EDITOR IF APPLICABLE
    // ========================================================

    if (
        isTextFile(
            fileName,
            fileType
        )
    ) {

        textEditorSection.style.display =
            "block";


        textEditor.placeholder =
            "Loading file content...";


        editStatus.innerHTML =
            "Loading text content...";


        await loadTextContent(
            documentId
        );

    } else {

        textEditorSection.style.display =
            "none";

        editStatus.innerHTML =
            "You can replace this file with another file of any type.";

    }
}


// ============================================================
// LOAD TEXT CONTENT
// ============================================================

async function loadTextContent(
    documentId
) {

    const textEditor =
        document.getElementById(
            "textEditor"
        );

    const editStatus =
        document.getElementById(
            "editStatus"
        );


    try {

        // ====================================================
        // GET DOWNLOAD URL
        // ====================================================

        const response =
            await fetch(
                DOWNLOAD_URL_API +
                "/" +
                encodeURIComponent(
                    documentId
                ) +
                "/download-url"
            );


        const responseText =
            await response.text();


        if (!response.ok) {

            throw new Error(
                "Could not get download URL. HTTP " +
                response.status
            );
        }


        if (
            !responseText ||
            responseText.trim() === ""
        ) {

            throw new Error(
                "Download API returned an empty response."
            );
        }


        const data =
            JSON.parse(
                responseText
            );


        if (
            !data.downloadUrl
        ) {

            throw new Error(
                "Download URL was not returned."
            );
        }


        // ====================================================
        // DOWNLOAD TEXT FILE
        // ====================================================

        const fileResponse =
            await fetch(
                data.downloadUrl
            );


        if (
            !fileResponse.ok
        ) {

            throw new Error(
                "Could not download file content."
            );
        }


        const blob =
            await fileResponse.blob();


        // Protect browser from accidentally loading
        // extremely large files into textarea.

        const MAX_TEXT_SIZE =
            2 * 1024 * 1024;


        if (
            blob.size >
            MAX_TEXT_SIZE
        ) {

            throw new Error(
                "This text file is larger than 2 MB. " +
                "Use the Replace File option instead."
            );
        }


        const text =
            await blob.text();


        originalTextContent =
            text;


        textEditor.value =
            text;


        textEditor.placeholder =
            "Edit file content here...";


        editStatus.innerHTML =
            "Text content loaded successfully.";

    } catch (error) {

        console.error(
            "Load text error:",
            error
        );


        textEditor.value =
            "";


        textEditor.placeholder =
            "Unable to load text content.";


        editStatus.innerHTML =
            '<span class="error">' +
            "Could not load text content: " +
            escapeHtml(
                error.message
            ) +
            "</span>";
    }
}


// ============================================================
// SAVE DOCUMENT CHANGES
// ============================================================

async function saveDocumentChanges() {

    const documentId =
        document.getElementById(
            "editDocumentId"
        ).value;


    const fileNameInput =
        document.getElementById(
            "editFileName"
        );


    const fileName =
        fileNameInput.value.trim();


    const replaceFile =
        document.getElementById(
            "replaceFile"
        );


    const selectedFile =
        replaceFile.files &&
        replaceFile.files.length > 0
            ? replaceFile.files[0]
            : null;


    const textEditorSection =
        document.getElementById(
            "textEditorSection"
        );


    const textEditor =
        document.getElementById(
            "textEditor"
        );


    const editStatus =
        document.getElementById(
            "editStatus"
        );


    const updateButton =
        document.getElementById(
            "updateButton"
        );


    if (!documentId) {

        editStatus.innerHTML =
            '<span class="error">' +
            "Document ID is missing." +
            "</span>";

        return;
    }


    if (!fileName) {

        editStatus.innerHTML =
            '<span class="error">' +
            "File name is required." +
            "</span>";

        return;
    }


    if (
        fileName.length >
        255
    ) {

        editStatus.innerHTML =
            '<span class="error">' +
            "File name must be 255 characters or less." +
            "</span>";

        return;
    }


    if (
        fileName.includes("/") ||
        fileName.includes("\\")
    ) {

        editStatus.innerHTML =
            '<span class="error">' +
            "File name cannot contain / or \\." +
            "</span>";

        return;
    }


    const textEditorVisible =
        textEditorSection.style.display !==
        "none";


    const textChanged =
        textEditorVisible &&
        textEditor.value !==
        originalTextContent;


    // ========================================================
    // PREVENT TWO CONTENT SOURCES AT ONCE
    // ========================================================

    if (
        selectedFile &&
        textChanged
    ) {

        editStatus.innerHTML =
            '<span class="error">' +
            "Choose either a replacement file OR edit the text content." +
            "</span>";

        return;
    }


    try {

        updateButton.disabled =
            true;


        // ====================================================
        // DETERMINE RENAME
        // ====================================================

        const originalFileName =
            currentEditDocument
                ? currentEditDocument.fileName
                : "";


        const renameRequired =
            fileName !==
            originalFileName;


        // ====================================================
        // REPLACE FILE
        // ====================================================

        if (
            selectedFile ||
            textChanged
        ) {

            let contentType =
                "application/octet-stream";


            let uploadBody;


            if (selectedFile) {

                contentType =
                    selectedFile.type ||
                    "application/octet-stream";


                uploadBody =
                    selectedFile;

            } else {

                contentType =
                    currentEditDocument.fileType ||
                    "text/plain";


                uploadBody =
                    new Blob(
                        [
                            textEditor.value
                        ],
                        {
                            type:
                                contentType
                        }
                    );
            }


            editStatus.innerHTML =
                "Generating replacement upload URL...";


            // ==================================================
            // GET PRESIGNED UPDATE URL
            // ==================================================

            const urlResponse =
                await fetch(
                    UPDATE_DOCUMENT_API +
                    "/" +
                    encodeURIComponent(
                        documentId
                    ) +
                    "/update-url",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                contentType:
                                    contentType
                            })
                    }
                );


            const urlResponseText =
                await urlResponse.text();


            if (!urlResponse.ok) {

                throw new Error(
                    "Could not generate replacement URL. HTTP " +
                    urlResponse.status +
                    " " +
                    urlResponseText
                );
            }


            if (
                !urlResponseText ||
                urlResponseText.trim() === ""
            ) {

                throw new Error(
                    "Replacement URL API returned an empty response."
                );
            }


            const urlData =
                JSON.parse(
                    urlResponseText
                );


            if (
                !urlData.uploadUrl
            ) {

                throw new Error(
                    "Replacement upload URL was not returned."
                );
            }


            editStatus.innerHTML =
                "Replacing file contents in S3...";


            // ==================================================
            // DIRECT PUT TO S3
            // ==================================================

            const uploadResponse =
                await fetch(
                    urlData.uploadUrl,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                contentType
                        },

                        body:
                            uploadBody
                    }
                );


            if (
                !uploadResponse.ok
            ) {

                throw new Error(
                    "S3 replacement failed. HTTP " +
                    uploadResponse.status
                );
            }


            editStatus.innerHTML =
                '<span class="success">' +
                "File contents updated successfully. " +
                "Processing..." +
                "</span>";


            // ==================================================
            // OPTIONAL RENAME
            // ==================================================

            if (renameRequired) {

                editStatus.innerHTML =
                    "File replaced. Updating file name...";


                // Give S3 trigger some time to process
                // the ObjectCreated event.

                await sleep(
                    3000
                );


                await renameDocumentInternal(
                    documentId,
                    fileName
                );

            }


            editStatus.innerHTML =
                '<span class="success">' +
                "Document updated successfully!" +
                "</span>";


            setTimeout(
                function () {

                    closeEditModal();

                    loadDocuments();

                },
                1000
            );


            return;
        }


        // ====================================================
        // RENAME ONLY
        // ====================================================

        if (renameRequired) {

            editStatus.innerHTML =
                "Updating file name...";


            await renameDocumentInternal(
                documentId,
                fileName
            );


            editStatus.innerHTML =
                '<span class="success">' +
                "Document renamed successfully!" +
                "</span>";


            setTimeout(
                function () {

                    closeEditModal();

                    loadDocuments();

                },
                700
            );


            return;
        }


        // ====================================================
        // NOTHING CHANGED
        // ====================================================

        editStatus.innerHTML =
            "No changes were made.";

    } catch (error) {

        console.error(
            "Save document error:",
            error
        );


        editStatus.innerHTML =
            '<span class="error">' +
            "Update failed: " +
            escapeHtml(
                error.message
            ) +
            "</span>";

    } finally {

        updateButton.disabled =
            false;
    }
}


// ============================================================
// RENAME DOCUMENT INTERNAL
// ============================================================

async function renameDocumentInternal(
    documentId,
    fileName
) {

    const response =
        await fetch(
            UPDATE_DOCUMENT_API +
            "/" +
            encodeURIComponent(
                documentId
            ),
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        fileName:
                            fileName
                    })
            }
        );


    const responseText =
        await response.text();


    if (!response.ok) {

        let message =
            "Rename failed. HTTP " +
            response.status;


        if (responseText) {

            try {

                const data =
                    JSON.parse(
                        responseText
                    );


                if (
                    data.message
                ) {

                    message =
                        data.message;
                }

            } catch (ignored) {

                message =
                    responseText;
            }
        }


        throw new Error(
            message
        );
    }


    return responseText;
}


// ============================================================
// DOWNLOAD DOCUMENT
// ============================================================

async function downloadDocument(
    documentId
) {

    try {

        const response =
            await fetch(
                DOWNLOAD_URL_API +
                "/" +
                encodeURIComponent(
                    documentId
                ) +
                "/download-url"
            );


        const responseText =
            await response.text();


        if (!response.ok) {

            throw new Error(
                "Download URL request failed. HTTP " +
                response.status
            );
        }


        if (
            !responseText ||
            responseText.trim() === ""
        ) {

            throw new Error(
                "Download API returned an empty response."
            );
        }


        const data =
            JSON.parse(
                responseText
            );


        if (
            !data.downloadUrl
        ) {

            throw new Error(
                "Download URL was not returned."
            );
        }


        window.open(
            data.downloadUrl,
            "_blank"
        );


    } catch (error) {

        console.error(
            "Download error:",
            error
        );


        alert(
            "Download failed: " +
            error.message
        );
    }
}


// ============================================================
// DELETE DOCUMENT
// ============================================================

async function deleteDocument(
    documentId
) {

    if (
        !confirm(
            "Are you sure you want to delete this document?"
        )
    ) {

        return;
    }


    try {

        const response =
            await fetch(
                DELETE_API +
                "/" +
                encodeURIComponent(
                    documentId
                ),
                {
                    method: "DELETE"
                }
            );


        const responseText =
            await response.text();


        if (!response.ok) {

            throw new Error(
                "Delete failed. HTTP " +
                response.status +
                " " +
                responseText
            );
        }


        let message =
            "Document deleted successfully.";


        if (responseText) {

            try {

                const data =
                    JSON.parse(
                        responseText
                    );


                if (
                    data.message
                ) {

                    message =
                        data.message;
                }

            } catch (ignored) {
            }
        }


        alert(
            message
        );


        loadDocuments();


    } catch (error) {

        console.error(
            "Delete error:",
            error
        );


        alert(
            "Delete failed: " +
            error.message
        );
    }
}


// ============================================================
// REPLACEMENT FILE LISTENER
// ============================================================

function setupReplaceFileListener() {

    const replaceFile =
        document.getElementById(
            "replaceFile"
        );


    const replacementInfo =
        document.getElementById(
            "replacementInfo"
        );


    if (!replaceFile) {
        return;
    }


    replaceFile.addEventListener(
        "change",
        function () {

            if (
                !replaceFile.files ||
                replaceFile.files.length === 0
            ) {

                replacementInfo.innerHTML =
                    "";

                return;
            }


            const file =
                replaceFile.files[0];


            replacementInfo.innerHTML =
                "Selected: <strong>" +
                escapeHtml(
                    file.name
                ) +
                "</strong> (" +
                escapeHtml(
                    formatFileSize(
                        file.size
                    )
                ) +
                ")";


            // If replacement file is selected,
            // clear text editor so both aren't changed.

            const textEditor =
                document.getElementById(
                    "textEditor"
                );


            if (textEditor) {

                textEditor.value =
                    originalTextContent;
            }

        }
    );
}


// ============================================================
// MODAL CLOSE
// ============================================================

function closeEditModal() {

    const modal =
        document.getElementById(
            "editModal"
        );


    modal.style.display =
        "none";


    currentEditDocument =
        null;


    originalTextContent =
        "";


    document.getElementById(
        "replaceFile"
    ).value = "";


    document.getElementById(
        "textEditor"
    ).value = "";


    document.getElementById(
        "editStatus"
    ).innerHTML = "";


    document.getElementById(
        "replacementInfo"
    ).innerHTML = "";
}


// ============================================================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// ============================================================

function setupModalCloseHandler() {

    const modal =
        document.getElementById(
            "editModal"
        );


    modal.addEventListener(
        "click",
        function (event) {

            if (
                event.target === modal
            ) {

                closeEditModal();
            }

        }
    );
}


// ============================================================
// ESC KEY CLOSE
// ============================================================

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape"
        ) {

            const modal =
                document.getElementById(
                    "editModal"
                );


            if (
                modal &&
                modal.style.display ===
                "flex"
            ) {

                closeEditModal();
            }
        }
    }
);


// ============================================================
// CHECK TEXT FILE
// ============================================================

function isTextFile(
    fileName,
    fileType
) {

    if (
        fileType &&
        TEXT_MIME_TYPES.includes(
            fileType.toLowerCase()
        )
    ) {

        return true;
    }


    const extension =
        getFileExtension(
            fileName
        );


    return TEXT_EXTENSIONS.includes(
        extension
    );
}


// ============================================================
// GET FILE EXTENSION
// ============================================================

function getFileExtension(
    fileName
) {

    if (!fileName) {
        return "";
    }


    const parts =
        fileName
            .toLowerCase()
            .split(".");


    if (
        parts.length < 2
    ) {

        return "";
    }


    return parts[
        parts.length - 1
    ];
}


// ============================================================
// FORMAT FILE SIZE
// ============================================================

function formatFileSize(
    bytes
) {

    if (
        bytes === null ||
        bytes === undefined ||
        bytes === ""
    ) {

        return "Unknown";
    }


    const size =
        Number(bytes);


    if (
        Number.isNaN(size)
    ) {

        return "Unknown";
    }


    if (
        size < 1024
    ) {

        return size +
            " B";
    }


    if (
        size < 1024 * 1024
    ) {

        return (
            size / 1024
        ).toFixed(2) +
        " KB";
    }


    if (
        size < 1024 * 1024 * 1024
    ) {

        return (
            size /
            (
                1024 *
                1024
            )
        ).toFixed(2) +
        " MB";
    }


    return (
        size /
        (
            1024 *
            1024 *
            1024
        )
    ).toFixed(2) +
    " GB";
}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(
    value
) {

    if (!value) {
        return "";
    }


    try {

        const date =
            new Date(
                value
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return value;
        }


        return date.toLocaleString();

    } catch (error) {

        return value;
    }
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


// ============================================================
// ESCAPE JAVASCRIPT
// ============================================================

function escapeJs(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    return String(value)
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        )
        .replace(
            /"/g,
            '\\"'
        )
        .replace(
            /\r/g,
            "\\r"
        )
        .replace(
            /\n/g,
            "\\n"
        );
}


// ============================================================
// SLEEP
// ============================================================

function sleep(
    milliseconds
) {

    return new Promise(
        function (resolve) {

            setTimeout(
                resolve,
                milliseconds
            );

        }
    );
}