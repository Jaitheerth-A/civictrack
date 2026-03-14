const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({

title: String,

description: String,

category: String,

severity:{
type:String,
enum:["Low","Medium","High","Critical"]
},

location:{
lat:Number,
lng:Number
},

image:String,

status:{
type:String,
default:"Pending"
},

createdAt:{
type:Date,
default:Date.now
}

});

module.exports = mongoose.model("Complaint",complaintSchema);