/**
 * Supabase Storage Service - AfriNet Hub
 * Version: 4.0.0 (Dedicated Afrinet Hub: private Edge uploads and admin-only media)
 */

const SUPABASE_URL = 'https://soqjthnzyntkhthcnucj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YVKFznQEfolCyUaHWz791g_lbxm-Imk';
const PRIVATE_BUCKET_NAME = 'afrinethub-private';
const MEDIA_BUCKET_NAME = 'afrinethub-media';

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

async function uploadFile(file, onProgress = null, options = {}) {
    if (location.hostname.endsWith(".vercel.app")) throw new Error("Uploads are disabled in this design preview. Please use the main AfriNet Hub website.");
    if (!file) throw new Error("No file selected for upload.");
    const kind = options?.kind || 'private';
    // Private student documents and receipts MUST go through a server-signed upload flow.
    if (kind !== 'public-media') {
        if (!window.afriBackend) throw new Error('Secure upload service is unavailable. Refresh this page.');
        return window.afriBackend.uploadFile(file,kind);
    }
    if (!/^(image\/jpeg|image\/png|image\/webp|application\/pdf)$/.test(file.type))
        throw new Error('Only JPG, PNG, WebP or PDF public media can be uploaded.');
    if (file.size <= 0 || file.size > 10*1024*1024)
        throw new Error('Media files must not exceed 10MB.');
    try {
        if (!supabaseClient) initSupabase();
        const ext = ({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf'})[file.type];
        const filePath = `media/${crypto.randomUUID()}.${ext}`;
        console.log(`Supabase: Starting upload for ${file.name}...`);

        const { data, error } = await supabaseClient.storage
            .from(MEDIA_BUCKET_NAME)
            .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (error) throw error;

        const { data: publicUrlData } = supabaseClient.storage
            .from(MEDIA_BUCKET_NAME)
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
        throw new Error(`Storage Service Error: ${error.message || "Upload failed. Please try again."} (Bucket: ${MEDIA_BUCKET_NAME})`);
    }
}

async function deleteFile(fileId) {
    if (location.hostname.endsWith(".vercel.app")) throw new Error("Preview mode: deleting live files is disabled.");
    if (!fileId) return;
    try {
        if (!supabaseClient) initSupabase();
        if (!String(fileId).startsWith('media/')) {
            if (!window.afriBackend) throw new Error('Secure deletion service is unavailable.');
            return await window.afriBackend.deleteFile(fileId);
        }
        const { data, error } = await supabaseClient.storage.from(MEDIA_BUCKET_NAME).remove([fileId]);
        if (error) throw error;
        console.log(`Supabase: File ${fileId} deleted successfully.`);
    } catch (error) {
        console.error("Supabase Storage Error:", error);
        if (error.status !== 404) throw error;
    }
}

function getFileView(fileId) {
    if (!supabaseClient) initSupabase();
    if (!String(fileId).startsWith('media/')) return '';
    const { data } = supabaseClient.storage.from(MEDIA_BUCKET_NAME).getPublicUrl(fileId);
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