import 'package:digital_student/core/network/api_client.dart';
import 'package:digital_student/core/storage/token_store.dart';
import 'package:digital_student/features/auth/data/auth_api.dart';
import 'package:digital_student/features/auth/models/auth_response.dart';
import 'package:digital_student/features/auth/models/user.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AuthRepository {
  AuthRepository(this._api, this._tokens);

  final AuthApi _api;
  final TokenStore _tokens;

  Future<AuthResponse> login({required String email, required String password}) async {
    final result = await _api.login(email: email, password: password);
    await _tokens.save(
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    );
    return result;
  }

  Future<User> me() => _api.me();

  Future<void> logout() async {
    final refreshToken = await _tokens.readRefreshToken();
    try {
      await _api.logout(refreshToken);
    } catch (_) {
      // Local session is still cleared by the caller.
    }
    await _tokens.clear();
  }

  Future<String?> readAccessToken() => _tokens.readAccessToken();

  Future<String?> readRefreshToken() => _tokens.readRefreshToken();

  Future<void> clearSession() => _tokens.clear();
}

final authApiProvider = Provider<AuthApi>(
  (ref) => AuthApi(ref.watch(apiClientProvider)),
);

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.watch(authApiProvider), ref.watch(tokenStoreProvider)),
);
