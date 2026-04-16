const API_BASE = '/sqlite_long';
let currentTable = '';
let currentPage = 1;
const pageSize = 10;
let totalRows = 0;

document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    loadOverview();
    loadTableList();
});

function initEventListeners() {
    document.querySelector('.overview-item').addEventListener('click', () => {
        showOverview();
    });

    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadTableData(currentTable, currentPage);
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        const totalPages = Math.ceil(totalRows / pageSize);
        if (currentPage < totalPages) {
            currentPage++;
            loadTableData(currentTable, currentPage);
        }
    });
}

function showLoading() {
    document.getElementById('loading').classList.add('show');
}

function hideLoading() {
    document.getElementById('loading').classList.remove('show');
}

function fetchApi(action, params = {}) {
    return Auth.fetchApi(API_BASE, action, params);
}

async function loadOverview() {
    showLoading();
    try {
        const data = await fetchApi('overview');
        
        document.getElementById('dbPath').textContent = data.database_path;
        document.getElementById('dbSize').textContent = formatSize(data.database_size);
        document.getElementById('tableCount').textContent = data.table_count;
        
        const grid = document.getElementById('tablesGrid');
        grid.innerHTML = data.tables.map(table => `
            <div class="table-card" onclick="showTable('${table.name}')">
                <div class="name">${table.name}</div>
                <div class="info">${table.row_count} 条记录 · ${table.column_count} 个字段</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('加载概览失败:', error);
    } finally {
        hideLoading();
    }
}

async function loadTableList() {
    try {
        const data = await fetchApi('tableList', { page: 1, page_size: 100 });
        
        const list = document.getElementById('tablesList');
        list.innerHTML = data.tables.map(table => `
            <div class="table-item" data-table="${table.name}" onclick="showTable('${table.name}')">
                <span class="table-name">${table.name}</span>
                <span class="row-count">${table.row_count}</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('加载表列表失败:', error);
    }
}

function showOverview() {
    document.querySelectorAll('.sidebar-item, .table-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector('.overview-item').classList.add('active');
    
    document.querySelectorAll('.panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById('overviewPanel').classList.add('active');
    
    loadOverview();
}

function showTable(tableName) {
    currentTable = tableName;
    currentPage = 1;
    
    document.querySelectorAll('.sidebar-item, .table-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const tableItem = document.querySelector(`.table-item[data-table="${tableName}"]`);
    if (tableItem) {
        tableItem.classList.add('active');
    }
    
    document.querySelectorAll('.panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById('tablePanel').classList.add('active');
    
    loadTableData(tableName, currentPage);
}

async function loadTableData(tableName, page) {
    showLoading();
    try {
        const data = await fetchApi('tableData', {
            table_name: tableName,
            page: page,
            page_size: pageSize
        });
        
        totalRows = data.total || 0;
        const columns = data.columns || [];
        const rows = data.rows || [];
        
        document.getElementById('currentTableName').textContent = tableName;
        document.getElementById('tableRowCount').textContent = `总条数: ${totalRows}`;
        document.getElementById('totalRows').textContent = totalRows;
        
        const thead = document.getElementById('tableHead');
        if (columns.length === 0) {
            thead.innerHTML = '<tr><th>无字段</th></tr>';
        } else {
            thead.innerHTML = `<tr>${columns.map(col => `<th>${col}</th>`).join('')}</tr>`;
        }
        
        const tbody = document.getElementById('tableBody');
        if (rows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${columns.length || 1}" style="text-align: center; color: #999;">暂无数据</td></tr>`;
        } else {
            tbody.innerHTML = rows.map(row => {
                return `<tr>${columns.map(col => {
                    let value = row[col];
                    if (value === null || value === undefined) {
                        value = '<span style="color: #999;">NULL</span>';
                    } else if (typeof value === 'object') {
                        value = JSON.stringify(value);
                    }
                    return `<td title="${value}">${value}</td>`;
                }).join('')}</tr>`;
            }).join('');
        }
        
        const totalPages = Math.ceil(totalRows / pageSize) || 1;
        renderPagination(page, totalPages);
        
    } catch (error) {
        console.error('加载表数据失败:', error);
        alert('加载表数据失败: ' + error.message);
    } finally {
        hideLoading();
    }
}

function renderPagination(currentPage, totalPages) {
    document.getElementById('prevPage').disabled = currentPage <= 1;
    document.getElementById('nextPage').disabled = currentPage >= totalPages;
    
    const pageNumbers = document.getElementById('pageNumbers');
    let html = '';
    
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    if (startPage > 1) {
        html += `<div class="page-number" onclick="goToPage(1)">1</div>`;
        if (startPage > 2) {
            html += `<div class="page-ellipsis">...</div>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            html += `<div class="page-number active">${i}</div>`;
        } else {
            html += `<div class="page-number" onclick="goToPage(${i})">${i}</div>`;
        }
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<div class="page-ellipsis">...</div>`;
        }
        html += `<div class="page-number" onclick="goToPage(${totalPages})">${totalPages}</div>`;
    }
    
    pageNumbers.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    loadTableData(currentTable, currentPage);
}

function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
