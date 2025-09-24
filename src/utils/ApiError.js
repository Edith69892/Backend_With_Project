class ApiError extends Error{
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack =''
    ){
        super(message)
        this.statusCode = statusCode,
        this.message = message, 
        this.data = null,
        this.success = false,
        this.errors = errors
        if(stack){
    this.stack = stack
}else{
    Error.captureStackTrace(this, this.constructor)
}

       
    }
}


export {ApiError}

// ApiError.js is used to handle the errors in the application. It is a class that extends the built-in Error class. It takes statusCode, message, errors and stack as arguments. It sets the statusCode, message, data, success and errors properties. The success property is always set to false. This way we can have a consistent error format for all the APIs.