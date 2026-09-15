import 'dart:async';

import 'package:digital_student/core/localization/l10n_format.dart';
import 'package:digital_student/features/auth/providers/auth_provider.dart';
import 'package:digital_student/features/notifications/models/app_notification.dart';
import 'package:digital_student/features/notifications/providers/notification_providers.dart';
import 'package:digital_student/features/notifications/repositories/notification_repository.dart';
import 'package:digital_student/features/notifications/services/notification_navigation.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class NotificationHost extends ConsumerStatefulWidget {
  const NotificationHost({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<NotificationHost> createState() => _NotificationHostState();
}

class _NotificationHostState extends ConsumerState<NotificationHost> {
  final _subs = <StreamSubscription<PushPayload>>[];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _start());
  }

  @override
  void dispose() {
    for (final sub in _subs) {
      unawaited(sub.cancel());
    }
    super.dispose();
  }

  Future<void> _start() async {
    if (!mounted) {
      return;
    }
    final auth = ref.read(authProvider);
    if (!auth.isAuthenticated) {
      return;
    }
    final push = ref.read(pushClientProvider);
    _subs.add(
      push.foregroundMessages.listen((payload) {
        if (!mounted) {
          return;
        }
        ref.read(foregroundPushPayloadProvider.notifier).state = payload;
        ref.invalidate(notificationsProvider);
      }),
    );
    _subs.add(
      push.openedMessages.listen((payload) {
        if (!mounted) {
          return;
        }
        ref.read(pendingPushPayloadProvider.notifier).state = payload;
      }),
    );
    unawaited(ref.read(deviceTokenProvider.notifier).sync());
    final initial = await push.initialMessage();
    if (initial != null && mounted) {
      ref.read(pendingPushPayloadProvider.notifier).state = initial;
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(pendingPushPayloadProvider, (previous, next) {
      if (next == null) {
        return;
      }
      WidgetsBinding.instance.addPostFrameCallback((_) async {
        if (!mounted) {
          return;
        }
        ref.read(pendingPushPayloadProvider.notifier).state = null;
        await openNotificationTarget(context, next);
        if (next.notificationId != null) {
          await ref
              .read(notificationRepositoryProvider)
              .markRead(next.notificationId!);
          ref.invalidate(notificationsProvider);
        }
      });
    });

    final banner = ref.watch(foregroundPushPayloadProvider);
    final l10n = AppLocalizations.of(context);
    return Column(
      children: [
        if (banner != null)
          Material(
            color: Theme.of(context).colorScheme.primaryContainer,
            child: ListTile(
              key: const Key('foregroundNotificationBanner'),
              title: Text(notificationTypeLabel(l10n, banner.type)),
              subtitle: Text(l10n.tapToViewJourney),
              onTap: () {
                ref.read(foregroundPushPayloadProvider.notifier).state = null;
                ref.read(pendingPushPayloadProvider.notifier).state = banner;
              },
            ),
          ),
        Expanded(child: widget.child),
      ],
    );
  }
}
