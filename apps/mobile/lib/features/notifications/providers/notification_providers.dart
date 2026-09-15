import 'dart:async';
import 'dart:io';

import 'package:digital_student/features/auth/providers/auth_provider.dart';
import 'package:digital_student/features/notifications/models/app_notification.dart';
import 'package:digital_student/features/notifications/repositories/notification_repository.dart';
import 'package:digital_student/features/notifications/services/push_client.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final pushClientProvider = Provider<PushClient>((ref) => const PushClient());

final notificationsProvider = FutureProvider<List<AppNotification>>((ref) {
  return ref.watch(notificationRepositoryProvider).list();
});

final unreadNotificationsCountProvider = Provider<int>((ref) {
  final list = ref.watch(notificationsProvider).asData?.value;
  if (list != null) {
    return list.where((item) => item.isUnread).length;
  }
  return 0;
});

final notificationPreferencesProvider = FutureProvider<NotificationPreferences>((
  ref,
) {
  return ref.watch(notificationRepositoryProvider).preferences();
});

final pendingPushPayloadProvider = StateProvider<PushPayload?>((ref) => null);

final foregroundPushPayloadProvider = StateProvider<PushPayload?>((ref) => null);

final osNotificationPermissionProvider = StateProvider<OsNotificationPermission>(
  (ref) => OsNotificationPermission.unknown,
);

class DeviceTokenController extends StateNotifier<String?> {
  DeviceTokenController(this._ref) : super(null);

  final Ref _ref;
  StreamSubscription<String>? _tokenSub;

  Future<void> sync() async {
    final auth = _ref.read(authProvider);
    if (!auth.isAuthenticated) {
      return;
    }
    final push = _ref.read(pushClientProvider);
    await push.initialize();
    final permission = await push.requestPermission();
    _ref.read(osNotificationPermissionProvider.notifier).state = permission;
    if (permission != OsNotificationPermission.granted) {
      return;
    }
    final token = await push.token();
    if (token == null || token.isEmpty) {
      return;
    }
    await _register(token);
    _tokenSub ??= push.tokenRefresh.listen(_register);
  }

  Future<void> _register(String token) async {
    state = token;
    try {
      await _ref.read(notificationRepositoryProvider).registerDevice(
        token: token,
        platform: Platform.isIOS ? 'IOS' : 'ANDROID',
      );
    } catch (_) {}
  }

  Future<void> unregister() async {
    await _tokenSub?.cancel();
    _tokenSub = null;
    await _ref.read(notificationRepositoryProvider).unregisterCurrentDevice();
    state = null;
  }

  @override
  void dispose() {
    _tokenSub?.cancel();
    super.dispose();
  }
}

final deviceTokenProvider =
    StateNotifierProvider<DeviceTokenController, String?>((ref) {
      return DeviceTokenController(ref);
    });
