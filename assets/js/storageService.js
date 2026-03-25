/**
 * FIXED Appwrite Storage Service - Unilesh Print Hub
 * Version: 2.2.0 (User logic integrated)
 * Centralized service for handling all file uploads and deletions.
 */

// --- CONFIGURATION ---
const APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1'; 
const APPWRITE_PROJECT_ID = '69c303e900353eca2124';
const BUCKET_ID = '69c307140031f849879a';

// --- INITIALIZATION ---
let client = null;
let storage = null;
let account = null;

/**
 * Initializes the Appwrite client and services.
 */
function initAppwrite() {
    if (typeof Appwrite === 'undefined') {
        console.error('❌ Appwrite SDK is not loaded!');
        return false;
    }
    
    try {
        const { Client, Storage, Account } = Appwrite;

        client = new Client()
            .setEndpoint(APPWRITE_ENDPOINT)
            .setProject(APPWRITE_PROJECT_ID);

        storage = new Storage(client);
        account = new Account(client);
        
        console.log('✅ Appwrite initialized successfully with Project ID:', APPWRITE_PROJECT_ID);
        return true;
    } catch (error) {
        console.error("❌ Appwrite Initialization Failed:", error);
        return false;
    }
}

// Initial attempt
initAppwrite();

/**
 * Ensures a session exists for the user.
 * If no session exists, it creates an anonymous session.
 */
async function ensureSession() {
    if (!account) initAppwrite();
    try {
        await account.get();
        return true;
    } catch (e) {
        console.log("Appwrite: No active session. Creating anonymous session...");
        try {
            await account.createAnonymousSession();
            console.log('✅ Anonymous session created');
            return true;
        } catch (err) {
            console.error('Session Error:', err);
            
            // Provide specific feedback for common errors
            if (err.message.includes("Failed to fetch") || err.code === 0) {
                throw new Error("Network Error: Could not reach storage. Ensure your domain is registered in Appwrite Console.");
            }
            if (err.code === 401) {
                throw new Error("Auth Error: Anonymous authentication is not enabled in Appwrite Console.");
            }
            
            throw new Error('Failed to connect to storage. Please check Appwrite settings.');
        }
    }
}

/**
 * Uploads a file to Appwrite Storage with progress tracking.
 * @param {File} file - The file to upload.
 * @param {Function} onProgress - Optional progress callback.
 * @returns {Promise<Object>} Upload result.
 */
async function uploadFile(file, onProgress = null) {
    if (!file) throw new Error("No file selected for upload.");

    try {
        const initialized = initAppwrite();
        if (!initialized) throw new Error("Appwrite SDK not available");

        await ensureSession();

        console.log(`Appwrite: Starting upload for ${file.name}...`);

        // Use Appwrite SDK to create file
        const response = await storage.createFile(
            BUCKET_ID,
            Appwrite.ID.unique(),
            file,
            (progress) => {
                if (onProgress) onProgress(progress.progress);
            }
        );

        const fileId = response.$id;
        
        // Construct the view URL as requested by the user
        const viewURL = `${APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${APPWRITE_PROJECT_ID}`;
        const downloadURL = `${APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${fileId}/download?project=${APPWRITE_PROJECT_ID}`;

        console.log('✅ Upload successful:', file.name);
        
        return { 
            success: true,
            fileId: fileId, 
            viewURL: viewURL, 
            downloadURL: downloadURL,
            fileName: file.name,
            originalName: file.name, // Keep for backward compatibility
            size: file.size,
            format: file.name.split('.').pop().toLowerCase()
        };

    } catch (error) {
        console.error("❌ Upload failed:", error);
        
        // Detailed error mapping
        if (error.code === 403) throw new Error("Access Forbidden: Your domain is not authorized. Add it to Appwrite Platforms.");
        if (error.code === 404) throw new Error(`Bucket Not Found: Verify Bucket ID '${BUCKET_ID}' exists.`);
        if (error.code === 413) throw new Error("File Too Large: Exceeds maximum allowed size.");
        
        throw new Error(error.message || "Upload failed. Please try again.");
    }
}

/**
 * Deletes a file from Appwrite Storage.
 * @param {string} fileId - The ID of the file to delete.
 */
async function deleteFile(fileId) {
    if (!fileId) return;
    try {
        if (!storage) initAppwrite();
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
    return `${APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${APPWRITE_PROJECT_ID}`;
}

/**
 * Gets the download URL for a file.
 */
function getFileDownload(fileId) {
    return `${APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${fileId}/download?project=${APPWRITE_PROJECT_ID}`;
}

// --- EXPORT TO GLOBAL WINDOW ---
// Export as both storageService (for existing code) and AppwriteStorage (as requested)
window.storageService = {
    uploadFile,
    deleteFile,
    getFileView,
    getFileDownload,
    initAppwrite
};

window.AppwriteStorage = { 
    uploadFile, 
    initAppwrite 
};

console.log('✅ AppwriteStorage module loaded');
