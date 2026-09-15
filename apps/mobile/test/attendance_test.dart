import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:digital_student/core/network/api_client.dart';
import 'package:digital_student/core/storage/token_store.dart';
import 'package:digital_student/features/attendance/attendance_repository.dart';
import 'package:digital_student/features/attendance/presentation/attendance_page.dart';
import 'package:digital_student/features/attendance/presentation/attendance_scan_page.dart';
import 'package:digital_student/features/auth/data/auth_api.dart';
import 'package:digital_student/features/auth/data/auth_repository.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

import 'support/localized_app.dart';

class _Adapter implements HttpClientAdapter {
  _Adapter(this._fetch);

  final Future<ResponseBody> Function(RequestOptions options) _fetch;

  @override
  void close({bool force = false}) {}

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) {
    return _fetch(options);
  }
}

ResponseBody _json(int status, Map<String, dynamic> data) {
  return ResponseBody.fromString(
    jsonEncode(data),
    status,
    headers: {
      Headers.contentTypeHeader: [Headers.jsonContentType],
    },
  );
}

Dio _dio(Future<ResponseBody> Function(RequestOptions options) fetch) {
  final dio = Dio(
    BaseOptions(
      baseUrl: 'http://test',
      connectTimeout: const Duration(milliseconds: 200),
      receiveTimeout: const Duration(seconds: 2),
    ),
  );
  dio.httpClientAdapter = _Adapter(fetch);
  return dio;
}

Map<String, dynamic> _scanBody({
  String status = 'RECORDED',
  String firstName = 'Emma',
  String lastName = 'Smith',
  String scannedAt = '2026-09-14T07:42:31.000Z',
}) {
  return {
    'status': status,
    'attendance': {
      'id': 'att-1',
      'attendanceType': 'PRESENT',
      'scannedAt': scannedAt,
    },
    'student': {
      'id': 'stu-1',
      'firstName': firstName,
      'lastName': lastName,
      'studentNumber': 'STU-00124',
    },
  };
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late TokenStore tokens;

  setUp(() {
    dotenv.testLoad(fileInput: 'API_BASE_URL=http://localhost:3000/api/v1');
    FlutterSecureStorage.setMockInitialValues({});
    tokens = TokenStore(const FlutterSecureStorage());
  });

  List<Override> overrides(Dio dio) {
    return [
      tokenStoreProvider.overrideWithValue(tokens),
      authRepositoryProvider.overrideWithValue(AuthRepository(AuthApi(dio), tokens)),
      apiClientProvider.overrideWithValue(dio),
      attendanceRepositoryProvider.overrideWithValue(AttendanceRepository(dio)),
    ];
  }

  Future<void> pumpScan(
    WidgetTester tester, {
    required Dio dio,
    Future<bool> Function()? requestCameraPermission,
  }) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: overrides(dio),
        child: localizedApp(
          home: AttendanceScanPage(
            requestCameraPermission: requestCameraPermission ?? () async => true,
            scannerBuilder: (context, onCode) {
              return Column(
                children: [
                  TextButton(
                    key: const Key('fakeScanButton'),
                    onPressed: () => onCode('7c8f4d9a'),
                    child: const Text('Simulate scan'),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
    await tester.pump();
    await tester.pump();
  }

  testWidgets('opens the scanner and records a QR token', (tester) async {
    var scannedToken = '';
    final dio = _dio((options) async {
      if (options.path.contains('/attendance/scan')) {
        scannedToken = (options.data as Map)['qrToken'] as String;
        return _json(201, _scanBody());
      }
      return _json(200, {
        'data': <dynamic>[],
        'meta': {'page': 1, 'limit': 20, 'total': 0},
      });
    });

    await pumpScan(tester, dio: dio);
    expect(find.text('Simulate scan'), findsOneWidget);

    await tester.tap(find.byKey(const Key('fakeScanButton')));
    await tester.pump();
    await tester.idle();
    await tester.pump();

    expect(scannedToken, '7c8f4d9a');
    expect(find.text('Attendance Recorded'), findsOneWidget);
    expect(find.text('Emma Smith'), findsOneWidget);
    expect(find.text('STU-00124'), findsOneWidget);
    expect(find.text('Present'), findsOneWidget);
    expect(find.byKey(const Key('scanNextStudentButton')), findsOneWidget);
  });

  testWidgets('shows already recorded and can scan the next student', (tester) async {
    final dio = _dio((options) async {
      if (options.path.contains('/attendance/scan')) {
        return _json(200, _scanBody(status: 'ALREADY_RECORDED'));
      }
      return _json(200, {
        'data': <dynamic>[],
        'meta': {'page': 1, 'limit': 20, 'total': 0},
      });
    });

    await pumpScan(tester, dio: dio);
    await tester.tap(find.byKey(const Key('fakeScanButton')));
    await tester.pump();
    await tester.idle();
    await tester.pump();

    expect(find.text('Already Recorded'), findsOneWidget);
    expect(find.text('was already marked present today.'), findsOneWidget);

    await tester.tap(find.byKey(const Key('scanNextStudentButton')));
    await tester.pump();
    expect(find.byKey(const Key('fakeScanButton')), findsOneWidget);
  });

  testWidgets('shows an error for an unrecognized QR code', (tester) async {
    final dio = _dio((options) async {
      if (options.path.contains('/attendance/scan')) {
        return _json(404, {
          'error': {'code': 'NOT_FOUND', 'message': 'Student not found'},
        });
      }
      return _json(200, {
        'data': <dynamic>[],
        'meta': {'page': 1, 'limit': 20, 'total': 0},
      });
    });

    await pumpScan(tester, dio: dio);
    await tester.tap(find.byKey(const Key('fakeScanButton')));
    await tester.pump();
    await tester.idle();
    await tester.pump();

    expect(find.text('QR Code Not Recognized'), findsOneWidget);
    expect(find.text('No active student was found.'), findsOneWidget);
    expect(find.byKey(const Key('tryAgainButton')), findsOneWidget);
  });

  testWidgets('shows a camera permission error', (tester) async {
    final dio = _dio((_) async => _json(500, {}));
    await pumpScan(tester, dio: dio, requestCameraPermission: () async => false);
    await tester.pump();

    expect(find.text('Camera Permission Needed'), findsOneWidget);
    expect(find.text('Camera permission is required to scan student QR codes.'), findsOneWidget);
  });

  testWidgets('loading state ignores a second scan', (tester) async {
    var scanCalls = 0;
    final gate = Completer<ResponseBody>();
    final dio = _dio((options) async {
      if (options.path.contains('/attendance/scan')) {
        scanCalls += 1;
        return gate.future;
      }
      return _json(200, {
        'data': <dynamic>[],
        'meta': {'page': 1, 'limit': 20, 'total': 0},
      });
    });

    await pumpScan(tester, dio: dio);
    await tester.tap(find.byKey(const Key('fakeScanButton')));
    await tester.pump();
    await tester.idle();
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    expect(scanCalls, 1);

    gate.complete(_json(201, _scanBody()));
    await tester.idle();
    await tester.pump();
    expect(find.text('Attendance Recorded'), findsOneWidget);
    expect(scanCalls, 1);
  });

  testWidgets('lists today attendance and shows the scan button', (tester) async {
    final dio = _dio((options) async {
      return _json(200, {
        'data': [
          {
            'id': 'att-1',
            'student': {
              'id': 'stu-1',
              'firstName': 'Emma',
              'lastName': 'Smith',
              'studentNumber': 'STU-00124',
            },
            'attendanceType': 'PRESENT',
            'scannedAt': '2026-09-14T07:42:31.000Z',
          },
        ],
        'meta': {'page': 1, 'limit': 20, 'total': 1},
      });
    });

    await tester.pumpWidget(
      ProviderScope(
        overrides: overrides(dio),
        child: localizedApp(home: const AttendancePage()),
      ),
    );
    await tester.pump();
    await tester.idle();
    await tester.pump();

    expect(find.text('Attendance'), findsWidgets);
    expect(find.text("Today's Attendance"), findsOneWidget);
    expect(find.text('Emma Smith'), findsOneWidget);
    expect(find.byKey(const Key('scanStudentQrButton')), findsOneWidget);
  });
}
