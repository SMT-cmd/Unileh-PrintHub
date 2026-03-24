const CLOUD_NAME = 'ditgccsfh';
const UPLOAD_PRESET = 'unilesh';

/**
 * Opens the Cloudinary Upload Widget and returns the upload result.
 * @returns {Promise} Resolves with {secure_url, original_filename, pages}
 */
function openCloudinaryWidget() {
  return new Promise((resolve, reject) => {
    // Explicitly set overwrite to undefined to ensure it's not sent, 
    // or try using the most minimal configuration possible.
    const widgetConfig = {
      cloudName: CLOUD_NAME,
      uploadPreset: UPLOAD_PRESET,
      sources: ['local', 'url', 'google_drive'],
      multiple: false,
      clientAllowedFormats: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
      maxFileSize: 10000000 // 10MB
    };
    
    console.log("Initializing Cloudinary Widget with config:", widgetConfig);

    const myWidget = cloudinary.createUploadWidget(widgetConfig, (error, result) => {
      if (!error && result && result.event === "success") {
        console.log('Done! Here is the image info: ', result.info);
        
        let finalUrl = result.info.secure_url;
        
        // Fix for PDF/DOCX 401 errors:
        // By default, Cloudinary sometimes generates the URL with '/image/upload/' 
        // even for PDFs, which causes a 401 error. Changing it to '/raw/upload/' 
        // or '/image/upload/fl_attachment/' forces it to bypass strict visual transformations.
        if (result.info.format === 'pdf' || result.info.format === 'doc' || result.info.format === 'docx') {
           // We append fl_attachment so the browser downloads it instead of trying to preview it,
           // which often bypasses the 401 Unauthorized PDF viewing restriction.
           finalUrl = finalUrl.replace('/upload/', '/upload/fl_attachment/');
        }
        
        resolve({
          secure_url: finalUrl,
          original_filename: result.info.original_filename,
          pages: result.info.pages // Cloudinary returns page count for PDFs
        });
      } else if (error) {
        reject(error);
      }
    });

    myWidget.open();
  });
}
