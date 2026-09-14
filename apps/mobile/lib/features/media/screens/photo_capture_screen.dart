import 'dart:typed_data';

import 'package:digital_student/features/media/models/student_media.dart';
import 'package:digital_student/features/media/providers/media_providers.dart';
import 'package:digital_student/features/media/widgets/photo_upload_progress.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';

enum CameraPermissionResult { granted, denied, permanentlyDenied }

class PhotoCaptureScreen extends ConsumerStatefulWidget {
  const PhotoCaptureScreen({
    super.key,
    required this.studentId,
    this.requestCameraPermission,
    this.capturePhoto,
    this.pickGallery,
    this.openSettings,
  });

  final String studentId;
  final Future<CameraPermissionResult> Function()? requestCameraPermission;
  final Future<CapturedPhoto?> Function()? capturePhoto;
  final Future<CapturedPhoto?> Function()? pickGallery;
  final Future<void> Function()? openSettings;

  @override
  ConsumerState<PhotoCaptureScreen> createState() => _PhotoCaptureScreenState();
}

class _PhotoCaptureScreenState extends ConsumerState<PhotoCaptureScreen> {
  CapturedPhoto? _preview;
  var _fromCamera = true;
  CameraPermissionResult? _permission;

  Future<CameraPermissionResult> _permissionFlow() async {
    if (widget.requestCameraPermission != null) {
      return widget.requestCameraPermission!();
    }
    final status = await Permission.camera.request();
    if (status.isGranted) {
      return CameraPermissionResult.granted;
    }
    if (status.isPermanentlyDenied) {
      return CameraPermissionResult.permanentlyDenied;
    }
    return CameraPermissionResult.denied;
  }

  Future<CapturedPhoto?> _pick(ImageSource source) async {
    if (source == ImageSource.camera && widget.capturePhoto != null) {
      return widget.capturePhoto!();
    }
    if (source == ImageSource.gallery && widget.pickGallery != null) {
      return widget.pickGallery!();
    }
    final file = await ImagePicker().pickImage(
      source: source,
      preferredCameraDevice: CameraDevice.rear,
      maxWidth: 1920,
      maxHeight: 1920,
      imageQuality: 85,
    );
    if (file == null) {
      return null;
    }
    return CapturedPhoto(
      bytes: await file.readAsBytes(),
      filename: 'photo.jpg',
    );
  }

  Future<void> _takePhoto() async {
    final permission = await _permissionFlow();
    if (!mounted) {
      return;
    }
    if (permission != CameraPermissionResult.granted) {
      setState(() => _permission = permission);
      return;
    }
    setState(() => _permission = CameraPermissionResult.granted);
    final photo = await _pick(ImageSource.camera);
    if (!mounted || photo == null) {
      return;
    }
    setState(() {
      _preview = photo;
      _fromCamera = true;
    });
  }

  Future<void> _chooseGallery() async {
    final photo = await _pick(ImageSource.gallery);
    if (!mounted || photo == null) {
      return;
    }
    setState(() {
      _preview = photo;
      _fromCamera = false;
      _permission = null;
    });
  }

  Future<void> _retake() async {
    ref.read(mediaUploadControllerProvider(widget.studentId).notifier).reset();
    if (_fromCamera) {
      await _takePhoto();
      return;
    }
    await _chooseGallery();
  }

  Future<void> _usePhoto() async {
    final photo = _preview;
    if (photo == null) {
      return;
    }
    await ref
        .read(mediaUploadControllerProvider(widget.studentId).notifier)
        .upload(photo);
  }

  @override
  Widget build(BuildContext context) {
    final upload = ref.watch(mediaUploadControllerProvider(widget.studentId));
    return Scaffold(
      appBar: AppBar(title: const Text('Student Photo')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: _body(context, upload),
      ),
    );
  }

  Widget _body(BuildContext context, MediaUploadState upload) {
    if (_permission != null &&
        _permission != CameraPermissionResult.granted &&
        _preview == null) {
      return _permissionDenied();
    }
    if (upload.phase == MediaUploadPhase.uploading) {
      return Column(
        children: [
          const Spacer(),
          PhotoUploadProgress(progress: upload.progress),
          const Spacer(),
          TextButton(
            key: const Key('cancelUploadButton'),
            onPressed: () => ref
                .read(mediaUploadControllerProvider(widget.studentId).notifier)
                .cancel(),
            child: const Text('Cancel'),
          ),
        ],
      );
    }
    if (upload.phase == MediaUploadPhase.success) {
      return Column(
        children: [
          const Spacer(),
          Icon(Icons.check_circle, color: Colors.green.shade700, size: 64),
          const SizedBox(height: 16),
          const Text('Photo uploaded'),
          const Spacer(),
          FilledButton(
            key: const Key('photoUploadDoneButton'),
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Done'),
          ),
        ],
      );
    }
    if (upload.phase == MediaUploadPhase.error) {
      return Column(
        children: [
          const Spacer(),
          Text(upload.message ?? 'Upload failed', textAlign: TextAlign.center),
          const Spacer(),
          FilledButton(
            key: const Key('retryUploadButton'),
            onPressed: _usePhoto,
            child: const Text('Try Again'),
          ),
          TextButton(
            onPressed: () => ref
                .read(mediaUploadControllerProvider(widget.studentId).notifier)
                .reset(),
            child: const Text('Cancel'),
          ),
        ],
      );
    }
    if (_preview != null) {
      return Column(
        children: [
          Expanded(
            child: ColoredBox(
              color: Colors.black12,
              child: Image.memory(
                key: const Key('photoPreview'),
                Uint8List.fromList(_preview!.bytes),
                fit: BoxFit.contain,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  key: const Key('retakePhotoButton'),
                  onPressed: _retake,
                  child: const Text('Retake'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  key: const Key('usePhotoButton'),
                  onPressed: upload.isUploading ? null : _usePhoto,
                  child: const Text('Use Photo'),
                ),
              ),
            ],
          ),
        ],
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Spacer(),
        FilledButton(
          key: const Key('takePhotoButton'),
          onPressed: _takePhoto,
          child: const Text('Take Photo'),
        ),
        const SizedBox(height: 12),
        OutlinedButton(
          key: const Key('chooseGalleryButton'),
          onPressed: _chooseGallery,
          child: const Text('Choose from device'),
        ),
        const Spacer(),
      ],
    );
  }

  Widget _permissionDenied() {
    return Column(
      children: [
        const Spacer(),
        const Text(
          'Camera access is required to take a photo.',
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 24),
        FilledButton(
          key: const Key('openSettingsButton'),
          onPressed: () async {
            await (widget.openSettings ?? openAppSettings)();
          },
          child: const Text('Open Settings'),
        ),
        TextButton(onPressed: _takePhoto, child: const Text('Try Again')),
        const Spacer(),
      ],
    );
  }
}
