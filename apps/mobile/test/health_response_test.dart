import 'package:digital_student/core/network/health_response.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('HealthResponse serializes to and from JSON', () {
    const response = HealthResponse(status: 'ok');
    final json = response.toJson();

    expect(json, {'status': 'ok'});
    expect(HealthResponse.fromJson(json).status, 'ok');
  });
}
