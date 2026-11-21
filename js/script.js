const atividades = [
    { id: 1, nome: "Estudar HTML",       categoria: "estudo",   prioridade: "alta",  descricao: "Revisar tags semânticas, formulários e acessibilidade.", prazo: dataIsoEmDias(-1), minutosEstimados: 120, minutosGastos: 120 },
    { id: 2, nome: "Praticar CSS",       categoria: "estudo",   prioridade: "media", descricao: "Exercitar Flexbox, Grid e responsividade.",              prazo: dataIsoEmDias(2),  minutosEstimados: 180, minutosGastos: 135 },
    { id: 3, nome: "Estudar JavaScript", categoria: "estudo",   prioridade: "alta",  descricao: "Estudar funções, arrays e manipulação do DOM.",          prazo: dataIsoEmDias(10), minutosEstimados: 240, minutosGastos: 60 },
    { id: 4, nome: "Enviar relatório",   categoria: "trabalho", prioridade: "alta",  descricao: "Finalizar o relatório semanal e enviar à coordenação.",  prazo: dataIsoEmDias(1),  minutosEstimados: 60,  minutosGastos: 0 },
    { id: 5, nome: "Lavar roupa",        categoria: "casa",     prioridade: "baixa", descricao: "Lavar e estender as roupas da semana.",                  prazo: dataIsoEmDias(6),  minutosEstimados: 45,  minutosGastos: 20 },
    { id: 6, nome: "Consulta médica",    categoria: "saude",    prioridade: "media", descricao: "Levar documentos e exames anteriores.",                  prazo: dataIsoEmDias(0),  minutosEstimados: 30,  minutosGastos: 40 }
];

const ROTULOS_FAIXA = {
    "concluida": "Concluída",
    "avancada": "Avançada",
    "andamento": "Em andamento",
    "nao-iniciada": "Não iniciada"
};

// As barras do gráfico usam as mesmas faixas e cores dos cartões de progresso
const FAIXAS_GRAFICO = [
    { faixa: "concluida",    rotulo: "Concluídas",    variavel: "--cor-sucesso" },
    { faixa: "avancada",     rotulo: "Avançadas",     variavel: "--cor-principal" },
    { faixa: "andamento",    rotulo: "Em andamento",  variavel: "--cor-alerta" },
    { faixa: "nao-iniciada", rotulo: "Não iniciadas", variavel: "--cor-secundaria" }
];

const MINUTOS_POR_REGISTRO = 30;

const listaAtividades = document.querySelector("#lista-atividades");
const campoBusca = document.querySelector("#busca-atividade");
const paragrafoResumo = document.querySelector("#resumo");
const formularioCadastro = document.querySelector("#cadastro form");
const mensagemCadastro = document.querySelector("#mensagem-cadastro");
const botaoMenu = document.querySelector(".menu-hamburguer");
const menuPrincipal = document.querySelector("#menu-principal");
const canvasGrafico = document.querySelector("#grafico-tarefas");
const legendaGrafico = document.querySelector("#legenda-grafico");
const somConfirmacao = document.querySelector("#som-confirmacao");
const numeroTotal = document.querySelector("#numero-total");
const numeroConcluidas = document.querySelector("#numero-concluidas");
const numeroPendentes = document.querySelector("#numero-pendentes");

let dadosDoGrafico = null;

function calcularProgresso(minutosGastos, minutosEstimados, limiteMaximo = 100) {
    if (minutosEstimados <= 0) {
        return 0;
    }

    const percentual = Math.round((minutosGastos / minutosEstimados) * 100);

    return Math.min(percentual, limiteMaximo);
}

function classificarProgresso(percentual) {
    if (percentual >= 100) {
        return "concluida";
    } else if (percentual >= 60) {
        return "avancada";
    } else if (percentual > 0) {
        return "andamento";
    } else {
        return "nao-iniciada";
    }
}

function avaliarAtividades(lista) {
    return lista.map((atividade) => {
        const percentual = calcularProgresso(atividade.minutosGastos, atividade.minutosEstimados);

        return {
            ...atividade,
            percentual: percentual,
            faixa: classificarProgresso(percentual)
        };
    });
}

function filtrarPendentes(avaliadas) {
    return avaliadas.filter((atividade) => atividade.faixa !== "concluida");
}

function filtrarPorTexto(avaliadas, texto) {
    const termo = texto.trim().toLowerCase();

    return avaliadas.filter((atividade) => atividade.nome.toLowerCase().includes(termo));
}

function calcularResumo(avaliadas, visiveis) {
    const totalMinutosGastos = visiveis.reduce((soma, atividade) => soma + atividade.minutosGastos, 0);
    const somaPercentuais = visiveis.reduce((soma, atividade) => soma + atividade.percentual, 0);
    const mediaProgresso = visiveis.length === 0 ? 0 : Math.round(somaPercentuais / visiveis.length);

    return {
        totalAtividades: avaliadas.length,
        totalVisiveis: visiveis.length,
        totalPendentes: filtrarPendentes(visiveis).length,
        totalMinutosGastos: totalMinutosGastos,
        mediaProgresso: mediaProgresso
    };
}

function gerarProximoId(lista) {
    return lista.reduce((maior, atividade) => Math.max(maior, atividade.id), 0) + 1;
}

// Alta primeiro, depois média e baixa; no empate, vence o prazo mais próximo (sem prazo vai para o fim)
const ORDEM_PRIORIDADE = { "alta": 0, "media": 1, "baixa": 2 };

function ordenarPorPrioridade(lista) {
    return [...lista].sort((a, b) => {
        const pesoA = ORDEM_PRIORIDADE[a.prioridade] ?? 3;
        const pesoB = ORDEM_PRIORIDADE[b.prioridade] ?? 3;

        if (pesoA !== pesoB) {
            return pesoA - pesoB;
        }

        const prazoA = a.prazo ?? "9999-12-31";
        const prazoB = b.prazo ?? "9999-12-31";

        if (prazoA !== prazoB) {
            return prazoA < prazoB ? -1 : 1;
        }

        return a.id - b.id;
    });
}

function criarNovaAtividade(lista, nome, prioridade, minutosEstimados = 60, descricao = "", prazo = null, categoria = "geral") {
    return {
        id: gerarProximoId(lista),
        nome: nome,
        categoria: categoria,
        prioridade: prioridade,
        descricao: descricao,
        prazo: prazo,
        minutosEstimados: minutosEstimados,
        minutosGastos: 0
    };
}

// ---------- Integração com a tabela e a análise (logica.js) ----------
function obterSituacaoAtividade(id) {
    const atividade = atividades.find((item) => item.id === id);

    if (atividade === undefined) {
        return null;
    }

    const percentual = calcularProgresso(atividade.minutosGastos, atividade.minutosEstimados);
    const faixa = classificarProgresso(percentual);

    return { faixa: faixa, rotulo: ROTULOS_FAIXA[faixa], percentual: percentual };
}

function concluirAtividadePorId(id) {
    const atividade = atividades.find((item) => item.id === id);

    if (atividade === undefined) {
        return;
    }

    atividade.minutosGastos = Math.max(atividade.minutosGastos, atividade.minutosEstimados);
    sincronizar();
}

function criarBotaoAcao(texto, descricao, acao, id) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.textContent = texto;
    botao.classList.add("botao-acao");
    botao.setAttribute("aria-label", descricao);
    botao.dataset.acao = acao;
    botao.dataset.id = String(id);

    return botao;
}

function criarItemMeta(rotulo, valor, classe) {
    const linha = document.createElement("div");

    const termo = document.createElement("dt");
    termo.textContent = rotulo;

    const definicao = document.createElement("dd");
    definicao.textContent = valor;

    if (classe) {
        definicao.classList.add(classe);
    }

    linha.append(termo, definicao);

    return linha;
}

function criarItemPrazo(atividade) {
    if (!atividade.prazo) {
        return criarItemMeta("Prazo", "Sem prazo");
    }

    const dataFormatada = formatarData(atividade.prazo);
    const item = criarItemMeta("Prazo", dataFormatada);

    // Tarefa concluída não precisa de alerta de prazo
    if (atividade.faixa === "concluida") {
        return item;
    }

    const dias = calcularDiasParaPrazo(atividade.prazo);
    const situacao = document.createElement("span");

    situacao.classList.add("prazo-situacao", `prazo-${classificarPrazo(dias)}`);
    situacao.textContent = descreverPrazo(dias);
    item.querySelector("dd").appendChild(situacao);

    return item;
}

function criarCartaoAtividade(atividade) {
    const cartao = document.createElement("article");
    cartao.classList.add("cartao-atividade", `faixa-${atividade.faixa}`);
    cartao.dataset.id = String(atividade.id);

    const topo = document.createElement("div");
    topo.classList.add("cartao-topo");

    const titulo = document.createElement("h3");
    titulo.textContent = atividade.nome;

    const prioridade = rotuloPrioridade(atividade.prioridade);
    const seloPrioridade = document.createElement("span");
    seloPrioridade.classList.add("selo-prioridade", `prioridade-${atividade.prioridade}`);
    seloPrioridade.textContent = prioridade;
    seloPrioridade.setAttribute("aria-label", `Prioridade ${prioridade}`);

    topo.append(titulo, seloPrioridade);

    const descricao = document.createElement("p");
    descricao.classList.add("descricao-atividade");

    if (atividade.descricao) {
        descricao.textContent = atividade.descricao;
    } else {
        descricao.textContent = "Sem descrição.";
        descricao.classList.add("descricao-vazia");
    }

    const detalhes = document.createElement("dl");
    detalhes.classList.add("meta-atividade");
    detalhes.append(
        criarItemMeta("Categoria", rotuloCategoria(atividade.categoria)),
        criarItemPrazo(atividade),
        criarItemMeta("Tempo", `${atividade.minutosGastos} de ${atividade.minutosEstimados} min`)
    );

    const linhaProgresso = document.createElement("div");
    linhaProgresso.classList.add("linha-progresso");

    const barra = document.createElement("progress");
    barra.max = 100;
    barra.value = atividade.percentual;
    barra.setAttribute("aria-label", `Progresso de ${atividade.nome}`);

    const percentual = document.createElement("span");
    percentual.classList.add("percentual-atividade");
    percentual.textContent = `${atividade.percentual}%`;
    percentual.setAttribute("aria-hidden", "true");

    linhaProgresso.append(barra, percentual);

    const rotulo = document.createElement("span");
    rotulo.classList.add("rotulo-faixa");
    rotulo.textContent = ROTULOS_FAIXA[atividade.faixa];

    const acoes = document.createElement("div");
    acoes.classList.add("acoes-atividade");

    const botaoRegistrar = criarBotaoAcao(
        `+${MINUTOS_POR_REGISTRO} min`,
        `Registrar ${MINUTOS_POR_REGISTRO} minutos em ${atividade.nome}`,
        "registrar",
        atividade.id
    );

    const botaoRemover = criarBotaoAcao(
        "Remover",
        `Remover ${atividade.nome}`,
        "remover",
        atividade.id
    );
    botaoRemover.classList.add("botao-remover");

    acoes.append(botaoRegistrar, botaoRemover);
    cartao.append(topo, descricao, detalhes, linhaProgresso, rotulo, acoes);

    return cartao;
}

function criarMensagemVazia() {
    const paragrafo = document.createElement("p");
    paragrafo.classList.add("mensagem-vazia");
    paragrafo.textContent = "Nenhuma atividade encontrada.";

    return paragrafo;
}

function criarItemResumo(rotulo, valor) {
    const item = document.createElement("div");

    const termo = document.createElement("dt");
    termo.textContent = rotulo;

    const definicao = document.createElement("dd");
    definicao.textContent = valor;

    item.append(termo, definicao);

    return item;
}

function atualizarResumo(resumo) {
    const titulo = document.createElement("p");
    titulo.classList.add("resumo-titulo");
    titulo.textContent = `Exibindo ${resumo.totalVisiveis} de ${resumo.totalAtividades} atividades`;

    const numeros = document.createElement("dl");
    numeros.classList.add("resumo-numeros");
    numeros.append(
        criarItemResumo("Pendentes", String(resumo.totalPendentes)),
        criarItemResumo("Progresso médio", `${resumo.mediaProgresso}%`),
        criarItemResumo("Minutos dedicados", String(resumo.totalMinutosGastos))
    );

    paragrafoResumo.replaceChildren(titulo, numeros);
}

function desenhar() {
    const avaliadas = avaliarAtividades(atividades);
    const visiveis = ordenarPorPrioridade(filtrarPorTexto(avaliadas, campoBusca.value));
    const cartoes = visiveis.map((atividade) => criarCartaoAtividade(atividade));

    if (cartoes.length === 0) {
        cartoes.push(criarMensagemVazia());
    }

    listaAtividades.replaceChildren(...cartoes);
    atualizarResumo(calcularResumo(avaliadas, visiveis));
}

// ---------- Gráfico de atividades por status (canvas) ----------
function lerCor(variavel) {
    return getComputedStyle(document.documentElement).getPropertyValue(variavel).trim();
}

function contarPorFaixa(avaliadas) {
    return FAIXAS_GRAFICO.map((item) => ({
        rotulo: item.rotulo,
        valor: avaliadas.filter((atividade) => atividade.faixa === item.faixa).length,
        cor: lerCor(item.variavel)
    }));
}

function tracarBarra(contexto, x, y, largura, altura, raio) {
    contexto.beginPath();

    if (typeof contexto.roundRect === "function") {
        contexto.roundRect(x, y, largura, altura, [raio, raio, 0, 0]);
    } else {
        contexto.rect(x, y, largura, altura);
    }

    contexto.fill();
}

// Quebra o rótulo em duas linhas quando a barra é estreita
function quebrarRotulo(contexto, texto, larguraMaxima) {
    if (contexto.measureText(texto).width <= larguraMaxima) {
        return [texto];
    }

    return texto.split(" ");
}

function desenharGrafico(dados) {
    if (canvasGrafico === null) {
        return;
    }

    const contexto = canvasGrafico.getContext("2d");

    if (contexto === null) {
        return;
    }

    dadosDoGrafico = dados;

    // Tamanho real na tela + densidade de pixels: o desenho fica nítido em qualquer aparelho
    const largura = Math.max(canvasGrafico.clientWidth, 280);
    const altura = Math.max(Math.round(largura * 0.58), 240);
    const escala = window.devicePixelRatio || 1;

    canvasGrafico.style.height = `${altura}px`;
    canvasGrafico.width = Math.round(largura * escala);
    canvasGrafico.height = Math.round(altura * escala);
    contexto.setTransform(escala, 0, 0, escala, 0, 0);

    const margem = { topo: 58, direita: 24, baixo: 62, esquerda: 38 };
    const areaLargura = largura - margem.esquerda - margem.direita;
    const areaAltura = altura - margem.topo - margem.baixo;
    const base = margem.topo + areaAltura;

    // Fundo do gráfico
    contexto.fillStyle = lerCor("--cor-fundo");
    contexto.fillRect(0, 0, largura, altura);

    // Título do gráfico
    contexto.fillStyle = lerCor("--cor-secundaria");
    contexto.font = "bold 16px Arial";
    contexto.textAlign = "left";
    contexto.textBaseline = "alphabetic";
    contexto.fillText("Quantidade de tarefas", 20, 32);

    // Escala vertical: sempre números inteiros, com no máximo 5 linhas de grade
    const valorMaximo = Math.max(1, ...dados.map((item) => item.valor));
    const passo = Math.max(1, Math.ceil(valorMaximo / 5));
    const topoEscala = Math.ceil(valorMaximo / passo) * passo;

    contexto.font = "12px Arial";
    contexto.lineWidth = 1;

    for (let valor = 0; valor <= topoEscala; valor += passo) {
        const y = base - (valor / topoEscala) * areaAltura;

        contexto.strokeStyle = valor === 0 ? "#9aa7b0" : "#dde3e8";
        contexto.beginPath();
        contexto.moveTo(margem.esquerda, y);
        contexto.lineTo(largura - margem.direita, y);
        contexto.stroke();

        contexto.fillStyle = "#5b6770";
        contexto.textAlign = "right";
        contexto.textBaseline = "middle";
        contexto.fillText(String(valor), margem.esquerda - 8, y);
    }

    // Uma barra por status
    const larguraSlot = areaLargura / dados.length;
    const larguraBarra = Math.min(64, larguraSlot * 0.58);

    dados.forEach((item, indice) => {
        const centro = margem.esquerda + larguraSlot * indice + larguraSlot / 2;
        const alturaBarra = (item.valor / topoEscala) * areaAltura;

        if (item.valor > 0) {
            contexto.fillStyle = item.cor;
            tracarBarra(contexto, centro - larguraBarra / 2, base - alturaBarra, larguraBarra, alturaBarra, 8);
        }

        // Valor acima da barra
        contexto.fillStyle = lerCor("--cor-secundaria");
        contexto.font = "bold 14px Arial";
        contexto.textAlign = "center";
        contexto.textBaseline = "alphabetic";
        contexto.fillText(String(item.valor), centro, base - alturaBarra - 8);

        // Rótulo abaixo da barra
        contexto.fillStyle = lerCor("--cor-texto");
        contexto.font = "13px Arial";
        contexto.textBaseline = "top";

        const linhas = quebrarRotulo(contexto, item.rotulo, larguraSlot - 6);

        linhas.forEach((linha, posicao) => {
            contexto.fillText(linha, centro, base + 10 + posicao * 16);
        });
    });

    // Texto alternativo e legenda acompanham os números reais
    const total = dados.reduce((soma, item) => soma + item.valor, 0);
    const descricaoGrafico = `Gráfico de tarefas por status, ${total} atividades no total. ${dados.map((item) => `${item.rotulo}: ${item.valor}`).join(", ")}.`;

    canvasGrafico.setAttribute("aria-label", descricaoGrafico);
    canvasGrafico.textContent = descricaoGrafico;

    atualizarLegenda(dados, total);
}

// Legenda em etiquetas: amostra de cor, nome do status e quantidade
function atualizarLegenda(dados, total) {
    if (legendaGrafico === null) {
        return;
    }

    const itens = dados.map((item) => {
        const linha = document.createElement("li");

        const amostra = document.createElement("span");
        amostra.classList.add("amostra-legenda");
        amostra.style.backgroundColor = item.cor;
        amostra.setAttribute("aria-hidden", "true");

        const nome = document.createElement("span");
        nome.textContent = item.rotulo;

        const quantidade = document.createElement("strong");
        quantidade.textContent = String(item.valor);

        linha.append(amostra, nome, quantidade);

        return linha;
    });

    const linhaTotal = document.createElement("li");
    linhaTotal.classList.add("legenda-total");
    linhaTotal.textContent = `Total: ${total}`;

    legendaGrafico.replaceChildren(...itens, linhaTotal);
}

function atualizarNumerosApresentacao(avaliadas) {
    const concluidas = avaliadas.filter((atividade) => atividade.faixa === "concluida").length;

    if (numeroTotal !== null) {
        numeroTotal.textContent = String(avaliadas.length);
    }

    if (numeroConcluidas !== null) {
        numeroConcluidas.textContent = String(concluidas);
    }

    if (numeroPendentes !== null) {
        numeroPendentes.textContent = String(avaliadas.length - concluidas);
    }
}

// Gráfico, números do topo e tabela dependem de todas as atividades (e não do filtro da busca)
function atualizarPainelGeral() {
    const avaliadas = avaliarAtividades(atividades);

    desenharGrafico(contarPorFaixa(avaliadas));
    atualizarNumerosApresentacao(avaliadas);

    if (typeof atualizarTabela === "function") {
        atualizarTabela();
    }
}

function sincronizar() {
    desenhar();
    atualizarPainelGeral();
}

function tratarCliqueNaLista(evento) {
    const botao = evento.target.closest("button[data-acao]");

    if (botao === null) {
        return;
    }

    const id = Number(botao.dataset.id);
    const atividade = atividades.find((item) => item.id === id);

    if (atividade === undefined) {
        return;
    }

    switch (botao.dataset.acao) {
        case "registrar": {
            atividade.minutosGastos += MINUTOS_POR_REGISTRO;
            sincronizar();

            const novoBotao = listaAtividades.querySelector(`button[data-acao="registrar"][data-id="${id}"]`);

            if (novoBotao !== null) {
                novoBotao.focus();
            }
            break;
        }
        case "remover":
            atividades.splice(atividades.indexOf(atividade), 1);

            if (typeof removerTarefaAnalise === "function") {
                removerTarefaAnalise(id);
            }

            sincronizar();
            listaAtividades.focus();
            break;
        default:
            break;
    }
}

function tocarSomConfirmacao() {
    if (somConfirmacao === null) {
        return;
    }

    somConfirmacao.currentTime = 0;

    const reproducao = somConfirmacao.play();

    // Alguns navegadores bloqueiam o áudio: o cadastro continua funcionando sem som
    if (reproducao !== undefined) {
        reproducao.catch(() => {});
    }
}

function tratarEnvioFormulario(evento) {
    evento.preventDefault();

    const dados = new FormData(formularioCadastro);
    const nome = String(dados.get("nome-tarefa")).trim();
    const descricao = String(dados.get("descricao")).trim();
    const categoria = normalizarCategoria(String(dados.get("categoria")));
    const prioridade = String(dados.get("prioridade"));
    const prazo = String(dados.get("prazo"));
    const minutos = Number(dados.get("tempo-estimado"));

    if (nome === "") {
        mensagemCadastro.textContent = "Digite um nome para a tarefa.";
        return;
    }

    const novaAtividade = criarNovaAtividade(atividades, nome, prioridade, minutos > 0 ? minutos : undefined, descricao, prazo === "" ? null : prazo, categoria);

    atividades.push(novaAtividade);

    // A nova tarefa também entra na tabela e na análise de prazos
    if (typeof adicionarTarefaAnalise === "function") {
        adicionarTarefaAnalise({
            id: novaAtividade.id,
            nome: novaAtividade.nome,
            categoria: novaAtividade.categoria,
            prioridade: novaAtividade.prioridade,
            descricao: novaAtividade.descricao,
            minutos: novaAtividade.minutosEstimados,
            diasParaPrazo: novaAtividade.prazo === null ? 30 : calcularDiasParaPrazo(novaAtividade.prazo)
        });
    }

    sincronizar();
    formularioCadastro.reset();
    mensagemCadastro.textContent = `"${nome}" foi adicionada à lista de progresso.`;
    tocarSomConfirmacao();
}

function definirMenu(aberto) {
    botaoMenu.setAttribute("aria-expanded", String(aberto));
    botaoMenu.setAttribute("aria-label", aberto ? "Fechar menu de navegação" : "Abrir menu de navegação");
    menuPrincipal.classList.toggle("aberto", aberto);
}

function alternarMenu() {
    definirMenu(botaoMenu.getAttribute("aria-expanded") !== "true");
}

function fecharMenuComEscape(evento) {
    if (evento.key === "Escape" && menuPrincipal.classList.contains("aberto")) {
        definirMenu(false);
        botaoMenu.focus();
    }
}

// ---------- Destaque do item de menu da seção atual ----------
let linksMenu = [];
let idsSecoes = [];
let secaoAtiva = null;
let rolagemTravada = false;
let quadroPendente = false;

function marcarSecaoAtiva(id) {
    if (id === secaoAtiva) {
        return;
    }

    secaoAtiva = id;

    for (const link of linksMenu) {
        const ehAtivo = link.getAttribute("href") === `#${id}`;

        link.classList.toggle("ativo", ehAtivo);

        if (ehAtivo) {
            link.setAttribute("aria-current", "location");
        } else {
            link.removeAttribute("aria-current");
        }
    }

    // Quando o item ativo está dentro do submenu, o item pai ("Tarefas") também fica destacado
    for (const pai of menuPrincipal.querySelectorAll(".tem-submenu > a")) {
        const filhoAtivo = pai.parentElement.querySelector(".submenu a.ativo") !== null;
        const ativo = filhoAtivo || pai.classList.contains("ativo");

        pai.classList.toggle("ativo", ativo);

        if (ativo) {
            pai.setAttribute("aria-current", "location");
        }
    }
}

// A seção atual é a última cujo topo já passou da linha de referência (logo abaixo da navbar)
function descobrirSecaoVisivel() {
    const navbar = document.querySelector(".navbar");
    const linhaReferencia = navbar.offsetHeight + 48;
    const fimDaPagina = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

    let escolhida = idsSecoes[0];
    let maiorTopo = -Infinity;
    let ultima = idsSecoes[0];
    let topoDaUltima = -Infinity;

    for (const id of idsSecoes) {
        const topo = document.getElementById(id).getBoundingClientRect().top;

        if (topo <= linhaReferencia && topo > maiorTopo) {
            maiorTopo = topo;
            escolhida = id;
        }

        if (topo > topoDaUltima) {
            topoDaUltima = topo;
            ultima = id;
        }
    }

    // Seções curtas no fim da página nunca chegam ao topo: no final da rolagem vale a última
    if (fimDaPagina && window.scrollY > 0) {
        return ultima;
    }

    return escolhida;
}

function aoRolarPagina() {
    if (rolagemTravada || quadroPendente) {
        return;
    }

    quadroPendente = true;

    requestAnimationFrame(() => {
        quadroPendente = false;
        marcarSecaoAtiva(descobrirSecaoVisivel());
    });
}

// Ao clicar num link interno, o destaque vai direto para o destino e não pisca nas seções do caminho
function tratarCliqueEmAncora(evento) {
    const link = evento.target.closest('a[href^="#"]');

    if (link === null) {
        return;
    }

    const id = link.getAttribute("href").slice(1);

    if (idsSecoes.includes(id)) {
        marcarSecaoAtiva(id);
        rolagemTravada = true;
    }

    if (botaoMenu !== null && menuPrincipal.contains(link) && menuPrincipal.classList.contains("aberto")) {
        definirMenu(false);
    }
}

// Quando a pessoa volta a rolar por conta própria, o destaque volta a acompanhar a página
function liberarRolagem() {
    rolagemTravada = false;
    aoRolarPagina();
}

function liberarRolagemPorTecla(evento) {
    const teclas = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "];

    if (teclas.includes(evento.key)) {
        liberarRolagem();
    }
}

function iniciarNavegacaoAtiva() {
    if (menuPrincipal === null || document.querySelector(".navbar") === null) {
        return;
    }

    linksMenu = [...menuPrincipal.querySelectorAll('a[href^="#"]')];
    idsSecoes = [...new Set(linksMenu.map((link) => link.getAttribute("href").slice(1)))]
        .filter((id) => document.getElementById(id) !== null);

    if (idsSecoes.length === 0) {
        return;
    }

    document.addEventListener("click", tratarCliqueEmAncora);
    window.addEventListener("scroll", aoRolarPagina, { passive: true });
    window.addEventListener("resize", aoRolarPagina);
    window.addEventListener("wheel", liberarRolagem, { passive: true });
    window.addEventListener("touchmove", liberarRolagem, { passive: true });
    window.addEventListener("keydown", liberarRolagemPorTecla);

    marcarSecaoAtiva(descobrirSecaoVisivel());
}

function iniciarPainel() {
    if (listaAtividades === null || campoBusca === null || paragrafoResumo === null) {
        console.error('Elementos do painel (#lista-atividades, #busca-atividade e #resumo) não foram encontrados no HTML.');
        return;
    }

    listaAtividades.addEventListener("click", tratarCliqueNaLista);
    campoBusca.addEventListener("input", desenhar);

    // O gráfico é redesenhado quando a largura da tela muda
    window.addEventListener("resize", () => {
        if (dadosDoGrafico !== null) {
            requestAnimationFrame(() => desenharGrafico(dadosDoGrafico));
        }
    });

    sincronizar();
}

function iniciarCadastro() {
    if (formularioCadastro === null || mensagemCadastro === null || listaAtividades === null) {
        console.error('O formulário de cadastro ou a mensagem (#mensagem-cadastro) não foram encontrados no HTML.');
        return;
    }

    // O prazo não pode ser anterior a hoje
    const campoPrazo = formularioCadastro.querySelector("#prazo");

    if (campoPrazo !== null) {
        campoPrazo.min = dataIsoEmDias(0);
    }

    formularioCadastro.addEventListener("submit", tratarEnvioFormulario);
}

function iniciarMenu() {
    if (botaoMenu === null || menuPrincipal === null) {
        console.error('O botão do menu ou o menu (#menu-principal) não foram encontrados no HTML.');
        return;
    }

    botaoMenu.addEventListener("click", alternarMenu);
    document.addEventListener("keydown", fecharMenuComEscape);
}

iniciarPainel();
iniciarCadastro();
iniciarMenu();
iniciarNavegacaoAtiva();