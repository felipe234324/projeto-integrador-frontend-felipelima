const atividades = [
    { nome: "Estudar HTML",       categoria: "estudo",   minutosEstimados: 120, minutosGastos: 120 },
    { nome: "Praticar CSS",       categoria: "estudo",   minutosEstimados: 180, minutosGastos: 135 },
    { nome: "Estudar JavaScript", categoria: "estudo",   minutosEstimados: 240, minutosGastos: 60 },
    { nome: "Enviar relatório",   categoria: "trabalho", minutosEstimados: 60,  minutosGastos: 0 },
    { nome: "Lavar roupa",        categoria: "casa",     minutosEstimados: 45,  minutosGastos: 20 },
    { nome: "Consulta médica",    categoria: "saude",    minutosEstimados: 30,  minutosGastos: 40 }
];

const ROTULOS_FAIXA = {
    "concluida": "Concluída",
    "avancada": "Avançada",
    "andamento": "Em andamento",
    "nao-iniciada": "Não iniciada"
};

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

function calcularResumo(avaliadas) {
    const totalMinutosGastos = avaliadas.reduce((soma, atividade) => soma + atividade.minutosGastos, 0);
    const somaPercentuais = avaliadas.reduce((soma, atividade) => soma + atividade.percentual, 0);
    const mediaProgresso = avaliadas.length === 0 ? 0 : Math.round(somaPercentuais / avaliadas.length);

    return {
        totalAtividades: avaliadas.length,
        totalPendentes: filtrarPendentes(avaliadas).length,
        totalMinutosGastos: totalMinutosGastos,
        mediaProgresso: mediaProgresso
    };
}

function criarCartaoAtividade(atividade) {
    const cartao = document.createElement("article");
    cartao.classList.add("cartao-atividade", `faixa-${atividade.faixa}`);

    const titulo = document.createElement("h3");
    titulo.textContent = atividade.nome;

    const detalhes = document.createElement("p");
    detalhes.textContent = `${atividade.categoria} · ${atividade.minutosGastos} de ${atividade.minutosEstimados} minutos`;

    const barra = document.createElement("progress");
    barra.max = 100;
    barra.value = atividade.percentual;
    barra.setAttribute("aria-label", `Progresso de ${atividade.nome}`);

    const rotulo = document.createElement("span");
    rotulo.classList.add("rotulo-faixa");
    rotulo.textContent = `${ROTULOS_FAIXA[atividade.faixa]} · ${atividade.percentual}%`;

    cartao.append(titulo, detalhes, barra, rotulo);

    return cartao;
}

function criarElementoResumo(resumo) {
    const paragrafo = document.createElement("p");
    paragrafo.classList.add("resumo-atividades");
    paragrafo.textContent = `${resumo.totalAtividades} atividades · ${resumo.totalPendentes} pendentes · progresso médio de ${resumo.mediaProgresso}% · ${resumo.totalMinutosGastos} minutos dedicados`;

    return paragrafo;
}

function mostrarPainel(destino, lista) {
    const avaliadas = avaliarAtividades(lista);
    const resumo = calcularResumo(avaliadas);

    const listaCartoes = document.createElement("div");
    listaCartoes.classList.add("lista-atividades");

    for (const atividade of avaliadas) {
        listaCartoes.append(criarCartaoAtividade(atividade));
    }

    destino.append(criarElementoResumo(resumo), listaCartoes);
}

const areaResultado = document.querySelector("#resultado");

if (areaResultado === null) {
    console.error('A área de resultado "#resultado" não foi encontrada no HTML.');
} else {
    mostrarPainel(areaResultado, atividades);
}