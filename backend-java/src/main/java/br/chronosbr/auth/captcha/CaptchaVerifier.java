package br.chronosbr.auth.captcha;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class CaptchaVerifier {

    private final boolean enabled;
    private final Set<String> allowedProviders;
    private final String defaultProvider;

    private final String recaptchaSecret;
    private final double recaptchaMinScore;

    private final String hcaptchaSecret;

    private final RestTemplate http = new RestTemplate();

    public CaptchaVerifier(
            @Value("${chronosbr.captcha.enabled:true}") boolean enabled,
            @Value("${chronosbr.captcha.allowedProviders:recaptcha,hcaptcha}") String allowedProviders,
            @Value("${chronosbr.captcha.defaultProvider:recaptcha}") String defaultProvider,
            @Value("${chronosbr.captcha.recaptcha.secret:}") String recaptchaSecret,
            @Value("${chronosbr.captcha.recaptcha.minScore:0.5}") double recaptchaMinScore,
            @Value("${chronosbr.captcha.hcaptcha.secret:}") String hcaptchaSecret
    ) {
        this.enabled = enabled;
        this.allowedProviders = Set.of(allowedProviders.toLowerCase().split("\\s*,\\s*"));
        this.defaultProvider = (defaultProvider == null || defaultProvider.isBlank()) ? "recaptcha" : defaultProvider.toLowerCase();
        this.recaptchaSecret = recaptchaSecret;
        this.recaptchaMinScore = recaptchaMinScore;
        this.hcaptchaSecret = hcaptchaSecret;
    }

    public void verifyOrThrow(String provider, String token, String action, String remoteIp) {
        if (!enabled) return;

        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Confirme que você não é um robô.");
        }

        String p = (provider == null || provider.isBlank()) ? defaultProvider : provider.toLowerCase();

        if (!allowedProviders.contains(p)) {
            throw new ResponseStatusException(BAD_REQUEST, "Captcha inválido.");
        }

        switch (p) {
            case "recaptcha" -> verifyRecaptcha(token, action, remoteIp);
            case "hcaptcha" -> verifyHcaptcha(token, remoteIp);
            default -> throw new ResponseStatusException(BAD_REQUEST, "Captcha inválido.");
        }
    }

    private void verifyRecaptcha(String token, String action, String remoteIp) {
        if (recaptchaSecret == null || recaptchaSecret.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Captcha não configurado no servidor (reCAPTCHA secret).");
        }

        String url = "https://www.google.com/recaptcha/api/siteverify";

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("secret", recaptchaSecret);
        form.add("response", token);
        if (remoteIp != null && !remoteIp.isBlank()) form.add("remoteip", remoteIp);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        try {
            ResponseEntity<RecaptchaVerifyResponse> res = http.postForEntity(
                    url,
                    new HttpEntity<>(form, headers),
                    RecaptchaVerifyResponse.class
            );

            RecaptchaVerifyResponse body = res.getBody();
            if (body == null || !Boolean.TRUE.equals(body.success)) {
                throw new ResponseStatusException(BAD_REQUEST, "Falha na verificação (reCAPTCHA).");
            }

            // v3: valida score + action quando presentes
            if (body.score != null) {
                if (body.score < recaptchaMinScore) {
                    throw new ResponseStatusException(BAD_REQUEST, "Verificação falhou (score baixo).");
                }
                if (action != null && body.action != null && !body.action.equals(action)) {
                    throw new ResponseStatusException(BAD_REQUEST, "Verificação inválida (ação).");
                }
            }

        } catch (RestClientException ex) {
            throw new ResponseStatusException(BAD_REQUEST, "Não foi possível validar o captcha agora.");
        }
    }

    private void verifyHcaptcha(String token, String remoteIp) {
        if (hcaptchaSecret == null || hcaptchaSecret.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Captcha não configurado no servidor (hCaptcha secret).");
        }

        String url = "https://hcaptcha.com/siteverify";

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("secret", hcaptchaSecret);
        form.add("response", token);
        if (remoteIp != null && !remoteIp.isBlank()) form.add("remoteip", remoteIp);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        try {
            ResponseEntity<HcaptchaVerifyResponse> res = http.postForEntity(
                    url,
                    new HttpEntity<>(form, headers),
                    HcaptchaVerifyResponse.class
            );

            HcaptchaVerifyResponse body = res.getBody();
            if (body == null || !Boolean.TRUE.equals(body.success)) {
                throw new ResponseStatusException(BAD_REQUEST, "Falha na verificação (hCaptcha).");
            }

        } catch (RestClientException ex) {
            throw new ResponseStatusException(BAD_REQUEST, "Não foi possível validar o captcha agora.");
        }
    }

    public static class RecaptchaVerifyResponse {
        public Boolean success;
        public Double score;
        public String action;

        @JsonProperty("challenge_ts")
        public String challengeTs;

        public String hostname;
    }

    public static class HcaptchaVerifyResponse {
        public Boolean success;

        @JsonProperty("challenge_ts")
        public String challengeTs;

        public String hostname;
    }
}
