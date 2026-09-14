import 'package:digital_student/core/router/app_router.dart';
import 'package:flutter/material.dart';

class DigitalStudentApp extends StatelessWidget {
  const DigitalStudentApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Digital Student',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
        useMaterial3: true,
      ),
      routerConfig: appRouter,
    );
  }
}
