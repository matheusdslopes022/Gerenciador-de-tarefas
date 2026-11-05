package com.example.gerenciadordetarefas.repository;

import com.example.gerenciadordetarefas.model.Tarefa;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TarefaRepository extends MongoRepository<Tarefa, String> {
    List<Tarefa> findByUsuarioId(String usuarioId);
}
