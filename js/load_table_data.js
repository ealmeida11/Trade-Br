// Script para carregar dados dinâmicos nas tabelas do dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Guardar dados em cache para não precisar recarregar ao mudar filtros
    const dataCache = {};
    let currentFilter = 'participation'; // Inicializa com o filtro de participação
    let currentView = 'exp-monthly'; // Inicializa com exportação mensal
    
    // Adiciona event listeners aos botões de filtro (Passo 1)
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', function() {
            // Remove classe ativa de todos os botões de filtro
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Adiciona classe ativa ao botão clicado
            this.classList.add('active');
            
            // Atualiza filtro atual
            currentFilter = this.getAttribute('data-filter');
            
            // Mostra o passo 2 (escolha de tabela)
            document.getElementById('step2').classList.remove('hidden');
            
            // Se uma visualização já estiver selecionada, atualiza os dados
            if (currentView) {
                showView(currentView);
            }
        });
    });
    
    // Adiciona event listeners aos botões de visualização (Passo 2)
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function() {
            // Remove classe ativa de todos os botões
            document.querySelectorAll('.btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Adiciona classe ativa ao botão clicado
            this.classList.add('active');
            
            // Obtém o ID da visualização
            const viewId = this.getAttribute('data-view');
            
            // Atualiza a visualização atual e mostra os dados
            currentView = viewId;
            showView(viewId);
        });
    });
    
    // Função para mostrar uma visualização específica
    function showView(viewId) {
        // Verifica se um filtro foi selecionado
        if (!currentFilter) {
            alert('Por favor, escolha primeiro como classificar os produtos');
            return;
        }
        
        // Mostra o container de dados
        document.getElementById('data-container').classList.remove('hidden');
        
        // Esconde todas as visualizações
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Mostra a visualização selecionada
        const viewElement = document.getElementById(viewId);
        if (viewElement) {
            viewElement.classList.add('active');
        }
        
        // Atualiza a informação de data
        updateDateInfo(viewId);
        
        // Carrega os dados para esta visualização
        loadTableData(viewId);
    }
    
    // Função para carregar dados da tabela
    function loadTableData(viewType) {
        // Se os dados já estiverem em cache, use-os
        if (dataCache[viewType]) {
            updateTable(viewType, dataCache[viewType], currentFilter);
            return;
        }
        
        // Mostra indicador de carregamento
        const tableContainer = document.getElementById(viewType);
        if (tableContainer) {
            const loadingElement = tableContainer.querySelector('.loading');
            if (loadingElement) {
                loadingElement.style.display = 'block';
            }
        }
        
        fetch(`dashboard_data/${viewType.replace('-', '_')}.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Dados não encontrados');
                }
                return response.json();
            })
            .then(data => {
                // Armazena dados em cache
                dataCache[viewType] = data;
                // Atualiza tabela com os dados
                updateTable(viewType, data, currentFilter);
            })
            .catch(error => {
                console.error('Erro ao carregar dados:', error);
                // Esconde indicador de carregamento
                if (tableContainer) {
                    const loadingElement = tableContainer.querySelector('.loading');
                    if (loadingElement) {
                        loadingElement.style.display = 'none';
                    }
                }
            });
    }
    
    // Função para atualizar a informação de data com base na visualização
    function updateDateInfo(viewId) {
        const dateInfo = document.getElementById('date-info');
        if (!dateInfo) return;
        
        const currentYear = new Date().getFullYear();
        const month = 'Abril';
        
        if (viewId.includes('monthly')) {
            dateInfo.textContent = `Dados de ${month}/${currentYear}`;
        } else if (viewId.includes('ytd')) {
            dateInfo.textContent = `Dados Acumulados de Janeiro a ${month}/${currentYear}`;
        } else if (viewId.includes('12m')) {
            dateInfo.textContent = `Dados Acumulados de Maio/${currentYear-1} a ${month}/${currentYear}`;
        }
    }
    
    // Adiciona função de exportação aos botões de download
    document.querySelectorAll('.download-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            // Encontra o ID da tab atual
            const tabContent = this.closest('.tab-content');
            if (tabContent) {
                exportTable(tabContent.id, 'csv');
            }
        });
    });
    
    // Configura a seleção padrão (Maiores Participações e Exportação Mensal)
    function setDefaultSelection() {
        // Ativa o filtro "Maiores Participações"
        const participationBtn = document.querySelector('.filter-btn[data-filter="participation"]');
        if (participationBtn) {
            participationBtn.classList.add('active');
        }
        
        // Mostra o passo 2
        document.getElementById('step2').classList.remove('hidden');
        
        // Ativa o botão "Exportação Mensal"
        const expMonthlyBtn = document.querySelector('.btn[data-view="exp-monthly"]');
        if (expMonthlyBtn) {
            expMonthlyBtn.classList.add('active');
        }
        
        // Carrega e exibe os dados
        showView('exp-monthly');
    }
    
    // Executa a configuração padrão ao carregar a página
    setDefaultSelection();
});

// Função para atualizar a tabela com os dados
function updateTable(viewType, data, filterType) {
    // Obtém o elemento da tabela
    const tableContainer = document.getElementById(viewType);
    if (!tableContainer) return;
    
    const tableBody = tableContainer.querySelector('table tbody');
    if (!tableBody) return;
    
    // Esconde indicador de carregamento
    const loadingElement = tableContainer.querySelector('.loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    
    // Limpa o conteúdo atual
    tableBody.innerHTML = '';
    
    // Define ordem dos setores para garantir consistência
    const sectorOrder = [
        'A - Agropecuária',
        'B - Indústria Extrativa',
        'C - Indústria de Transformação'
    ];
    
    // Ano atual e anterior
    const year = new Date().getFullYear();
    const prevYear = year - 1;
    
    // Adiciona linhas para cada setor e seus produtos filtrados
    sectorOrder.forEach(sectorKey => {
        if (!data[sectorKey]) return;
        
        const sectorData = data[sectorKey].sector_data;
        let productsData = [...data[sectorKey].products_data]; // Cria uma cópia para não modificar os dados originais
        
        // Filtra os produtos com base no critério selecionado
        if (filterType === 'participation') {
            // Ordenar por participação no ano atual (decrescente)
            productsData.sort((a, b) => b[`Part_${year}`] - a[`Part_${year}`]);
        } else if (filterType === 'increase') {
            // Ordenar por variação percentual (decrescente)
            productsData.sort((a, b) => b.Var_Pct - a.Var_Pct);
        } else if (filterType === 'decrease') {
            // Ordenar por variação percentual (crescente)
            productsData.sort((a, b) => a.Var_Pct - b.Var_Pct);
        }
        
        // Limita a 5 produtos por setor
        productsData = productsData.slice(0, 5);
        
        // Adiciona linha do setor
        const sectorRow = document.createElement('tr');
        sectorRow.className = 'sector-row';
        
        // Verifica se é view de 12 meses ou não para determinar as colunas
        if (viewType.includes('12m')) {
            sectorRow.innerHTML = `
                <td>${sectorData.Produto}</td>
                <td>${formatNumber(sectorData[`Valor_${year}`])}</td>
                <td>${formatNumber(sectorData[`Valor_${prevYear}`])}</td>
                <td class="${sectorData.Var_Pct >= 0 ? 'positive' : 'negative'}">${formatNumber(sectorData.Var_Pct, true)}</td>
                <td>${formatNumber(sectorData[`Part_${year}`], false, 2)}</td>
                <td>${formatNumber(sectorData[`Part_${prevYear}`], false, 2)}</td>
            `;
        } else {
            sectorRow.innerHTML = `
                <td>${sectorData.Produto}</td>
                <td>${formatNumber(sectorData[`Valor_${year}`])}</td>
                <td>${formatNumber(sectorData[`MD_${year}`])}</td>
                <td>${formatNumber(sectorData[`Valor_${prevYear}`])}</td>
                <td>${formatNumber(sectorData[`MD_${prevYear}`])}</td>
                <td class="${sectorData.Var_Pct >= 0 ? 'positive' : 'negative'}">${formatNumber(sectorData.Var_Pct, true)}</td>
                <td>${formatNumber(sectorData[`Part_${year}`], false, 2)}</td>
                <td>${formatNumber(sectorData[`Part_${prevYear}`], false, 2)}</td>
            `;
        }
        
        tableBody.appendChild(sectorRow);
        
        // Adiciona linhas dos produtos filtrados
        productsData.forEach(product => {
            const productRow = document.createElement('tr');
            
            if (viewType.includes('12m')) {
                productRow.innerHTML = `
                    <td>&nbsp;&nbsp;&nbsp;${product.Produto}</td>
                    <td>${formatNumber(product[`Valor_${year}`])}</td>
                    <td>${formatNumber(product[`Valor_${prevYear}`])}</td>
                    <td class="${product.Var_Pct >= 0 ? 'positive' : 'negative'}">${formatNumber(product.Var_Pct, true)}</td>
                    <td>${formatNumber(product[`Part_${year}`], false, 2)}</td>
                    <td>${formatNumber(product[`Part_${prevYear}`], false, 2)}</td>
                `;
            } else {
                productRow.innerHTML = `
                    <td>&nbsp;&nbsp;&nbsp;${product.Produto}</td>
                    <td>${formatNumber(product[`Valor_${year}`])}</td>
                    <td>${formatNumber(product[`MD_${year}`])}</td>
                    <td>${formatNumber(product[`Valor_${prevYear}`])}</td>
                    <td>${formatNumber(product[`MD_${prevYear}`])}</td>
                    <td class="${product.Var_Pct >= 0 ? 'positive' : 'negative'}">${formatNumber(product.Var_Pct, true)}</td>
                    <td>${formatNumber(product[`Part_${year}`], false, 2)}</td>
                    <td>${formatNumber(product[`Part_${prevYear}`], false, 2)}</td>
                `;
            }
            
            tableBody.appendChild(productRow);
        });
    });
    
    // Atualiza o título conforme a visualização
    updateViewTitle(viewType);
}

// Função para formatar números
function formatNumber(value, isPercentage = false, decimals = 2) {
    if (value === undefined || value === null) return '-';
    
    // Formata como percentual com sinal se for percentual
    if (isPercentage) {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(decimals)}`;
    }
    
    // Formato normal com separador de milhares
    return value.toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// Função para atualizar o título da visualização
function updateViewTitle(viewType) {
    const currentYear = new Date().getFullYear();
    const titleElement = document.querySelector(`#${viewType} h2`);
    if (!titleElement) return;
    
    const month = 'Abril';
    
    let title = '';
    if (viewType === 'exp-monthly') {
        title = `Exportações de ${month}/${currentYear} - US$ Milhões`;
    } else if (viewType === 'exp-ytd') {
        title = `Exportações Acumuladas Jan-${month}/${currentYear} - US$ Milhões`;
    } else if (viewType === 'exp-12m') {
        title = `Exportações Acumuladas 12 meses (Mai/${currentYear-1}-${month}/${currentYear}) - US$ Milhões`;
    } else if (viewType === 'imp-monthly') {
        title = `Importações de ${month}/${currentYear} - US$ Milhões`;
    } else if (viewType === 'imp-ytd') {
        title = `Importações Acumuladas Jan-${month}/${currentYear} - US$ Milhões`;
    } else if (viewType === 'imp-12m') {
        title = `Importações Acumuladas 12 meses (Mai/${currentYear-1}-${month}/${currentYear}) - US$ Milhões`;
    }
    
    titleElement.textContent = title;
}

// Função para exportar tabela para Excel ou CSV
function exportTable(viewType, format = 'csv') {
    const table = document.querySelector(`#${viewType} table`);
    if (!table) return;
    
    const title = document.querySelector(`#${viewType} h2`).textContent;
    let fileName = title.replace(/\s+/g, '_').replace(/\//g, '-');
    
    if (format === 'csv') {
        const rows = [];
        // Cabeçalho
        const headers = [];
        table.querySelectorAll('thead th').forEach(th => {
            headers.push(`"${th.textContent.replace(/\n/g, ' ')}"`);
        });
        rows.push(headers.join(','));
        
        // Dados
        table.querySelectorAll('tbody tr').forEach(tr => {
            const rowData = [];
            tr.querySelectorAll('td').forEach(td => {
                rowData.push(`"${td.textContent.replace(/\n/g, ' ')}"`);
            });
            rows.push(rowData.join(','));
        });
        
        // Gera CSV
        const csv = rows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        
        // Download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}.csv`;
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
} 