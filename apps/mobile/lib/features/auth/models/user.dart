class User {
  const User({
    required this.id,
    required this.organizationId,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.role,
  });

  final String id;
  final String organizationId;
  final String firstName;
  final String lastName;
  final String email;
  final String role;

  String get displayName => '$firstName $lastName'.trim();

  bool get canManageSchool => role == 'ADMIN' || role == 'SUPERVISOR';

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      organizationId: json['organizationId'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      email: json['email'] as String,
      role: json['role'] as String,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'organizationId': organizationId,
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'role': role,
      };
}
