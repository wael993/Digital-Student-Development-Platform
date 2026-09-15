import 'dart:io';

import 'package:digital_student/features/notifications/models/app_notification.dart';
import 'package:digital_student/features/notifications/services/push_client.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:permission_handler/permission_handler.dart';

PushPayload? payloadFromRemote(RemoteMessage message) {
  final data = message.data;
  final studentId = data['studentId'];
  if (studentId == null || studentId.isEmpty) {
    return null;
  }
  return PushPayload.fromData(
    data,
    title: message.notification?.title,
    body: message.notification?.body,
  );
}

class FirebasePushClient extends PushClient {
  FirebasePushClient(this._messaging);

  final FirebaseMessaging _messaging;

  @override
  Future<void> initialize() async {
    await _messaging.setForegroundNotificationPresentationOptions(
      alert: false,
      badge: true,
      sound: false,
    );
  }

  @override
  Future<OsNotificationPermission> requestPermission() async {
    if (Platform.isAndroid) {
      await Permission.notification.request();
    }
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    return _map(settings.authorizationStatus);
  }

  @override
  Future<OsNotificationPermission> currentPermission() async {
    final settings = await _messaging.getNotificationSettings();
    return _map(settings.authorizationStatus);
  }

  @override
  Future<String?> token() => _messaging.getToken();

  @override
  Stream<String> get tokenRefresh => _messaging.onTokenRefresh;

  @override
  Stream<PushPayload> get foregroundMessages =>
      _payloads(FirebaseMessaging.onMessage);

  @override
  Stream<PushPayload> get openedMessages =>
      _payloads(FirebaseMessaging.onMessageOpenedApp);

  @override
  Future<PushPayload?> initialMessage() async {
    final message = await _messaging.getInitialMessage();
    if (message == null) {
      return null;
    }
    return payloadFromRemote(message);
  }

  OsNotificationPermission _map(AuthorizationStatus status) {
    switch (status) {
      case AuthorizationStatus.authorized:
      case AuthorizationStatus.provisional:
        return OsNotificationPermission.granted;
      case AuthorizationStatus.denied:
      case AuthorizationStatus.deniedPermanently:
        return OsNotificationPermission.denied;
      case AuthorizationStatus.notDetermined:
        return OsNotificationPermission.notDetermined;
    }
  }
}

Stream<PushPayload> _payloads(Stream<RemoteMessage> source) async* {
  await for (final message in source) {
    final payload = payloadFromRemote(message);
    if (payload != null) {
      yield payload;
    }
  }
}

Future<PushClient> createPushClient() async {
  try {
    if (Firebase.apps.isEmpty) {
      final options = _optionsFromEnv();
      if (options != null) {
        await Firebase.initializeApp(options: options);
      } else {
        await Firebase.initializeApp();
      }
    }
    final client = FirebasePushClient(FirebaseMessaging.instance);
    await client.initialize();
    return client;
  } catch (_) {
    return const PushClient();
  }
}

FirebaseOptions? _optionsFromEnv() {
  final projectId = dotenv.env['FIREBASE_PROJECT_ID'];
  final apiKey = dotenv.env['FIREBASE_API_KEY'];
  final appId = dotenv.env['FIREBASE_APP_ID'];
  final senderId = dotenv.env['FIREBASE_MESSAGING_SENDER_ID'];
  if (projectId == null ||
      projectId.isEmpty ||
      apiKey == null ||
      apiKey.isEmpty ||
      appId == null ||
      appId.isEmpty ||
      senderId == null ||
      senderId.isEmpty) {
    return null;
  }
  return FirebaseOptions(
    apiKey: apiKey,
    appId: appId,
    messagingSenderId: senderId,
    projectId: projectId,
    iosBundleId: dotenv.env['FIREBASE_IOS_BUNDLE_ID'],
  );
}
