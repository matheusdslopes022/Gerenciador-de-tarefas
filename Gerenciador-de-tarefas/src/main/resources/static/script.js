const API = "/api/tarefas";

// Faz a requisição; se o login expirou (401), volta para a tela de login
async function requisicao(url, opcoes) {
    const resposta = await fetch(url, opcoes);
    if (resposta.status === 401) {
        window.location.href = "/login.html";
        return new Promise(function () {}); // não continua enquanto a página troca
    }
    return resposta;
}

// Confere o login, mostra o nome e libera a tela
async function iniciar() {
    try {
        const r = await fetch("/api/auth/me");
        if (r.status === 401) {
            window.location.href = "/login.html";
            return;
        }
        if (r.ok) {
            const usuario = await r.json();
            document.getElementById("nome").textContent = usuario.nome;
        }
    } catch (erro) {
        console.error("Erro ao verificar login:", erro);
    }
    document.body.style.visibility = "visible";
    carregarTarefas();
}

document.getElementById("botao-sair").addEventListener("click", async function () {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch (e) {}
    window.location.href = "/login.html";
});
let tarefas = []; 

const botaoTema = document.getElementById("botao-tema");

function aplicarTema(escuro) {
    if (escuro) {
        document.body.classList.add("escuro");
        botaoTema.textContent = "☀️ Modo claro";
    } else {
        document.body.classList.remove("escuro");
        botaoTema.textContent = "🌙 Modo escuro";
    }
}

botaoTema.addEventListener("click", function () {
    const virarEscuro = !document.body.classList.contains("escuro");
    aplicarTema(virarEscuro);
});



const botaoAdicionar = document.getElementById("button");
const listaDeTarefas = document.querySelector(".task-list-empty");
const filtroSituacao = document.getElementById("filter-status");
const filtroCategoria = document.getElementById("filter-category");
const campoBusca = document.getElementById("busca");

// Guarda a mensagem "Nenhuma tarefa cadastrada" que já está no HTML
const htmlVazio = listaDeTarefas.innerHTML;


// Retorna a data de hoje
function dataDeHoje() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    return ano + "-" + mes + "-" + dia;
}

// Descobre se a tarefa está "concluida", "atrasada" ou "pendente"
function pegarSituacao(tarefa) {
    if (tarefa.concluida) {
        return "concluida";
    }
    if (tarefa.data < dataDeHoje()) {
        return "atrasada";
    }
    return "pendente";
}

// Tira a data do formato americano 2026-10-01 em 01/10/2026
function formatarData(data) {
    const partes = data.split("-"); // ["2026", "10", "01"]
    return partes[2] + "/" + partes[1] + "/" + partes[0];
}

// Devolve só as tarefas que passam nos filtros e na busca
function filtrarTarefas() {
    const situacaoEscolhida = filtroSituacao.value;
    const categoriaEscolhida = filtroCategoria.value;
    const textoBusca = campoBusca.value.trim().toLowerCase();

    const resultado = [];

    for (const tarefa of tarefas) {
        // Filtro de situação
        if (situacaoEscolhida !== "todas" && pegarSituacao(tarefa) !== situacaoEscolhida) {
            continue;
        }
        // Filtro de categoria
        if (categoriaEscolhida !== "todas" && tarefa.categoria !== categoriaEscolhida) {
            continue;
        }
        // Busca pela descrição
        if (!tarefa.descricao.toLowerCase().includes(textoBusca)) {
            continue;
        }
        resultado.push(tarefa);
    }

    return resultado;
}



// Cria o card de uma tarefa
function criarCard(tarefa) {
    const situacao = pegarSituacao(tarefa);
    const nomesDaSituacao = { pendente: "Pendente", concluida: "Concluída", atrasada: "Atrasada" };

    const card = document.createElement("div");
    card.classList.add("task-card", "prioridade-" + tarefa.prioridade);
    if (situacao === "concluida") {
        card.classList.add("concluida");
    }

    // Estrutura do card (os textos são preenchidos abaixo, de forma segura)
    card.innerHTML = `
        <div class="task-card-content">
            <h3 class="task-title"></h3>
            <div class="task-tags">
                <span class="badge badge-status badge-${situacao}"></span>
                <span class="badge badge-category"></span>
                <span class="task-date"></span>
            </div>
        </div>
        <div class="task-actions">
            <button class="action-btn btn-concluir">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Concluir</span>
            </button>
            <button class="action-btn btn-excluir">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <span>Excluir</span>
            </button>
        </div>
    `;

    card.querySelector(".task-title").textContent = tarefa.descricao;
    card.querySelector(".badge-status").textContent = nomesDaSituacao[situacao];
    card.querySelector(".badge-category").textContent = tarefa.categoria;
    card.querySelector(".task-date").textContent = formatarData(tarefa.data);

    card.querySelector(".btn-concluir").addEventListener("click", function () {
        concluirTarefa(tarefa.id);
    });
    card.querySelector(".btn-excluir").addEventListener("click", function () {
        excluirTarefa(tarefa.id);
    });

    return card;
}

// Desenha a lista de tarefas na tela
function mostrarTarefas() {
    atualizarDashboard();

    const lista = filtrarTarefas();

    // Nenhuma tarefa para mostrar
    if (lista.length === 0) {
        if (tarefas.length === 0) {
            listaDeTarefas.innerHTML = htmlVazio;
        } else {
            listaDeTarefas.innerHTML = "<h4>Nenhuma tarefa encontrada.</h4><p>Ajuste os filtros ou a busca.</p>";
        }
        return;
    }

    // Limpa a lista e coloca um card para cada tarefa
    listaDeTarefas.innerHTML = "";
    for (const tarefa of lista) {
        listaDeTarefas.appendChild(criarCard(tarefa));
    }
}

// Atualiza os números e as barrinhas dos 4 cards do topo
function atualizarDashboard() {
    let concluidas = 0;
    let atrasadas = 0;
    let pendentes = 0;

    for (const tarefa of tarefas) {
        const situacao = pegarSituacao(tarefa);
        if (situacao === "concluida") {
            concluidas++;
        } else if (situacao === "atrasada") {
            atrasadas++;
        } else {
            pendentes++;
        }
    }

    const total = tarefas.length;

    document.getElementById("num-total").textContent = total;
    document.getElementById("num-pendentes").textContent = pendentes;
    document.getElementById("num-concluidas").textContent = concluidas;
    document.getElementById("num-atrasadas").textContent = atrasadas;

    // Barras: porcentagem em relação ao total
    atualizarBarra("barra-total", total, total);
    atualizarBarra("barra-pendentes", pendentes, total);
    atualizarBarra("barra-concluidas", concluidas, total);
    atualizarBarra("barra-atrasadas", atrasadas, total);

    atualizarGraficos();
}

function atualizarBarra(idDaBarra, valor, total) {
    let porcentagem = 0;
    if (total > 0) {
        porcentagem = (valor / total) * 100;
    }
    document.getElementById(idDaBarra).style.width = porcentagem + "%";
}



// Busca todas as tarefas no servidor
async function carregarTarefas() {
    try {
        const resposta = await requisicao(API);
        if (!resposta.ok) throw new Error("Status " + resposta.status);
        tarefas = await resposta.json();
        mostrarTarefas();
    } catch (erro) {
        console.error("Erro ao carregar tarefas:", erro);
    }
}

// Envia uma nova tarefa. Retorna true se deu certo.
async function criarTarefa(novaTarefa) {
    try {
        const resposta = await requisicao(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(novaTarefa)
        });

        if (!resposta.ok) {
            alert("Erro ao salvar a tarefa!");
            return false;
        }

        await carregarTarefas();
        return true;
    } catch (erro) {
        alert("Erro ao conectar com o servidor!");
        return false;
    }
}

// Marca a tarefa como concluída
async function concluirTarefa(id) {
    try {
        const resposta = await requisicao(API + "/" + id, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ concluida: true })
        });

        if (!resposta.ok) {
            alert("Erro ao concluir a tarefa!");
            return;
        }

        await carregarTarefas();
    } catch (erro) {
        alert("Erro ao conectar com o servidor!");
    }
}

// Apaga a tarefa
async function excluirTarefa(id) {
    try {
        const resposta = await requisicao(API + "/" + id, { method: "DELETE" });

        if (!resposta.ok) {
            alert("Erro ao excluir a tarefa!");
            return;
        }

        await carregarTarefas();
    } catch (erro) {
        alert("Erro ao conectar com o servidor!");
    }
}


// Marca o campo com borda vermelha e avisa o usuário
function mostrarErro(campo, mensagem) {
    alert(mensagem);
    campo.style.border = "2px solid red";
}

botaoAdicionar.addEventListener("click", async function (evento) {
    evento.preventDefault(); // não deixa a página recarregar

    const campoDescricao = document.getElementById("descricao");
    const campoCategoria = document.getElementById("categoria");
    const campoPrioridade = document.getElementById("prioridade");
    const campoData = document.getElementById("data");

    // Tira as bordas vermelhas de erros anteriores
    campoDescricao.style.border = "";
    campoCategoria.style.border = "";
    campoPrioridade.style.border = "";
    campoData.style.border = "";

    const descricao = campoDescricao.value.trim();

    // Confere se tudo foi preenchido
    if (descricao === "") {
        mostrarErro(campoDescricao, "Por favor, preencha a descrição!");
        return;
    }
    if (campoCategoria.value === "") {
        mostrarErro(campoCategoria, "Por favor, escolha a categoria!");
        return;
    }
    if (campoPrioridade.value === "") {
        mostrarErro(campoPrioridade, "Por favor, escolha a prioridade!");
        return;
    }
    if (campoData.value === "") {
        mostrarErro(campoData, "Por favor, escolha a data!");
        return;
    }

    const novaTarefa = {
        descricao: descricao,
        categoria: campoCategoria.value,
        prioridade: campoPrioridade.value,
        data: campoData.value,
        concluida: false
    };

    const deuCerto = await criarTarefa(novaTarefa);

    // Só limpa o formulário se a tarefa foi salva
    if (deuCerto) {
        campoDescricao.value = "";
        campoCategoria.value = "";
        campoPrioridade.value = "";
        campoData.value = "";
    }
});


// Quando o usuário mexe nos filtros ou digita na busca, redesenha a lista
filtroSituacao.addEventListener("change", mostrarTarefas);
filtroCategoria.addEventListener("change", mostrarTarefas);
campoBusca.addEventListener("input", mostrarTarefas);

// Ao abrir a página, confere o login e carrega as tarefas
iniciar();

// ===== SIDEBAR: navegação por âncoras =====
(function () {
    const itens = document.querySelectorAll(".sidebar nav li");
    const ids = ["inicio", "estatisticas", "tarefas"];

    function ativar(id) {
        itens.forEach(function (li) {
            const href = li.querySelector("a").getAttribute("href");
            li.classList.toggle("active", href === "#" + id);
        });
    }

    // Ao rolar, destaca a seção que está na parte de cima da tela
    function atualizarAtivo() {
        let atual = ids[0];
        const noFim = window.innerHeight + window.scrollY >= document.body.scrollHeight - 2;
        if (noFim) {
            atual = ids[ids.length - 1];
        } else {
            ids.forEach(function (id) {
                const el = document.getElementById(id);
                if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.35) {
                    atual = id;
                }
            });
        }
        ativar(atual);
    }

    window.addEventListener("scroll", atualizarAtivo, { passive: true });
    atualizarAtivo();
})();


// ===== GRÁFICOS (Chart.js) =====
const CORES_SITUACAO = { pendente: "#f59e0b", concluida: "#10b981", atrasada: "#e40303" };
const CATEGORIAS = ["Pessoal", "Estudos", "Trabalho", "Outros"];

let graficoSituacao = null;
let graficoCategoria = null;
let textoCentro = { pct: "0%", sub: "concluído" };

function temaEscuro() {
    return document.body.classList.contains("escuro");
}

// Escreve a porcentagem no meio da rosca
const pluginTextoCentro = {
    id: "textoCentro",
    afterDraw(chart) {
        if (chart.config.type !== "doughnut") return;
        const area = chart.chartArea;
        const x = (area.left + area.right) / 2;
        const y = (area.top + area.bottom) / 2;
        const ctx = chart.ctx;

        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = temaEscuro() ? "#f9fafb" : "#1f2937";
        ctx.font = "700 28px system-ui, sans-serif";
        ctx.fillText(textoCentro.pct, x, y - 8);
        ctx.fillStyle = temaEscuro() ? "#d1d5db" : "#4b5563";
        ctx.font = "13px system-ui, sans-serif";
        ctx.fillText(textoCentro.sub, x, y + 16);
        ctx.restore();
    }
};

// Conta as tarefas por situação e por categoria
function contarTarefas() {
    const situacao = { pendente: 0, concluida: 0, atrasada: 0 };
    const porCategoria = {};
    for (const c of CATEGORIAS) {
        porCategoria[c] = { pendente: 0, concluida: 0, atrasada: 0 };
    }

    for (const tarefa of tarefas) {
        const s = pegarSituacao(tarefa);
        const c = CATEGORIAS.includes(tarefa.categoria) ? tarefa.categoria : "Outros";
        situacao[s]++;
        porCategoria[c][s]++;
    }
    return { situacao, porCategoria };
}

function criarGraficos() {
    Chart.defaults.font.family = "system-ui, -apple-system, sans-serif";

    graficoSituacao = new Chart(document.getElementById("grafico-situacao"), {
        type: "doughnut",
        data: {
            labels: ["Pendentes", "Concluídas", "Atrasadas"],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [CORES_SITUACAO.pendente, CORES_SITUACAO.concluida, CORES_SITUACAO.atrasada],
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "65%",
            plugins: { legend: { position: "bottom" } }
        },
        plugins: [pluginTextoCentro]
    });

    graficoCategoria = new Chart(document.getElementById("grafico-categoria"), {
        type: "bar",
        data: {
            labels: CATEGORIAS,
            datasets: [
                { label: "Pendentes", data: [], backgroundColor: CORES_SITUACAO.pendente },
                { label: "Concluídas", data: [], backgroundColor: CORES_SITUACAO.concluida },
                { label: "Atrasadas", data: [], backgroundColor: CORES_SITUACAO.atrasada }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "bottom" } },
            scales: {
                x: { stacked: true, grid: { display: false } },
                y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } }
            }
        }
    });
}

// Atualiza os gráficos (chamada sempre que as tarefas mudam ou o tema troca)
function atualizarGraficos() {
    const grade = document.getElementById("graficos-grid");
    const vazio = document.getElementById("grafico-vazio");

    if (typeof Chart === "undefined") {
        grade.hidden = true;
        vazio.hidden = false;
        vazio.textContent = "Não foi possível carregar os gráficos.";
        return;
    }

    if (tarefas.length === 0) {
        grade.hidden = true;
        vazio.hidden = false;
        return;
    }

    grade.hidden = false;
    vazio.hidden = true;

    if (!graficoSituacao) {
        criarGraficos();
    }

    const { situacao, porCategoria } = contarTarefas();
    const escuro = temaEscuro();
    const corTexto = escuro ? "#d1d5db" : "#4b5563";
    const corGrade = escuro ? "#374151" : "#e5e7eb";

    // Rosca
    const pct = Math.round((situacao.concluida / tarefas.length) * 100);
    textoCentro = { pct: pct + "%", sub: "concluído" };
    graficoSituacao.data.datasets[0].data = [situacao.pendente, situacao.concluida, situacao.atrasada];
    graficoSituacao.data.datasets[0].borderColor = escuro ? "#1f2937" : "#ffffff";
    graficoSituacao.options.plugins.legend.labels.color = corTexto;
    graficoSituacao.update();

    // Barras
    graficoCategoria.data.datasets[0].data = CATEGORIAS.map(c => porCategoria[c].pendente);
    graficoCategoria.data.datasets[1].data = CATEGORIAS.map(c => porCategoria[c].concluida);
    graficoCategoria.data.datasets[2].data = CATEGORIAS.map(c => porCategoria[c].atrasada);
    graficoCategoria.options.plugins.legend.labels.color = corTexto;
    graficoCategoria.options.scales.x.ticks.color = corTexto;
    graficoCategoria.options.scales.y.ticks.color = corTexto;
    graficoCategoria.options.scales.y.grid.color = corGrade;
    graficoCategoria.update();
}


new MutationObserver(function () {
    if (tarefas.length > 0) atualizarGraficos();
}).observe(document.body, { attributes: true, attributeFilter: ["class"] });