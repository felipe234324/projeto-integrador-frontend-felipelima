/*
 * PLANEJAMENTO
 * Tema: Gerenciador de Tarefas (analisador de prazos).
 *
 * Entrada (começa quando o usuário clica em "Analisar tarefas"):
 *   - Um limite de dias (modal) que define quando uma tarefa é "urgente".
 *   - Nomes de tarefas concluídas (modal), até digitar "sair".
 *
 * Processamento:
 *   - Classifica cada tarefa pelo prazo (if / else if / else).
 *   - Escolhe uma dica pela categoria (switch).
 *   - Soma minutos, conta tarefas críticas e acha a mais demorada (laço).
 *
 * Saída: frases com template literal e relatório com console.table.
 *
 * Pseudocódigo:
 *   1. Ao clicar no botão, ler o limite de urgência (modal) e validar.
 *   2. Para cada tarefa, classificar pelo prazo:
 *   3.    dias < 0 -> Atrasada; dias === 0 -> Vence hoje;
 *   4.    dias <= limite -> Urgente; senão -> Tranquila.
 *   5. Pela categoria da tarefa, escolher uma dica (switch).
 *   6. Percorrer de novo: somar minutos, contar críticas, achar a mais demorada.
 *   7. Mostrar o resumo (frases) e a tabela (console.table).
 *   8. Enquanto não digitar "sair" (ou clicar em Encerrar), marcar tarefas como concluídas.
 */

// ---------- Dados ----------
// "id" liga cada tarefa à atividade de mesmo id no painel de progresso (script.js)
const tarefas = [
    { id: 1, nome: "Estudar HTML",       categoria: "estudo",   prioridade: "alta",  descricao: "Revisar tags semânticas, formulários e acessibilidade.", minutos: 90,  diasParaPrazo: -1, concluida: false },
    { id: 2, nome: "Praticar CSS",       categoria: "estudo",   prioridade: "media", descricao: "Exercitar Flexbox, Grid e responsividade.",              minutos: 120, diasParaPrazo: 2,  concluida: false },
    { id: 3, nome: "Estudar JavaScript", categoria: "estudo",   prioridade: "alta",  descricao: "Estudar funções, arrays e manipulação do DOM.",          minutos: 150, diasParaPrazo: 10, concluida: false },
    { id: 4, nome: "Enviar relatório",   categoria: "trabalho", prioridade: "alta",  descricao: "Finalizar o relatório semanal e enviar à coordenação.",  minutos: 45,  diasParaPrazo: 1,  concluida: false },
    { id: 5, nome: "Lavar roupa",        categoria: "casa",     prioridade: "baixa", descricao: "Lavar e estender as roupas da semana.",                  minutos: 60,  diasParaPrazo: 6,  concluida: false },
    { id: 6, nome: "Consulta médica",    categoria: "saude",    prioridade: "media", descricao: "Levar documentos e exames anteriores.",                  minutos: 30,  diasParaPrazo: 0,  concluida: false }
];

// ---------- Entrada: limite de urgência ----------
const LIMITE_PADRAO = 3;

// ---------- Rótulos, datas e prazos (também usados por script.js) ----------
const MS_POR_DIA = 24 * 60 * 60 * 1000;

const ROTULOS_PRIORIDADE = {
    "baixa": "baixa",
    "media": "média",
    "alta": "alta"
};

// Categorias conhecidas: a chave é usada na lógica (switch) e o texto, na tela
const ROTULOS_CATEGORIA = {
    "estudo": "Estudo",
    "trabalho": "Trabalho",
    "casa": "Casa",
    "saude": "Saúde",
    "geral": "Geral"
};

// Situação da análise -> classe de cor do selo de prazo
const CLASSES_SITUACAO = {
    "Atrasada": "atrasado",
    "Vence hoje": "hoje",
    "Urgente": "proximo",
    "Tranquila": "folga"
};

// Guarda a situação de cada tarefa depois que a análise roda (chave: id da tarefa)
const situacoesPorId = {};

function rotuloPrioridade(prioridade) {
    return ROTULOS_PRIORIDADE[prioridade] ?? prioridade;
}

function semAcento(texto) {
    return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// "Saúde" vira "saude" (categoria conhecida); texto livre é mantido como foi digitado; vazio vira "geral"
function normalizarCategoria(texto) {
    const limpo = texto.trim().replace(/\s+/g, " ");

    if (limpo === "") {
        return "geral";
    }

    const chave = semAcento(limpo);

    return Object.hasOwn(ROTULOS_CATEGORIA, chave) ? chave : limpo;
}

function rotuloCategoria(categoria) {
    if (Object.hasOwn(ROTULOS_CATEGORIA, categoria)) {
        return ROTULOS_CATEGORIA[categoria];
    }

    return categoria.charAt(0).toUpperCase() + categoria.slice(1);
}

function dataEmDias(dias) {
    const data = new Date();

    data.setHours(0, 0, 0, 0);
    data.setDate(data.getDate() + dias);

    return data;
}

function dataParaIso(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

function dataIsoEmDias(dias) {
    return dataParaIso(dataEmDias(dias));
}

// Aceita "AAAA-MM-DD" (valor do input type="date") e devolve a diferença em dias a partir de hoje
function calcularDiasParaPrazo(prazoIso) {
    const [ano, mes, dia] = prazoIso.split("-").map(Number);
    const prazo = new Date(ano, mes - 1, dia);
    const hoje = new Date();

    hoje.setHours(0, 0, 0, 0);

    return Math.round((prazo - hoje) / MS_POR_DIA);
}

function formatarData(prazoIso) {
    const [ano, mes, dia] = prazoIso.split("-");

    return `${dia}/${mes}/${ano}`;
}

function descreverPrazo(dias) {
    if (dias < 0) {
        const atraso = Math.abs(dias);
        return `Atrasada há ${atraso} ${atraso === 1 ? "dia" : "dias"}`;
    }

    if (dias === 0) {
        return "Vence hoje";
    }

    if (dias === 1) {
        return "Vence amanhã";
    }

    return `Vence em ${dias} dias`;
}

function classificarPrazo(dias) {
    if (dias < 0) {
        return "atrasado";
    } else if (dias === 0) {
        return "hoje";
    } else if (dias <= LIMITE_PADRAO) {
        return "proximo";
    } else {
        return "folga";
    }
}

// ---------- Modal de entrada (substitui o prompt) ----------
/*
 * Devolve uma Promise: o texto digitado ou null se a pessoa cancelar
 * (botão Cancelar, tecla Esc ou clique fora da caixa).
 * Opções: titulo, mensagem, rotulo, tipo, valorInicial, placeholder, min, max,
 * confirmar, cancelar, icone, sugestoes, retorno, retornoTipo, validar.
 */
function pedirEntrada(opcoes) {
    const dialogo = document.getElementById("modal-entrada");

    // Navegador sem suporte a <dialog>: volta para o prompt simples
    if (dialogo === null || typeof dialogo.showModal !== "function") {
        return Promise.resolve(prompt(opcoes.mensagem, opcoes.valorInicial ?? ""));
    }

    const formulario = dialogo.querySelector("form");
    const titulo = dialogo.querySelector("#modal-titulo");
    const mensagem = dialogo.querySelector("#modal-mensagem");
    const rotulo = dialogo.querySelector("#modal-rotulo");
    const campo = dialogo.querySelector("#modal-campo");
    const sugestoes = dialogo.querySelector("#modal-sugestoes");
    const erro = dialogo.querySelector("#modal-erro");
    const retorno = dialogo.querySelector("#modal-retorno");
    const botaoCancelar = dialogo.querySelector("#modal-cancelar");
    const botaoConfirmar = dialogo.querySelector("#modal-confirmar");

    return new Promise((resolver) => {
        let resultado = null;

        dialogo.dataset.icone = opcoes.icone ?? "relogio";
        titulo.textContent = opcoes.titulo;
        mensagem.textContent = opcoes.mensagem;
        rotulo.textContent = opcoes.rotulo;
        botaoConfirmar.textContent = opcoes.confirmar ?? "Confirmar";
        botaoCancelar.textContent = opcoes.cancelar ?? "Cancelar";

        campo.type = opcoes.tipo ?? "text";
        campo.value = opcoes.valorInicial ?? "";
        campo.placeholder = opcoes.placeholder ?? "";
        campo.removeAttribute("aria-invalid");

        if (opcoes.min !== undefined) {
            campo.min = String(opcoes.min);
        } else {
            campo.removeAttribute("min");
        }

        if (opcoes.max !== undefined) {
            campo.max = String(opcoes.max);
        } else {
            campo.removeAttribute("max");
        }

        const nomesSugeridos = opcoes.sugestoes ?? [];
        const opcoesLista = nomesSugeridos.map((nome) => {
            const opcao = document.createElement("option");
            opcao.value = nome;
            return opcao;
        });

        sugestoes.replaceChildren(...opcoesLista);

        if (nomesSugeridos.length > 0) {
            campo.setAttribute("list", "modal-sugestoes");
        } else {
            campo.removeAttribute("list");
        }

        erro.textContent = "";
        retorno.textContent = opcoes.retorno ?? "";
        retorno.dataset.tipo = opcoes.retornoTipo ?? "";
        retorno.hidden = !opcoes.retorno;

        function limparErro() {
            erro.textContent = "";
            campo.removeAttribute("aria-invalid");
        }

        function enviar(evento) {
            evento.preventDefault();

            const mensagemErro = opcoes.validar ? opcoes.validar(campo.value) : "";

            if (mensagemErro !== "") {
                erro.textContent = mensagemErro;
                campo.setAttribute("aria-invalid", "true");
                campo.focus();
                return;
            }

            resultado = campo.value;
            dialogo.close();
        }

        function cancelar() {
            resultado = null;
            dialogo.close();
        }

        // Com padding 0 no <dialog>, só o fundo escuro (::backdrop) tem o próprio <dialog> como alvo
        function cliqueNoFundo(evento) {
            if (evento.target === dialogo) {
                cancelar();
            }
        }

        function aoFechar() {
            formulario.removeEventListener("submit", enviar);
            campo.removeEventListener("input", limparErro);
            botaoCancelar.removeEventListener("click", cancelar);
            dialogo.removeEventListener("click", cliqueNoFundo);
            dialogo.removeEventListener("close", aoFechar);
            resolver(resultado);
        }

        formulario.addEventListener("submit", enviar);
        campo.addEventListener("input", limparErro);
        botaoCancelar.addEventListener("click", cancelar);
        dialogo.addEventListener("click", cliqueNoFundo);
        dialogo.addEventListener("close", aoFechar);

        dialogo.showModal();
        campo.focus();
        campo.select();
    });
}

// Mensagem de erro mostrada dentro do modal (texto vazio = sem erro)
function validarLimite(texto) {
    if (texto.trim() === "") {
        return "";
    }

    const numero = Number(texto);

    if (Number.isNaN(numero)) {
        return "Digite apenas números.";
    }

    if (numero < 1 || numero > 30) {
        return "Digite um valor entre 1 e 30 dias.";
    }

    return "";
}

async function lerLimiteUrgencia() {
    const resposta = await pedirEntrada({
        titulo: "Limite de urgência",
        mensagem: "Dentro de quantos dias uma tarefa é urgente? (digite de 1 a 30)",
        rotulo: "Dias para o prazo",
        tipo: "number",
        valorInicial: String(LIMITE_PADRAO),
        placeholder: `Padrão: ${LIMITE_PADRAO}`,
        min: 1,
        max: 30,
        confirmar: "Analisar tarefas",
        cancelar: `Usar padrão (${LIMITE_PADRAO})`,
        icone: "relogio",
        validar: validarLimite
    });

    // Cancelar devolve null. Number(null) seria 0, então null é testado antes de converter.
    if (resposta === null) {
        console.warn(`Entrada cancelada. Usando o limite padrão de ${LIMITE_PADRAO} dias.`);
        return LIMITE_PADRAO;
    }

    if (resposta.trim() === "") {
        console.warn(`Entrada vazia. Usando o limite padrão de ${LIMITE_PADRAO} dias.`);
        return LIMITE_PADRAO;
    }

    const numero = Number(resposta);

    if (Number.isNaN(numero)) {
        console.warn(`"${resposta}" não é um número. Usando o limite padrão de ${LIMITE_PADRAO} dias.`);
        return LIMITE_PADRAO;
    }

    if (numero < 1 || numero > 30) {
        console.warn(`${numero} está fora da faixa de 1 a 30. Usando o limite padrão de ${LIMITE_PADRAO} dias.`);
        return LIMITE_PADRAO;
    }

    return numero;
}

function pedirTarefaConcluida(primeiraVez, retorno, tipoRetorno) {
    const nomesPendentes = tarefas
        .filter((tarefa) => tarefa.concluida === false)
        .map((tarefa) => tarefa.nome);

    return pedirEntrada({
        titulo: "Tarefas concluídas",
        mensagem: primeiraVez
            ? 'Digite o nome de uma tarefa que você concluiu (ou "sair" para encerrar):'
            : 'Digite outra tarefa concluída (ou "sair" para encerrar):',
        rotulo: "Nome da tarefa",
        tipo: "text",
        placeholder: "Ex.: Estudar HTML",
        confirmar: "Marcar como concluída",
        cancelar: "Encerrar",
        icone: "check",
        sugestoes: nomesPendentes,
        retorno: retorno,
        retornoTipo: tipoRetorno
    });
}

// ---------- Tabela de tarefas ----------
// A situação de cada tarefa vem do painel de progresso (script.js), para tabela, cartões e gráfico concordarem
function obterSituacaoDaTarefa(tarefa) {
    if (typeof obterSituacaoAtividade === "function") {
        const situacao = obterSituacaoAtividade(tarefa.id);

        if (situacao !== null) {
            return situacao;
        }
    }

    if (tarefa.concluida) {
        return { faixa: "concluida", rotulo: "Concluída", percentual: 100 };
    }

    return { faixa: "nao-iniciada", rotulo: "Pendente" };
}

function criarColunaPrazo(tarefa) {
    const coluna = document.createElement("td");

    const data = document.createElement("span");
    data.classList.add("prazo-data");
    data.textContent = formatarData(dataIsoEmDias(tarefa.diasParaPrazo));

    // Depois da análise, mostra a situação calculada; antes, só o tempo restante
    const situacao = situacoesPorId[tarefa.id];
    const texto = situacao ?? descreverPrazo(tarefa.diasParaPrazo);
    const classe = situacao ? CLASSES_SITUACAO[situacao] : classificarPrazo(tarefa.diasParaPrazo);

    const detalhe = document.createElement("span");
    detalhe.classList.add("prazo-situacao", `prazo-${classe}`);
    detalhe.textContent = texto;

    coluna.append(data, detalhe);

    return coluna;
}

function atualizarTabela() {
    const listaTarefas = document.getElementById("lista-tarefas");

    listaTarefas.innerHTML = "";

    for (const tarefa of tarefas) {
        const linha = document.createElement("tr");

        const colunaTarefa = document.createElement("td");
        const nome = document.createElement("strong");
        nome.textContent = tarefa.nome;
        colunaTarefa.appendChild(nome);

        if (tarefa.descricao) {
            const descricao = document.createElement("span");
            descricao.classList.add("descricao-tabela");
            descricao.textContent = tarefa.descricao;
            colunaTarefa.appendChild(descricao);
        }

        const colunaPrioridade = document.createElement("td");
        const seloPrioridade = document.createElement("span");
        seloPrioridade.classList.add("selo-prioridade", `prioridade-${tarefa.prioridade}`);
        seloPrioridade.textContent = rotuloPrioridade(tarefa.prioridade);
        colunaPrioridade.appendChild(seloPrioridade);

        const colunaPrazo = criarColunaPrazo(tarefa);

        const situacaoTarefa = obterSituacaoDaTarefa(tarefa);
        const colunaStatus = document.createElement("td");
        const seloStatus = document.createElement("span");
        seloStatus.classList.add("rotulo-faixa", `faixa-${situacaoTarefa.faixa}`);
        seloStatus.textContent = situacaoTarefa.rotulo;

        if (situacaoTarefa.percentual !== undefined) {
            seloStatus.title = `${situacaoTarefa.percentual}% concluído`;
        }
        colunaStatus.appendChild(seloStatus);

        linha.append(colunaTarefa, colunaPrioridade, colunaPrazo, colunaStatus);

        listaTarefas.appendChild(linha);
    }
}

// Resumo visível na página (o mesmo conteúdo que vai para o console)
function mostrarResumoAnalise(linhas) {
    const area = document.getElementById("resultado-analise");

    if (area === null) {
        return;
    }

    const titulo = document.createElement("h3");
    titulo.textContent = "Resultado da análise";

    const lista = document.createElement("ul");

    for (const linha of linhas) {
        const item = document.createElement("li");
        item.textContent = linha;
        lista.appendChild(item);
    }

    area.replaceChildren(titulo, lista);
    area.hidden = false;
}

// ---------- Integração com o painel de progresso (script.js) ----------
function adicionarTarefaAnalise(dados) {
    tarefas.push({
        id: dados.id,
        nome: dados.nome,
        categoria: dados.categoria,
        prioridade: dados.prioridade,
        descricao: dados.descricao,
        minutos: dados.minutos,
        diasParaPrazo: dados.diasParaPrazo,
        concluida: false
    });

    atualizarTabela();
}

function removerTarefaAnalise(id) {
    const posicao = tarefas.findIndex((tarefa) => tarefa.id === id);

    if (posicao === -1) {
        return;
    }

    tarefas.splice(posicao, 1);
    delete situacoesPorId[id];
    atualizarTabela();
}

// Todo o fluxo roda dentro desta função, só quando o botão é clicado
async function analisarTarefas() {
    if (tarefas.length === 0) {
        console.warn("Não há tarefas cadastradas para analisar.");
        mostrarResumoAnalise(["Não há tarefas cadastradas para analisar."]);
        return;
    }

    // Cada análise começa do zero
    for (const tarefa of tarefas) {
        tarefa.concluida = false;
    }

    const limiteUrgencia = await lerLimiteUrgencia();

    // ---------- Classificação ----------
    /*
     * Teste de mesa (limite = 3), três primeiras voltas do laço abaixo:
     *
     * Volta | tarefa             | dias | dias < 0 | dias === 0 | dias <= 3 | situacao
     * ------|--------------------|------|----------|------------|-----------|----------
     *   1   | Estudar HTML       |  -1  | true     | (não testa)| (não testa)| Atrasada
     *   2   | Praticar CSS       |   2  | false    | false      | true      | Urgente
     *   3   | Estudar JavaScript |  10  | false    | false      | false     | Tranquila
     *
     */
    const relatorio = [];

    for (const tarefa of tarefas) {
        let situacao;

        // A ordem importa: "dias === 0" vem antes de "dias <= limite",
        // senão toda tarefa que vence hoje cairia em "Urgente".
        if (tarefa.diasParaPrazo < 0) {
            situacao = "Atrasada";
        } else if (tarefa.diasParaPrazo === 0) {
            situacao = "Vence hoje";
        } else if (tarefa.diasParaPrazo <= limiteUrgencia) {
            situacao = "Urgente";
        } else {
            situacao = "Tranquila";
        }

        let dica;

        switch (tarefa.categoria) {
            case "estudo":
                dica = "Reserve um horário sem distrações.";
                break;
            case "trabalho":
                dica = "Avise a equipe sobre o andamento.";
                break;
            case "casa":
                dica = "Encaixe entre outras atividades.";
                break;
            case "saude":
                dica = "Confirme o horário com antecedência.";
                break;
            default:
                dica = "Categoria sem orientação definida.";
                break;
        }

        situacoesPorId[tarefa.id] = situacao;

        relatorio.push({
            tarefa: tarefa.nome,
            categoria: tarefa.categoria,
            diasParaPrazo: tarefa.diasParaPrazo,
            situacao: situacao,
            dica: dica
        });
    }

    // ---------- Resumo ----------
    let totalMinutos = 0;
    let totalCriticas = 0;
    let tarefaMaisLonga = tarefas[0];

    for (let i = 0; i < tarefas.length; i++) {
        totalMinutos += tarefas[i].minutos;

        if (relatorio[i].situacao !== "Tranquila") {
            totalCriticas++;
        }

        if (tarefas[i].minutos > tarefaMaisLonga.minutos) {
            tarefaMaisLonga = tarefas[i];
        }
    }

    const mediaMinutos = totalMinutos / tarefas.length;

    // ---------- Exibição ----------
    const linhasResumo = [
        `Limite de urgência: ${limiteUrgencia} dia(s)`,
        `Tarefas cadastradas: ${tarefas.length}`,
        `Tarefas atrasadas, que vencem hoje ou urgentes: ${totalCriticas}`,
        `Tempo total estimado: ${totalMinutos} minutos (média de ${mediaMinutos.toFixed(1)} por tarefa)`,
        `Tarefa mais demorada: ${tarefaMaisLonga.nome} (${tarefaMaisLonga.minutos} minutos)`
    ];

    for (const linha of linhasResumo) {
        console.log(linha);
    }

    console.table(relatorio);

    // ---------- Registro de tarefas concluídas (while) ----------
    let totalConcluidas = 0;
    let minutosConcluidos = 0;
    let retorno = "";
    let tipoRetorno = "";

    let nomeDigitado = await pedirTarefaConcluida(true, retorno, tipoRetorno);

    // null (Cancelar) também encerra, para o laço não travar.
    while (nomeDigitado !== null && nomeDigitado.trim().toLowerCase() !== "sair") {
        const nomeBuscado = nomeDigitado.trim().toLowerCase();
        let encontrada = false;

        for (const tarefa of tarefas) {
            if (tarefa.nome.toLowerCase() === nomeBuscado) {
                encontrada = true;

                if (tarefa.concluida === true) {
                    console.log(`"${tarefa.nome}" já estava marcada como concluída.`);
                    retorno = `"${tarefa.nome}" já estava marcada como concluída.`;
                    tipoRetorno = "erro";
                } else {
                    tarefa.concluida = true;
                    totalConcluidas++;
                    minutosConcluidos += tarefa.minutos;
                    console.log(`Concluída: ${tarefa.nome} (${tarefa.minutos} minutos).`);
                    retorno = `Concluída: ${tarefa.nome} (${tarefa.minutos} minutos).`;
                    tipoRetorno = "sucesso";

                    // Avisa o painel de progresso para cartões e gráfico acompanharem
                    if (typeof concluirAtividadePorId === "function") {
                        concluirAtividadePorId(tarefa.id);
                    }
                }
            }
        }

        if (encontrada === false) {
            console.log(`Nenhuma tarefa encontrada com o nome "${nomeDigitado}".`);
            retorno = `Nenhuma tarefa encontrada com o nome "${nomeDigitado}".`;
            tipoRetorno = "erro";
        }

        // A condição do while é atualizada aqui dentro, a cada volta.
        nomeDigitado = await pedirTarefaConcluida(false, retorno, tipoRetorno);
    }

    const linhaConcluidas = `Você concluiu ${totalConcluidas} tarefa(s), somando ${minutosConcluidos} minutos.`;

    console.log(linhaConcluidas);
    console.table(tarefas);

    atualizarTabela();
    mostrarResumoAnalise([...linhasResumo, linhaConcluidas]);
}

// ---------- Ligação com o botão da página ----------
const botaoAnalisar = document.getElementById("botao-analisar");

botaoAnalisar.addEventListener("click", async () => {
    // Desativa o botão enquanto os modais estão abertos, para não iniciar duas análises
    botaoAnalisar.disabled = true;

    try {
        await analisarTarefas();
    } finally {
        botaoAnalisar.disabled = false;
    }
});

atualizarTabela();