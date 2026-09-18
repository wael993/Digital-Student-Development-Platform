import 'package:digital_student/features/auth/models/user.dart';
import 'package:digital_student/features/platform/presentation/account/platform_account_page.dart';
import 'package:digital_student/features/platform/presentation/dashboard/platform_dashboard_page.dart';
import 'package:digital_student/features/platform/presentation/invitations/invite_admin_page.dart';
import 'package:digital_student/features/platform/presentation/organizations/organizations_page.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:flutter/material.dart';

/// Root shell for PLATFORM_ADMIN. Never shows tenant school navigation.
class PlatformShell extends StatefulWidget {
  const PlatformShell({super.key, this.user});

  final User? user;

  @override
  State<PlatformShell> createState() => _PlatformShellState();
}

class _PlatformShellState extends State<PlatformShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    // Lazy pages: avoid firing dashboard+orgs+invite APIs all at once after login
    // (Render cold starts / aggregate queries otherwise race the Dio timeout).
    final Widget body;
    switch (_index) {
      case 1:
        body = const OrganizationsPage();
      case 2:
        body = const InviteAdminPage();
      case 3:
        body = PlatformAccountPage(user: widget.user);
      default:
        body = const PlatformDashboardPage();
    }

    return Scaffold(
      body: body,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.dashboard_outlined),
            selectedIcon: const Icon(Icons.dashboard),
            label: l10n.platformDashboard,
          ),
          NavigationDestination(
            icon: const Icon(Icons.business_outlined),
            selectedIcon: const Icon(Icons.business),
            label: l10n.platformOrganizations,
          ),
          NavigationDestination(
            icon: const Icon(Icons.mail_outline),
            selectedIcon: const Icon(Icons.mail),
            label: l10n.platformInvitations,
          ),
          NavigationDestination(
            icon: const Icon(Icons.person_outline),
            selectedIcon: const Icon(Icons.person),
            label: l10n.platformAccount,
          ),
        ],
      ),
    );
  }
}
