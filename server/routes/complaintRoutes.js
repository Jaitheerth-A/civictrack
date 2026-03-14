const express = require("express");

const router = express.Router();

const upload = require("../middleware/upload");
const adminAuth = require("../middleware/adminAuth");

const {

createComplaint,
getComplaints,
getComplaintInsights,
updateStatus,
exportComplaints

} = require("../controllers/complaintController");


router.post("/create",upload.single("image"),createComplaint);

router.get("/",getComplaints);
router.get("/insights",getComplaintInsights);

router.patch("/:id",adminAuth,updateStatus);

router.get("/export",adminAuth,exportComplaints);


module.exports = router;
