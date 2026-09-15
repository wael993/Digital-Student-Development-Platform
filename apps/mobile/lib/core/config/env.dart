import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppEnv {
  AppEnv._();

  static Future<void> load({String fileName = '.env'}) async {
    await dotenv.load(fileName: fileName);
  }

  static String get apiBaseUrl {
    const defined = String.fromEnvironment('API_BASE_URL');
    final raw = defined.isNotEmpty
        ? defined
        : (dotenv.env['API_BASE_URL'] ??
            'https://digital-student-development-platform.onrender.com/api/v1');
    return resolveApiBaseUrl(
      raw,
      isAndroid: Platform.isAndroid,
      rewriteEmulatorLocalhost: !kReleaseMode,
    );
  }

  /// Android emulator loopback is the VM, not the host. Map localhost there.
  /// Release builds keep the URL as-is so a device talks to the real API host.
  static String resolveApiBaseUrl(
    String url, {
    required bool isAndroid,
    bool rewriteEmulatorLocalhost = true,
  }) {
    if (!isAndroid || !rewriteEmulatorLocalhost) {
      return url;
    }
    return url
        .replaceFirst('://localhost', '://10.0.2.2')
        .replaceFirst('://127.0.0.1', '://10.0.2.2');
  }
}
