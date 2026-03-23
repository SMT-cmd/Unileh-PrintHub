const CLOUD_NAME = 'ditgccsfh';
const UPLOAD_PRESET = 'unilesh';

/**
 * Opens the Cloudinary Upload Widget and returns the upload result.
 * @returns {Promise} Resolves with {secure_url, original_filename, pages}
 */
function openCloudinaryWidget() {
  return new Promise((resolve, reject) => {
    const myWidget = cloudinary.createUploadWidget({
      cloudName: CLOUD_NAME,
      uploadPreset: UPLOAD_PRESET,
      folder: 'unilesh',
      overwrite: false,
      useFilename: false,
      uniqueFilename: false,
      useFilenameAsDisplayName: true,
      resourceType: 'auto', // type: upload translates to auto or image depending on context, auto is safer
      sources: ['local', 'url', 'google_drive'],
      multiple: false,
      clientAllowedFormats: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
      maxFileSize: 10000000, // 10MB
      styles: {
        palette: {
          window: "#0a1f44",
          windowBorder: "#ff6b35",
          tabIcon: "#ff6b35",
          menuIcons: "#ffffff",
          textDark: "#000000",
          textLight: "#ffffff",
          link: "#ff6b35",
          action: "#ff6b35",
          inactiveTabIcon: "#cccccc",
          error: "#e63946",
          inProgress: "#ffc107",
          complete: "#2a9d8f",
          sourceBg: "#f4f7f6"
        }
      }
    }, (error, result) => {
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
