package com.vocabkicker.serverless.service;

import com.vocabkicker.serverless.dto.AuthResult;
import com.vocabkicker.serverless.dto.LoginRequest;
import com.vocabkicker.serverless.dto.RefreshRequest;
import com.vocabkicker.serverless.entity.User;
import com.vocabkicker.serverless.exception.BadRequestException;
import com.vocabkicker.serverless.exception.ConflictException;
import com.vocabkicker.serverless.exception.NotFoundException;
import com.vocabkicker.serverless.exception.UnauthorizedException;
import com.vocabkicker.serverless.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final String jwtSecret;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.jwtSecret = System.getenv("JWT_SECRET");
    }

    public AuthResult login(LoginRequest req) {
        Optional<User> userOpt = userRepository.findByEmail(req.getEmail());
        if (userOpt.isEmpty()) {
            throw new UnauthorizedException("Invalid credentials");
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid credentials");
        }

        return generateTokensAndSave(user);
    }

    public AuthResult createAdmin(LoginRequest req) {
        if (userRepository.count() > 0) {
            throw new ConflictException("An admin user already exists.");
        }

        final long now = System.currentTimeMillis();
        final User user = User.builder()
                .id(UUID.randomUUID().toString())
                .email(req.getEmail().toLowerCase())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .createdAt(now)
                .updatedAt(now)
                .build();

        userRepository.save(user);

        return login(req);
    }

    public AuthResult refresh(RefreshRequest req) {
        if (req.getRefreshToken() == null || req.getRefreshToken().isEmpty()) {
            throw new BadRequestException("Refresh token is required");
        }

        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        Claims claims;
        try {
            claims = Jwts.parser().verifyWith(key).build()
                    .parseSignedClaims(req.getRefreshToken()).getPayload();
        } catch (Exception e) {
            throw new UnauthorizedException("Invalid refresh token");
        }

        if (!"refresh".equals(claims.get("type"))) {
            throw new UnauthorizedException("Invalid token type");
        }

        if (claims.getExpiration().before(new Date())) {
            throw new UnauthorizedException("Refresh token expired");
        }

        String userId = claims.getSubject();
        Optional<User> userOpt = userRepository.findById(userId);

        if (userOpt.isEmpty()) {
            throw new NotFoundException("User not found");
        }

        User user = userOpt.get();
        if (user.getRefreshTokenHash() == null || !passwordEncoder.matches(req.getRefreshToken(), user.getRefreshTokenHash())) {
            throw new UnauthorizedException("Invalid refresh token");
        }

        if (user.getRefreshTokenExpiry() != null && user.getRefreshTokenExpiry() < System.currentTimeMillis()) {
            throw new UnauthorizedException("Refresh token expired in db");
        }

        return generateTokensAndSave(user);
    }

    private AuthResult generateTokensAndSave(User user) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));

        long accessExpiration = 1000L * 60 * 15; // 15 mins
        String accessToken = Jwts.builder()
                .subject(user.getId())
                .claim("email", user.getEmail())
                .claim("type", "access")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessExpiration))
                .signWith(key)
                .compact();

        long refreshExpiration = 1000L * 60 * 60 * 24 * 7; // 7 days
        String refreshToken = Jwts.builder()
                .subject(user.getId())
                .claim("type", "refresh")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshExpiration))
                .signWith(key)
                .compact();

        user.setRefreshTokenHash(passwordEncoder.encode(refreshToken));
        user.setRefreshTokenExpiry(System.currentTimeMillis() + refreshExpiration);
        userRepository.save(user);

        return new AuthResult(accessToken, refreshToken);
    }
}
