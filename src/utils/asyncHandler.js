const asyncHandler = (requestHandler) => {
    return (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next))
        .catch((err) => next(err))
    }
}



  

export  {asyncHandler}

//try catch

// const asyncHandler2 = (fn) => async (req,res,next) => {
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success:false,
//             message: err.message || 'Internal Server Error'
//         })
//     }
// }

//  asynchadler.js is used to handle the errors in async functions. It is a higher order function that takes a function as an argument and returns a function. The returned function calls the original function and catches any errors that occur. The error is then passed to the next middleware function in the stack. This way we don't have to write try catch block in every async function. We can just wrap the async function with asyncHandler and it will handle the errors for us.