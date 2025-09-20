class ApiResponse{
    constructor(statusCode, message = "Success", data ){
        this.statusCode = statusCode,
        this.data = data,
        this.success = statusCode < 400 ,
        this.message = message 
    }
}

export {ApiResponse}

// ApiResponse.js is used to send the response to the client. It is a class that takes statusCode, message and data as arguments. It sets the success property to true if the statusCode is less than 400, otherwise it sets it to false. It also sets the message and data properties. This way we can have a consistent response format for all the APIs.