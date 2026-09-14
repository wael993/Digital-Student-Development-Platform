import 'dart:io' show Platform;

import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppEnv {
  AppEnv._();

  static Future<void> load({String fileName = '.env'}) async {
    await dotenv.load(fileName: fileName);
  }

  static String get apiBaseUrl => resolveApiBaseUrl(
        dotenv.env['API_BASE_URL'] ?? 'http://localhost:3000/api/v1',
        isAndroid: Platform.isAndroid,
      );

  /// Android emulator loopback is the VM, not the host. Map localhost there.
  static String resolveApiBaseUrl(String url, {required bool isAndroid}) {
    if (!isAndroid) {
      return url;
    }
    return url
        .replaceFirst('://localhost', '://10.0.2.2')
        .replaceFirst('://127.0.0.1', '://10.0.2.2');
  }
}
