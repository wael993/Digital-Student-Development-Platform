import 'package:digital_student/core/config/env.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

final appRouter = GoRouter(
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const PlaceholderHomePage(),
    ),
  ],
);

class PlaceholderHomePage extends StatelessWidget {
  const PlaceholderHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Digital Student')),
      body: Center(
        child: Text(
          'API: ${AppEnv.apiBaseUrl}',
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}
