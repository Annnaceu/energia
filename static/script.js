const API_URL = "http://127.0.0.1:5000/api";

// Função para inserir dados de consumo
document.getElementById("consumo-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = document.getElementById("data").value;
  const consumo = parseFloat(document.getElementById("consumo").value);

  const response = await fetch(`${API_URL}/consumo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data, consumo }),
  });

  if (response.ok) {
    alert("Dados inseridos com sucesso!");
    carregarDados(); // Atualizar tabela
    carregarAnalise(); // Atualizar análise
  } else {
    alert("Erro ao inserir dados.");
  }
});

async function carregarDados() {
  const response = await fetch(`${API_URL}/consumo`);
  const dados = await response.json();

  const tabela = document.querySelector("#dados-tabela tbody");
  tabela.innerHTML = "";

  dados.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.data}</td>
      <td>${item.consumo} kWh</td>
    `;
    tabela.appendChild(row);
  });
}

// Função para carregar análise
async function carregarAnalise() {
  const response = await fetch(`${API_URL}/consumo/analise`);
  const analise = await response.json();

  document.getElementById("media-consumo").textContent = analise.media.toFixed(2);
  document.getElementById("pico-consumo").textContent = analise.pico.toFixed(2);
}

// Carregar dados ao iniciar
carregarDados();
carregarAnalise();
