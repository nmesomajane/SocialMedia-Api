
const errorHandler = (err, req, res, next) => {

    console.error("ERROR:", err.message) 

    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message)
        return res.status(400).json({
            status: 'error',
            message: messages.join(', ')  
        })
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0]  
        return res.status(400).json({
            status: 'error',
            message: `${field} already exists`
        })
    }

   
    if (err.name === 'CastError') {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid ID format'
        })
    }

   
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ status: 'error', message: 'Invalid token' })
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ status: 'error', message: 'Token expired' })
    }

    if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message
        })
    }

   
    return res.status(500).json({
        status: 'error',
        message: 'Something went wrong'
    })
}

export default errorHandler