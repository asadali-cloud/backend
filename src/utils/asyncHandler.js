

const asyncHandler = (requesthandler) => {
    (req, res, next)=>{
        Promise.resolve(requesthandler(req, res, next)).catch((eror)=>next(eror))
    }
}

export { asyncHandler }