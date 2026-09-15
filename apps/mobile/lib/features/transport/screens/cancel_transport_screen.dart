import 'package:digital_student/core/localization/l10n_format.dart';
import 'package:digital_student/features/transport/providers/transport_providers.dart';
import 'package:digital_student/features/transport/repositories/transport_repository.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

class CancelTransportScreen extends ConsumerStatefulWidget {
  const CancelTransportScreen({super.key, required this.studentId, required this.direction});

  final String studentId;
  final String direction;

  @override
  ConsumerState<CancelTransportScreen> createState() => _CancelTransportScreenState();
}

class _CancelTransportScreenState extends ConsumerState<CancelTransportScreen> {
  String _choice = 'today';
  DateTimeRange? _custom;
  var _saving = false;

  DateTime get _today {
    final now = DateTime.now();
    return DateTime(now.year, now.month, now.day);
  }

  (DateTime, DateTime) _range() {
    final today = _today;
    switch (_choice) {
      case 'tomorrow':
        final day = today.add(const Duration(days: 1));
        return (day, day);
      case 'three':
        return (today, today.add(const Duration(days: 2)));
      case 'custom':
        final range = _custom;
        if (range != null) {
          return (range.start, range.end);
        }
        return (today, today);
      default:
        return (today, today);
    }
  }

  Future<void> _submit() async {
    final l10n = AppLocalizations.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.cancelBus),
        content: Text(l10n.confirmCancelBus),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(l10n.cancel)),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: Text(l10n.confirm)),
        ],
      ),
    );
    if (confirmed != true || _saving) {
      return;
    }
    setState(() => _saving = true);
    final range = _range();
    final format = DateFormat('yyyy-MM-dd');
    try {
      await ref.read(transportRepositoryProvider).cancelBus(
            studentId: widget.studentId,
            direction: widget.direction,
            startDate: format.format(range.$1),
            endDate: format.format(range.$2),
          );
      ref.invalidate(parentTransportProvider(widget.studentId));
      if (mounted) {
        Navigator.pop(context, true);
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(localizedError(AppLocalizations.of(context), error))),
        );
        setState(() => _saving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(l10n.cancelBus)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(l10n.cancelBusFor, style: Theme.of(context).textTheme.titleMedium),
          RadioGroup<String>(
            groupValue: _choice,
            onChanged: (value) async {
              if (value == 'custom') {
                final picked = await showDateRangePicker(
                  context: context,
                  firstDate: _today,
                  lastDate: _today.add(const Duration(days: 31)),
                );
                setState(() {
                  _choice = 'custom';
                  _custom = picked;
                });
                return;
              }
              setState(() => _choice = value ?? 'today');
            },
            child: Column(
              children: [
                RadioListTile(title: Text(l10n.cancelToday), value: 'today'),
                RadioListTile(title: Text(l10n.cancelTomorrow), value: 'tomorrow'),
                RadioListTile(title: Text(l10n.cancelNextThreeDays), value: 'three'),
                RadioListTile(title: Text(l10n.cancelCustomDates), value: 'custom'),
              ],
            ),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _saving ? null : _submit,
            child: Text(l10n.confirm),
          ),
        ],
      ),
    );
  }
}
