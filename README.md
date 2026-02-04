# 日日記 (Nichi-Nichi Log)

**Nichi-Nichi Log** 是一款專為在日留學生設計的極簡記帳應用。結合了極簡視覺設計與交換學生特有的需求（如：日幣/台幣換算、代墊拆帳、旅行專案管理），幫助你在異國生活中輕鬆紀錄每一筆開銷與回憶。

---

## 🌟 核心特色
- **極簡美學**：低飽和度、大留白，減少記帳的心理負擔。
- **針對性功能**：
  - **多幣種參考**：主要貨幣為 JPY，輔助顯示 TWD (依據自訂匯率)。
  - **社交拆帳 (Social Ledger)**：記錄「誰先付錢」、「誰欠誰錢」，不需複雜的複式記帳。
  - **旅行計畫 (Projects)**：將特定期間的開銷標記為「專案」（例如：北海道之旅），便於事後統計旅費。
- **無伺服器架構**：
  - **Frontend**: GitHub Pages (Vue 3 + Tailwind CSS)
  - **Backend**: Google Apps Script (GAS)
  - **Database**: 你的私人 Google Sheets

---

## 🚀 安裝與設定指南

### 步驟 1：建立 Google Sheet 資料庫
請建立一個新的 Google Sheet，並建立以下 6 個工作表（Tab）：

#### 1. `Transactions` (交易與分帳)
最核心的記帳資料表。
| 欄位 (Col) | 名稱 | 用途 | 範例值 |
| :--- | :--- | :--- | :--- |
| A | ID | 唯一識別碼 (UUID) | `1707012345678` |
| B | CreatedTime | 建立時間 | `2024-02-01 12:00:00` |
| C | Date | 消費日期 | `2024-02-01` |
| D | Type | 類型 | `支出` / `收入` / `收款` |
| E | Name | 消費名稱 | `Lawson 早餐` |
| F | CategoryID | 類別 ID | `c_food` |
| G | Amount | **總金額 (JPY)** (主要記帳金額) | `2500` |
| H | AmountTWD | 台幣金額 (參考用) | `550` |
| I | PaymentMethod | 支付方式 ID | `pm_suica` |
| J | IsOneTime | 是否為一次性/特殊開銷 | `TRUE` / `FALSE` |
| K | UpdatedAt | 最後更新時間 | `2024-02-01 12:05:00` |
| L | PersonalShare | **我的份額** (實際歸屬我的花費) | `1250` (兩人分) |
| M | DebtAmount | 債務金額 (+ 債權 / - 債務) | `1250` (幫朋友付) |
| N | Note | 備註 | `好像有點貴` |
| O | FriendName | 朋友名稱 (若是收款/還款) | `Max` |
| P | Payer | 誰先付錢 | `我` / `Max` |
| Q | Currency | 原始貨幣 | `JPY` |
| R | ProjectID | 關聯的旅行專案 ID | `p_hokkaido` |

#### 2. `Projects` (旅行計畫)
管理特定期間的專案。
| 欄位 | 名稱 | 用途 |
| :--- | :--- | :--- |
| A | ID | 專案 ID (`p_xxx`) |
| B | Name | 專案名稱 (如：京都賞楓) |
| C | StartDate | 開始日期 |
| D | EndDate | 結束日期 |
| E | Status | 狀態 (`Active`: 進行中, `Archived`: 已封存) |

#### 3. `Categories` (類別設定)
| 欄位 | 用途 | 範例 |
| :--- | :--- | :--- |
| A | ID | `c_food` |
| B | Name | `飲食` |
| C | Icon | Material Icon 代碼 (如 `restaurant`) |
| D | Type | `支出` / `收入` |

#### 4. `PaymentMethods` (支付方式)
| 欄位 | 用途 |
| :--- | :--- |
| A | ID (`pm_cash`, `pm_suica`) |
| B | Name (`現金`, `Suica`) |
| C | Order (排序用) |

#### 5. `Friends` (朋友名單)
| 欄位 | 用途 |
| :--- | :--- |
| A | ID |
| B | Name (`Max`, `Ryu`) |

#### 6. `Config` (系統設定)
| 欄位 | 值 (Row 2) | 用途 |
| :--- | :--- | :--- |
| A | `fx_rate` | 匯率 (如 `0.215`) |
| B | `user_name` | 使用者顯示名稱 |

---

### 步驟 2：部署 Google Apps Script (後端)
1.  開啟 Google Sheet，點選 **擴充功能 (Extensions)** > **Apps Script**。
2.  將本專案中的 `gas-backup.gs` 內容複製貼上到編輯器中。
3.  點擊 **部署 (Deploy)** > **新增部署 (New deployment)**。
4.  **設定如下 (重要！)**：
    - 類型：**Web app**
    - 執行身分：**Me (我)**
    - 誰可以存取：**Anyone (任何人)**
5.  複製生成的 **Web app URL**。

### 步驟 3：GitHub 部署 (前端)
1.  Fork 本專案到你的 GitHub。
2.  進入 **Settings** > **Secrets and variables** > **Actions**。
3.  新增 Repository Secret：
    - Name: `GAS_URL`
    - Value: (剛剛複製的 Web app URL)
    - Name: `SPREADSHEET_URL` (選填，用於設定頁的連結)
    - Value: (你的 Google Sheet 網址)
4.  進入 **Settings** > **Pages**：
    - Source: 改為 **GitHub Actions**。
5.  至 **Actions** 分頁，手動觸發一次 `Deploy to GitHub Pages`。

---

## 🎨 設計系統 (Design System)

### 配色 (Color Palette)
本專案避免高飽和色。
- **背景色**: `#FDFCFB` (溫暖的米白色，模擬紙張質感)
- **主要文字**: `#4A4A4A` (深灰色，比純黑更柔和)
- **次要文字**: `#9CA3AF` (淺灰，Tailwind `gray-400`)
- **強調色**: `#4A4A4A` (深灰按鈕 / Active 狀態)
- **錯誤/債務**: `#FCA5A5` (淡紅，Tailwind `red-300`)

### 互動原則
- **行動優先**：所有按鈕位於拇指可及區域。
- **無干擾回饋**：操作成功不跳出 Alert，僅有微小動畫。
- **3秒原則**：記帳流程極簡化，不強迫填寫非必要欄位。

---

## 🧮 核心邏輯說明

### 1. 份額與債務 (Personal Share vs Debt)
- **總金額 (Amount)**：這筆交易當下付出去的錢。
- **我的份額 (Personal Share)**：實際上我消費的部分。
- **債務金額 (Debt Amount)**：
    - 若 `我先付` 且 `幫朋友付`：債權 (+) (朋友欠我)。
    - 若 `朋友先付` 且 `包含我`：債務 (-) (我欠朋友)。
    - 系統會自動依據「總金額 - 債務 = 我的份額」進行計算。

### 2. 專案 (Projects)
- **Active (進行中)**：會出現在新增頁面的選單中，方便快速記帳。
- **Archived (已封存)**：不會出現在選單中，但統計資料保留。

---
