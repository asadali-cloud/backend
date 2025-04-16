import app from "./app.js";
import connected from "./db/index.js";

connected()
.then(()=>{
    app.on("err", (error)=>{
        console.log("Error",error);
        throw error
    })
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running at port:${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log("Mongoose db connection failed!!!", error);
})