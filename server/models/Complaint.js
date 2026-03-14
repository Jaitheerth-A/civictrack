const mongoose = require("mongoose");

const statusHistorySchema = new mongoose.Schema({
status: {
type: String,
required: true
},
label: {
type: String,
required: true
},
changedAt: {
type: Date,
default: Date.now
},
changedBy: {
type: String,
default: "system"
}
}, { _id: false });

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

resolvedAt:{
type:Date,
default:null
},

statusHistory:{
type:[statusHistorySchema],
default:[]
},

createdAt:{
type:Date,
default:Date.now
}

});

module.exports = mongoose.model("Complaint",complaintSchema);
