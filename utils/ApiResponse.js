class ApiResponse {
  constructor(res) {
    this.res = res;
  }

  success(data = null, message = 'Success', statusCode = 200) {
    const response = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    return this.res.status(statusCode).json(response);
  }

  created(data = null, message = 'Resource created successfully') {
    return this.success(data, message, 201);
  }

  noContent(message = 'No content') {
    return this.res.status(204).send();
  }

  paginated(data, pagination, message = 'Success') {
    const response = {
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        pages: Math.ceil(pagination.total / pagination.limit),
        hasNext: pagination.page * pagination.limit < pagination.total,
        hasPrev: pagination.page > 1
      },
      timestamp: new Date().toISOString()
    };
    return this.res.status(200).json(response);
  }
}

module.exports = ApiResponse;