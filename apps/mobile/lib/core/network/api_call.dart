import 'package:dio/dio.dart';
import 'package:digital_student/core/network/api_exception.dart';

Never throwApi(DioException error) {
  if (error.type == DioExceptionType.connectionTimeout ||
      error.type == DioExceptionType.sendTimeout ||
      error.type == DioExceptionType.receiveTimeout ||
      error.type == DioExceptionType.connectionError) {
    throw ApiException(
      code: 'NETWORK_ERROR',
      message: 'Unable to connect. Try again.',
      statusCode: error.response?.statusCode,
    );
  }
  throw ApiException.fromBody(error.response?.statusCode, error.response?.data);
}

T requireData<T>(T? data) {
  if (data == null) {
    throw ApiException(code: 'UNKNOWN', message: 'Request failed');
  }
  return data;
}
