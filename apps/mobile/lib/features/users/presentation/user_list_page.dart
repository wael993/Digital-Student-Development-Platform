import 'dart:async';

import 'package:digital_student/core/localization/l10n_format.dart';
import 'package:digital_student/features/auth/models/user.dart' show User;
import 'package:digital_student/features/auth/providers/auth_provider.dart';
import 'package:digital_student/features/users/presentation/add_user_page.dart';
import 'package:digital_student/features/users/presentation/user_details_page.dart';
import 'package:digital_student/features/users/user_providers.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:digital_student/shared/widgets/school_scaffold.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class UserListPage extends ConsumerStatefulWidget {
  const UserListPage({super.key});

  @override
  ConsumerState<UserListPage> createState() => _UserListPageState();
}

class _UserListPageState extends ConsumerState<UserListPage> {
  late final TextEditingController _search;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _search = TextEditingController(text: ref.read(userListFilterProvider).q);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final user = ref.watch(authProvider).user;
    final filter = ref.watch(userListFilterProvider);
    final users = ref.watch(staffUsersProvider);
    final canAdd = user?.canManageStaffUsers ?? false;

    return SchoolScaffold(
      title: l10n.users,
      floatingActionButton: canAdd
          ? FloatingActionButton(
              key: const Key('addUserButton'),
              onPressed: () async {
                final created = await Navigator.of(context).push<bool>(
                  MaterialPageRoute<bool>(builder: (_) => const AddUserPage()),
                );
                if (created == true) {
                  invalidateStaffUsers(ref);
                }
              },
              child: const Icon(Icons.add),
            )
          : null,
      bottom: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
        child: Column(
          children: [
            TextField(
              key: const Key('usersSearchField'),
              controller: _search,
              decoration: InputDecoration(
                hintText: l10n.searchUsers,
                prefixIcon: const Icon(Icons.search),
                border: const OutlineInputBorder(),
                isDense: true,
              ),
              onChanged: (value) {
                _debounce?.cancel();
                _debounce = Timer(const Duration(milliseconds: 300), () {
                  ref.read(userListFilterProvider.notifier).setQuery(value);
                });
              },
            ),
            const SizedBox(height: 8),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _FilterChip(
                    label: l10n.filterAll,
                    selected: filter.role == null,
                    onSelected: () =>
                        ref.read(userListFilterProvider.notifier).setRole(null),
                  ),
                  for (final role in (user?.role == 'ADMIN'
                      ? User.tenantRoles
                      : User.supervisorCreatableRoles))
                    _FilterChip(
                      label: tenantRoleLabel(l10n, role),
                      selected: filter.role == role,
                      onSelected: () => ref
                          .read(userListFilterProvider.notifier)
                          .setRole(role),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 4),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _FilterChip(
                    label: l10n.filterAllStatuses,
                    selected: filter.status == null,
                    onSelected: () => ref
                        .read(userListFilterProvider.notifier)
                        .setStatus(null),
                  ),
                  _FilterChip(
                    label: l10n.userStatusActive,
                    selected: filter.status == 'ACTIVE',
                    onSelected: () => ref
                        .read(userListFilterProvider.notifier)
                        .setStatus('ACTIVE'),
                  ),
                  _FilterChip(
                    label: l10n.userStatusInactive,
                    selected: filter.status == 'INACTIVE',
                    onSelected: () => ref
                        .read(userListFilterProvider.notifier)
                        .setStatus('INACTIVE'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      body: AsyncRefreshBody(
        value: users,
        onRefresh: () async {
          ref.invalidate(staffUsersProvider);
          await ref.read(staffUsersProvider.future);
        },
        isEmpty: (page) => page.data.isEmpty,
        emptyMessage: l10n.noUsersYet,
        builder: (page) => ListView.builder(
          key: const Key('usersList'),
          physics: const AlwaysScrollableScrollPhysics(),
          itemCount: page.data.length,
          itemBuilder: (context, index) {
            final staff = page.data[index];
            return ListTile(
              title: Text(staff.displayName),
              subtitle: Text(
                '${tenantRoleLabel(l10n, staff.role)} · ${userStatusLabel(l10n, staff.status)}',
              ),
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => UserDetailsPage(userId: staff.id),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onSelected,
  });

  final String label;
  final bool selected;
  final VoidCallback onSelected;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onSelected(),
      ),
    );
  }
}
