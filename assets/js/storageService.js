/**
 * Unilesh Print Hub - Appwrite Storage Utility
 * Centralized service for handling all file uploads and deletions.
 */

const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = 'nyc-unilesh-printhub';
const BUCKET_ID = '69c2727d00370c585b4b';

// Check if Appwrite is loaded
if (typeof Appwrite === 'undefined') {
    console.error('Appwrite SDK not found. Please include <script src="https://cdn.jsdelivr.net/npm/appwrite@14.0.0"></script> in your HTML.');
}

let client, storage, account;

function initAppwrite() {
    if (typeof Appwrite === 'undefined') return;
    
    const { Client, Storage, Account } = Appwrite;

    client = new Client()
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(APPWRITE_PROJECT_ID);

    storage = new Storage(client);
    account = new Account(client);
}

// Initialize immediately
initAppwrite();

/**
 * Ensures a session exists for the user (required for most Appwrite operations).
 * If no session exists, it creates an anonymous session.
 */
async function ensureSession() {
    if (!account) initAppwrite();
    try {
        await account.get();
        console.log("Appwrite: Active session found.");
    } catch (error) {
        console.log("Appwrite: No active session. Creating anonymous session...");
        try {
            await account.createAnonymousSession();
            console.log("Appwrite: Anonymous session created.");
        } catch (sessionError) {
            console.error("Appwrite: Failed to create session:", sessionError);
            throw new Error("Could not connect to storage. Please ensure your internet is stable.");
        }
    }
}

/**
 * Uploads a file to Appwrite Storage.
 * @param {File} file - The file to upload.
 * @returns {Promise<{fileId: string, viewURL: string, originalName: string}>}
 */
async function uploadFile(file) {
    try {
        // Step 1: Ensure session is active
        await ensureSession();

        // Step 2: Upload file
        const response = await storage.createFile(
            BUCKET_ID,
            Appwrite.ID.unique(),
            file
        );
        const fileId = response.$id;
        const viewURL = storage.getFileView(BUCKET_ID, fileId).href;
        
        return { 
            fileId: fileId, 
            viewURL: viewURL, 
            originalName: file.name,
            format: file.name.split('.').pop().toLowerCase()
        };
    } catch (error) {
        console.error("Appwrite Upload Full Error:", error);
        
        // Detailed error mapping
        if (error.code === 401) throw new Error("Unauthorized: Please enable 'Any' permissions for 'Create' in your Appwrite Bucket Settings.");
        if (error.code === 403) throw new Error("Forbidden: Add your domain (localhost or unilesh.com) to Appwrite -> Project -> Platforms.");
        if (error.code === 404) throw new Error("Not Found: Check your Bucket ID (69c2727d00370c585b4b) in the Appwrite Console.");
        
        throw error;
    }
}

/**
 * Deletes a file from Appwrite Storage.
 * @param {string} fileId - The ID of the file to delete.
 */
async function deleteFile(fileId) {
    if (!fileId) return;
    try {
        await storage.deleteFile(BUCKET_ID, fileId);
        console.log(`File ${fileId} deleted successfully from Appwrite.`);
    } catch (error) {
        console.error("Appwrite Delete Error:", error);
        // Don't throw if file already deleted (404)
        if (error.code !== 404) throw error;
    }
}

/**
 * Gets the view URL for a file.
 * @param {string} fileId 
 * @returns {string}
 */
function getFileView(fileId) {
    return storage.getFileView(BUCKET_ID, fileId).href;
}

/**
 * Gets the download URL for a file.
 * @param {string} fileId 
 * @returns {string}
 */
function getFileDownload(fileId) {
    return storage.getFileDownload(BUCKET_ID, fileId).href;
}

// Export to window for global access
window.storageService = {
    uploadFile,
    deleteFile,
    getFileView,
    getFileDownload
};
