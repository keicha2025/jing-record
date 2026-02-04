function doGet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const getSheetData = (name) => {
      const sheet = ss.getSheetByName(name);
      return sheet ? sheet.getDataRange().getValues() : [];
    };

    const categories = getSheetData("Categories").slice(1).map(r => ({id: r[0], name: r[1], icon: r[2], type: r[3]}));
    const friends = getSheetData("Friends").slice(1).map(r => r[1]);
    const paymentMethods = getSheetData("PaymentMethods").slice(1).map(r => ({id: r[0], name: r[1], order: r[2]})); // 讀取新分頁
    const config = {};
    getSheetData("Config").slice(1).forEach(r => { config[r[0]] = r[1]; });

    const transData = getSheetData("Transactions").slice(1);
    const now = new Date();
    
    let monthlyLifeTotal = 0;   
    let allOneTimeTotal = 0;    
    let allLifeTotal = 0;       
    let netDebt = 0; 

    const transactions = transData.map((r, index) => {
      if (!r[0]) return null;
      const spendDate = new Date(r[2]);
      const type = r[3];
      const amountJPY = parseFloat(r[6] || 0);
      const isOneTime = r[9] === true;
      const personalShare = parseFloat(r[11] || 0);
      const debtAmount = parseFloat(r[12] || 0);
      const originalCurrency = r[16] || "JPY"; // 讀取第 17 欄

      if (type === '支出') {
        netDebt += debtAmount; 
        if (isOneTime) allOneTimeTotal += personalShare;
        else {
          allLifeTotal += personalShare;
          if (spendDate.getMonth() === now.getMonth() && spendDate.getFullYear() === now.getFullYear()) {
            monthlyLifeTotal += personalShare;
          }
        }
      } else if (type === '收款') {
        netDebt -= amountJPY; 
      }

      return {
        row: index + 2, id: r[0], spendDate: Utilities.formatDate(spendDate, "GMT+9", "yyyy/MM/dd HH:mm"),
        type, name: r[4], categoryId: r[5], amountJPY, amountTWD: parseFloat(r[7] || 0), paymentMethod: r[8],
        isOneTime, friendName: r[14], note: r[13], personalShare, payer: r[15] || "我", debtAmount,
        originalCurrency: originalCurrency // 回傳原始幣別
      };
    }).filter(t => t !== null).reverse();

    const output = { 
      categories, friends, paymentMethods, config, // 增加回傳支付方式
      transactions: transactions.slice(0, 150),
      stats: { monthlyLifeTotal, allOneTimeTotal, allLifeTotal, totalInvestment: allLifeTotal + allOneTimeTotal, debtTotal: netDebt }
    };

    return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// doPost 保持不變即可

// doPost 保持不變，它只負責寫入前端算好的 debtAmount

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 【新增】處理系統設定更新 (匯率、使用者名稱)
    if (params.action === 'updateConfig') {
      const configSheet = ss.getSheetByName("Config");
      const data = configSheet.getDataRange().getValues();
      
      if (params.fx_rate) {
        configSheet.getRange(2, 2).setValue(params.fx_rate); // 假設 fx_rate 在第二行
      }
      if (params.user_name) {
        configSheet.getRange(3, 2).setValue(params.user_name); // 假設 user_name 在第三行
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

    // 原有的刪除邏輯
    const transSheet = ss.getSheetByName("Transactions");
    if (params.action === 'delete' && params.row) {
      transSheet.deleteRow(params.row);
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

    // 處理朋友名單更新
    if (params.payer && params.payer !== '我') saveFriend(ss, params.payer);
    if (params.friendName) params.friendName.split(', ').forEach(name => saveFriend(ss, name));

const rowData = [
      params.id || "tx_" + new Date().getTime(),
      new Date(),
      new Date(params.spendDate),
      params.type,
      params.name,
      params.categoryId,
      params.amountJPY,
      params.amountTWD,
      params.paymentMethod,
      params.isOneTime,
      params.isSplit,
      params.personalShare,
      params.debtAmount,
      params.note,
      params.friendName || "",
      params.payer || "我", // 加上逗號
      params.currency // 第 17 欄：原始幣別
    ];

    if (params.action === 'edit' && params.row) {
      // 這裡的 16 要改為 17
      transSheet.getRange(params.row, 1, 1, 17).setValues([rowData]);
    } else {
      transSheet.appendRow(rowData);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function saveFriend(ss, name) {
  const friendSheet = ss.getSheetByName("Friends");
  const data = friendSheet.getDataRange().getValues();
  const currentFriends = data.map(r => r[1]);
  if (name && !currentFriends.includes(name)) {
    friendSheet.appendRow(["fr_" + new Date().getTime(), name]);
  }
}