/**
 * Supabase Storage Service - AfriNet Hub
 * Version: 3.3.0 (Consolidated onto shared project)
 */

const SUPABASE_URL = 'https://uuuoqexhuwwiwpvqgypy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dW9xZXhodXd3aXdwdnFneXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NDMyMDEsImV4cCI6MjEwNjIxOTIwMX0.ktKrFp8EuYBq9CBLGbME9PEo4GaReiKRVBtEOdR-BYI';
const BUCKET_NAME = 'unilesh';

let supabaseClient = null;

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

initSupabase();

async function uploadFile(file, onProgress = null) {
    if (!file) throw new Error("No file selected for upload.");
    try {
        if (!supabaseClient) initSupabase();
        const filePath = `${Date.now()}_${file.name}`;
        console.log(`Supabase: Starting upload for ${file.name}...`);

        const { data, error } = await supabaseClient.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (error) throw error;

        const { data: publicUrlData } = supabaseClient.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        console.log('✅ Upload successful:', file.name);

        return {
            success: true,
            fileId: filePath,
            viewURL: publicUrlData.publicUrl,
            originalName: file.name
        };
    } catch (error) {
        console.error("❌ Supabase Storage Error:", error);
        if (error.statusCode === '413') {
            throw new Error("File too large. Please select a smaller file.");
        }
        throw new Error(`Storage Service Error: ${error.message || "Upload failed. Please try again."} (Bucket: ${BUCKET_NAME})`);
    }
}

async function deleteFile(fileId) {
    if (!fileId) return;
    try {
        if (!supabaseClient) initSupabase();
        const { data, error } = await supabaseClient.storage.from(BUCKET_NAME).remove([fileId]);
        if (error) throw error;
        console.log(`Supabase: File ${fileId} deleted successfully.`);
    } catch (error) {
        console.error("Supabase Storage Error:", error);
        if (error.status !== 404) throw error;
    }
}

function getFileView(fileId) {
    if (!supabaseClient) initSupabase();
    const { data } = supabaseClient.storage.from(BUCKET_NAME).getPublicUrl(fileId);
    return data.publicUrl;
}

function getFileDownload(fileId) {
    return getFileView(fileId);
}

window.storageService = {
    uploadFile,
    deleteFile,
    getFileView,
    getFileDownload,
    initAppwrite: initSupabase
};

window.initAppwrite = initSupabase;

console.log('✅ Supabase Storage module loaded');