const CLOUD_NAME = 'ditgccsfh';
const UPLOAD_PRESET = 'unilesh';

/**
 * Opens the Cloudinary Upload Widget and returns the upload result.
 * @returns {Promise} Resolves with {secure_url, original_filename, pages}
 */
function openCloudinaryWidget() {
  return new Promise((resolve, reject) => {
    const widgetConfig = {
      cloudName: CLOUD_NAME,
      uploadPreset: UPLOAD_PRESET,
      sources: ['local', 'url', 'google_drive'],
      multiple: false,
      clientAllowedFormats: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
      maxFileSize: 10000000, // 10MB
      // We don't pass resourceType here to avoid the restriction error, 
      // but Cloudinary handles it on the server side.
    };

    const myWidget = cloudinary.createUploadWidget(widgetConfig, (error, result) => {
      if (!error && result && result.event === "success") {
        console.log('Upload Success:', result.info);
        
        let secureUrl = result.info.secure_url;
        const format = (result.info.format || '').toLowerCase();
        const resourceType = result.info.resource_type; // 'image', 'raw', or 'video'

        // GLOBAL FIX FOR ALL UPLOADS:
        // Ensure PDFs and raw files are downloadable and bypass 401 errors
        if (resourceType === 'raw' || format === 'pdf' || format === 'doc' || format === 'docx') {
          // If Cloudinary returned it as an image URL, force it to raw or add attachment flag
          if (secureUrl.includes('/image/upload/')) {
            secureUrl = secureUrl.replace('/image/upload/', '/image/upload/fl_attachment/');
          }
        }

        resolve({
          secure_url: secureUrl,
          original_filename: result.info.original_filename,
          pages: result.info.pages || 1,
          format: format,
          resource_type: resourceType,
          thumbnail_url: result.info.thumbnail_url || result.info.secure_url
        });
      } else if (error) {
        reject(error);
      }
    });

    myWidget.open();
  });
}
