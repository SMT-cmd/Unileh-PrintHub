/**
 * Unilesh Print Hub - Appwrite Storage Utility
 * Version: 2.1.0 (2026 Updated)
 * Centralized service for handling all file uploads and deletions using Appwrite Cloud.
 */

// --- CONFIGURATION ---
const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1'; 
const APPWRITE_PROJECT_ID = '69c303e900353eca2124';
const BUCKET_ID = '69c307140031f849879a';

// --- INITIALIZATION ---
let client, storage, account;

/**
 * Initializes the Appwrite client and services.
 */
function initAppwrite() {
    if (typeof Appwrite === 'undefined') {
        console.warn('Appwrite SDK not yet loaded. Waiting...');
        return false;
    }
    
    try {
        const { Client, Storage, Account } = Appwrite;

        client = new Client()
            .setEndpoint(APPWRITE_ENDPOINT)
            .setProject(APPWRITE_PROJECT_ID);

        storage = new Storage(client);
        account = new Account(client);
        
        console.log("Appwrite: Initialized successfully with Project ID:", APPWRITE_PROJECT_ID);
        return true;
    } catch (error) {
        console.error("Appwrite Initialization Failed:", error);
        return false;
    }
}

// Initial attempt
initAppwrite();

/**
 * Ensures a session exists for the user.
 * Required for anonymous uploads to work with 'Any' permissions.
 */
async function ensureSession() {
    if (!account && !initAppwrite()) {
        throw new Error("Appwrite SDK is missing. Please check your internet and reload.");
    }

    try {
        // Check if session exists
        const session = await account.get();
        console.log("Appwrite: Active session verified:", session.$id);
        return session;
    } catch (error) {
        console.log("Appwrite: No session found. Creating anonymous session...");
        try {
            const session = await account.createAnonymousSession();
            console.log("Appwrite: Anonymous session created successfully.");
            return session;
        } catch (sessionError) {
            console.error("Appwrite Session Error:", sessionError);
            
            // Map common session errors
            if (sessionError.code === 401) {
                throw new Error("Auth Error: Anonymous authentication is not enabled in Appwrite Console.");
            }
            if (sessionError.message.includes("Failed to fetch") || sessionError.code === 0) {
                throw new Error("Network Error: Could not reach Appwrite. This is usually a CORS issue. Ensure your domain is added to 'Platforms' in Appwrite Console.");
            }
            
            throw new Error(`Session Failed (${sessionError.code}): ${sessionError.message}`);
        }
    }
}

/**
 * Uploads a file to Appwrite Storage with robust error handling.
 * @param {File} file - The file to upload.
 * @param {Function} onProgress - Optional callback for upload progress.
 * @returns {Promise<{fileId: string, viewURL: string, originalName: string, format: string}>}
 */
async function uploadFile(file, onProgress = null) {
    if (!file) throw new Error("No file selected for upload.");

    try {
        // 1. Ensure we have a session
        await ensureSession();

        console.log(`Appwrite: Starting upload for ${file.name} (${(file.size / 1024).toFixed(2)} KB)...`);

        // 2. Perform the upload
        const response = await storage.createFile(
            BUCKET_ID,
            Appwrite.ID.unique(),
            file,
            [], // Permissions (defaults to bucket permissions)
            (progress) => {
                if (onProgress) onProgress(progress.progress);
            }
        );

        const fileId = response.$id;
        const viewURL = storage.getFileView(BUCKET_ID, fileId).href;
        const downloadURL = storage.getFileDownload(BUCKET_ID, fileId).href;
        
        console.log("Appwrite: Upload complete! File ID:", fileId);

        return { 
            fileId: fileId, 
            viewURL: viewURL, 
            downloadURL: downloadURL,
            originalName: file.name,
            format: file.name.split('.').pop().toLowerCase()
        };

    } catch (error) {
        console.error("Appwrite Upload Error:", error);
        
        // Detailed error mapping for production feedback
        if (error.message.includes("Failed to fetch") || error.code === 0) {
            throw new Error("Network Error: Connection to Appwrite blocked. Please check your internet or domain registration in Appwrite Console.");
        }
        
        if (error.code === 401) {
            throw new Error("Permission Denied: Ensure your Appwrite Bucket has 'Create' permissions enabled for 'Any'.");
        }

        if (error.code === 403) {
            throw new Error("Access Forbidden: Your domain is not authorized to upload to this project.");
        }

        if (error.code === 404) {
            throw new Error(`Bucket Not Found: Verify Bucket ID '${BUCKET_ID}' exists in your Appwrite Console.`);
        }

        if (error.code === 413) {
            throw new Error("File Too Large: The file exceeds the maximum allowed size in Appwrite Settings.");
        }

        throw new Error(`Upload Failed: ${error.message}`);
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
        console.log(`Appwrite: File ${fileId} deleted successfully.`);
    } catch (error) {
        console.error("Appwrite Delete Error:", error);
        // Silently fail if file already gone
        if (error.code !== 404) throw error;
    }
}

/**
 * Gets the direct view URL for a file.
 */
function getFileView(fileId) {
    if (!storage) initAppwrite();
    return storage.getFileView(BUCKET_ID, fileId).href;
}

/**
 * Gets the download URL for a file.
 */
function getFileDownload(fileId) {
    if (!storage) initAppwrite();
    return storage.getFileDownload(BUCKET_ID, fileId).href;
}

// --- EXPORT TO GLOBAL WINDOW ---
window.storageService = {
    uploadFile,
    deleteFile,
    getFileView,
    getFileDownload,
    initAppwrite
};
