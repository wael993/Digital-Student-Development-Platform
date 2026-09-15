import 'package:flutter/widgets.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const supportedLanguageCodes = ['en', 'ar'];

Locale resolveAppLocale({String? stored, Locale? device}) {
  if (stored != null && supportedLanguageCodes.contains(stored)) {
    return Locale(stored);
  }
  final deviceCode = (device ?? WidgetsBinding.instance.platformDispatcher.locale)
      .languageCode;
  if (supportedLanguageCodes.contains(deviceCode)) {
    return Locale(deviceCode);
  }
  return const Locale('en');
}

class LocaleStorage {
  LocaleStorage(this._storage);

  static const key = 'app_locale';

  final FlutterSecureStorage _storage;

  Future<String?> read() => _storage.read(key: key);

  Future<void> write(String languageCode) {
    return _storage.write(key: key, value: languageCode);
  }
}
