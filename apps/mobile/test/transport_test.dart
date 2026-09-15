import 'package:digital_student/core/localization/l10n_format.dart';
import 'package:digital_student/features/transport/models/transport_models.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('parses parent ETA from remaining physical stops', () {
    final progress = ParentRouteProgress.fromJson({
      'currentStop': {'sequence': 3, 'name': 'Central Park'},
      'childStop': {'sequence': 6, 'name': 'Oak Building'},
      'childrenAtStop': 3,
      'stopsRemaining': 3,
      'estimatedMinutes': 10,
      'estimatedArrivalTime': '07:55',
      'liveTracking': false,
    });
    expect(progress.stopsRemaining, 3);
    expect(progress.estimatedMinutes, 10);
    expect(progress.estimatedArrivalTime, '07:55');
    expect(progress.childrenAtStop, 3);
    expect(progress.currentStop?.name, 'Central Park');
  });

  test('maps transport journey labels', () {
    final l10n = lookupAppLocalizations(const Locale('en'));
    expect(parentEventLabel(l10n, 'ARRIVED_BY_CAR'), 'Arrived by car');
    expect(parentEventLabel(l10n, 'TRANSPORT_CANCELLED'), 'Bus cancelled');
    expect(parentCurrentStatusLabel(l10n, 'NOT_PRESENT_AT_CLASS_CHECK'), 'Not arrived yet');
    expect(l10n.stopsRemaining(3), '3 stops remaining');
    expect(l10n.estimatedArrivalInMinutes(10), 'Estimated arrival in 10 minutes');
    expect(l10n.notLiveTracking, 'Estimated arrival — not live location');
  });
}
