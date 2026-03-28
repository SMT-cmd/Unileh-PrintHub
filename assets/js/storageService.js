/**
 * Supabase Storage Service - Unilesh Print Hub
 * Version: 3.2.0 (Final Migration)
 * Centralized service for handling all file uploads and deletions via Supabase.
 */

// --- CONFIGURATION ---
const SUPABASE_URL = 'https://oxyvzcgjracrlyckhent.supabase.co';
// Using the long JWT (Anon Key) provided by the user
const SUPABASE_ANON_KEY = 'sb_publishable_f3g4xUVmod3xgqv6KE8_XQ_Yydete1X';
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
 * @param {Function} onProgress - Optional progress callback.
 * @returns {Promise<Object>} Upload result.
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

        console.log('✅ Upload successful:', file.name);

        // Return exact object structure as requested by the user
        return {
            success: true,
            fileId: filePath,
            viewURL: publicUrlData.publicUrl,
            originalName: file.name
        };

    } catch (error) {
        console.error("❌ Supabase Storage Error:", error);
        
        // Detailed error mapping for better UX
        if (error.statusCode === '413') {
            throw new Error("File too large. Please select a smaller file.");
        }
        
        throw new Error(`Storage Service Error: ${error.message || "Upload failed. Please try again."} (Bucket: ${BUCKET_NAME})`);
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
        console.error("Supabase Storage Error:", error);
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
// Export as storageService (primary) and maintain Appwrite aliases for backward compatibility
window.storageService = {
    uploadFile,
    deleteFile,
    getFileView,
    getFileDownload,
    initAppwrite: initSupabase // Alias to prevent errors in other scripts
};

// Global initAppwrite alias
window.initAppwrite = initSupabase;

console.log('✅ Supabase Storage module loaded');
