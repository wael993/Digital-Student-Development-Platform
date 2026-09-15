import 'package:digital_student/app.dart';
import 'package:digital_student/core/config/env.dart';
import 'package:digital_student/core/logging/app_logger.dart';
import 'package:digital_student/features/notifications/providers/notification_providers.dart';
import 'package:digital_student/features/notifications/services/firebase_push_client.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await AppEnv.load();
  appLogger.i('Digital Student starting');
  final push = await createPushClient();
  runApp(
    ProviderScope(
      overrides: [pushClientProvider.overrideWithValue(push)],
      child: const DigitalStudentApp(),
    ),
  );
}
