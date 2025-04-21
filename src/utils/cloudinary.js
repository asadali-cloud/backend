import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({ 
    cloud_name: 'asadcloud', 
    api_key: '397919744743951', 
    api_secret: 'xcCyXE4vMnrNcyGYtOp_ox-YA38' 
});
const uploadOnCloud = async (localfilePath) => {
    try {
        if (!localfilePath) return null
        const repsonse = await cloudinary.uploader.upload(localfilePath, {resource_type:"auto"})
        return repsonse;
    } catch (error) {
        console.error("Cloudinary upload error:", error.message || error);
        fs.unlinkSync(localfilePath)
        return null;
    }
};
export {uploadOnCloud}