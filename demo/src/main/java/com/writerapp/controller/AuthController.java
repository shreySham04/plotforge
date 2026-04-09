package com.writerapp.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.writerapp.dto.AuthResponse;
import com.writerapp.dto.ForgotPasswordRequest;
import com.writerapp.dto.LoginRequest;
import com.writerapp.dto.RegisterRequest;
import com.writerapp.dto.ResetPasswordRequest;
import com.writerapp.dto.UserProfileResponse;
import com.writerapp.dto.UserProfileUpdateRequest;
import com.writerapp.service.AuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@Validated
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.requestPasswordReset(request);
        return ResponseEntity.ok(Map.of("message", "If that email exists, a password reset link has been sent."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", "Password reset successful. Please login with your new password."));
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> me() {
        return ResponseEntity.ok(authService.getCurrentUserProfile());
    }

    @PutMapping("/me")
    public ResponseEntity<AuthResponse> updateMe(@Valid @RequestBody UserProfileUpdateRequest request) {
        return ResponseEntity.ok(authService.updateCurrentUserProfile(request));
    }
}