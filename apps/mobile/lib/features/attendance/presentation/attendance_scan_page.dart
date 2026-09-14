import 'package:digital_student/features/attendance/attendance.dart';
import 'package:digital_student/features/attendance/attendance_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:permission_handler/permission_handler.dart';

class AttendanceScanPage extends ConsumerStatefulWidget {
  const AttendanceScanPage({
    super.key,
    this.scannerBuilder,
    this.requestCameraPermission,
  });

  final Widget Function(BuildContext context, void Function(String token) onCode)? scannerBuilder;
  final Future<bool> Function()? requestCameraPermission;

  @override
  ConsumerState<AttendanceScanPage> createState() => _AttendanceScanPageState();
}

class _AttendanceScanPageState extends ConsumerState<AttendanceScanPage> {
  MobileScannerController? _camera;
  var _handled = false;

  @override
  void initState() {
    super.initState();
    if (widget.scannerBuilder == null) {
      _camera = MobileScannerController(formats: const [BarcodeFormat.qrCode]);
    }
    WidgetsBinding.instance.addPostFrameCallback((_) => _ensurePermission());
  }

  Future<void> _ensurePermission() async {
    final request = widget.requestCameraPermission ?? _defaultPermission;
    final granted = await request();
    if (!mounted) {
      return;
    }
    if (!granted) {
      ref.read(attendanceScanControllerProvider.notifier).permissionDenied();
      return;
    }
    if (ref.read(attendanceScanControllerProvider).permissionDenied) {
      await _scanNext();
    }
  }

  Future<bool> _defaultPermission() async {
    final status = await Permission.camera.request();
    return status.isGranted;
  }

  @override
  void dispose() {
    _camera?.dispose();
    super.dispose();
  }

  Future<void> _onCode(String token) async {
    if (_handled) {
      return;
    }
    final controller = ref.read(attendanceScanControllerProvider.notifier);
    if (ref.read(attendanceScanControllerProvider).phase != AttendanceScanPhase.scanning) {
      return;
    }
    _handled = true;
    await _camera?.stop();
    await controller.submit(token);
    if (mounted) {
      ref.invalidate(todaysAttendanceProvider);
    }
  }

  Future<void> _scanNext() async {
    _handled = false;
    ref.read(attendanceScanControllerProvider.notifier).scanNext();
    await _camera?.start();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(attendanceScanControllerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Scan Student QR')),
      body: switch (state.phase) {
        AttendanceScanPhase.scanning => _scanner(context),
        AttendanceScanPhase.loading => const Center(child: CircularProgressIndicator()),
        AttendanceScanPhase.recorded => _result(
            title: 'Attendance Recorded',
            student: state.result!.student,
            subtitle: 'Present',
            time: formatAttendanceTime(state.result!.attendance.scannedAt),
          ),
        AttendanceScanPhase.alreadyRecorded => _result(
            title: 'Already Recorded',
            student: state.result!.student,
            subtitle: 'was already marked present today.',
            time: formatAttendanceTime(state.result!.attendance.scannedAt),
          ),
        AttendanceScanPhase.error => _error(state),
      },
    );
  }

  Widget _scanner(BuildContext context) {
    final builder = widget.scannerBuilder;
    if (builder != null) {
      return builder(context, _onCode);
    }
    return MobileScanner(
      controller: _camera,
      onDetect: (capture) {
        final value = capture.barcodes.firstOrNull?.rawValue;
        if (value != null && value.trim().isNotEmpty) {
          _onCode(value);
        }
      },
      errorBuilder: (context, error) {
        return _PermissionBody(
          message: 'Camera permission is required to scan student QR codes.',
          onRetry: _ensurePermission,
        );
      },
    );
  }

  Widget _result({
    required String title,
    required AttendanceStudent student,
    required String subtitle,
    required String time,
  }) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Icon(Icons.check_circle, color: Colors.green.shade700, size: 64),
          const SizedBox(height: 16),
          Text(title, style: Theme.of(context).textTheme.headlineSmall, textAlign: TextAlign.center),
          const SizedBox(height: 16),
          Text(student.displayName, style: Theme.of(context).textTheme.titleLarge, textAlign: TextAlign.center),
          Text(student.studentNumber, textAlign: TextAlign.center),
          const SizedBox(height: 12),
          Text(subtitle, textAlign: TextAlign.center),
          Text(time, textAlign: TextAlign.center),
          const Spacer(),
          FilledButton(
            key: const Key('scanNextStudentButton'),
            onPressed: _scanNext,
            child: const Text('Scan Next Student'),
          ),
        ],
      ),
    );
  }

  Widget _error(AttendanceScanState state) {
    return _PermissionBody(
      title: state.permissionDenied ? 'Camera Permission Needed' : 'QR Code Not Recognized',
      message: state.message ?? 'No active student was found.',
      onRetry: () {
        if (state.permissionDenied) {
          _ensurePermission();
          return;
        }
        _scanNext();
      },
    );
  }
}

class _PermissionBody extends StatelessWidget {
  const _PermissionBody({
    required this.message,
    required this.onRetry,
    this.title,
  });

  final String? title;
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            title ?? 'QR Code Not Recognized',
            style: Theme.of(context).textTheme.headlineSmall,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 24),
          FilledButton(
            key: const Key('tryAgainButton'),
            onPressed: onRetry,
            child: const Text('Try Again'),
          ),
        ],
      ),
    );
  }
}
