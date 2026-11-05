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

// Para onde ir depois de entrar
const PAGINA_INICIAL = "/index.html";

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

// Se já estiver logado, vai direto para o app
fetch("/api/auth/me").then(function (r) {
    if (r.ok) window.location.href = PAGINA_INICIAL;
}).catch(function () {});

form.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    limparErros();

    const nome = campoNome.value.trim();
    const email = campoEmail.value.trim().toLowerCase();
    const senha = campoSenha.value;

    if (modo === "cadastrar" && nome === "") return mostrarErro(campoNome, "Por favor, preencha seu nome!");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return mostrarErro(campoEmail, "Por favor, digite um e-mail válido!");
    if (senha.length < 6) return mostrarErro(campoSenha, "A senha precisa ter pelo menos 6 caracteres!");

    const url = modo === "cadastrar" ? "/api/auth/register" : "/api/auth/login";
    const corpo = modo === "cadastrar" ? { nome: nome, email: email, senha: senha } : { email: email, senha: senha };

    botaoEnviar.disabled = true;
    mostrarSucesso("Aguarde...");
    try {
        const resposta = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(corpo)
        });
        const dados = await resposta.json().catch(function () { return {}; });

        if (!resposta.ok) {
            const campo = resposta.status === 409 ? campoEmail : (modo === "cadastrar" ? campoEmail : campoSenha);
            return mostrarErro(campo, dados.erro || "Não foi possível continuar.");
        }
        mostrarSucesso("Olá, " + dados.nome + "! Entrando...");
        setTimeout(function () { window.location.href = PAGINA_INICIAL; }, 600);
    } catch (erro) {
        mostrarErro(campoEmail, "Servidor indisponível. Se for o primeiro acesso, aguarde ~1 minuto e tente de novo.");
    } finally {
        botaoEnviar.disabled = false;
    }
});
