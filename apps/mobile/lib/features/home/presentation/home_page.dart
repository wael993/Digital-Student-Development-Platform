import 'package:digital_student/features/auth/providers/auth_provider.dart';
import 'package:digital_student/features/campuses/presentation/campus_list_page.dart';
import 'package:digital_student/features/classrooms/presentation/classroom_list_page.dart';
import 'package:digital_student/features/parent/screens/parent_dashboard_screen.dart';
import 'package:digital_student/features/students/presentation/student_list_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final role = ref.watch(authProvider).user?.role;
    return Navigator(
      onGenerateRoute: (_) {
        return MaterialPageRoute<void>(builder: (_) => _roleHome(role));
      },
    );
  }

  Widget _roleHome(String? role) {
    switch (role) {
      case 'TEACHER':
        return const ClassroomListPage();
      case 'GUARDIAN':
        return const ParentDashboardScreen();
      case 'DRIVER':
        return const StudentListPage(title: 'Students');
      default:
        return const CampusListPage();
    }
  }
}
