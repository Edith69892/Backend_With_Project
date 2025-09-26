import {v2 as cloudinary} from 'cloudinary'; 
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCludinary =  async (filepath) => {
    try {
        if(!filepath) throw new Error("File path is required") ;
        //upload on cloudinary
       const response = await cloudinary.uploader.upload(filepath , {
            resource_type: "auto"
        })
        // console.log("File upload on cloudinary",response.url);
        fs.unlinkSync(filepath)
        return response
    } catch (error) {
        fs.unlinkSync(filepath) //remove the locally saved temprorary file as the upload failed 
        return null 
    }
}

export {uploadOnCludinary};

// cloudinary is a cloud service that offers a solution to a web application's entire image management pipeline. It provides an end-to-end image and video management solution, including uploads, storage, manipulations, optimizations, and delivery. This js file is used to upload images to cloudinary and get the url of the uploaded image.