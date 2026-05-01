class ApiResponse {
  static success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({ status: 'success', message, data });
  }
  static error(res, message = 'Error', statusCode = 400) {
    return res.status(statusCode).json({ status: 'error', message });
  }
}
module.exports = ApiResponse;