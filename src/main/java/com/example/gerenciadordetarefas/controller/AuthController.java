package com.example.gerenciadordetarefas.controller;

import com.example.gerenciadordetarefas.auth.AuthHelper;
import com.example.gerenciadordetarefas.auth.SenhaHasher;
import com.example.gerenciadordetarefas.model.Usuario;
import com.example.gerenciadordetarefas.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    public record RegistroRequest(String nome, String email, String senha) {}
    public record LoginRequest(String email, String senha) {}

    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final UsuarioRepository usuarios;
    private final AuthHelper auth;

    public AuthController(UsuarioRepository usuarios, AuthHelper auth) {
        this.usuarios = usuarios;
        this.auth = auth;
    }

    @PostMapping("/register")
    public ResponseEntity<?> cadastrar(@RequestBody RegistroRequest req, HttpServletRequest http) {
        String nome = req.nome() == null ? "" : req.nome().trim();
        String email = req.email() == null ? "" : req.email().trim().toLowerCase();
        String senha = req.senha() == null ? "" : req.senha();

        if (nome.isEmpty()) return erro(400, "Por favor, preencha seu nome!");
        if (!EMAIL.matcher(email).matches()) return erro(400, "Por favor, digite um e-mail válido!");
        if (senha.length() < 6) return erro(400, "A senha precisa ter pelo menos 6 caracteres!");
        if (usuarios.findByEmail(email).isPresent()) return erro(409, "Este e-mail já está cadastrado!");

        Usuario u = new Usuario();
        u.setNome(nome);
        u.setEmail(email);
        u.setSenhaHash(SenhaHasher.gerar(senha));
        u = usuarios.save(u);

        return ResponseEntity.ok()
                .header(AuthHelper.cabecalho(), auth.cookieLogin(http, u.getId()))
                .body(Map.of("nome", u.getNome(), "email", u.getEmail()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> entrar(@RequestBody LoginRequest req, HttpServletRequest http) {
        String email = req.email() == null ? "" : req.email().trim().toLowerCase();
        String senha = req.senha() == null ? "" : req.senha();

        var encontrado = usuarios.findByEmail(email);
        if (encontrado.isEmpty() || !SenhaHasher.confere(senha, encontrado.get().getSenhaHash())) {
            return erro(401, "E-mail ou senha incorretos.");
        }
        Usuario u = encontrado.get();
        return ResponseEntity.ok()
                .header(AuthHelper.cabecalho(), auth.cookieLogin(http, u.getId()))
                .body(Map.of("nome", u.getNome(), "email", u.getEmail()));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> sair(HttpServletRequest http) {
        return ResponseEntity.ok()
                .header(AuthHelper.cabecalho(), auth.cookieLogout(http))
                .body(Map.of("ok", true));
    }

    @GetMapping("/me")
    public ResponseEntity<?> eu(HttpServletRequest http) {
        return auth.usuarioId(http)
                .flatMap(usuarios::findById)
                .<ResponseEntity<?>>map(u -> ResponseEntity.ok(Map.of("nome", u.getNome(), "email", u.getEmail())))
                .orElseGet(() -> erro(401, "Não autenticado"));
    }

    private static ResponseEntity<?> erro(int status, String mensagem) {
        return ResponseEntity.status(status).body(Map.of("erro", mensagem));
    }
}
