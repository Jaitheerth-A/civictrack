import { useDropzone } from "react-dropzone";
import { useState } from "react";

export default function ImageUpload({ setFile }){

 const [preview,setPreview] = useState(null);

 const {getRootProps,getInputProps} = useDropzone({

  onDrop:(files)=>{

   const file = files[0];

   setFile(file);

   setPreview(URL.createObjectURL(file));

  }

 });

 return(

  <div {...getRootProps()} className="image-upload">

   <input {...getInputProps()} />

   {preview ? (

    <img
     src={preview}
     className="image-preview"
    />

   ) : (

    <p>Drag & drop complaint image here</p>

   )}

  </div>

 );

}