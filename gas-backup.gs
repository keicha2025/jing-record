function doGet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const getSheetData = (name) => {
      const sheet = ss.getSheetByName(name);
      return sheet ? sheet.getDataRange().getValues() : [];
    };

    const categories = getSheetData("Categories").slice(1).map(r => ({id: r[0], name: r[1], icon: r[2], type: r[3]}));
    const friends = getSheetData("Friends").slice(1).map(r => r[1]);
    const paymentMethods = getSheetData("PaymentMethods").slice(1).map(r => ({id: r[0], name: r[1], order: r[2]})); 
    const projects = getSheetData("Projects").slice(1).map(r => ({
      id: r[0], 
      name: r[1], 
      startDate: r[2] ? Utilities.formatDate(new Date(r[2]), "GMT+9", "yyyy-MM-dd") : "",
      endDate: r[3] ? Utilities.formatDate(new Date(r[3]), "GMT+9", "yyyy-MM-dd") : "",
      status: r[4]
    })); // 【新增】讀取 Projects 分頁

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
      const originalCurrency = r[16] || "JPY"; 
      const projectId = r[17] || ""; // 【新增】讀取第 18 欄 ProjectID

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
        originalCurrency: originalCurrency,
        projectId: projectId // 【新增】回傳 ProjectID
      };
    }).filter(t => t !== null).reverse();

    const output = { 
      categories, friends, paymentMethods, projects, config, // 【新增】回傳 projects
      transactions: transactions.slice(0, 150),
      stats: { monthlyLifeTotal, allOneTimeTotal, allLifeTotal, totalInvestment: allLifeTotal + allOneTimeTotal, debtTotal: netDebt }
    };

    return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 處理系統設定更新
    if (params.action === 'updateConfig') {
      const configSheet = ss.getSheetByName("Config");
      const data = configSheet.getDataRange().getValues();
      
      if (params.fx_rate) {
        configSheet.getRange(2, 2).setValue(params.fx_rate); 
      }
      if (params.user_name) {
        configSheet.getRange(3, 2).setValue(params.user_name); 
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

    // 處理專案新增/更新 (簡單實作)
    if (params.action === 'updateProject') {
       // 未來實作 Project 新增/修改邏輯，目前先保留
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
      params.payer || "我",
      params.currency,
      params.projectId || "" // 【新增】第 18 欄：ProjectID
    ];

    if (params.action === 'edit' && params.row) {
      // 這裡的 17 要改為 18
      transSheet.getRange(params.row, 1, 1, 18).setValues([rowData]);
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