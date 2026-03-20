const multer = require("multer");
const fs = require("fs");
const path = require("path");

const uploadDir = path.join(__dirname, "..", "uploads");

const storage = multer.diskStorage({

 destination:(req,file,cb)=>{
  fs.mkdirSync(uploadDir, { recursive: true });
  cb(null,uploadDir);
 },

 filename:(req,file,cb)=>{
  cb(null,Date.now()+"-"+file.originalname);
 }

});

const upload = multer({storage});

module.exports = upload;
