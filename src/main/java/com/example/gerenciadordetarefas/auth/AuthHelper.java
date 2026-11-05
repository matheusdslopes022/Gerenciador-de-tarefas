package com.example.gerenciadordetarefas.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;

/** Lê e escreve o cookie de login. */
@Component
public class AuthHelper {

    public static final String COOKIE = "tf_auth";

    private final TokenService tokens;

    public AuthHelper(TokenService tokens) {
        this.tokens = tokens;
    }

    /** Id do usuário logado nesta requisição (vazio se não estiver logado). */
    public Optional<String> usuarioId(HttpServletRequest req) {
        Cookie[] cookies = req.getCookies();
        if (cookies == null) return Optional.empty();
        for (Cookie c : cookies) {
            if (COOKIE.equals(c.getName())) return tokens.validar(c.getValue());
        }
        return Optional.empty();
    }

    public String cookieLogin(HttpServletRequest req, String usuarioId) {
        return montar(req, tokens.gerar(usuarioId), Duration.ofSeconds(TokenService.VALIDADE_SEGUNDOS));
    }

    public String cookieLogout(HttpServletRequest req) {
        return montar(req, "", Duration.ZERO);
    }

    private String montar(HttpServletRequest req, String valor, Duration duracao) {
        // No Render o HTTPS termina no proxy, então olhamos o cabeçalho X-Forwarded-Proto
        boolean https = req.isSecure() || "https".equalsIgnoreCase(req.getHeader("X-Forwarded-Proto"));
        return ResponseCookie.from(COOKIE, valor)
                .httpOnly(true)
                .secure(https)
                .sameSite("Lax")
                .path("/")
                .maxAge(duracao)
                .build()
                .toString();
    }

    public static String cabecalho() {
        return HttpHeaders.SET_COOKIE;
    }
}
