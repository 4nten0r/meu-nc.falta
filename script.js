const API_URL = "https://script.google.com/macros/s/AKfycbzmlnKgbkyE7Ij9Ez6k7z4iw5fW7GqK6oDOcIoy4VVqr5M-UJ9ZGnz5fLk2ZP0yKSvx/exec";

let listaGeral = []; 
let estado = { filial: '', motorista: '', idOcorrencia: null };

window.onload = init;

async function init() {
  console.log("Iniciando carregamento...");
  try {
    const resp = await fetch(API_URL);
    if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
    
    const data = await resp.json();
    
    // Mapeamento pelas novas colunas da "base faltas"
    listaGeral = data.slice(1).map((row, index) => ({
      ID: index,           // Criamos um ID único baseado na linha
      MOTORISTA: row[1],   // Coluna B
      PEDIDOS: row[3],     // Coluna D
      FILIAL: row[4],      // Coluna E
      DESCRIÇÃO: row[12]   // Coluna M
    }));
    
    renderFiliais();
  } catch (e) {
    alert("Erro na conexão ao Google Sheets. Verifique a URL do Web App.");
  }
}

function goTo(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.add('hidden');
    s.classList.remove('active');
  });
  
  const target = document.getElementById(id);
  target.classList.remove('hidden');
  target.classList.add('active'); 
}

function renderFiliais() {
  const filiais = [...new Set(listaGeral.map(d => d.FILIAL).filter(f => f))];
  document.getElementById('list-filiais').innerHTML = filiais.map(f => 
    `<button onclick="selFilial('${String(f).trim()}')" class="w-full p-4 border-2 border-[#C2410C] text-[#C2410C] rounded-xl font-bold mb-2 hover:bg-orange-50 transition">${f}</button>`
  ).join('');
}

function selFilial(f) { 
  estado.filial = f; 
  renderMotoristas(); 
  goTo('motorista'); 
}

function renderMotoristas() {
  const filtrados = listaGeral.filter(d => String(d.FILIAL).trim() === String(estado.filial));
  const mots = [...new Set(filtrados.map(d => d.MOTORISTA).filter(m => m))];
  
  const container = document.getElementById('list-motoristas');
  if (mots.length === 0) {
    container.innerHTML = "<p class='text-gray-500'>Nenhum motorista encontrado.</p>";
    return;
  }

  container.innerHTML = mots.map(m => 
    `<button onclick="selMot('${String(m).trim()}')" class="w-full p-4 border rounded-xl mb-2 hover:border-[#C2410C] shadow-sm">${m}</button>`
  ).join('');
}

function selMot(m) { 
  estado.motorista = m; 
  renderOcorrencias(); // Salta a etapa dos meses e vai direto para ocorrências
  goTo('ocorrencias'); 
}

function renderOcorrencias() {
  const lista = listaGeral.filter(d => String(d.MOTORISTA).trim() === String(estado.motorista));
  const container = document.getElementById('list-ocorrencias');

  if (lista.length === 0) {
    container.innerHTML = "<p class='p-4 text-gray-500'>Nenhuma ocorrência encontrada.</p>";
    return;
  }

  container.innerHTML = lista.map(d => {
    let desc = d.DESCRIÇÃO ? String(d.DESCRIÇÃO) : "Sem descrição na planilha";
    return `
    <div onclick="abrirForm(${d.ID})" class="p-4 border border-gray-200 rounded-xl shadow-sm mb-3 cursor-pointer bg-white hover:border-[#C2410C] transition-all">
      <div class="mb-2 w-full overflow-hidden">
        <span class="text-xs font-bold bg-orange-50 text-[#C2410C] px-2 py-1 rounded block truncate w-full">PEDIDOS: ${d.PEDIDOS}</span>
      </div>
      <p class="text-sm text-gray-700 whitespace-pre-line line-clamp-3">${desc}</p>
      <p class="text-xs text-orange-600 mt-3 font-bold">Preencher Tratativa →</p>
    </div>
    `;
  }).join('');
}

function abrirForm(id) { 
  estado.idOcorrencia = id; 
  const ocorrencia = listaGeral.find(d => d.ID === id);
  const caixaDescricao = document.getElementById('desc-ocorrencia');

  if (ocorrencia && ocorrencia.DESCRIÇÃO) {
    caixaDescricao.innerText = ocorrencia.DESCRIÇÃO; 
    caixaDescricao.className = "p-4 bg-orange-50 border border-orange-200 rounded-lg text-sm mb-4 whitespace-pre-line overflow-y-auto max-h-40";
  } else {
    caixaDescricao.innerText = "Sem descrição detalhada.";
  }

  goTo('form'); 
}

async function salvar() {
  const btn = document.querySelector('button[onclick="salvar()"]');
  btn.innerText = "A guardar...";
  btn.disabled = true;

  // Usa o ID para recuperar a string completa dos pedidos antes de enviar
  const ocorrencia = listaGeral.find(d => d.ID === estado.idOcorrencia);

  const payload = {
    pedido: ocorrencia.PEDIDOS, 
    analise: document.getElementById('inp-analise').value,
    acoes: document.getElementById('inp-acoes').value,
    preventiva: document.getElementById('inp-preventiva').value,
    responsavel: document.getElementById('inp-resp').value,
    prazo: document.getElementById('inp-prazo').value,
    realizado: document.getElementById('inp-realizado').value,
    status: document.getElementById('inp-status').value,
    periodo: document.getElementById('inp-periodo').value
  };

  try {
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    alert("Tratativa guardada com sucesso!");
    goTo('ocorrencias'); 
  } catch (e) {
    alert("Erro ao enviar. Verifique a conexão.");
  } finally {
    btn.innerText = "Salvar Tratativa";
    btn.disabled = false;
  }
}
