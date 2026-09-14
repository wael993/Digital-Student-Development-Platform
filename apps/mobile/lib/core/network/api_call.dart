import 'package:dio/dio.dart';
import 'package:digital_student/core/network/api_exception.dart';

Never throwApi(DioException error) {
  throw ApiException.fromBody(error.response?.statusCode, error.response?.data);
}

T requireData<T>(T? data) {
  if (data == null) {
    throw ApiException(code: 'UNKNOWN', message: 'Request failed');
  }
  return data;
}
