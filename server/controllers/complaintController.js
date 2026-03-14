const Complaint = require("../models/Complaint");
const XLSX = require("xlsx");

exports.createComplaint = async (req,res)=>{

 try{

  const {title,description,category,severity,lat,lng} = req.body;

  const complaint = new Complaint({

   title,
   description,
   category,
   severity,

   location:{
    lat,
    lng
   },

   image:req.file ? req.file.filename : null

  });

  await complaint.save();

  res.json(complaint);

 }
 catch(err){

  res.status(500).json({error:err.message});

 }

};


exports.getComplaints = async (req,res)=>{

 try{

  const complaints = await Complaint.find().sort({createdAt:-1});

  res.json(complaints);

 }
 catch(err){

  res.status(500).json({error:err.message});

 }

};


exports.updateStatus = async (req,res)=>{

 try{

  const complaint = await Complaint.findByIdAndUpdate(

   req.params.id,
   {status:req.body.status},
   {new:true}

  );

  res.json(complaint);

 }
 catch(err){

  res.status(500).json({error:err.message});

 }

};


exports.exportComplaints = async (req,res)=>{

 const complaints = await Complaint.find();

 const data = complaints.map(c=>({

  Title:c.title,
  Category:c.category,
  Severity:c.severity,
  Status:c.status,
  Latitude:c.location.lat,
  Longitude:c.location.lng

 }));

 const worksheet = XLSX.utils.json_to_sheet(data);

 const workbook = XLSX.utils.book_new();

 XLSX.utils.book_append_sheet(workbook,worksheet,"Complaints");

 const file = "exports/complaints.xlsx";

 XLSX.writeFile(workbook,file);

 res.download(file);

};