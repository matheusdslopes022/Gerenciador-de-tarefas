package com.example.gerenciadordetarefas.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Optional;

/**
 * Gera e valida o token do cookie de login: base64(usuarioId|expira) + "." + assinatura HMAC.
 * Como é assinado (e não guardado em memória), o login continua valendo quando o Render reinicia,
 * desde que a variável AUTH_SECRET esteja definida.
 */
@Service
public class TokenService {

    public static final long VALIDADE_SEGUNDOS = 7L * 24 * 60 * 60; // 7 dias

    private final byte[] segredo;

    public TokenService(@Value("${app.auth.secret:}") String segredoConfigurado) {
        if (segredoConfigurado == null || segredoConfigurado.length() < 16) {
            System.err.println("[AVISO] AUTH_SECRET não definido (ou menor que 16 caracteres). "
                    + "Usando segredo temporário: os logins serão perdidos a cada reinício.");
            byte[] aleatorio = new byte[32];
            new SecureRandom().nextBytes(aleatorio);
            this.segredo = aleatorio;
        } else {
            this.segredo = segredoConfigurado.getBytes(StandardCharsets.UTF_8);
        }
    }

    public String gerar(String usuarioId) {
        long expira = System.currentTimeMillis() / 1000 + VALIDADE_SEGUNDOS;
        String corpo = b64(usuarioId + "|" + expira);
        return corpo + "." + assinar(corpo);
    }

    /** Devolve o id do usuário se o token for válido e não estiver vencido. */
    public Optional<String> validar(String token) {
        try {
            if (token == null) return Optional.empty();
            int ponto = token.indexOf('.');
            if (ponto < 1) return Optional.empty();
            String corpo = token.substring(0, ponto);
            String assinatura = token.substring(ponto + 1);
            byte[] esperada = assinar(corpo).getBytes(StandardCharsets.UTF_8);
            if (!MessageDigest.isEqual(esperada, assinatura.getBytes(StandardCharsets.UTF_8))) {
                return Optional.empty();
            }
            String texto = new String(Base64.getUrlDecoder().decode(corpo), StandardCharsets.UTF_8);
            int barra = texto.lastIndexOf('|');
            long expira = Long.parseLong(texto.substring(barra + 1));
            if (expira < System.currentTimeMillis() / 1000) return Optional.empty();
            return Optional.of(texto.substring(0, barra));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private String assinar(String corpo) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(segredo, "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(mac.doFinal(corpo.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static String b64(String s) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(s.getBytes(StandardCharsets.UTF_8));
    }
}
