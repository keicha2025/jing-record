function checkAuth(token) {
  const adminPassword = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  return adminPassword && token === adminPassword;
}

function doGet(e) {
  try {
    const token = e && e.parameter ? e.parameter.token : "";
    const isAdmin = checkAuth(token);

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

    // --- 訪客/檢視模式：資料去識別化 Map ---
    let friendMap = {};
    let friendCounter = 1;
    function getAnonymizedName(originalName) {
         if (!originalName || originalName === "我") return originalName;
         // 拆分多個朋友 (例如 "John, Mary")
         return originalName.split(', ').map(n => {
             if (n === "我") return "我";
             if (!friendMap[n]) friendMap[n] = "友" + friendCounter++;
             return friendMap[n];
         }).join(', ');
    }
    // -------------------------------------

    // 遮蔽敏感資訊邏輯：若非 Admin，Note 欄位轉為 ***
    const transactions = transData.map((r, index) => {
      if (!r[0]) return null;
      const spendDate = new Date(r[2]);
      const type = r[3];
      const amount = parseFloat(r[6] || 0); // 原始金額 (G 欄)
      const isOneTime = r[8] === true;      // 欄位往左移一格 (原本 9)
      const personalShare = parseFloat(r[10] || 0); // 原本 11
      const debtAmount = parseFloat(r[11] || 0);    // 原本 12
      const originalCurrency = r[15] || "JPY";     // 原本 16
      const projectId = r[16] || "";               // 原本 17
      
      let friendName = r[13]; // 原本 14
      let payer = r[14] || "我"; // 原本 15
      let note = r[12]; // 原本 13

      // 若非管理員，進行去識別化
      if (!isAdmin) {
          note = note ? "***" : ""; 
          friendName = getAnonymizedName(friendName);
          payer = getAnonymizedName(payer);
      }

      // 動態換算 JPY 用於統計 (Backward compatibility for stats)
      const fxRate = parseFloat(config.fx_rate || 0.22);
      const amountJPY = originalCurrency === 'JPY' ? amount : amount / fxRate;
      const amountTWD = originalCurrency === 'TWD' ? amount : amount * fxRate;
      
      // 債務對應日幣金額
      const debtInJPY = originalCurrency === 'JPY' ? debtAmount : debtAmount / fxRate;
      const shareInJPY = originalCurrency === 'JPY' ? personalShare : personalShare / fxRate;

      if (type === '支出') {
        netDebt += debtInJPY; 
        if (isOneTime) allOneTimeTotal += shareInJPY;
        else {
          allLifeTotal += shareInJPY;
          // 取得 YYYY/MM 部分，避免時區偏移影響統計
          const dateStr = String(r[2]);
          const dateMatch = dateStr.match(/^(\d{4})[/-](\d{2})/);
          if (dateMatch) {
            const rowYear = parseInt(dateMatch[1]);
            const rowMonth = parseInt(dateMatch[2]);
            if (rowYear === now.getFullYear() && rowMonth === (now.getMonth() + 1)) {
              monthlyLifeTotal += shareInJPY;
            }
          }
        }
      } else if (type === '收款') {
        netDebt -= amountJPY; 
      }

      // 所見即所得：回傳原始儲存格字串。避免 GAS 時區偏移。
      let spendDateVal = r[2];
      let spendDateStr = "";
      if (typeof spendDateVal === 'string') {
          spendDateStr = spendDateVal;
      } else {
          // 只有當出現非預期的舊 Date 物件時，以腳本時區格式化作為後備
          spendDateStr = Utilities.formatDate(new Date(spendDateVal), Session.getScriptTimeZone(), "yyyy/MM/dd HH:mm");
      }

      return {
        row: index + 2, id: r[0], spendDate: spendDateStr,
        type, name: r[4], categoryId: r[5], amountJPY, amountTWD, 
        originalAmount: amount, // 新增：回傳原始金額
        paymentMethod: r[7],    // 原端 8
        isOneTime, friendName: friendName, 
        note: note,
        personalShare, payer: payer, debtAmount,
        originalCurrency: originalCurrency,
        projectId: projectId 
      };
    }).filter(t => t !== null).reverse();

    // 處理最終輸出的朋友列表 (若非管理員，只回傳代號)
    let finalFriends = friends;
    if (!isAdmin) {
        // 確保所有朋友都已進入 Map (即使沒有交易紀錄)
        friends.forEach(f => getAnonymizedName(f)); 
        finalFriends = Object.values(friendMap).filter(n => n !== "我");
        finalFriends = [...new Set(finalFriends)];
        
        // 隱藏敏感 Config
        if (config.user_name) config.user_name = "User";
    }

    const output = { 
      categories, friends: finalFriends, paymentMethods, projects, config, 
      transactions: transactions.slice(0, 150),
      stats: { monthlyLifeTotal, allOneTimeTotal, allLifeTotal, totalInvestment: allLifeTotal + allOneTimeTotal, debtTotal: netDebt },
      is_admin: isAdmin 
    };

    return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const token = params.token;
    
    // Auth Check
    if (!checkAuth(token)) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "401 Unauthorized" })).setMimeType(ContentService.MimeType.JSON);
    }
    
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
       const projectSheet = ss.getSheetByName("Projects");
       if (!projectSheet) {
         // 若無此表則自動建立 (通常應已有，但防呆)
         const pSheet = ss.insertSheet("Projects");
         pSheet.appendRow(["ID", "Name", "StartDate", "EndDate", "Status"]);
       }
       const pSheet = ss.getSheetByName("Projects");
       
       const newRow = [
         params.id || "proj_" + new Date().getTime(),
         params.name,
         params.startDate,
         params.endDate,
         params.status || "Active"
       ];

       // 檢查是否為編輯現有
       let isEdit = false;
       if (params.id) {
         const data = pSheet.getDataRange().getValues();
         for (let i = 1; i < data.length; i++) {
           if (data[i][0] == params.id) {
             pSheet.getRange(i + 1, 1, 1, 5).setValues([newRow]);
             isEdit = true;
             break;
           }
         }
       }
       
       if (!isEdit) {
         pSheet.appendRow(newRow);
       }

       return ContentService.createTextOutput(JSON.stringify({ status: "success", project: newRow })).setMimeType(ContentService.MimeType.JSON);
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
      params.spendDate, // 應為 "YYYY/MM/DD HH:mm UTC+X" 字串
      params.type,
      params.name,
      params.categoryId,
      params.amount,          // 第 7 欄 (Index 6): 原始金額
      params.paymentMethod,   // 第 8 欄 (Index 7): 支付方式 (原本 8 -> 7)
      params.isOneTime,       // 第 9 欄 (Index 8): 是否一次性
      params.isSplit,         // 第 10 欄 (Index 9)
      params.personalShare,   // 第 11 欄 (Index 10)
      params.debtAmount,      // 第 12 欄 (Index 11)
      params.note,            // 第 13 欄 (Index 12)
      params.friendName || "",// 第 14 欄 (Index 13)
      params.payer || "我",    // 第 15 欄 (Index 14)
      params.currency,        // 第 16 欄 (Index 15): 幣別
      params.projectId || ""  // 第 17 欄 (Index 16): ProjectID
    ];

    if (params.action === 'edit' && params.row) {
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

/**
 * 遷移現有資料：
 * 1. 根據 OriginalCurrency (Q 欄) 決定要將 JPY 或 TWD 金額存入 G 欄。
 * 2. 刪除 H 欄 (Amount TWD)。
 * 3. 【全新】標準化日期格式：將所有 C 欄日期轉換為 "YYYY/MM/DD HH:mm UTC+8" 字串。
 */
function migrateLegacyData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Transactions");
  const data = sheet.getDataRange().getValues();
  const rows = data.length;
  
  // 檢查標題列，輔助判定當前結構
  const header = data[0];
  const isOldStructure = header.length >= 18; // 舊結構通常有 18 欄以上

  for (let i = 1; i < rows; i++) {
    const row = data[i];
    
    // 1. 處理金額遷移 (如果是舊結構)
    if (isOldStructure) {
      const amountJPY = row[6];
      const amountTWD = row[7];
      const originalCurrency = row[15]; // P 欄 (Index 15)
      let originalAmount = (originalCurrency === "TWD") ? amountTWD : amountJPY;
      sheet.getRange(i + 1, 7).setValue(originalAmount);
    }

    // 2. 處理日期標準化 (C 欄, Index 2)
    let dateVal = row[2];
    let normalizedDateStr = "";
    
    if (dateVal instanceof Date) {
      // 舊資料視為台灣時間 UTC+8
      normalizedDateStr = Utilities.formatDate(dateVal, "GMT+8", "yyyy/MM/dd HH:mm") + " UTC+8";
    } else if (typeof dateVal === 'string') {
      // 如果已經是字串但格式不符 (例如包含 "(" 或 "-" )，則進行修復
      if (dateVal.includes("(") || dateVal.includes("-")) {
         // 將 2026-02-06 21:54 (+0800) 轉為 2026/02/06 21:54 UTC+8
         let cleanDate = dateVal.split(" (")[0].replace(/-/g, "/");
         let offset = "";
         if (dateVal.includes("+0800")) offset = "UTC+8";
         else if (dateVal.includes("+0900")) offset = "UTC+9";
         else offset = "UTC+8"; // 預設
         normalizedDateStr = cleanDate + " " + offset;
      } else {
         normalizedDateStr = dateVal; // 正確格式則略過
      }
    }
    
    if (normalizedDateStr) {
       sheet.getRange(i + 1, 3).setValue(normalizedDateStr);
    }
  }

  // 如果是舊結構，最後才執行刪除欄位與更名
  if (isOldStructure) {
    sheet.deleteColumn(8); // 刪除 H 欄 (Amount TWD)
    sheet.getRange(1, 7).setValue("Amount");
  }
  
  Logger.log("遷移與日期標準化完成！");
}