import 'package:digital_student/core/localization/locale_provider.dart';
import 'package:digital_student/core/localization/locale_storage.dart';
import 'package:digital_student/features/auth/presentation/login_page.dart';
import 'package:digital_student/features/notifications/screens/settings_screen.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    dotenv.testLoad(fileInput: 'API_BASE_URL=http://localhost:3000/api/v1');
    FlutterSecureStorage.setMockInitialValues({});
  });

  test('uses the device language when it is supported', () {
    expect(resolveAppLocale(device: const Locale('ar')), const Locale('ar'));
    expect(
      resolveAppLocale(device: const Locale('en', 'US')),
      const Locale('en'),
    );
  });

  test('falls back to English when the device language is unsupported', () {
    expect(resolveAppLocale(device: const Locale('fr')), const Locale('en'));
  });

  test('saved language wins over the device language', () {
    expect(
      resolveAppLocale(stored: 'ar', device: const Locale('en')),
      const Locale('ar'),
    );
  });

  test('persists the selected language', () async {
    final storage = LocaleStorage(const FlutterSecureStorage());
    expect(await storage.read(), isNull);
    await storage.write('ar');
    expect(await storage.read(), 'ar');
  });

  testWidgets('switching language updates the UI without logout', (tester) async {
    final storage = LocaleStorage(const FlutterSecureStorage());
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          localeStorageProvider.overrideWithValue(storage),
          localeProvider.overrideWith(
            (ref) => LocaleController(storage, initial: const Locale('en')),
          ),
        ],
        child: const _LocaleHost(child: LoginPage()),
      ),
    );
    await tester.pump();

    expect(find.text('Welcome'), findsOneWidget);
    expect(find.text('Login'), findsOneWidget);

    await tester.tap(find.text('العربية'));
    await tester.pumpAndSettle();

    expect(await storage.read(), 'ar');
    expect(find.text('مرحباً'), findsOneWidget);
    expect(find.text('تسجيل الدخول'), findsOneWidget);
    expect(find.text('Welcome'), findsNothing);
  });

  testWidgets('settings language choice persists and flips direction', (
    tester,
  ) async {
    final storage = LocaleStorage(const FlutterSecureStorage());
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          localeStorageProvider.overrideWithValue(storage),
          localeProvider.overrideWith(
            (ref) => LocaleController(storage, initial: const Locale('en')),
          ),
        ],
        child: const _LocaleHost(child: SettingsScreen()),
      ),
    );
    await tester.pump();

    expect(
      Directionality.of(tester.element(find.byType(SettingsScreen))),
      TextDirection.ltr,
    );

    await tester.tap(find.byKey(const Key('languageArabic')));
    await tester.pumpAndSettle();

    expect(await storage.read(), 'ar');
    expect(find.text('الإعدادات'), findsOneWidget);
    expect(
      Directionality.of(tester.element(find.byType(SettingsScreen))),
      TextDirection.rtl,
    );
  });
}

class _LocaleHost extends ConsumerWidget {
  const _LocaleHost({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeProvider);
    return MaterialApp(
      locale: locale,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: child,
    );
  }
}
