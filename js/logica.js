
/*
 * PLANEJAMENTO
 * Tema: Gerenciador de Tarefas (analisador de prazos).
 *
 * Entrada (começa quando o usuário clica em "Analisar tarefas"):
 *   - Um limite de dias (prompt) que define quando uma tarefa é "urgente".
 *   - Nomes de tarefas concluídas (prompt), até digitar "sair".
 *
 * Processamento:
 *   - Classifica cada tarefa pelo prazo (if / else if / else).
 *   - Escolhe uma dica pela categoria (switch).
 *   - Soma minutos, conta tarefas críticas e acha a mais demorada (laço).
 *
 * Saída: frases com template literal e relatório com console.table.
 *
 * Pseudocódigo:
 *   1. Ao clicar no botão, ler o limite de urgência (prompt) e validar.
 *   2. Para cada tarefa, classificar pelo prazo:
 *   3.    dias < 0 -> Atrasada; dias === 0 -> Vence hoje;
 *   4.    dias <= limite -> Urgente; senão -> Tranquila.
 *   5. Pela categoria da tarefa, escolher uma dica (switch).
 *   6. Percorrer de novo: somar minutos, contar críticas, achar a mais demorada.
 *   7. Mostrar o resumo (frases) e a tabela (console.table).
 *   8. Enquanto não digitar "sair", marcar tarefas como concluídas.
 */

// ---------- Dados ----------
const tarefas = [
    { nome: "Estudar HTML",       categoria: "estudo",   minutos: 90,  diasParaPrazo: -1, concluida: false },
    { nome: "Praticar CSS",       categoria: "estudo",   minutos: 120, diasParaPrazo: 2,  concluida: false },
    { nome: "Estudar JavaScript", categoria: "estudo",   minutos: 150, diasParaPrazo: 10, concluida: false },
    { nome: "Enviar relatório",   categoria: "trabalho", minutos: 45,  diasParaPrazo: 1,  concluida: false },
    { nome: "Lavar roupa",        categoria: "casa",     minutos: 60,  diasParaPrazo: 6,  concluida: false },
    { nome: "Consulta médica",    categoria: "saude",    minutos: 30,  diasParaPrazo: 0,  concluida: false }
];

// ---------- Entrada: limite de urgência ----------
const LIMITE_PADRAO = 3;

function lerLimiteUrgencia() {
    const resposta = prompt("Dentro de quantos dias uma tarefa é urgente? (digite de 1 a 30)");

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

function atualizarTabela() {
    const listaTarefas = document.getElementById("lista-tarefas");

    listaTarefas.innerHTML = "";

    for (const tarefa of tarefas) {
        const linha = document.createElement("tr");

        const colunaTarefa = document.createElement("td");
        colunaTarefa.textContent = tarefa.nome;

        const colunaStatus = document.createElement("td");
        colunaStatus.textContent = tarefa.concluida ? "Concluída" : "Pendente";

        linha.appendChild(colunaTarefa);
        linha.appendChild(colunaStatus);

        listaTarefas.appendChild(linha);
    }
}

// Todo o fluxo roda dentro desta função, só quando o botão é clicado
function analisarTarefas() {
    // Cada análise começa do zero
    for (const tarefa of tarefas) {
        tarefa.concluida = false;
    }

    const limiteUrgencia = lerLimiteUrgencia();

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
    console.log(`Limite de urgência: ${limiteUrgencia} dia(s)`);
    console.log(`Tarefas cadastradas: ${tarefas.length}`);
    console.log(`Tarefas atrasadas, que vencem hoje ou urgentes: ${totalCriticas}`);
    console.log(`Tempo total estimado: ${totalMinutos} minutos (média de ${mediaMinutos.toFixed(1)} por tarefa)`);
    console.log(`Tarefa mais demorada: ${tarefaMaisLonga.nome} (${tarefaMaisLonga.minutos} minutos)`);
    console.table(relatorio);

    // ---------- Registro de tarefas concluídas (while) ----------
    let totalConcluidas = 0;
    let minutosConcluidos = 0;

    let nomeDigitado = prompt('Digite o nome de uma tarefa que você concluiu (ou "sair" para encerrar):');

    // null (Cancelar) também encerra, para o laço não travar.
    while (nomeDigitado !== null && nomeDigitado.trim().toLowerCase() !== "sair") {
        const nomeBuscado = nomeDigitado.trim().toLowerCase();
        let encontrada = false;

        for (const tarefa of tarefas) {
            if (tarefa.nome.toLowerCase() === nomeBuscado) {
                encontrada = true;

                if (tarefa.concluida === true) {
                    console.log(`"${tarefa.nome}" já estava marcada como concluída.`);
                } else {
                    tarefa.concluida = true;
                    totalConcluidas++;
                    minutosConcluidos += tarefa.minutos;
                    console.log(`Concluída: ${tarefa.nome} (${tarefa.minutos} minutos).`);
                }
            }
        }

        if (encontrada === false) {
            console.log(`Nenhuma tarefa encontrada com o nome "${nomeDigitado}".`);
        }

        // A condição do while é atualizada aqui dentro, a cada volta.
        nomeDigitado = prompt('Digite outra tarefa concluída (ou "sair" para encerrar):');
    }

    console.log(`Você concluiu ${totalConcluidas} tarefa(s), somando ${minutosConcluidos} minutos.`);
    console.table(tarefas);

    atualizarTabela();
}

// ---------- Ligação com o botão da página ----------
const botaoAnalisar = document.getElementById("botao-analisar");
botaoAnalisar.addEventListener("click", analisarTarefas);

atualizarTabela();
