const express = require("express");

const router = express.Router();

const upload = require("../middleware/upload");

const {

createComplaint,
getComplaints,
updateStatus,
exportComplaints

} = require("../controllers/complaintController");


router.post("/create",upload.single("image"),createComplaint);

router.get("/",getComplaints);

router.patch("/:id",updateStatus);

router.get("/export",exportComplaints);


module.exports = router;