import 'package:digital_student/features/users/staff_user.dart';
import 'package:digital_student/features/users/user_repository.dart';
import 'package:digital_student/shared/models/page_result.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class UserListFilter {
  const UserListFilter({this.q = '', this.role, this.status});

  final String q;
  final String? role;
  final String? status;

  UserListFilter copyWith({String? q, String? role, String? status, bool clearRole = false, bool clearStatus = false}) {
    return UserListFilter(
      q: q ?? this.q,
      role: clearRole ? null : (role ?? this.role),
      status: clearStatus ? null : (status ?? this.status),
    );
  }
}

class UserListFilterNotifier extends StateNotifier<UserListFilter> {
  UserListFilterNotifier() : super(const UserListFilter());

  void setQuery(String q) => state = state.copyWith(q: q);

  void setRole(String? role) =>
      state = role == null ? state.copyWith(clearRole: true) : state.copyWith(role: role);

  void setStatus(String? status) =>
      state = status == null ? state.copyWith(clearStatus: true) : state.copyWith(status: status);
}

final userListFilterProvider =
    StateNotifierProvider<UserListFilterNotifier, UserListFilter>(
  (ref) => UserListFilterNotifier(),
);

final staffUsersProvider =
    FutureProvider.autoDispose<PageResult<StaffUser>>((ref) {
  final filter = ref.watch(userListFilterProvider);
  return ref.watch(userRepositoryProvider).list(
        q: filter.q,
        role: filter.role,
        status: filter.status,
      );
});

final staffUserDetailsProvider =
    FutureProvider.autoDispose.family<StaffUser, String>((ref, id) {
  return ref.watch(userRepositoryProvider).getById(id);
});

void invalidateStaffUsers(WidgetRef ref, {String? userId}) {
  ref.invalidate(staffUsersProvider);
  if (userId != null) {
    ref.invalidate(staffUserDetailsProvider(userId));
  }
}
