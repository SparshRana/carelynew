export const cameraConstraints:MediaStreamConstraints={audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}};
export function cameraError(error:unknown){
 const name=error&&typeof error==='object'&&'name' in error?String(error.name):'';
 if(name==='NotAllowedError'||name==='SecurityError')return 'Camera access was blocked. Allow camera access in your browser settings, or upload a barcode photo.';
 if(name==='NotFoundError'||name==='DevicesNotFoundError')return 'No camera was found. Connect a camera or upload a barcode photo.';
 if(name==='NotReadableError'||name==='TrackStartError')return 'The camera is in use or could not start. Close other camera apps and try again, or upload a photo.';
 if(name==='OverconstrainedError')return 'This camera could not use the requested settings. Try a different device or upload a photo.';
 return 'Camera is unavailable. Use HTTPS or localhost, check camera permissions, or upload a barcode photo.';
}
