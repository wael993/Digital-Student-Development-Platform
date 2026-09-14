class StudentMedia {
  const StudentMedia({
    required this.id,
    required this.mediaType,
    required this.contentType,
    required this.capturedAt,
    this.width,
    this.height,
    this.createdAt,
    this.thumbnailUrl,
    this.url,
  });

  final String id;
  final String mediaType;
  final String contentType;
  final DateTime capturedAt;
  final int? width;
  final int? height;
  final DateTime? createdAt;
  final String? thumbnailUrl;
  final String? url;

  factory StudentMedia.fromJson(Map<String, dynamic> json) {
    return StudentMedia(
      id: json['id'] as String,
      mediaType: json['mediaType'] as String? ?? 'PHOTO',
      contentType: json['contentType'] as String? ?? 'image/jpeg',
      capturedAt: DateTime.parse(json['capturedAt'] as String),
      width: json['width'] as int?,
      height: json['height'] as int?,
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      thumbnailUrl: json['thumbnailUrl'] as String?,
      url: json['url'] as String?,
    );
  }
}

class CapturedPhoto {
  const CapturedPhoto({required this.bytes, required this.filename});

  final List<int> bytes;
  final String filename;
}

enum MediaAudience { staff, parent }

class MediaListArgs {
  const MediaListArgs({required this.studentId, required this.audience});

  final String studentId;
  final MediaAudience audience;

  @override
  bool operator ==(Object other) =>
      other is MediaListArgs &&
      other.studentId == studentId &&
      other.audience == audience;

  @override
  int get hashCode => Object.hash(studentId, audience);
}
