package com.writerapp.service;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.writerapp.dto.AuthResponse;
import com.writerapp.dto.ForgotPasswordRequest;
import com.writerapp.dto.LoginRequest;
import com.writerapp.dto.RegisterRequest;
import com.writerapp.dto.ResetPasswordRequest;
import com.writerapp.dto.UserProfileResponse;
import com.writerapp.dto.UserProfileUpdateRequest;
import com.writerapp.model.PasswordResetToken;
import com.writerapp.model.User;
import com.writerapp.repository.PasswordResetTokenRepository;
import com.writerapp.repository.UserRepository;
import com.writerapp.security.JwtService;

import org.springframework.beans.factory.annotation.Value;
import lombok.RequiredArgsConstructor;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final CurrentUserService currentUserService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final MailService mailService;

    @Value("${app.frontend.base-url:https://plotforge-liard.vercel.app}")
    private String frontendBaseUrl;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ResponseStatusException(BAD_REQUEST, "Username already in use");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(BAD_REQUEST, "Email already in use");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();

        User saved = userRepository.save(Objects.requireNonNull(user));

        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(saved.getUsername())
                .password(saved.getPassword())
                .authorities("ROLE_USER")
                .build();

        String token = jwtService.generateToken(userDetails);
        return buildAuthResponse(saved, token);
    }

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
        } catch (AuthenticationException ex) {
            throw new ResponseStatusException(UNAUTHORIZED, "Invalid username or password");
        }

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Invalid username or password"));

        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .authorities("ROLE_USER")
                .build();

        String token = jwtService.generateToken(userDetails);
        return buildAuthResponse(user, token);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile() {
        User user = currentUserService.getCurrentUser();
        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt())
                .build();
    }

    @Transactional
    public AuthResponse updateCurrentUserProfile(UserProfileUpdateRequest request) {
        User user = currentUserService.getCurrentUser();

        String username = request.getUsername().trim();
        String email = request.getEmail().trim();

        if (!username.equalsIgnoreCase(user.getUsername()) && userRepository.existsByUsername(username)) {
            throw new ResponseStatusException(BAD_REQUEST, "Username already in use");
        }
        if (!email.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(BAD_REQUEST, "Email already in use");
        }

        user.setUsername(username);
        user.setEmail(email);

        User saved = userRepository.save(user);

        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(saved.getUsername())
                .password(saved.getPassword())
                .authorities("ROLE_USER")
                .build();

        String token = jwtService.generateToken(userDetails);
        return buildAuthResponse(saved, token);
    }

    @Transactional
    public void requestPasswordReset(ForgotPasswordRequest request) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim();

        userRepository.findByEmail(email).ifPresent((user) -> {
            passwordResetTokenRepository.deleteByUser(user);
            passwordResetTokenRepository.deleteAllByExpiresAtBefore(LocalDateTime.now());

            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .token(UUID.randomUUID().toString())
                    .user(user)
                    .expiresAt(LocalDateTime.now().plusMinutes(30))
                    .build();

            passwordResetTokenRepository.save(resetToken);

            String normalizedFrontendBase = frontendBaseUrl.endsWith("/")
                    ? frontendBaseUrl.substring(0, frontendBaseUrl.length() - 1)
                    : frontendBaseUrl;
            String resetUrl = normalizedFrontendBase + "/reset-password?token=" + resetToken.getToken();

            mailService.sendPasswordResetEmail(user.getEmail(), user.getUsername(), resetUrl);
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String resetToken = request.getToken() == null ? "" : request.getToken().trim();

        PasswordResetToken tokenRecord = passwordResetTokenRepository.findByToken(resetToken)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Invalid or expired reset token"));

        if (tokenRecord.isUsed() || tokenRecord.isExpired(LocalDateTime.now())) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid or expired reset token");
        }

        User user = tokenRecord.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        tokenRecord.setUsedAt(LocalDateTime.now());
        passwordResetTokenRepository.save(tokenRecord);
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .build();
    }
}