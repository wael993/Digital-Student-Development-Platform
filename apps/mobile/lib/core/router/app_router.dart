import 'package:digital_student/features/auth/presentation/auth_gate.dart';
import 'package:go_router/go_router.dart';

final appRouter = GoRouter(
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const AuthGate(),
    ),
  ],
);
