import 'package:digital_student/features/auth/providers/auth_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Digital Student'),
        actions: [
          TextButton(
            key: const Key('logoutButton'),
            onPressed: () => ref.read(authProvider.notifier).logout(),
            child: const Text('Log out'),
          ),
        ],
      ),
      body: Center(
        child: Text(
          user == null
              ? 'Signed in'
              : 'Signed in as ${user.displayName}\n${user.email}\n${user.role}',
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}
