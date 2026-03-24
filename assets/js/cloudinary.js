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
        resolve({
          secure_url: result.info.secure_url,
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
