// ===== TEMA =====
const botaoTema = document.getElementById("botao-tema");

function aplicarTema(escuro) {
    document.body.classList.toggle("escuro", escuro);
    botaoTema.textContent = escuro ? "☀️ Modo claro" : "🌙 Modo escuro";
    localStorage.setItem("tema-escuro", escuro);
}
botaoTema.addEventListener("click", function () {
    aplicarTema(!document.body.classList.contains("escuro"));
});
aplicarTema(localStorage.getItem("tema-escuro") === "true");

// ===== LOGIN / CADASTRO =====
const form = document.getElementById("form-login");
const campoNome = document.getElementById("nome");
const campoEmail = document.getElementById("email");
const campoSenha = document.getElementById("senha");
const grupoNome = document.getElementById("grupo-nome");
const mensagem = document.getElementById("mensagem");
const titulo = document.getElementById("titulo");
const subtitulo = document.getElementById("subtitulo");
const botaoEnviar = document.getElementById("botao-enviar");
const botaoTrocar = document.getElementById("botao-trocar");
const textoTrocar = document.getElementById("texto-trocar");

// Para onde ir depois de entrar (troque pelo endereço do seu app)
const PAGINA_INICIAL = "index.html";

let modo = "entrar"; // "entrar" ou "cadastrar"

function trocarModo() {
    modo = modo === "entrar" ? "cadastrar" : "entrar";
    const cadastrar = modo === "cadastrar";
    grupoNome.hidden = !cadastrar;
    titulo.textContent = cadastrar ? "Crie sua conta" : "Bem-vindo de volta!";
    subtitulo.textContent = cadastrar ? "Comece a organizar suas tarefas hoje." : "Entre para ver suas tarefas.";
    botaoEnviar.textContent = cadastrar ? "Cadastrar" : "Entrar";
    textoTrocar.textContent = cadastrar ? "Já tem conta?" : "Ainda não tem conta?";
    botaoTrocar.textContent = cadastrar ? "Entrar" : "Cadastre-se";
    limparErros();
}
botaoTrocar.addEventListener("click", trocarModo);

function limparErros() {
    [campoNome, campoEmail, campoSenha].forEach(function (c) { c.classList.remove("erro"); });
    mensagem.textContent = "";
    mensagem.className = "mensagem";
}

function mostrarErro(campo, texto) {
    campo.classList.add("erro");
    mensagem.textContent = texto;
    mensagem.className = "mensagem erro";
    campo.focus();
}

function mostrarSucesso(texto) {
    mensagem.textContent = texto;
    mensagem.className = "mensagem sucesso";
}

// Usuários salvos no navegador (apenas demonstração; em produção use um servidor)
function pegarUsuarios() {
    return JSON.parse(localStorage.getItem("usuarios") || "[]");
}

form.addEventListener("submit", function (evento) {
    evento.preventDefault();
    limparErros();

    const nome = campoNome.value.trim();
    const email = campoEmail.value.trim().toLowerCase();
    const senha = campoSenha.value;

    if (modo === "cadastrar" && nome === "") return mostrarErro(campoNome, "Por favor, preencha seu nome!");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return mostrarErro(campoEmail, "Por favor, digite um e-mail válido!");
    if (senha.length < 6) return mostrarErro(campoSenha, "A senha precisa ter pelo menos 6 caracteres!");

    const usuarios = pegarUsuarios();
    const existente = usuarios.find(function (u) { return u.email === email; });

    if (modo === "cadastrar") {
        if (existente) return mostrarErro(campoEmail, "Este e-mail já está cadastrado!");
        usuarios.push({ nome: nome, email: email, senha: senha });
        localStorage.setItem("usuarios", JSON.stringify(usuarios));
        trocarModo();
        campoEmail.value = email;
        mostrarSucesso("Conta criada! Agora é só entrar.");
        return;
    }

    if (!existente || existente.senha !== senha) {
        return mostrarErro(campoSenha, "E-mail ou senha incorretos.");
    }
    localStorage.setItem("usuarioLogado", existente.nome);
    mostrarSucesso("Olá, " + existente.nome + "! Entrando...");
    setTimeout(function () { window.location.href = PAGINA_INICIAL; }, 800);
});
