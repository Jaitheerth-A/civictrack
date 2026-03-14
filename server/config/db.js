const mongoose = require("mongoose");

const connectDB = async () => {

try{

await mongoose.connect("mongodb://127.0.0.1:27017/civictrack");

console.log("MongoDB Connected");

}
catch(err){

console.error(err);

process.exit(1);

}

};

module.exports = connectDB;