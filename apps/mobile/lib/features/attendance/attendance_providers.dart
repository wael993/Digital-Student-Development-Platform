import 'package:digital_student/core/network/api_exception.dart';
import 'package:digital_student/features/attendance/attendance.dart';
import 'package:digital_student/features/attendance/attendance_repository.dart';
import 'package:digital_student/shared/models/page_result.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum AttendanceScanPhase { scanning, loading, recorded, alreadyRecorded, error }

class AttendanceScanState {
  const AttendanceScanState({
    required this.phase,
    this.result,
    this.message,
    this.permissionDenied = false,
  });

  final AttendanceScanPhase phase;
  final AttendanceScanResult? result;
  final String? message;
  final bool permissionDenied;

  static const scanning = AttendanceScanState(phase: AttendanceScanPhase.scanning);
}

class AttendanceScanController extends StateNotifier<AttendanceScanState> {
  AttendanceScanController(this._repository) : super(AttendanceScanState.scanning);

  final AttendanceRepository _repository;

  Future<void> submit(String qrToken) async {
    if (state.phase == AttendanceScanPhase.loading) {
      return;
    }
    final token = qrToken.trim();
    if (token.isEmpty) {
      return;
    }

    state = const AttendanceScanState(phase: AttendanceScanPhase.loading);
    try {
      final result = await _repository.scan(token);
      if (!mounted) {
        return;
      }
      state = AttendanceScanState(
        phase: result.alreadyRecorded
            ? AttendanceScanPhase.alreadyRecorded
            : AttendanceScanPhase.recorded,
        result: result,
      );
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      state = AttendanceScanState(
        phase: AttendanceScanPhase.error,
        message: error.statusCode == 404 ? 'STUDENT_NOT_FOUND' : error.code,
      );
    } catch (_) {
      if (!mounted) {
        return;
      }
      state = const AttendanceScanState(
        phase: AttendanceScanPhase.error,
        message: 'NETWORK_ERROR',
      );
    }
  }

  void scanNext() {
    state = AttendanceScanState.scanning;
  }

  void permissionDenied() {
    state = const AttendanceScanState(
      phase: AttendanceScanPhase.error,
      permissionDenied: true,
      message: 'CAMERA_PERMISSION',
    );
  }
}

final attendanceScanControllerProvider =
    StateNotifierProvider.autoDispose<AttendanceScanController, AttendanceScanState>(
  (ref) => AttendanceScanController(ref.watch(attendanceRepositoryProvider)),
);

final todaysAttendanceProvider =
    FutureProvider.autoDispose<PageResult<AttendanceRecord>>((ref) {
  return ref.watch(attendanceRepositoryProvider).list();
});
