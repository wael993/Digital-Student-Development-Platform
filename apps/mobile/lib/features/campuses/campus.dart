class Campus {
  const Campus({
    required this.id,
    required this.organizationId,
    required this.name,
    required this.status,
  });

  final String id;
  final String organizationId;
  final String name;
  final String status;

  factory Campus.fromJson(Map<String, dynamic> json) {
    return Campus(
      id: json['id'] as String,
      organizationId: json['organizationId'] as String,
      name: json['name'] as String,
      status: json['status'] as String,
    );
  }
}
