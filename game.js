/* ===== Missão Lua – lógica do jogo (JavaScript puro) ===== */

/* ---------- MÓDULO 1: configuração ---------- */
const ETAPAS = 10;          // acertos líquidos necessários para chegar à Lua
const VIDAS_INICIAIS = 3;
const ACERTOS_PARA_SUBIR = 3;  // acertos seguidos
const ERROS_PARA_DESCER = 2;   // erros seguidos
const SIMBOLO = { soma: "+", subtracao: "−", multiplicacao: "×", divisao: "÷" };

// Faixas por nível (índice 0 = nível 1 ... índice 4 = nível 5)
const FAIXA_SOMA = [[1,10],[1,20],[10,50],[10,99],[100,500]];       // soma e subtração
const FAIXA_MULT = [[[2,5],[1,5]],[[2,9],[2,9]],[[2,12],[2,12]],[[11,15],[2,9]],[[12,25],[3,12]]];
const FAIXA_DIV  = [[[2,5],[1,5]],[[2,9],[2,9]],[[2,12],[2,12]],[[3,12],[10,20]],[[6,15],[10,30]]]; // [divisor],[quociente]

/* ---------- MÓDULO 2: geração das questões ---------- */
function sortear(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Retorna { a, b, op, resposta }. Divisão sempre exata; subtração nunca negativa.
function gerarQuestao(op, nivel) {
  const i = nivel - 1;
  if (op === "soma" || op === "subtracao") {
    let a = sortear(...FAIXA_SOMA[i]);
    let b = sortear(...FAIXA_SOMA[i]);
    if (op === "soma") return { a, b, op, resposta: a + b };
    if (b > a) [a, b] = [b, a];
    return { a, b, op, resposta: a - b };
  }
  if (op === "multiplicacao") {
    const a = sortear(...FAIXA_MULT[i][0]);
    const b = sortear(...FAIXA_MULT[i][1]);
    return { a, b, op, resposta: a * b };
  }
  // divisão: sorteia divisor e quociente e monta o dividendo (garante resto zero)
  const divisor = sortear(...FAIXA_DIV[i][0]);
  const quociente = sortear(...FAIXA_DIV[i][1]);
  return { a: divisor * quociente, b: divisor, op, resposta: quociente };
}

/* ---------- MÓDULO 3: verificação e dica de correção ---------- */
function verificarResposta(questao, valor) {
  return valor === questao.resposta;
}

function dicaDeErro(q) {
  const conta = `${q.a} ${SIMBOLO[q.op]} ${q.b} = ${q.resposta}`;
  const dicas = {
    soma: "Some unidades com unidades, depois dezenas com dezenas.",
    subtracao: `Confira: ${q.resposta} + ${q.b} deve dar ${q.a}.`,
    multiplicacao: `Multiplicar é somar parcelas iguais: ${q.a} repetido ${q.b} vezes.`,
    divisao: `Confira: ${q.resposta} × ${q.b} deve dar ${q.a}.`
  };
  return `Resposta certa: ${conta}. ${dicas[q.op]}`;
}

/* ---------- MÓDULO 4: estado, pontuação e progressão ---------- */
let jogo = {};

function novoJogo(modo) {
  jogo = { modo, nivel: 1, acertosSeguidos: 0, errosSeguidos: 0,
           vidas: VIDAS_INICIAIS, pontos: 0, etapa: 0, questao: null, aguardando: false };
}

// Retorna a mensagem sobre mudança de nível (ou "")
function registrarAcerto() {
  jogo.acertosSeguidos++; jogo.errosSeguidos = 0;
  jogo.etapa++;
  const bonus = jogo.acertosSeguidos >= 3 ? 5 : 0;   // bônus por sequência
  const ganho = 10 * jogo.nivel + bonus;
  jogo.pontos += ganho;
  let msg = `✅ Muito bem! +${ganho} pontos`;
  if (jogo.acertosSeguidos >= ACERTOS_PARA_SUBIR && jogo.nivel < 5) {
    jogo.nivel++; jogo.acertosSeguidos = 0;
    msg += ` · ⬆️ Nível ${jogo.nivel}!`;
  }
  return msg;
}

function registrarErro(q) {
  jogo.errosSeguidos++; jogo.acertosSeguidos = 0;
  jogo.vidas--;
  jogo.etapa = Math.max(0, jogo.etapa - 1);          // foguete recua
  let msg = "❌ Quase! " + dicaDeErro(q);
  if (jogo.errosSeguidos >= ERROS_PARA_DESCER && jogo.nivel > 1) {
    jogo.nivel--; jogo.errosSeguidos = 0;
    msg += ` · ⬇️ Vamos treinar o nível ${jogo.nivel}.`;
  }
  return msg;
}

/* ---------- MÓDULO 5: interface e gamificação ---------- */
const $ = (id) => document.getElementById(id);

function mostrarTela(id) {
  ["tela-inicio", "tela-jogo", "tela-fim"].forEach(t =>
    $(t).classList.toggle("oculto", t !== id));
}

function atualizarPainel() {
  $("pontos").textContent = "⭐ " + jogo.pontos;
  $("nivel").textContent = "Nível " + jogo.nivel;
  $("vidas").textContent = jogo.vidas > 0 ? "❤️".repeat(jogo.vidas) : "💔";
  // o foguete percorre a pista proporcionalmente às etapas concluídas
  $("foguete").style.left = `calc(${jogo.etapa / ETAPAS} * (100% - 2.2rem))`;
  $("barra-progresso").style.width = (jogo.etapa / ETAPAS * 100) + "%";
  $("texto-progresso").textContent = `Etapa ${jogo.etapa} de ${ETAPAS}`;
}

function animar(elemento, classe) {
  elemento.classList.remove(classe);
  void elemento.offsetWidth;            // reinicia a animação
  elemento.classList.add(classe);
}

/* ---------- MÓDULO 6: fluxo do jogo ---------- */
function iniciar(modo) {
  novoJogo(modo);
  mostrarTela("tela-jogo");
  atualizarPainel();
  proximaQuestao();
}

function proximaQuestao() {
  const ops = ["soma", "subtracao", "multiplicacao", "divisao"];
  const op = jogo.modo === "mista" ? ops[sortear(0, 3)] : jogo.modo;
  jogo.questao = gerarQuestao(op, jogo.nivel);
  jogo.aguardando = false;
  $("pergunta").textContent = `${jogo.questao.a} ${SIMBOLO[op]} ${jogo.questao.b} = ?`;
  $("feedback").textContent = "";
  $("feedback").className = "";
  $("resposta").value = "";
  $("resposta").disabled = false;
  $("enviar").disabled = false;
  $("resposta").focus();
}

function responder(evento) {
  evento.preventDefault();
  if (jogo.aguardando) return;
  const texto = $("resposta").value.trim();
  if (texto === "") return;
  jogo.aguardando = true;
  $("resposta").disabled = true;
  $("enviar").disabled = true;

  const acertou = verificarResposta(jogo.questao, Number(texto));
  const fb = $("feedback");
  if (acertou) {
    fb.textContent = registrarAcerto();
    fb.className = "certo";
    animar($("cartao-questao"), "pulo");
  } else {
    fb.textContent = registrarErro(jogo.questao);
    fb.className = "errado";
    animar($("cartao-questao"), "tremer");
  }
  atualizarPainel();

  setTimeout(() => {
    if (jogo.etapa >= ETAPAS) finalizar(true);
    else if (jogo.vidas <= 0) finalizar(false);
    else proximaQuestao();
  }, acertou ? 1100 : 2600);   // erro fica mais tempo na tela para ler a correção
}

function finalizar(venceu) {
  mostrarTela("tela-fim");
  $("fim-icone").textContent = venceu ? "🌕" : "🛰️";
  $("fim-titulo").textContent = venceu ? "Você chegou à Lua!" : "Missão interrompida";
  $("fim-texto").textContent = venceu
    ? `Pontos: ${jogo.pontos} · Vidas restantes: ${jogo.vidas}`
    : `Pontos: ${jogo.pontos}. Revise as dicas e tente de novo!`;
}

/* ---------- Eventos ---------- */
document.querySelectorAll("[data-op]").forEach(botao =>
  botao.addEventListener("click", () => iniciar(botao.dataset.op)));
$("formulario").addEventListener("submit", responder);
$("reiniciar").addEventListener("click", () => mostrarTela("tela-inicio"));
