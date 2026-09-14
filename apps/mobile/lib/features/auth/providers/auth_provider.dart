import 'dart:async';

import 'package:digital_student/core/network/api_exception.dart';
import 'package:digital_student/core/network/auth_session.dart';
import 'package:digital_student/features/auth/data/auth_repository.dart';
import 'package:digital_student/features/auth/models/user.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum AuthStatus { unknown, unauthenticated, authenticating, authenticated, error }

class AuthState {
  const AuthState({required this.status, this.user, this.message});

  final AuthStatus status;
  final User? user;
  final String? message;

  static const unknown = AuthState(status: AuthStatus.unknown);
  static const unauthenticated = AuthState(status: AuthStatus.unauthenticated);

  bool get isAuthenticated => status == AuthStatus.authenticated;
}

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._repository) : super(AuthState.unknown) {
    _onRefreshFailed = () {
      if (state.status == AuthStatus.authenticated) {
        state = AuthState.unauthenticated;
      }
    };
    authSession.onRefreshFailed = _onRefreshFailed;
  }

  final AuthRepository _repository;
  late final void Function() _onRefreshFailed;

  @override
  void dispose() {
    if (authSession.onRefreshFailed == _onRefreshFailed) {
      authSession.onRefreshFailed = null;
    }
    super.dispose();
  }

  Future<void> restore() async {
    final access = await _repository.readAccessToken();
    final refresh = await _repository.readRefreshToken();
    if (access == null || access.isEmpty || refresh == null || refresh.isEmpty) {
      state = AuthState.unauthenticated;
      return;
    }

    try {
      final user = await _repository.me();
      state = AuthState(status: AuthStatus.authenticated, user: user);
    } on ApiException catch (error) {
      if (error.statusCode == 401 || error.statusCode == 403) {
        await _repository.clearSession();
      }
      state = AuthState.unauthenticated;
    } catch (_) {
      state = AuthState.unauthenticated;
    }
  }

  Future<void> login({required String email, required String password}) async {
    if (state.status == AuthStatus.authenticating) {
      return;
    }

    state = const AuthState(status: AuthStatus.authenticating);
    try {
      final result = await _repository.login(email: email, password: password);
      state = AuthState(status: AuthStatus.authenticated, user: result.user);
    } on ApiException catch (error) {
      state = AuthState(status: AuthStatus.error, message: error.message);
    } catch (_) {
      state = const AuthState(
        status: AuthStatus.error,
        message: 'Unable to log in. Try again.',
      );
    }
  }

  Future<void> logout() async {
    await _repository.logout();
    state = AuthState.unauthenticated;
  }
}

final authProvider = StateNotifierProvider<AuthController, AuthState>((ref) {
  final controller = AuthController(ref.watch(authRepositoryProvider));
  unawaited(controller.restore());
  return controller;
});
