/**
 * Supabase Storage Service - Unilesh Print Hub
 * Version: 3.0.0 (Migrated from Appwrite)
 * Centralized service for handling all file uploads and deletions via Supabase.
 */

// --- CONFIGURATION ---
const SUPABASE_URL = 'https://oxyvzcgjracrlyckhent.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94eXZ6Y2dqcmFjcmx5Y2toZW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2OTIxMDYsImV4cCI6MjA5MDI2ODEwNn0.4N81chDh9Nuc_uWeTDS9SnEf05Z3M-_9lcU6h12wJLQ';
const BUCKET_NAME = 'unilesh';

// --- INITIALIZATION ---
let supabaseClient = null;

/**
 * Initializes the Supabase client.
 */
function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.error('❌ Supabase SDK is not loaded!');
        return false;
    }

    try {
        if (!supabaseClient) {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase initialized successfully');
        }
        return true;
    } catch (error) {
        console.error("❌ Supabase Initialization Failed:", error);
        return false;
    }
}

// Initial attempt
initSupabase();

/**
 * Uploads a file to Supabase Storage.
 * @param {File} file - The file to upload.
 * @param {Function} onProgress - Optional progress callback (Supabase-js v2 doesn't support progress in simple upload).
 * @returns {Promise<Object>} Upload result compatible with database.js.
 */
async function uploadFile(file, onProgress = null) {
    if (!file) throw new Error("No file selected for upload.");

    try {
        if (!supabaseClient) initSupabase();
        
        const filePath = `${Date.now()}_${file.name}`;
        console.log(`Supabase: Starting upload for ${file.name}...`);

        const { data, error } = await supabaseClient.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Retrieve the Public URL
        const { data: publicUrlData } = supabaseClient.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        const viewURL = publicUrlData.publicUrl;

        console.log('✅ Upload successful:', file.name);

        return {
            success: true,
            fileId: filePath,
            viewURL: viewURL,
            downloadURL: viewURL, // Supabase public URL can be used for both
            fileName: file.name,
            originalName: file.name,
            size: file.size,
            format: file.name.split('.').pop().toLowerCase()
        };

    } catch (error) {
        console.error("❌ Upload failed:", error);
        throw new Error(error.message || "Upload failed. Please try again.");
    }
}

/**
 * Deletes a file from Supabase Storage.
 * @param {string} fileId - The path/ID of the file to delete.
 */
async function deleteFile(fileId) {
    if (!fileId) return;
    try {
        if (!supabaseClient) initSupabase();
        
        const { data, error } = await supabaseClient.storage
            .from(BUCKET_NAME)
            .remove([fileId]);

        if (error) throw error;
        
        console.log(`Supabase: File ${fileId} deleted successfully.`);
    } catch (error) {
        console.error("Supabase Delete Error:", error);
        // Silently fail if file already gone
        if (error.status !== 404) throw error;
    }
}

/**
 * Gets the direct view URL for a file.
 */
function getFileView(fileId) {
    if (!supabaseClient) initSupabase();
    const { data } = supabaseClient.storage.from(BUCKET_NAME).getPublicUrl(fileId);
    return data.publicUrl;
}

/**
 * Gets the download URL for a file.
 */
function getFileDownload(fileId) {
    return getFileView(fileId);
}

// --- EXPORT TO GLOBAL WINDOW ---
// Export as both storageService (for existing code) and maintain initAppwrite as alias
window.storageService = {
    uploadFile,
    deleteFile,
    getFileView,
    getFileDownload,
    initAppwrite: initSupabase // Backward compatibility alias
};

// Also maintain AppwriteStorage alias for compatibility
window.AppwriteStorage = {
    uploadFile,
    initAppwrite: initSupabase
};

// Global initAppwrite alias
window.initAppwrite = initSupabase;

console.log('✅ Supabase Storage module loaded');
