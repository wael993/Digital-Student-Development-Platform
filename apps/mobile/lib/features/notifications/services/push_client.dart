import 'dart:async';

import 'package:digital_student/features/notifications/models/app_notification.dart';

enum OsNotificationPermission { unknown, granted, denied, notDetermined }

class PushClient {
  const PushClient();

  Future<void> initialize() async {}

  Future<OsNotificationPermission> requestPermission() async {
    return OsNotificationPermission.denied;
  }

  Future<OsNotificationPermission> currentPermission() async {
    return OsNotificationPermission.denied;
  }

  Future<String?> token() async => null;

  Stream<PushPayload> get foregroundMessages => const Stream.empty();

  Stream<PushPayload> get openedMessages => const Stream.empty();

  Future<PushPayload?> initialMessage() async => null;

  Stream<String> get tokenRefresh => const Stream.empty();
}

class FakePushClient extends PushClient {
  FakePushClient({
    this.permission = OsNotificationPermission.granted,
    this.deviceToken = 'fake-fcm-token',
    this.initial,
  });

  OsNotificationPermission permission;
  String? deviceToken;
  PushPayload? initial;
  bool initialized = false;
  int permissionRequests = 0;
  final _foreground = StreamController<PushPayload>.broadcast();
  final _opened = StreamController<PushPayload>.broadcast();
  final _tokenRefresh = StreamController<String>.broadcast();

  @override
  Future<void> initialize() async {
    initialized = true;
  }

  @override
  Future<OsNotificationPermission> requestPermission() async {
    permissionRequests += 1;
    return permission;
  }

  @override
  Future<OsNotificationPermission> currentPermission() async {
    return permission;
  }

  @override
  Future<String?> token() async => deviceToken;

  @override
  Stream<PushPayload> get foregroundMessages => _foreground.stream;

  @override
  Stream<PushPayload> get openedMessages => _opened.stream;

  @override
  Future<PushPayload?> initialMessage() async => initial;

  @override
  Stream<String> get tokenRefresh => _tokenRefresh.stream;

  void emitForeground(PushPayload payload) => _foreground.add(payload);

  void emitOpened(PushPayload payload) => _opened.add(payload);

  void emitTokenRefresh(String token) => _tokenRefresh.add(token);

  void dispose() {
    _foreground.close();
    _opened.close();
    _tokenRefresh.close();
  }
}
