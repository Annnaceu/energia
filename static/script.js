const API_URL = "http://127.0.0.1:5000/api";
let graficoConsumo, graficoComparacao;
let limiteConsumo = 0;
let periodoLimite = "diario";
let limiteDefinido = false;

// Função para obter o limite de consumo
async function obterLimite() {
  const response = await fetch(`${API_URL}/limite`);
  const data = await response.json();
  if (data.limite !== null) {
    limiteConsumo = data.limite;
    limiteDefinido = true;
    document.getElementById("limite-definido").innerHTML = `Limite de Consumo: ${limiteConsumo} kWh (${periodoLimite})`;
    carregarDados();
  } else {
    document.getElementById("limite-definido").innerHTML = "Nenhum limite definido ainda.";
  }
}

// Função para alterar o limite de consumo
document.getElementById("alterar-limite").addEventListener("click", () => {
  Swal.fire({
    title: 'Alterar Limite',
    html: `<input type="number" id="novo-limite" class="swal2-input" placeholder="Novo limite">`,
    confirmButtonText: 'Alterar',
    showCancelButton: true,
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const novoLimite = document.getElementById("novo-limite").value;
      if (novoLimite) {
        atualizarLimite(novoLimite);
      }
    }
  });
});

// Função para atualizar o limite de consumo no backend
async function atualizarLimite(novoLimite) {
  const response = await fetch(`${API_URL}/limite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ limite: novoLimite, periodo: periodoLimite }),
  });
  if (response.ok) {
    limiteConsumo = novoLimite;
    limiteDefinido = true;
    document.getElementById("limite-definido").innerHTML = `Limite de Consumo: ${limiteConsumo} kWh (${periodoLimite})`;
    carregarDados();
  } else {
    Swal.fire('Erro', 'Não foi possível atualizar o limite.', 'error');
  }
}

// Função para carregar dados de consumo
async function carregarDados() {
  const response = await fetch(`${API_URL}/consumo`);
  const dados = await response.json();
  const datas = [];
  const consumos = [];
  dados.forEach(item => {
    datas.push(item.data);
    consumos.push(item.consumo);
  });

  atualizarGraficoConsumo(datas, consumos);
  atualizarGraficoComparacao(datas, consumos);
  gerarAnalise(consumos);
}

// Função para atualizar gráfico de consumo
function atualizarGraficoConsumo(labels, dados) {
  if (graficoConsumo) graficoConsumo.destroy();
  const ctx = document.getElementById("grafico-consumo").getContext("2d");
  graficoConsumo = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Consumo Diário (kWh)",
        data: dados,
        borderColor: "rgba(75, 192, 192, 1)", // Cor mais suave para o gráfico de consumo
        borderWidth: 2,
        fill: false,
      }]
    }
  });
}

// Função para atualizar gráfico de comparação
function atualizarGraficoComparacao(labels, dados) {
  if (graficoComparacao) graficoComparacao.destroy();
  const ctx = document.getElementById("grafico-comparacao").getContext("2d");
  graficoComparacao = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Consumo Atual (kWh)",
        data: dados,
        backgroundColor: "rgba(75, 192, 192, 0.2)", // Cor suave de preenchimento para consumo atual
        borderColor: "rgba(75, 192, 192, 1)", 
        borderWidth: 2,
      },
      {
        label: "Limite",
        data: Array(labels.length).fill(limiteConsumo),
        backgroundColor: "rgba(153, 102, 255, 0.2)", // Cor mais suave para limite
        borderColor: "rgba(153, 102, 255, 1)",
        borderWidth: 2,
      }]
    }
  });
}

// Função para gerar análise do consumo
function gerarAnalise(consumos) {
  const total = consumos.reduce((acc, val) => acc + val, 0);
  const media = total / consumos.length;
  let analiseTexto = `<p><strong>Consumo Total:</strong> ${total.toFixed(2)} kWh</p>`;
  analiseTexto += `<p><strong>Média de Consumo:</strong> ${media.toFixed(2)} kWh/dia</p>`;

  if (total > limiteConsumo) {
    analiseTexto += `<p><strong>Atenção:</strong> Seu consumo ultrapassou o limite de ${limiteConsumo} kWh. Considere adotar dicas para reduzir o consumo.</p>`;
  } else {
    analiseTexto += `<p><strong>Ótimo!</strong> Você está dentro do limite de consumo estabelecido.</p>`;
  }

  document.getElementById("analise-detalhada").innerHTML = analiseTexto;
}

// Função para alterar tipo de gráfico
function alterarTipoGrafico(tipo) {
  graficoConsumo.config.type = tipo;
  graficoConsumo.update();
  graficoComparacao.config.type = tipo;
  graficoComparacao.update();
}

// Função para registrar consumo manual
document.getElementById("registro-consumo-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const consumo = document.getElementById("consumo").value;
  if (!consumo) return;

  await fetch(`${API_URL}/consumo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ consumo: consumo }),
  });
  Swal.fire('Sucesso', 'Consumo registrado com sucesso!', 'success');
  carregarDados();
});

// Função para o efeito de iluminação nas bordas com o cursor
const raioSeguinte = document.createElement('div');
raioSeguinte.id = 'raio-seguindo';
document.body.appendChild(raioSeguinte);

// Estilos do efeito de raio
raioSeguinte.style.position = 'absolute';
raioSeguinte.style.border = '1px solid rgba(255, 255, 255, 0.8)';
raioSeguinte.style.background = 'radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 60%)';
raioSeguinte.style.borderRadius = '50%';
raioSeguinte.style.pointerEvents = 'none';
raioSeguinte.style.transition = 'all 0.1s ease-out'; // Transição suave

// Adiciona o movimento do raio baseado no cursor
document.body.addEventListener('mousemove', (e) => {
  const largura = window.innerWidth;
  const altura = window.innerHeight;
  const margem = 50; // Área sensível nos cantos da tela
  const raioTamanho = 100; // Tamanho inicial do raio

  // Calculando as distâncias do cursor aos cantos
  const distanciaEsquerda = e.clientX;
  const distanciaDireita = largura - e.clientX;
  const distanciaTopo = e.clientY;
  const distanciaFundo = altura - e.clientY;

  // Verifica se o cursor está perto dos cantos
  if (distanciaEsquerda < margem || distanciaDireita < margem || distanciaTopo < margem || distanciaFundo < margem) {
    let raioTamanhoAtual = raioTamanho;

    // Ajusta o tamanho do raio com base na proximidade aos cantos
    if (distanciaEsquerda < margem) {
      raioTamanhoAtual += (margem - distanciaEsquerda);
    }
    if (distanciaDireita < margem) {
      raioTamanhoAtual += (margem - distanciaDireita);
    }
    if (distanciaTopo < margem) {
      raioTamanhoAtual += (margem - distanciaTopo);
    }
    if (distanciaFundo < margem) {
      raioTamanhoAtual += (margem - distanciaFundo);
    }

    // Atualiza a posição e o tamanho do raio
    raioSeguinte.style.left = `${e.clientX - raioTamanhoAtual / 2}px`;
    raioSeguinte.style.top = `${e.clientY - raioTamanhoAtual / 2}px`;
    raioSeguinte.style.width = `${raioTamanhoAtual}px`;
    raioSeguinte.style.height = `${raioTamanhoAtual}px`;
    raioSeguinte.style.opacity = 1;  // O raio se torna visível
  } else {
    raioSeguinte.style.opacity = 0;  // O raio desaparece fora da área sensível
  }
});

// Carrega os dados e o limite inicial
obterLimite();
carregarDados();


