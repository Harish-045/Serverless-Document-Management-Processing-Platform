// ============================================================
// SERVERLESS DOCUMENT PLATFORM
// Frontend JavaScript
// Cognito Authentication + S3 + API Gateway
// ============================================================


// ============================================================
// 1. COGNITO CONFIGURATION
// ============================================================

const COGNITO_USER_POOL_ID =
    "ap-south-1_XKjKqLgtq";

const COGNITO_CLIENT_ID =
    "7g4a8v3vad2c3hfdh0h18771ll";

const cognitoPoolData = {
    UserPoolId: COGNITO_USER_POOL_ID,
    ClientId: COGNITO_CLIENT_ID
};

const userPool =
    new AmazonCognitoIdentity.CognitoUserPool(
        cognitoPoolData
    );

let pendingSignupEmail = "";


// ============================================================
// 2. API CONFIGURATION
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
// 3. APPLICATION START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "Cloud Document Platform started."
        );

        checkAuthentication();

    }
);


// ============================================================
// 4. GET CURRENT USER
// ============================================================

function getCurrentUser() {

    return userPool.getCurrentUser();

}


// ============================================================
// 5. GET COGNITO ACCESS TOKEN
// ============================================================

function getAccessToken() {

    return new Promise(
        function (resolve, reject) {

            const user =
                getCurrentUser();

            if (!user) {

                reject(
                    new Error(
                        "User is not logged in."
                    )
                );

                return;
            }

            user.getSession(
                function (error, session) {

                    if (error) {

                        reject(error);

                        return;

                    }

                    if (
                        !session ||
                        !session.isValid()
                    ) {

                        reject(
                            new Error(
                                "Login session has expired."
                            )
                        );

                        return;

                    }

                    const token =
                        session
                            .getAccessToken()
                            .getJwtToken();

                    resolve(token);

                }
            );

        }
    );

}


// ============================================================
// 6. AUTHENTICATED API REQUEST
// ============================================================

async function authenticatedFetch(
    url,
    options = {}
) {

    const token =
        await getAccessToken();

    const requestOptions = {
        ...options
    };

    requestOptions.headers = {

        ...(options.headers || {}),

        "Authorization":
            "Bearer " + token

    };

    return fetch(
        url,
        requestOptions
    );

}


// ============================================================
// 7. CHECK AUTHENTICATION
// ============================================================

function checkAuthentication() {

    const user =
        getCurrentUser();

    if (!user) {

        console.log(
            "No logged-in user."
        );

        showLogin();

        return;

    }

    user.getSession(
        function (error, session) {

            if (
                error ||
                !session ||
                !session.isValid()
            ) {

                console.log(
                    "No valid Cognito session."
                );

                showLogin();

                return;

            }

            console.log(
                "Valid Cognito session found."
            );

            showApplication(user);

        }
    );

}


// ============================================================
// 8. LOGIN
// ============================================================

function loginUser() {

    const emailInput =
        document.getElementById(
            "loginEmail"
        );

    const passwordInput =
        document.getElementById(
            "loginPassword"
        );

    if (
        !emailInput ||
        !passwordInput
    ) {

        alert(
            "Login fields not found."
        );

        return;

    }

    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;

    if (!email || !password) {

        alert(
            "Please enter email and password."
        );

        return;

    }

    const authenticationDetails =
        new AmazonCognitoIdentity.AuthenticationDetails(
            {
                Username: email,
                Password: password
            }
        );

    const cognitoUser =
        new AmazonCognitoIdentity.CognitoUser(
            {
                Username: email,
                Pool: userPool
            }
        );

    console.log(
        "Logging in..."
    );

    cognitoUser.authenticateUser(
        authenticationDetails,
        {

            onSuccess:
                function (session) {

                    console.log(
                        "Login successful."
                    );

                    console.log(
                        "Access token received."
                    );

                    showApplication(
                        cognitoUser
                    );

                },

            onFailure:
                function (error) {

                    console.error(
                        "Login failed:",
                        error
                    );

                    alert(
                        error.message ||
                        "Login failed."
                    );

                },

            newPasswordRequired:
                function () {

                    alert(
                        "A new password is required."
                    );

                }

        }
    );

}


// ============================================================
// 9. SIGN UP
// ============================================================

function signupUser() {

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;

    if (!name || !email || !password) {
        alert("Please fill all fields.");
        return;
    }

    const attributeList = [];

    attributeList.push(
        new AmazonCognitoIdentity.CognitoUserAttribute({
            Name: "email",
            Value: email
        })
    );

    attributeList.push(
        new AmazonCognitoIdentity.CognitoUserAttribute({
            Name: "name",
            Value: name
        })
    );

    userPool.signUp(
        email,
        password,
        attributeList,
        null,
        function(err, result) {

            if (err) {
                console.error("Signup failed:", err);
                alert(err.message || "Signup failed.");
                return;
            }

            console.log("Signup successful:", result);

            alert(
                "Signup successful! Please check your email for the verification code."
            );

            showVerification();
        }
    );
}


// ============================================================
// 10. VERIFY EMAIL
// ============================================================

function confirmSignup() {

    const codeInput =
        document.getElementById(
            "verificationCode"
        );

    if (!codeInput) {

        alert(
            "Verification field not found."
        );

        return;

    }

    const code =
        codeInput.value.trim();

    if (!pendingSignupEmail) {

        alert(
            "Signup email not found."
        );

        return;

    }

    if (!code) {

        alert(
            "Please enter the verification code."
        );

        return;

    }

    const cognitoUser =
        new AmazonCognitoIdentity.CognitoUser(
            {
                Username:
                    pendingSignupEmail,

                Pool:
                    userPool
            }
        );

    cognitoUser.confirmRegistration(
        code,
        true,
        function (error, result) {

            if (error) {

                console.error(
                    "Verification failed:",
                    error
                );

                alert(
                    error.message ||
                    "Verification failed."
                );

                return;

            }

            console.log(
                "Email verified."
            );

            alert(
                "Email verified successfully. Please login."
            );

            pendingSignupEmail = "";

            codeInput.value = "";

            showLogin();

        }
    );

}


// ============================================================
// 11. SHOW LOGIN
// ============================================================

function showLogin() {

    const authSection =
        document.getElementById(
            "authSection"
        );

    const appSection =
        document.getElementById(
            "appSection"
        );

    const loginForm =
        document.getElementById(
            "loginForm"
        );

    const signupForm =
        document.getElementById(
            "signupForm"
        );

    const verificationForm =
        document.getElementById(
            "verificationForm"
        );

    if (authSection) {

        authSection.style.display =
            "block";

    }

    if (appSection) {

        appSection.style.display =
            "none";

    }

    if (loginForm) {

        loginForm.style.display =
            "block";

    }

    if (signupForm) {

        signupForm.style.display =
            "none";

    }

    if (verificationForm) {

        verificationForm.style.display =
            "none";

    }

}


// ============================================================
// 12. SHOW SIGNUP
// ============================================================

function showSignup() {

    const loginForm =
        document.getElementById(
            "loginForm"
        );

    const signupForm =
        document.getElementById(
            "signupForm"
        );

    const verificationForm =
        document.getElementById(
            "verificationForm"
        );

    if (loginForm) {

        loginForm.style.display =
            "none";

    }

    if (signupForm) {

        signupForm.style.display =
            "block";

    }

    if (verificationForm) {

        verificationForm.style.display =
            "none";

    }

}


// ============================================================
// 13. SHOW VERIFICATION
// ============================================================

function showVerification() {

    const loginForm =
        document.getElementById(
            "loginForm"
        );

    const signupForm =
        document.getElementById(
            "signupForm"
        );

    const verificationForm =
        document.getElementById(
            "verificationForm"
        );

    if (loginForm) {

        loginForm.style.display =
            "none";

    }

    if (signupForm) {

        signupForm.style.display =
            "none";

    }

    if (verificationForm) {

        verificationForm.style.display =
            "block";

    }

}


// ============================================================
// 14. SHOW MAIN APPLICATION
// ============================================================

function showApplication(user) {

    const authSection =
        document.getElementById(
            "authSection"
        );

    const appSection =
        document.getElementById(
            "appSection"
        );

    if (authSection) {

        authSection.style.display =
            "none";

    }

    if (appSection) {

        appSection.style.display =
            "block";

    }

    displayLoggedInUser();

    loadDocuments();

}


// ============================================================
// 15. DISPLAY LOGGED-IN USER
// ============================================================

function displayLoggedInUser() {

    const user =
        getCurrentUser();

    if (!user) {

        return;

    }

    const userDisplay =
        document.getElementById(
            "loggedInUser"
        );

    if (!userDisplay) {

        return;

    }

    user.getUserAttributes(
        function (error, attributes) {

            if (error) {

                console.error(
                    "Could not get user attributes:",
                    error
                );

                userDisplay.textContent =
                    "Logged in as: " +
                    user.getUsername();

                return;

            }

            let email = "";

            if (attributes) {

                attributes.forEach(
                    function (attribute) {

                        if (
                            attribute.getName() ===
                            "email"
                        ) {

                            email =
                                attribute.getValue();

                        }

                    }
                );

            }

            userDisplay.textContent =
                "Logged in as: " +
                (
                    email ||
                    user.getUsername()
                );

        }
    );

}


// ============================================================
// 16. LOGOUT
// ============================================================

function logoutUser() {

    const user =
        getCurrentUser();

    if (user) {

        user.signOut();

    }

    console.log(
        "User logged out."
    );

    closeEditModal();

    showLogin();

}


// ============================================================
// 17. UPLOAD DOCUMENT
// ============================================================

async function uploadDocument() {

    const fileInput =
        document.getElementById(
            "fileInput"
        );

    const uploadStatus =
        document.getElementById(
            "uploadStatus"
        );

    if (!fileInput) {

        alert(
            "File input not found."
        );

        return;

    }

    const file =
        fileInput.files[0];

    if (!file) {

        alert(
            "Please select a file."
        );

        return;

    }

    try {

        if (uploadStatus) {

            uploadStatus.textContent =
                "Generating secure upload URL...";

        }

        const response =
            await authenticatedFetch(
                UPLOAD_URL_API,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            {

                                fileName:
                                    file.name,

                                contentType:
                                    file.type ||
                                    "application/octet-stream"

                            }
                        )

                }
            );

        if (response.status === 401) {

            handleUnauthorized();

            return;

        }

        if (!response.ok) {

            const errorText =
                await response.text();

            throw new Error(
                "Upload URL request failed: " +
                response.status +
                " " +
                errorText
            );

        }

        const uploadData =
            await response.json();

        console.log(
            "Upload URL generated."
        );

        if (!uploadData.uploadUrl) {

            throw new Error(
                "Upload URL was not returned."
            );

        }

        if (uploadStatus) {

            uploadStatus.textContent =
                "Uploading to S3...";

        }

        // ====================================================
        // DIRECT S3 UPLOAD
        // IMPORTANT:
        // Do NOT send Cognito Authorization here.
        // ====================================================

        const s3Response =
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

        if (!s3Response.ok) {

            throw new Error(
                "S3 upload failed: " +
                s3Response.status
            );

        }

        console.log(
            "S3 upload successful."
        );

        if (uploadStatus) {

            uploadStatus.textContent =
                "Upload successful.";

        }

        alert(
            "File uploaded successfully."
        );

        fileInput.value = "";

        await sleep(3000);

        await loadDocuments();

    }
    catch (error) {

        console.error(
            "Upload error:",
            error
        );

        if (uploadStatus) {

            uploadStatus.textContent =
                "Upload failed.";

        }

        alert(
            "Upload failed: " +
            error.message
        );

    }

}


// ============================================================
// 18. LOAD DOCUMENTS
// ============================================================

async function loadDocuments() {

    const container =
        document.getElementById(
            "documentsContainer"
        );

    if (!container) {

        console.error(
            "documentsContainer not found."
        );

        return;

    }

    container.innerHTML =
        '<p class="loading">Loading documents...</p>';

    try {

        const response =
            await authenticatedFetch(
                DOCUMENTS_API,
                {

                    method: "GET"

                }
            );

        if (response.status === 401) {

            handleUnauthorized();

            return;

        }

        if (!response.ok) {

            const errorText =
                await response.text();

            throw new Error(
                "Failed to load documents: " +
                response.status +
                " " +
                errorText
            );

        }

        const documents =
            await response.json();

        console.log(
            "Documents received:",
            documents
        );

        displayDocuments(
            documents
        );

    }
    catch (error) {

        console.error(
            "Load documents error:",
            error
        );

        container.innerHTML =
            `
            <p>
                Unable to load documents.
            </p>
            `;

    }

}


// ============================================================
// 19. DISPLAY DOCUMENTS
// ============================================================

function displayDocuments(
    documents
) {

    const container =
        document.getElementById(
            "documentsContainer"
        );

    if (!container) {

        return;

    }

    container.innerHTML = "";

    if (
        !documents ||
        documents.length === 0
    ) {

        container.innerHTML =
            `
            <p>
                No documents found.
            </p>
            `;

        return;

    }

    documents.forEach(
        function (doc) {

            const card =
                createDocumentCard(
                    doc
                );

            container.appendChild(
                card
            );

        }
    );

}


// ============================================================
// 20. CREATE DOCUMENT CARD
// ============================================================

function createDocumentCard(
    doc
) {

    const card =
        document.createElement(
            "div"
        );

    card.className =
        "document-card";

    const documentId =
        doc.documentId || "";

    const fileName =
        doc.fileName ||
        "Unnamed document";

    const fileType =
        doc.fileType ||
        "Unknown";

    const status =
        doc.status ||
        "UNKNOWN";

    const fileSize =
        formatFileSize(
            doc.fileSize
        );

    const escapedId =
        escapeJs(documentId);

    const escapedName =
        escapeJs(fileName);

    const textFile =
        isTextFile(
            fileName,
            fileType
        );

    card.innerHTML =
        `

        <div class="document-info">

            <h3>
                ${escapeHtml(fileName)}
            </h3>

            <p>
                <strong>ID:</strong>
                ${escapeHtml(documentId)}
            </p>

            <p>
                <strong>Type:</strong>
                ${escapeHtml(fileType)}
            </p>

            <p>
                <strong>Size:</strong>
                ${escapeHtml(fileSize)}
            </p>

            <p>
                <strong>Status:</strong>
                ${escapeHtml(status)}
            </p>

        </div>

        <div class="document-actions">

            <button
                onclick="downloadDocument('${escapedId}')"
            >
                Download
            </button>

            ${
                textFile
                    ?
                    `
                    <button
                        onclick="editTextDocument(
                            '${escapedId}',
                            '${escapedName}',
                            '${escapeJs(fileType)}'
                        )"
                    >
                        Edit Text
                    </button>
                    `
                    :
                    ""
            }

            <button
                onclick="openEditModal(
                    '${escapedId}',
                    '${escapedName}',
                    '${escapeJs(fileType)}'
                )"
            >
                Edit
            </button>

            <button
                onclick="deleteDocument('${escapedId}')"
            >
                Delete
            </button>

        </div>

        `;

    return card;

}


// ============================================================
// 21. DOWNLOAD DOCUMENT
// ============================================================

async function downloadDocument(
    documentId
) {

    try {

        const response =
            await authenticatedFetch(
                DOWNLOAD_URL_API +
                "/" +
                encodeURIComponent(
                    documentId
                ) +
                "/download-url",
                {

                    method: "GET"

                }
            );

        if (response.status === 401) {

            handleUnauthorized();

            return;

        }

        if (response.status === 403) {

            alert(
                "You are not authorized to download this document."
            );

            return;

        }

        if (!response.ok) {

            const errorText =
                await response.text();

            throw new Error(
                "Download request failed: " +
                response.status +
                " " +
                errorText
            );

        }

        const data =
            await response.json();

        if (!data.downloadUrl) {

            throw new Error(
                "Download URL was not returned."
            );

        }

        window.open(
            data.downloadUrl,
            "_blank"
        );

    }
    catch (error) {

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
// 22. DELETE DOCUMENT
// ============================================================

async function deleteDocument(
    documentId
) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this document?"
        );

    if (!confirmed) {

        return;

    }

    try {

        const response =
            await authenticatedFetch(
                DELETE_API +
                "/" +
                encodeURIComponent(
                    documentId
                ),
                {

                    method: "DELETE"

                }
            );

        if (response.status === 401) {

            handleUnauthorized();

            return;

        }

        if (response.status === 403) {

            alert(
                "You are not authorized to delete this document."
            );

            return;

        }

        if (!response.ok) {

            const errorText =
                await response.text();

            throw new Error(
                "Delete failed: " +
                response.status +
                " " +
                errorText
            );

        }

        alert(
            "Document deleted successfully."
        );

        await loadDocuments();

    }
    catch (error) {

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
// 23. OPEN EDIT MODAL
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

    const replaceFile =
        document.getElementById(
            "replaceFile"
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

    const replacementInfo =
        document.getElementById(
            "replacementInfo"
        );

    if (!modal) {

        alert(
            "Edit modal not found."
        );

        return;

    }

    if (documentIdInput) {

        documentIdInput.value =
            documentId;

    }

    if (fileNameInput) {

        fileNameInput.value =
            fileName;

    }

    if (replaceFile) {

        replaceFile.value = "";

    }

    if (replacementInfo) {

        replacementInfo.textContent =
            "";

    }

    if (editStatus) {

        editStatus.textContent =
            "";

    }

    // --------------------------------------------------------
    // TEXT FILE
    // --------------------------------------------------------

    if (
        isTextFile(
            fileName,
            fileType
        )
    ) {

        if (textEditorSection) {

            textEditorSection.style.display =
                "block";

        }

        if (textEditor) {

            textEditor.value =
                "Loading file content...";

        }

        modal.style.display =
            "flex";

        try {

            const response =
                await authenticatedFetch(
                    DOWNLOAD_URL_API +
                    "/" +
                    encodeURIComponent(
                        documentId
                    ) +
                    "/download-url",
                    {

                        method: "GET"

                    }
                );

            if (!response.ok) {

                throw new Error(
                    "Could not get download URL."
                );

            }

            const data =
                await response.json();

            const fileResponse =
                await fetch(
                    data.downloadUrl
                );

            if (!fileResponse.ok) {

                throw new Error(
                    "Could not download text file."
                );

            }

            const text =
                await fileResponse.text();

            if (textEditor) {

                textEditor.value =
                    text;

            }

        }
        catch (error) {

            console.error(
                "Text loading error:",
                error
            );

            if (textEditor) {

                textEditor.value =
                    "";

            }

            if (editStatus) {

                editStatus.textContent =
                    "Could not load text content.";

            }

        }

    }
    else {

        if (textEditorSection) {

            textEditorSection.style.display =
                "none";

        }

        modal.style.display =
            "flex";

    }

}


// ============================================================
// 24. CLOSE EDIT MODAL
// ============================================================

function closeEditModal() {

    const modal =
        document.getElementById(
            "editModal"
        );

    if (modal) {

        modal.style.display =
            "none";

    }

}


// ============================================================
// 25. SAVE DOCUMENT CHANGES
// ============================================================

async function saveDocumentChanges() {

    const documentIdInput =
        document.getElementById(
            "editDocumentId"
        );

    const fileNameInput =
        document.getElementById(
            "editFileName"
        );

    const replaceFile =
        document.getElementById(
            "replaceFile"
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

    if (
        !documentIdInput ||
        !fileNameInput
    ) {

        alert(
            "Edit fields not found."
        );

        return;

    }

    const documentId =
        documentIdInput.value.trim();

    const newFileName =
        fileNameInput.value.trim();

    if (!documentId) {

        alert(
            "Document ID is missing."
        );

        return;

    }

    if (!newFileName) {

        alert(
            "File name cannot be empty."
        );

        return;

    }

    try {

        if (editStatus) {

            editStatus.textContent =
                "Saving changes...";

        }

        // ====================================================
        // STEP 1: REPLACE FILE IF SELECTED
        // ====================================================

        if (
            replaceFile &&
            replaceFile.files.length > 0
        ) {

            const file =
                replaceFile.files[0];

            if (editStatus) {

                editStatus.textContent =
                    "Generating replacement URL...";
            }

            const replacementResponse =
                await authenticatedFetch(
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
                            JSON.stringify(
                                {

                                    contentType:
                                        file.type ||
                                        "application/octet-stream"

                                }
                            )

                    }
                );

            if (
                replacementResponse.status ===
                401
            ) {

                handleUnauthorized();

                return;

            }

            if (
                replacementResponse.status ===
                403
            ) {

                alert(
                    "You are not authorized to replace this document."
                );

                return;

            }

            if (!replacementResponse.ok) {

                const errorText =
                    await replacementResponse.text();

                throw new Error(
                    "Replacement URL request failed: " +
                    replacementResponse.status +
                    " " +
                    errorText
                );

            }

            const replacementData =
                await replacementResponse.json();

            if (
                !replacementData.uploadUrl
            ) {

                throw new Error(
                    "Replacement URL was not returned."
                );

            }

            if (editStatus) {

                editStatus.textContent =
                    "Uploading replacement to S3...";

            }

            // ------------------------------------------------
            // DIRECT S3 UPLOAD
            // ------------------------------------------------

            const s3Response =
                await fetch(
                    replacementData.uploadUrl,
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

            if (!s3Response.ok) {

                throw new Error(
                    "S3 replacement upload failed: " +
                    s3Response.status
                );

            }

            if (editStatus) {

                editStatus.textContent =
                    "Replacement uploaded successfully.";

            }

            // Give S3 -> Lambda processing some time.
            await sleep(3000);

        }


        // ====================================================
        // STEP 2: SAVE TEXT CONTENT
        // ====================================================

        if (
            textEditorSection &&
            textEditorSection.style.display !== "none" &&
            textEditor
        ) {

            const content =
                textEditor.value;

            const contentSize =
                new Blob(
                    [content]
                ).size;

            if (
                contentSize >
                2 * 1024 * 1024
            ) {

                throw new Error(
                    "Text file cannot exceed 2 MB."
                );

            }

            if (editStatus) {

                editStatus.textContent =
                    "Saving text content...";

            }

            const textContentType =
                getTextContentType(
                    newFileName
                );

            const textResponse =
                await authenticatedFetch(
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
                            JSON.stringify(
                                {

                                    contentType:
                                        textContentType

                                }
                            )

                    }
                );

            if (
                textResponse.status ===
                401
            ) {

                handleUnauthorized();

                return;

            }

            if (
                textResponse.status ===
                403
            ) {

                alert(
                    "You are not authorized to update this document."
                );

                return;

            }

            if (!textResponse.ok) {

                const errorText =
                    await textResponse.text();

                throw new Error(
                    "Could not generate text replacement URL: " +
                    textResponse.status +
                    " " +
                    errorText
                );

            }

            const textData =
                await textResponse.json();

            if (!textData.uploadUrl) {

                throw new Error(
                    "Text replacement URL missing."
                );

            }

            const textUploadResponse =
                await fetch(
                    textData.uploadUrl,
                    {

                        method: "PUT",

                        headers: {

                            "Content-Type":
                                textContentType

                        },

                        body:
                            content

                    }
                );

            if (!textUploadResponse.ok) {

                throw new Error(
                    "S3 text upload failed: " +
                    textUploadResponse.status
                );

            }

            await sleep(3000);

        }


        // ====================================================
        // STEP 3: RENAME DOCUMENT
        // ====================================================

        if (editStatus) {

            editStatus.textContent =
                "Updating file name...";

        }

        const renameResponse =
            await authenticatedFetch(
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
                        JSON.stringify(
                            {

                                fileName:
                                    newFileName

                            }
                        )

                }
            );

        if (
            renameResponse.status ===
            401
        ) {

            handleUnauthorized();

            return;

        }

        if (
            renameResponse.status ===
            403
        ) {

            alert(
                "You are not authorized to rename this document."
            );

            return;

        }

        if (!renameResponse.ok) {

            const errorText =
                await renameResponse.text();

            throw new Error(
                "Rename failed: " +
                renameResponse.status +
                " " +
                errorText
            );

        }

        if (editStatus) {

            editStatus.textContent =
                "Changes saved successfully.";

        }

        alert(
            "Document updated successfully."
        );

        closeEditModal();

        await loadDocuments();

    }
    catch (error) {

        console.error(
            "Save changes error:",
            error
        );

        if (editStatus) {

            editStatus.textContent =
                "Error: " +
                error.message;

        }

        alert(
            "Could not save changes: " +
            error.message
        );

    }

}


// ============================================================
// 26. TEXT DOCUMENT QUICK EDIT
// ============================================================

async function editTextDocument(
    documentId,
    fileName,
    fileType
) {

    await openEditModal(
        documentId,
        fileName,
        fileType
    );

}


// ============================================================
// 27. TEXT FILE DETECTION
// ============================================================

function isTextFile(
    fileName,
    fileType
) {

    if (
        fileType &&
        fileType.startsWith(
            "text/"
        )
    ) {

        return true;

    }

    const extension =
        fileName
            .split(".")
            .pop()
            .toLowerCase();

    const textExtensions = [

        "txt",
        "csv",
        "json",
        "xml",
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
        "md",
        "log"

    ];

    return textExtensions.includes(
        extension
    );

}


// ============================================================
// 28. TEXT CONTENT TYPE
// ============================================================

function getTextContentType(
    fileName
) {

    const extension =
        fileName
            .split(".")
            .pop()
            .toLowerCase();

    const contentTypes = {

        txt:
            "text/plain",

        csv:
            "text/csv",

        json:
            "application/json",

        xml:
            "application/xml",

        html:
            "text/html",

        htm:
            "text/html",

        css:
            "text/css",

        js:
            "text/javascript",

        java:
            "text/plain",

        py:
            "text/plain",

        c:
            "text/plain",

        cpp:
            "text/plain",

        h:
            "text/plain",

        hpp:
            "text/plain",

        md:
            "text/markdown",

        log:
            "text/plain"

    };

    return (
        contentTypes[extension] ||
        "text/plain"
    );

}


// ============================================================
// 29. FORMAT FILE SIZE
// ============================================================

function formatFileSize(
    bytes
) {

    if (
        bytes === undefined ||
        bytes === null ||
        bytes === ""
    ) {

        return "Unknown";

    }

    bytes =
        Number(bytes);

    if (
        Number.isNaN(bytes)
    ) {

        return "Unknown";

    }

    if (bytes === 0) {

        return "0 Bytes";

    }

    const units = [

        "Bytes",
        "KB",
        "MB",
        "GB",
        "TB"

    ];

    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );

    const size =
        bytes /
        Math.pow(
            1024,
            index
        );

    return (
        size.toFixed(2) +
        " " +
        units[index]
    );

}


// ============================================================
// 30. ESCAPE HTML
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
// 31. ESCAPE JAVASCRIPT
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
// 32. SLEEP
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


// ============================================================
// 33. HANDLE UNAUTHORIZED
// ============================================================

function handleUnauthorized() {

    console.log(
        "401 Unauthorized."
    );

    const user =
        getCurrentUser();

    if (user) {

        user.signOut();

    }

    showLogin();

    alert(
        "Your login session has expired. Please login again."
    );

}


// ============================================================
// 34. CLOSE MODAL WHEN CLICKING OUTSIDE
// ============================================================

window.addEventListener(
    "click",
    function (event) {

        const modal =
            document.getElementById(
                "editModal"
            );

        if (
            modal &&
            event.target === modal
        ) {

            closeEditModal();

        }

    }
);