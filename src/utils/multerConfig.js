import multer from "multer";

const upload = multer({ dest: "uploads/" });

const uploadFields = upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "cover", maxCount: 1 },
]);

export { uploadFields };