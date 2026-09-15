import 'package:digital_student/core/localization/l10n_format.dart';
import 'package:digital_student/features/transport/models/transport_models.dart';
import 'package:digital_student/features/transport/repositories/transport_repository.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:permission_handler/permission_handler.dart';

class BoardingScanPage extends ConsumerStatefulWidget {
  const BoardingScanPage({super.key});

  @override
  ConsumerState<BoardingScanPage> createState() => _BoardingScanPageState();
}

class _BoardingScanPageState extends ConsumerState<BoardingScanPage> {
  MobileScannerController? _camera;
  var _handled = false;
  BoardingResult? _result;
  String? _error;
  var _loading = false;

  @override
  void initState() {
    super.initState();
    _camera = MobileScannerController(formats: const [BarcodeFormat.qrCode]);
    WidgetsBinding.instance.addPostFrameCallback((_) => _ensurePermission());
  }

  Future<void> _ensurePermission() async {
    final granted = await Permission.camera.request();
    if (!granted.isGranted && mounted) {
      setState(() => _error = AppLocalizations.of(context).cameraPermissionScan);
    }
  }

  @override
  void dispose() {
    _camera?.dispose();
    super.dispose();
  }

  Future<void> _onCode(String token) async {
    if (_handled || _loading) {
      return;
    }
    _handled = true;
    setState(() => _loading = true);
    await _camera?.stop();
    try {
      final result = await ref.read(transportRepositoryProvider).scanBoarding(token);
      if (mounted) {
        setState(() {
          _result = result;
          _loading = false;
        });
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = localizedError(AppLocalizations.of(context), error);
          _loading = false;
        });
      }
    }
  }

  Future<void> _scanNext() async {
    _handled = false;
    setState(() {
      _result = null;
      _error = null;
      _loading = false;
    });
    await _camera?.start();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(l10n.scanBoardingQr)),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _result != null
              ? _done(l10n)
              : _error != null
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(_error!, textAlign: TextAlign.center),
                            const SizedBox(height: 16),
                            FilledButton(onPressed: _scanNext, child: Text(l10n.tryAgain)),
                          ],
                        ),
                      ),
                    )
                  : MobileScanner(
                      controller: _camera,
                      onDetect: (capture) {
                        final value = capture.barcodes.firstOrNull?.rawValue;
                        if (value != null && value.trim().isNotEmpty) {
                          _onCode(value);
                        }
                      },
                    ),
    );
  }

  Widget _done(AppLocalizations l10n) {
    final result = _result!;
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Icon(Icons.check_circle, color: Colors.green.shade700, size: 64),
          const SizedBox(height: 16),
          Text(
            result.alreadyRecorded ? l10n.alreadyRecorded : l10n.attendanceRecorded,
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(result.displayName, style: Theme.of(context).textTheme.titleLarge),
          const Spacer(),
          FilledButton(onPressed: _scanNext, child: Text(l10n.scanNextStudent)),
        ],
      ),
    );
  }
}
