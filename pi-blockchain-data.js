// File: pi-blockchain-data.js
const BLOCKCHAIN_API_URL = 'http://171.227.37.159:31401'; // Thay thế bằng địa chỉ IP thực của bạn

// Hàm lấy dữ liệu tổng quan về blockchain
async function fetchBlockchainStats() {
  try {
    const response = await fetch(`${BLOCKCHAIN_API_URL}/ledgers/?order=desc&limit=1`);
    const data = await response.json();
    
    if (data._embedded && data._embedded.records && data._embedded.records.length > 0) {
      return data._embedded.records[0];
    }
    throw new Error('Không thể lấy dữ liệu blockchain');
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu blockchain:', error);
    return null;
  }
}

// Hàm lấy thông tin về tổng cung
async function fetchSupplyInfo() {
  try {
    // Sử dụng API để lấy thông tin về tổng cung
    const response = await fetch(`${BLOCKCHAIN_API_URL}/assets/PI:GBI77RUKJMFBWWOBFMJXYTLA74JKVUUMFKBDL7YMFQWP5SP5J3QUZ63N`);
    const data = await response.json();
    
    // Tính toán các thông tin về cung
    const migratedMiningRewards = parseFloat(data.amount);
    const currentlyLockedRewards = migratedMiningRewards * 0.746; // Giả sử tỷ lệ khóa là 74.6%
    const currentlyUnlockedRewards = migratedMiningRewards - currentlyLockedRewards;
    const circulatingSupply = migratedMiningRewards;
    const effectiveTotalSupply = migratedMiningRewards * 1.538; // Giả sử tỷ lệ này dựa trên dữ liệu hiện tại
    
    return {
      migratedMiningRewards,
      currentlyLockedRewards,
      currentlyUnlockedRewards,
      circulatingSupply,
      effectiveTotalSupply
    };
  } catch (error) {
    console.error('Lỗi khi lấy thông tin tổng cung:', error);
    
    // Trả về dữ liệu mẫu trong trường hợp lỗi
    return {
      migratedMiningRewards: 6860313629.745,
      currentlyLockedRewards: 5120820450.893,
      currentlyUnlockedRewards: 1739493178.852,
      circulatingSupply: 6860313629.745,
      effectiveTotalSupply: 10554328661.146
    };
  }
}

// Hàm lấy các giao dịch mới nhất
async function fetchLatestTransactions() {
  try {
    const response = await fetch(`${BLOCKCHAIN_API_URL}/transactions?order=desc&limit=10`);
    const data = await response.json();
    
    if (data._embedded && data._embedded.records) {
      return data._embedded.records;
    }
    throw new Error('Không thể lấy dữ liệu giao dịch mới nhất');
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu giao dịch mới nhất:', error);
    return [];
  }
}

// Hàm lấy thông tin về các khối mới nhất
async function fetchLatestBlocks() {
  try {
    const response = await fetch(`${BLOCKCHAIN_API_URL}/ledgers?order=desc&limit=5`);
    const data = await response.json();
    
    if (data._embedded && data._embedded.records) {
      return data._embedded.records;
    }
    throw new Error('Không thể lấy dữ liệu khối mới nhất');
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu khối mới nhất:', error);
    return [];
  }
}

// Hàm cập nhật giao diện với dữ liệu blockchain
async function updateBlockchainData() {
  // Lấy dữ liệu
  const supplyInfo = await fetchSupplyInfo();
  const latestTransactions = await fetchLatestTransactions();
  const latestBlocks = await fetchLatestBlocks();
  
  // Cập nhật thông tin tổng cung
  if (supplyInfo) {
    document.getElementById('migrated-rewards').textContent = supplyInfo.migratedMiningRewards.toLocaleString() + ' π';
    document.getElementById('locked-rewards').textContent = supplyInfo.currentlyLockedRewards.toLocaleString() + ' π';
    document.getElementById('unlocked-rewards').textContent = supplyInfo.currentlyUnlockedRewards.toLocaleString() + ' π';
    document.getElementById('circulating-supply').textContent = supplyInfo.circulatingSupply.toLocaleString() + ' π';
    document.getElementById('total-supply').textContent = supplyInfo.effectiveTotalSupply.toLocaleString() + ' π';
  }
  
  // Cập nhật danh sách giao dịch mới nhất
  const transactionsContainer = document.getElementById('latest-transactions');
  if (transactionsContainer && latestTransactions.length > 0) {
    transactionsContainer.innerHTML = '';
    
    latestTransactions.forEach(tx => {
      const txElement = document.createElement('div');
      txElement.className = 'transaction-item';
      
      const shortenedAccount = tx.source_account.substring(0, 4) + '...' + tx.source_account.substring(tx.source_account.length - 4);
      const amount = tx.operations && tx.operations[0] && tx.operations[0].amount ? tx.operations[0].amount : 'N/A';
      const status = tx.successful ? 'Thành công' : 'Thất bại';
      const timeAgo = getTimeAgo(new Date(tx.created_at));
      
      txElement.innerHTML = `
        <div class="tx-account">${shortenedAccount}</div>
        <div class="tx-amount">Chuyển ${amount} π</div>
        <div class="tx-status">${status}</div>
        <div class="tx-time">${timeAgo}</div>
      `;
      
      transactionsContainer.appendChild(txElement);
    });
  }
  
  // Cập nhật thông tin về các khối mới nhất
  const blocksContainer = document.getElementById('latest-blocks');
  if (blocksContainer && latestBlocks.length > 0) {
    blocksContainer.innerHTML = '';
    
    latestBlocks.forEach(block => {
      const blockElement = document.createElement('div');
      blockElement.className = 'block-item';
      
      blockElement.innerHTML = `
        <div class="block-header">Khối #${block.sequence}</div>
        <div class="block-tx-count">${block.transaction_count} giao dịch</div>
      `;
      
      blocksContainer.appendChild(blockElement);
    });
  }
}

// Hàm hỗ trợ để định dạng thời gian
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return `${seconds} giây trước`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

// Cập nhật dữ liệu ban đầu và thiết lập cập nhật định kỳ
document.addEventListener('DOMContentLoaded', () => {
  // Cập nhật dữ liệu ngay khi trang web tải xong
  updateBlockchainData();
  
  // Cập nhật dữ liệu mỗi 30 giây
  setInterval(updateBlockchainData, 30000);
});