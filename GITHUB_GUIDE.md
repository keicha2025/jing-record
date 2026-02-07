# GitHub 上傳指南

這是一份針對您目前專案狀態的 GitHub 上傳說明手冊。

## 第一步：確認您的程式碼狀態
目前您的專案已經初始化，且所有檔案都已經準備好被提交（Staged），但尚未提交（Commit）。

請在終端機（Terminal）執行以下指令來保存目前的更改：

```bash
git commit -m "首次提交：專案初始化"
```

## 第二步：在 GitHub 上建立新倉庫 (Repository)
1. 登入您的 [GitHub](https://github.com/) 帳號。
2. 點擊右上角的 **+** 號，選擇 **New repository**。
3. 在 **Repository name** 欄位輸入專案名稱，例如 `jing-record`。
4. 選擇 **Public** (公開) 或 **Private** (私人)。
5. **不要** 勾選 "Add a README file"、".gitignore" 或 "license"（因為您的電腦上已經有這些檔案了）。
6. 點擊 **Create repository**。

## 第三步：連結並上傳程式碼
建立好倉庫後，GitHub 會顯示一些指令。請找到標題為 **"…or push an existing repository from the command line"** 的區塊，複製並執行類似以下的指令（請將 `<您的GitHub帳號>` 替換為您的實際帳號）：

```bash
# 建立連結 (請將 URL 換成您剛建立的倉庫網址)
git remote add origin https://github.com/keicha2025/jing-record.git

# 將程式碼上傳到 GitHub
git push -u origin main
```

---

## 未來如何更新？ (日常流程)
當您修改了程式碼並想要更新到 GitHub 時，請依序執行以下三個步驟：

### 1. 紀錄更改 (Add)
將修改過的檔案加入暫存區：
```bash
git add .
```

### 2. 提交更改 (Commit)
為這次的修改寫下說明（請用引號包住說明文字）：
```bash
git commit -m "這裡寫下您做了什麼修改，例如：新增記帳頁面"
```

### 3. 上傳至 GitHub (Push)
將提交的更改推送到雲端：
```bash
git push
```

---

## 本次更新內容 (2026/02/07 - Final)
如果您今天要提交，建議的 Commit 訊息如下：
```bash
git commit -m "UI/UX 大升級：開發自訂選單組件、重構歷史與統計頁面篩選器、微調全站彈出動畫"
```

### 主要變更點：
1. **全新組件**：開發 `AppSelect` 代替原生選單，全站 UI 質感提升。
2. **視覺細節**：微調 `spring-up` 動畫參數 (20px -> 12px)，動效切換更自然。
3. **功能整合**：
    - **歷史頁面**：搜尋列整合自訂選單。
    - **統計頁面**：專案選擇器升級，佈局更加精簡。
    - **全域**：Header 高度鎖定，解決頁面閃爍感。

