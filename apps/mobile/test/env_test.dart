import 'package:digital_student/core/config/env.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('keeps localhost on non-Android', () {
    expect(
      AppEnv.resolveApiBaseUrl(
        'http://localhost:3000/api/v1',
        isAndroid: false,
      ),
      'http://localhost:3000/api/v1',
    );
  });

  test('maps localhost to the Android emulator host loopback', () {
    expect(
      AppEnv.resolveApiBaseUrl(
        'http://localhost:3000/api/v1',
        isAndroid: true,
      ),
      'http://10.0.2.2:3000/api/v1',
    );
    expect(
      AppEnv.resolveApiBaseUrl(
        'http://127.0.0.1:3000/api/v1',
        isAndroid: true,
      ),
      'http://10.0.2.2:3000/api/v1',
    );
  });

  test('leaves an explicit host unchanged', () {
    expect(
      AppEnv.resolveApiBaseUrl(
        'http://192.168.1.10:3000/api/v1',
        isAndroid: true,
      ),
      'http://192.168.1.10:3000/api/v1',
    );
  });
}
