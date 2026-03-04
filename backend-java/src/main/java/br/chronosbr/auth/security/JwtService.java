package br.chronosbr.auth.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final Key key;
    private final long ttlSeconds;

    public JwtService(
            @Value("${JWT_SECRET:dev-secret-change-me-dev-secret-change-me}") String secret,
            @Value("${chronosbr.jwt.ttlSeconds:604800}") long ttlSeconds
    ) {
        if (secret.length() < 32) {
            // HS256 precisa de chave com tamanho razoável; aqui força no mínimo básico
            secret = (secret + "________________________________").substring(0, 32);
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.ttlSeconds = ttlSeconds;
    }

    public String issueToken(String username, String role) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(ttlSeconds);

        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(exp))
                .addClaims(Map.of("role", role))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Jws<Claims> parse(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token);
    }
}
