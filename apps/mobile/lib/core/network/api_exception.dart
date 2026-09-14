class ApiException implements Exception {
  ApiException({required this.code, required this.message, this.statusCode});

  final String code;
  final String message;
  final int? statusCode;

  factory ApiException.fromBody(int? statusCode, dynamic data) {
    if (data is Map && data['error'] is Map) {
      final error = data['error'] as Map;
      return ApiException(
        code: error['code'] as String? ?? 'UNKNOWN',
        message: error['message'] as String? ?? 'Request failed',
        statusCode: statusCode,
      );
    }
    return ApiException(
      code: 'UNKNOWN',
      message: 'Request failed',
      statusCode: statusCode,
    );
  }

  @override
  String toString() => message;
}
