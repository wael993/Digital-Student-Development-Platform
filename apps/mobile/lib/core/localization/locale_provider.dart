import 'package:digital_student/core/localization/locale_storage.dart';
import 'package:digital_student/core/storage/secure_storage.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final localeStorageProvider = Provider<LocaleStorage>(
  (ref) => LocaleStorage(ref.watch(secureStorageProvider)),
);

final localeProvider = StateNotifierProvider<LocaleController, Locale>((ref) {
  return LocaleController(ref.watch(localeStorageProvider));
});

class LocaleController extends StateNotifier<Locale> {
  LocaleController(this._storage, {Locale? initial})
      : super(initial ?? resolveAppLocale()) {
    if (initial == null) {
      _restore();
    }
  }

  final LocaleStorage _storage;

  Future<void> _restore() async {
    state = resolveAppLocale(stored: await _storage.read());
  }

  Future<void> setLocale(Locale locale) async {
    final next = resolveAppLocale(stored: locale.languageCode);
    state = next;
    await _storage.write(next.languageCode);
  }
}

Future<Locale> loadSavedLocale(LocaleStorage storage) async {
  return resolveAppLocale(stored: await storage.read());
}
