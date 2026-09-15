import 'package:digital_student/app.dart';
import 'package:digital_student/core/config/env.dart';
import 'package:digital_student/core/localization/locale_provider.dart';
import 'package:digital_student/core/localization/locale_storage.dart';
import 'package:digital_student/core/logging/app_logger.dart';
import 'package:digital_student/core/storage/secure_storage.dart';
import 'package:digital_student/features/notifications/providers/notification_providers.dart';
import 'package:digital_student/features/notifications/services/firebase_push_client.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('en');
  await initializeDateFormatting('ar');
  await AppEnv.load();
  final localeStorage = LocaleStorage(secureStorage);
  final locale = await loadSavedLocale(localeStorage);
  appLogger.i('رحلتي starting');
  final push = await createPushClient();
  runApp(
    ProviderScope(
      overrides: [
        pushClientProvider.overrideWithValue(push),
        localeStorageProvider.overrideWithValue(localeStorage),
        localeProvider.overrideWith(
          (ref) => LocaleController(localeStorage, initial: locale),
        ),
      ],
      child: const DigitalStudentApp(),
    ),
  );
}
