import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:digital_student/core/storage/secure_storage.dart';

class TokenStore {
  TokenStore(this._storage);

  static const accessKey = 'accessToken';
  static const refreshKey = 'refreshToken';

  final FlutterSecureStorage _storage;

  Future<String?> readAccessToken() => _storage.read(key: accessKey);

  Future<String?> readRefreshToken() => _storage.read(key: refreshKey);

  Future<void> save({required String accessToken, required String refreshToken}) async {
    await _storage.write(key: accessKey, value: accessToken);
    await _storage.write(key: refreshKey, value: refreshToken);
  }

  Future<void> saveAccessToken(String accessToken) {
    return _storage.write(key: accessKey, value: accessToken);
  }

  Future<void> clear() async {
    await _storage.delete(key: accessKey);
    await _storage.delete(key: refreshKey);
  }
}

final tokenStoreProvider = Provider<TokenStore>(
  (ref) => TokenStore(ref.watch(secureStorageProvider)),
);
