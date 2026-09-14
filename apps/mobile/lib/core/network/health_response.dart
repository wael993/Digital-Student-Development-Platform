import 'package:json_annotation/json_annotation.dart';

part 'health_response.g.dart';

@JsonSerializable()
class HealthResponse {
  const HealthResponse({required this.status});

  final String status;

  factory HealthResponse.fromJson(Map<String, dynamic> json) =>
      _$HealthResponseFromJson(json);

  Map<String, dynamic> toJson() => _$HealthResponseToJson(this);
}
