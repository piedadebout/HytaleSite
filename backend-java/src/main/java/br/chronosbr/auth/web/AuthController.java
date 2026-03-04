package br.chronosbr.auth.web;

import br.chronosbr.auth.captcha.CaptchaVerifier;
import br.chronosbr.auth.security.JwtAuthFilter;
import br.chronosbr.auth.security.JwtService;
import br.chronosbr.auth.user.UserEntity;
import br.chronosbr.auth.user.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Locale;

import static br.chronosbr.auth.web.AuthDtos.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository users;
    private final CaptchaVerifier captcha;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final boolean cookieSecure;
    private final long ttlSeconds;

    public AuthController(
            UserRepository users,
            PasswordEncoder encoder,
            JwtService jwt,
            CaptchaVerifier captcha,
            @Value("${chronosbr.cookie.secure:false}") boolean cookieSecure,
            @Value("${chronosbr.jwt.ttlSeconds:604800}") long ttlSeconds
    ) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
        this.captcha = captcha;
        this.cookieSecure = cookieSecure;
        this.ttlSeconds = ttlSeconds;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req, @RequestHeader(value = "X-Forwarded-For", required = false) String xff) {
        String ip = (xff != null && !xff.isBlank()) ? xff.split(",")[0].trim() : null;
        captcha.verifyOrThrow(req.captchaProvider(), req.captchaToken(), req.captchaAction(), ip);
        String username = req.username().trim();
        String email = req.email().trim().toLowerCase(Locale.ROOT);

        if (users.findByUsernameIgnoreCase(username).isPresent()) {
            return ResponseEntity.badRequest().body(new ApiMessage("Esse usuário já existe."));
        }
        if (users.findByEmailIgnoreCase(email).isPresent()) {
            return ResponseEntity.badRequest().body(new ApiMessage("Esse e-mail já está em uso."));
        }

        UserEntity u = new UserEntity();
        u.setUsername(username);
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(req.password()));
        u.setRole("USER");
        users.save(u);

        return ResponseEntity.ok(new ApiMessage("Conta criada com sucesso."));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req, HttpServletResponse response, @RequestHeader(value = "X-Forwarded-For", required = false) String xff) {
        String ip = (xff != null && !xff.isBlank()) ? xff.split(",")[0].trim() : null;
        captcha.verifyOrThrow(req.captchaProvider(), req.captchaToken(), req.captchaAction(), ip);
        String login = req.login().trim();

        UserEntity u = users.findByEmailIgnoreCase(login).orElseGet(() ->
                users.findByUsernameIgnoreCase(login).orElse(null)
        );

        if (u == null || !encoder.matches(req.password(), u.getPasswordHash())) {
            return ResponseEntity.status(401).body(new ApiMessage("Login ou senha inválidos."));
        }

        String token = jwt.issueToken(u.getUsername(), u.getRole());

        ResponseCookie cookie = ResponseCookie.from(JwtAuthFilter.COOKIE_NAME, token)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofSeconds(ttlSeconds))
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok(new ApiMessage("Login OK."));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(JwtAuthFilter.COOKIE_NAME, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ZERO)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return ResponseEntity.ok(new ApiMessage("Saiu."));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null) {
            return ResponseEntity.status(401).body(new ApiMessage("Não autenticado."));
        }

        String username = String.valueOf(auth.getPrincipal());
        var userOpt = users.findByUsernameIgnoreCase(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(new ApiMessage("Sessão inválida."));
        }

        UserEntity u = userOpt.get();
        return ResponseEntity.ok(new MeResponse(u.getUsername(), u.getEmail(), u.getRole()));
    }
}
