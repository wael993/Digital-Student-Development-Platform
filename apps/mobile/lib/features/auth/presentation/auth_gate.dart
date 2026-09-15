import 'package:digital_student/features/auth/presentation/login_page.dart';
import 'package:digital_student/features/auth/providers/auth_provider.dart';
import 'package:digital_student/features/home/presentation/home_page.dart';
import 'package:digital_student/features/notifications/widgets/notification_host.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AuthGate extends ConsumerWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);

    switch (auth.status) {
      case AuthStatus.unknown:
        return const Scaffold(body: Center(child: CircularProgressIndicator()));
      case AuthStatus.authenticated:
        return const NotificationHost(child: HomePage());
      case AuthStatus.unauthenticated:
      case AuthStatus.authenticating:
      case AuthStatus.error:
        return const LoginPage();
    }
  }
}
