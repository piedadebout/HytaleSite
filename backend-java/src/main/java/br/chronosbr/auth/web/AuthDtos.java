package br.chronosbr.auth.web;

import jakarta.validation.constraints.*;

public class AuthDtos {

    public record RegisterRequest(
            @NotBlank @Size(min = 3, max = 32) String username,
            @NotBlank @Email @Size(max = 120) String email,
            @NotBlank @Size(min = 6, max = 72) String password,
            @NotBlank String captchaToken,
            @NotBlank String captchaProvider,
            @NotBlank String captchaAction
    ) {}

    public record LoginRequest(
            @NotBlank @Size(max = 120) String login,
            @NotBlank @Size(min = 1, max = 72) String password,
            @NotBlank String captchaToken,
            @NotBlank String captchaProvider,
            @NotBlank String captchaAction
    ) {}

    public record MeResponse(String username, String email, String role) {}

    public record ApiMessage(String message) {}
}
