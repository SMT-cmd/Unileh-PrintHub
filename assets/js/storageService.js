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

const { Client, Storage, ID } = Appwrite;

const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

const storage = new Storage(client);

/**
 * Uploads a file to Appwrite Storage.
 * @param {File} file - The file to upload.
 * @returns {Promise<{fileId: string, viewURL: string, originalName: string}>}
 */
async function uploadFile(file) {
    try {
        const response = await storage.createFile(
            BUCKET_ID,
            ID.unique(),
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
        console.error("Appwrite Upload Error:", error);
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
