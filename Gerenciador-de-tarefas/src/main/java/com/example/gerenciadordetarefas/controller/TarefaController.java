package com.example.gerenciadordetarefas.controller;

import com.example.gerenciadordetarefas.auth.AuthHelper;
import com.example.gerenciadordetarefas.model.Tarefa;
import com.example.gerenciadordetarefas.repository.TarefaRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Todas as rotas exigem login e só mexem nas tarefas do usuário logado. */
@RestController
@RequestMapping("/api/tarefas")
public class TarefaController {

    private final TarefaRepository tarefaRepository;
    private final AuthHelper auth;

    public TarefaController(TarefaRepository tarefaRepository, AuthHelper auth) {
        this.tarefaRepository = tarefaRepository;
        this.auth = auth;
    }

    @GetMapping
    public ResponseEntity<List<Tarefa>> listarTodas(HttpServletRequest http) {
        return auth.usuarioId(http)
                .map(uid -> ResponseEntity.ok(tarefaRepository.findByUsuarioId(uid)))
                .orElseGet(() -> ResponseEntity.status(401).build());
    }

    @PostMapping
    public ResponseEntity<Tarefa> criarTarefa(@RequestBody Tarefa tarefa, HttpServletRequest http) {
        return auth.usuarioId(http)
                .map(uid -> {
                    tarefa.setId(null);          // sempre cria uma nova
                    tarefa.setUsuarioId(uid);    // a tarefa pertence a quem está logado
                    return ResponseEntity.ok(tarefaRepository.save(tarefa));
                })
                .orElseGet(() -> ResponseEntity.status(401).build());
    }

    // Usado pelo botão "Concluir" do front-end
    @PutMapping("/{id}")
    public ResponseEntity<Tarefa> atualizarTarefa(@PathVariable String id, @RequestBody Tarefa dados,
                                                  HttpServletRequest http) {
        var uid = auth.usuarioId(http);
        if (uid.isEmpty()) return ResponseEntity.status(401).build();

        return tarefaRepository.findById(id)
                .filter(t -> uid.get().equals(t.getUsuarioId()))
                .map(t -> {
                    t.setConcluida(dados.isConcluida());
                    return ResponseEntity.ok(tarefaRepository.save(t));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarTarefa(@PathVariable String id, HttpServletRequest http) {
        var uid = auth.usuarioId(http);
        if (uid.isEmpty()) return ResponseEntity.status(401).build();

        return tarefaRepository.findById(id)
                .filter(t -> uid.get().equals(t.getUsuarioId()))
                .<ResponseEntity<Void>>map(t -> {
                    tarefaRepository.deleteById(id);
                    return ResponseEntity.noContent().build();
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
