const multer = require("multer");

const storage = multer.memoryStorage();

const allowedMimeTypes = new Set([
 "image/jpeg",
 "image/png",
 "image/webp",
 "image/gif"
]);

const upload = multer({
 storage,
 limits:{
  fileSize:5 * 1024 * 1024
 },
 fileFilter:(req,file,cb)=>{
  if(!allowedMimeTypes.has(file.mimetype)){
   return cb(new Error("Only JPG, PNG, WEBP, and GIF images are allowed"));
  }

  cb(null,true);
 }
});

module.exports = upload;
