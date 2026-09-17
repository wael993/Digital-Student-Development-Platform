import 'package:digital_student/features/auth/models/user.dart';
import 'package:digital_student/features/auth/providers/auth_provider.dart';
import 'package:digital_student/features/campuses/presentation/campus_list_page.dart';
import 'package:digital_student/features/classrooms/presentation/classroom_list_page.dart';
import 'package:digital_student/features/parent/screens/parent_dashboard_screen.dart';
import 'package:digital_student/features/platform/presentation/platform_shell.dart';
import 'package:digital_student/features/transport/screens/driver_route_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    return Navigator(
      onGenerateRoute: (_) {
        return MaterialPageRoute<void>(
          builder: (_) => _roleHome(user),
        );
      },
    );
  }

  Widget _roleHome(User? user) {
    switch (user?.role) {
      case 'PLATFORM_ADMIN':
        return PlatformShell(user: user);
      case 'TEACHER':
        return const ClassroomListPage();
      case 'GUARDIAN':
        return const ParentDashboardScreen();
      case 'DRIVER':
        return const DriverRouteScreen();
      default:
        return const CampusListPage();
    }
  }
}
