import { v2 as cloudinary } from "cloudinary";
import fs from fs;

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloud = async (localfilePath) => {
    try {
        if (!localfilePath) return null
        const repsonse = await cloudinary.uploader.upload(localfilePath, {resource_type:"auto"})
        console.log("file has been uploaded", repsonse.url);
        return repsonse;
    } catch (error) {
        fs.unlinkSync(localfilePath)
        return null;
    }
}
export {uploadOnCloud}