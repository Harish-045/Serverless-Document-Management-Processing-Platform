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
// 3. DOM CONTENT LOADED
// ============================================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("Application started");

    checkAuthentication();

});


// ============================================================
// 4. GET CURRENT COGNITO USER
// ============================================================

function getCurrentUser() {

    return userPool.getCurrentUser();

}


// ============================================================
// 5. GET ACCESS TOKEN
// ============================================================

function getAccessToken() {

    return new Promise(function (resolve, reject) {

        const user = getCurrentUser();

        if (!user) {

            reject(
                new Error("User is not logged in.")
            );

            return;
        }

        user.getSession(function (error, session) {

            if (error) {

                reject(error);

                return;
            }

            if (!session || !session.isValid()) {

                reject(
                    new Error("Login session has expired.")
                );

                return;
            }

            const accessToken =
                session
                    .getAccessToken()
                    .getJwtToken();

            resolve(accessToken);

        });

    });

}


// ============================================================
// 6. AUTHENTICATED FETCH
// ============================================================

async function authenticatedFetch(url, options = {}) {

    const token = await getAccessToken();

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

        showLogin();

        return;
    }

    user.getSession(function (error, session) {

        if (
            error ||
            !session ||
            !session.isValid()
        ) {

            console.log(
                "No valid session."
            );

            showLogin();

            return;
        }

        console.log(
            "User already logged in."
        );

        showApplication(user);

    });

}


// ============================================================
// 8. LOGIN USER
// ============================================================

function loginUser() {

    const emailElement =
        document.getElementById("loginEmail");

    const passwordElement =
        document.getElementById("loginPassword");

    if (!emailElement || !passwordElement) {

        alert(
            "Login fields not found."
        );

        return;
    }

    const email =
        emailElement.value.trim();

    const password =
        passwordElement.value;

    if (!email || !password) {

        alert(
            "Please enter email and password."
        );

        return;
    }

    const authenticationData = {

        Username: email,

        Password: password

    };

    const authenticationDetails =
        new AmazonCognitoIdentity.AuthenticationDetails(
            authenticationData
        );

    const userData = {

        Username: email,

        Pool: userPool

    };

    const cognitoUser =
        new AmazonCognitoIdentity.CognitoUser(
            userData
        );

    cognitoUser.authenticateUser(
        authenticationDetails,
        {

            onSuccess: function (session) {

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

            onFailure: function (error) {

                console.error(
                    "Login failed:",
                    error
                );

                alert(
                    error.message ||
                    "Login failed."
                );

            },

            newPasswordRequired: function () {

                alert(
                    "A new password is required."
                );

            }

        }
    );

}


// ============================================================
// 9. SIGN UP USER
// ============================================================

function signupUser() {

    const emailElement =
        document.getElementById("signupEmail");

    const passwordElement =
        document.getElementById("signupPassword");

    if (!emailElement || !passwordElement) {

        alert(
            "Signup fields not found."
        );

        return;
    }

    const email =
        emailElement.value.trim();

    const password =
        passwordElement.value;

    if (!email || !password) {

        alert(
            "Please enter email and password."
        );

        return;
    }

    if (password.length < 8) {

        alert(
            "Password must contain at least 8 characters."
        );

        return;
    }

    const attributeList = [];

    const emailAttribute =
        new AmazonCognitoIdentity.CognitoUserAttribute(
            {
                Name: "email",
                Value: email
            }
        );

    attributeList.push(
        emailAttribute
    );

    userPool.signUp(
        email,
        password,
        attributeList,
        null,
        function (error, result) {

            if (error) {

                console.error(
                    "Signup failed:",
                    error
                );

                alert(
                    error.message ||
                    "Signup failed."
                );

                return;
            }

            pendingSignupEmail =
                email;

            console.log(
                "Signup successful."
            );

            alert(
                "Account created. Please check your email for the verification code."
            );

            showVerification();

        }
    );

}


// ============================================================
// 10. CONFIRM SIGNUP
// ============================================================

function confirmSignup() {

    const codeElement =
        document.getElementById("verificationCode");

    if (!codeElement) {

        alert(
            "Verification code field not found."
        );

        return;
    }

    const code =
        codeElement.value.trim();

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

    const userData = {

        Username:
            pendingSignupEmail,

        Pool:
            userPool

    };

    const cognitoUser =
        new AmazonCognitoIdentity.CognitoUser(
            userData
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
                "Email verification successful."
            );

            alert(
                "Account verified successfully. You can now login."
            );

            pendingSignupEmail = "";

            showLogin();

        }
    );

}


// ============================================================
// 11. RESEND VERIFICATION CODE
// ============================================================

function resendVerificationCode() {

    if (!pendingSignupEmail) {

        alert(
            "Signup email not found."
        );

        return;
    }

    const userData = {

        Username:
            pendingSignupEmail,

        Pool:
            userPool

    };

    const cognitoUser =
        new AmazonCognitoIdentity.CognitoUser(
            userData
        );

    cognitoUser.resendConfirmationCode(
        function (error, result) {

            if (error) {

                console.error(
                    error
                );

                alert(
                    error.message ||
                    "Could not resend verification code."
                );

                return;
            }

            alert(
                "A new verification code has been sent."
            );

        }
    );

}


// ============================================================
// 12. SHOW LOGIN
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
// 13. SHOW SIGNUP
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
// 14. SHOW VERIFICATION
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
// 15. SHOW APPLICATION
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
// 16. DISPLAY LOGGED-IN USER
// ============================================================

function displayLoggedInUser() {

    const user =
        getCurrentUser();

    if (!user) {

        return;
    }

    user.getUserAttributes(
        function (error, attributes) {

            if (error) {

                console.log(
                    "Could not get user attributes."
                );

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

            const userDisplay =
                document.getElementById(
                    "loggedInUser"
                );

            if (userDisplay) {

                userDisplay.textContent =
                    email ||
                    user.getUsername();

            }

        }
    );

}


// ============================================================
// 17. LOGOUT
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

    showLogin();

}


// ============================================================
// 18. UPLOAD DOCUMENT
// ============================================================

async function uploadDocument() {

    const fileInput =
        document.getElementById(
            "fileInput"
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

        console.log(
            "Requesting upload URL..."
        );

        const response =
            await authenticatedFetch(
                UPLOAD_URL_API,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        fileName:
                            file.name,

                        contentType:
                            file.type ||
                            "application/octet-stream"

                    })

                }
            );

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
            "Upload URL received:",
            uploadData
        );

        // ----------------------------------------------------
        // IMPORTANT:
        // This request goes DIRECTLY to S3.
        // Do NOT add Cognito Authorization header here.
        // ----------------------------------------------------

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

        alert(
            "File uploaded successfully."
        );

        fileInput.value = "";

        await loadDocuments();

    }
    catch (error) {

        console.error(
            "Upload error:",
            error
        );

        alert(
            "Upload failed: " +
            error.message
        );

    }

}


// ============================================================
// 19. LOAD DOCUMENTS
// ============================================================

async function loadDocuments() {

    try {

        console.log(
            "Loading documents..."
        );

        const response =
            await authenticatedFetch(
                DOCUMENTS_API,
                {

                    method: "GET"

                }
            );

        if (response.status === 401) {

            console.log(
                "Unauthorized. Session may have expired."
            );

            logoutUser();

            alert(
                "Your login session has expired. Please login again."
            );

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
            "Documents:",
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

        const documentsList =
            document.getElementById(
                "documentsList"
            );

        if (documentsList) {

            documentsList.innerHTML =
                "<p>Unable to load documents.</p>";

        }

    }

}


// ============================================================
// 20. DISPLAY DOCUMENTS
// ============================================================

function displayDocuments(documents) {

    const container =
        document.getElementById(
            "documentsList"
        );

    if (!container) {

        console.warn(
            "documentsList element not found."
        );

        return;
    }

    container.innerHTML = "";

    if (
        !documents ||
        documents.length === 0
    ) {

        container.innerHTML =
            "<p>No documents found.</p>";

        return;

    }

    documents.forEach(
        function (document) {

            const card =
                createDocumentCard(
                    document
                );

            container.appendChild(
                card
            );

        }
    );

}


// ============================================================
// 21. CREATE DOCUMENT CARD
// ============================================================

function createDocumentCard(document) {

    const card =
        window.document.createElement(
            "div"
        );

    card.className =
        "document-card";

    const fileName =
        document.fileName ||
        "Unnamed file";

    const documentId =
        document.documentId ||
        "";

    const status =
        document.status ||
        "UNKNOWN";

    const fileType =
        document.fileType ||
        "Unknown";

    const fileSize =
        formatFileSize(
            document.fileSize
        );

    card.innerHTML = `

        <div class="document-info">

            <h3>
                ${escapeHtml(fileName)}
            </h3>

            <p>
                ID:
                ${escapeHtml(documentId)}
            </p>

            <p>
                Type:
                ${escapeHtml(fileType)}
            </p>

            <p>
                Size:
                ${escapeHtml(fileSize)}
            </p>

            <p>
                Status:
                <strong>
                    ${escapeHtml(status)}
                </strong>
            </p>

        </div>

        <div class="document-actions">

            <button
                onclick="downloadDocument('${escapeJs(documentId)}')"
            >
                Download
            </button>

            <button
                onclick="renameDocument('${escapeJs(documentId)}', '${escapeJs(fileName)}')"
            >
                Rename
            </button>

            <button
                onclick="replaceDocument('${escapeJs(documentId)}')"
            >
                Replace
            </button>

            <button
                onclick="deleteDocument('${escapeJs(documentId)}')"
            >
                Delete
            </button>

        </div>

    `;

    return card;

}


// ============================================================
// 22. DOWNLOAD DOCUMENT
// ============================================================

async function downloadDocument(
    documentId
) {

    try {

        console.log(
            "Requesting download URL..."
        );

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

            logoutUser();

            alert(
                "Your login session has expired."
            );

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
                "Download URL request failed: " +
                response.status +
                " " +
                errorText
            );

        }

        const data =
            await response.json();

        console.log(
            "Download URL received."
        );

        if (!data.downloadUrl) {

            throw new Error(
                "Download URL not returned by server."
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
// 23. DELETE DOCUMENT
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

            logoutUser();

            alert(
                "Your login session has expired."
            );

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
// 24. RENAME DOCUMENT
// ============================================================

async function renameDocument(
    documentId,
    currentFileName
) {

    const newFileName =
        prompt(
            "Enter new file name:",
            currentFileName
        );

    if (
        newFileName === null
    ) {

        return;

    }

    const trimmedName =
        newFileName.trim();

    if (!trimmedName) {

        alert(
            "File name cannot be empty."
        );

        return;

    }

    try {

        const response =
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

                    body: JSON.stringify({

                        fileName:
                            trimmedName

                    })

                }
            );

        if (response.status === 401) {

            logoutUser();

            alert(
                "Your login session has expired."
            );

            return;

        }

        if (response.status === 403) {

            alert(
                "You are not authorized to rename this document."
            );

            return;

        }

        if (!response.ok) {

            const errorText =
                await response.text();

            throw new Error(
                "Rename failed: " +
                response.status +
                " " +
                errorText
            );

        }

        alert(
            "Document renamed successfully."
        );

        await loadDocuments();

    }
    catch (error) {

        console.error(
            "Rename error:",
            error
        );

        alert(
            "Rename failed: " +
            error.message
        );

    }

}


// ============================================================
// 25. REPLACE DOCUMENT
// ============================================================

async function replaceDocument(
    documentId
) {

    const input =
        window.document.createElement(
            "input"
        );

    input.type =
        "file";

    input.accept =
        "*/*";

    input.onchange =
        async function () {

            const file =
                input.files[0];

            if (!file) {

                return;

            }

            try {

                console.log(
                    "Requesting replacement URL..."
                );

                const response =
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

                            body: JSON.stringify({

                                contentType:
                                    file.type ||
                                    "application/octet-stream"

                            })

                        }
                    );

                if (
                    response.status ===
                    401
                ) {

                    logoutUser();

                    alert(
                        "Your login session has expired."
                    );

                    return;

                }

                if (
                    response.status ===
                    403
                ) {

                    alert(
                        "You are not authorized to replace this document."
                    );

                    return;

                }

                if (!response.ok) {

                    const errorText =
                        await response.text();

                    throw new Error(
                        "Replacement URL request failed: " +
                        response.status +
                        " " +
                        errorText
                    );

                }

                const data =
                    await response.json();

                console.log(
                    "Replacement URL received."
                );

                if (!data.uploadUrl) {

                    throw new Error(
                        "Replacement upload URL was not returned."
                    );

                }

                // ------------------------------------------------
                // IMPORTANT:
                // Direct upload to S3.
                // No Cognito Authorization header.
                // ------------------------------------------------

                const uploadResponse =
                    await fetch(
                        data.uploadUrl,
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

                if (!uploadResponse.ok) {

                    throw new Error(
                        "S3 replacement upload failed: " +
                        uploadResponse.status
                    );

                }

                alert(
                    "Document replaced successfully."
                );

                // Give S3 -> Lambda processing time.
                await sleep(3000);

                await loadDocuments();

            }
            catch (error) {

                console.error(
                    "Replacement error:",
                    error
                );

                alert(
                    "Replacement failed: " +
                    error.message
                );

            }

        };

    input.click();

}


// ============================================================
// 26. TEXT FILE EDITOR
// ============================================================

async function editTextDocument(
    documentId,
    fileName,
    fileType
) {

    if (
        !isTextFile(
            fileName,
            fileType
        )
    ) {

        alert(
            "This file cannot be edited as text."
        );

        return;

    }

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

        openTextEditor(
            documentId,
            fileName,
            text
        );

    }
    catch (error) {

        console.error(
            "Text edit error:",
            error
        );

        alert(
            "Unable to open text file: " +
            error.message
        );

    }

}


// ============================================================
// 27. OPEN TEXT EDITOR
// ============================================================

function openTextEditor(
    documentId,
    fileName,
    content
) {

    const modal =
        document.getElementById(
            "editModal"
        );

    const textarea =
        document.getElementById(
            "editTextArea"
        );

    const title =
        document.getElementById(
            "editFileName"
        );

    if (!modal || !textarea) {

        alert(
            "Text editor UI not found in index.html."
        );

        return;

    }

    if (title) {

        title.textContent =
            fileName;

    }

    textarea.value =
        content;

    modal.dataset.documentId =
        documentId;

    modal.dataset.fileName =
        fileName;

    modal.style.display =
        "block";

}


// ============================================================
// 28. CLOSE TEXT EDITOR
// ============================================================

function closeTextEditor() {

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
// 29. SAVE TEXT EDITOR
// ============================================================

async function saveTextDocument() {

    const modal =
        document.getElementById(
            "editModal"
        );

    const textarea =
        document.getElementById(
            "editTextArea"
        );

    if (!modal || !textarea) {

        return;

    }

    const documentId =
        modal.dataset.documentId;

    const fileName =
        modal.dataset.fileName;

    if (!documentId) {

        alert(
            "Document ID not found."
        );

        return;

    }

    const content =
        textarea.value;

    if (
        new Blob(
            [content]
        ).size >
        2 * 1024 * 1024
    ) {

        alert(
            "Text file cannot exceed 2 MB."
        );

        return;

    }

    try {

        // ----------------------------------------------------
        // STEP 1:
        // Get replacement URL from API Gateway.
        // This request needs Cognito token.
        // ----------------------------------------------------

        const response =
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

                    body: JSON.stringify({

                        contentType:
                            getTextContentType(
                                fileName
                            )

                    })

                }
            );

        if (!response.ok) {

            const errorText =
                await response.text();

            throw new Error(
                "Could not generate replacement URL: " +
                response.status +
                " " +
                errorText
            );

        }

        const data =
            await response.json();

        if (!data.uploadUrl) {

            throw new Error(
                "Replacement URL missing."
            );

        }

        // ----------------------------------------------------
        // STEP 2:
        // Upload directly to S3.
        // No Authorization header.
        // ----------------------------------------------------

        const uploadResponse =
            await fetch(
                data.uploadUrl,
                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            getTextContentType(
                                fileName
                            )

                    },

                    body: content

                }
            );

        if (!uploadResponse.ok) {

            throw new Error(
                "S3 upload failed: " +
                uploadResponse.status
            );

        }

        closeTextEditor();

        alert(
            "Text document saved successfully."
        );

        await sleep(3000);

        await loadDocuments();

    }
    catch (error) {

        console.error(
            "Save text error:",
            error
        );

        alert(
            "Could not save document: " +
            error.message
        );

    }

}


// ============================================================
// 30. CHECK TEXT FILE
// ============================================================

function isTextFile(
    fileName,
    fileType
) {

    if (
        fileType &&
        fileType.startsWith("text/")
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
        "css",
        "js",
        "java",
        "py",
        "c",
        "cpp",
        "h",
        "md",
        "log"

    ];

    return textExtensions.includes(
        extension
    );

}


// ============================================================
// 31. GET TEXT CONTENT TYPE
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

        txt: "text/plain",

        csv: "text/csv",

        json: "application/json",

        xml: "application/xml",

        html: "text/html",

        css: "text/css",

        js: "text/javascript",

        java: "text/plain",

        py: "text/plain",

        c: "text/plain",

        cpp: "text/plain",

        h: "text/plain",

        md: "text/markdown",

        log: "text/plain"

    };

    return (
        contentTypes[extension] ||
        "text/plain"
    );

}


// ============================================================
// 32. FORMAT FILE SIZE
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
// 33. ESCAPE HTML
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
// 34. ESCAPE JAVASCRIPT
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
// 35. SLEEP
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
// 36. HANDLE API AUTH ERRORS
// ============================================================

async function handleApiResponse(
    response
) {

    if (
        response.status ===
        401
    ) {

        console.log(
            "401 Unauthorized"
        );

        logoutUser();

        alert(
            "Your login session has expired. Please login again."
        );

        return false;

    }

    if (
        response.status ===
        403
    ) {

        alert(
            "You are not authorized to perform this action."
        );

        return false;

    }

    return true;

}