import 'package:digital_student/app.dart';
import 'package:digital_student/core/config/env.dart';
import 'package:digital_student/core/logging/app_logger.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await AppEnv.load();
  appLogger.i('Digital Student starting');
  runApp(const ProviderScope(child: DigitalStudentApp()));
}
