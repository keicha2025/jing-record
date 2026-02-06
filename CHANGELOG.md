# Changelog - 2026-02-06 Update (Guest & View Mode Refinement)

## 🌟 Guest Mode (體驗模式) Refinements
- **Data Logic Overhaul**:
  - **Separation of Local vs. Remote**: User-created data (Local) is now strictly separated from Demo data (Remote). Clearing or toggling "Import Data" will **not** delete your local entries.
  - **Always-On Metadata**: Even if "Import Data" is OFF, the app now fetches Categories, Payment Methods, and Config from the backend to ensure a seamless experience (menus won't be empty).
  - **Toggling Logic**: The "Import Data" toggle now only controls the visibility of Demo transactions.
- **Sorting Fix**: Fixed an issue where local transactions were forced to the bottom of the list. Now, all transactions (Local & Remote) are correctly sorted mixed by date (Newest First).
- **Payment Method Fix**: Resolved an issue where "Cash" and "PayPay" would appear as duplicates in the dropdown menu. Now strictly relies on backend configuration.

## 🚀 View Mode (Viewer) Polish
- **Dedicated Read-Only Page**:
  - Replaced the shared Edit Page with a new `ViewEditPage`.
  - **Removed**: "Start Editing" button, "Delete" button, and all input fields.
  - **Retained**: Full detail view including Splitwise details and Project tags.
- **Settings Page Clean-up**: Removed the intrusive "Read Only" badge from the settings card for a cleaner aesthetic.
- **Search & Filter**:
  - The "Clear Filter" (CLEAR) button is now **always visible** in History Mode, allowing users to easily reset views without guessing if a filter is active.

## 🐛 Bug Fixes & Technical
- **Date Normalization**: Standardized remote date formats to ensure consistent grouping in the History list.
- **Syntax Fixes**: Resolved a `SyntaxError` in `app.js` related to the fetch logic.

---

# Changelog - 2026-02-06 Update (View Mode & Features)

## 🚀 View Mode (Viewer)
- **New Architecture**: Created dedicated `view.html`, `js/view-app.js`, and `ViewDashboard` component to isolate Viewer logic from the main Admin/Guest app.
- **FX Rate Fix**: Fixed an issue where the exchange rate was defaulting to 0.22. Now correctly fetches `config.fx_rate` from GAS or Guest settings (e.g., 0.21).
- **Chart Reactivity**: Resolved a critical bug where Chart.js instances were wrapped in Vue proxies, causing `TypeError` and rendering failures. Implemented proper cleanup logic.
- **UI Improvements**: Updated the View Mode dashboard layout and currency toggle style.

## ✨ New Features
- **Project Search Integration**:
  - Added a "View Details" (查看明細) button to the Project Detail page.
  - Clicking "View Details" now filters the History page by the project's ID.
  - Enhanced the search bar to support searching by **Project Name** or **Project ID**.
- **Guest Mode Enhancements**:
  - **Settings Persistence**: Guest settings (User Name, FX Rate) now take precedence over remote default data during import.
  - **UI Refinement**: Renamed "Clear Data" and "Import Default Data" actions for clarity.

## 🐛 Bug Fixes
- **Layout Fixes**: Corrected the Project Detail page layout to center content vertically.
- **Event Handling**: Fixed missing event listeners for `view-history` in both `index.html` and `view.html`.


## 🎨 UI & Layout Updates
- **Global Layout Unification**:
  - `AppHeader` (Top Bar) and `AppFooter` (Navigation) are now consistently visible across all pages, including **Project Detail** and **Edit Page**.
  - Normalized padding and spacing for the main content area (`<main>`).
- **History Page**:
  - Fixed the "jump" issue caused by scrollbars appearing/disappearing by enforcing `scrollbar-gutter: stable`.
  - Refactored `SearchBar` to use a sticky positioning that stays within the layout boundaries.
- **Edit Page**:
  - Removed the redundant top navigation bar.
  - Integrated "Close/Cancel" and Title into the main content card for a cleaner look.
- **Project Detail Page**:
  - **Vertical Centering**: The read-only project summary view is now vertically centered within the card.
  - **Edit Mode Layout**: Improved the grid layout for Start/End Date inputs.
  - Removed duplicate "CANCEL" button in the header section.

## 🛠️ Refactoring
- **Component Separation**:
  - Extracted `AppHeader`, `AppFooter`, `SearchBar`, and `SystemModal` into verified standalone components in `js/components/`.
- **Search Logic**:
  - Centralized search and filter logic in `SearchBar` component.

## 🐛 Bug Fixes
- **Invalid Token Alert**: Fixed an issue where the "Invalid Token" alert would close immediately before the user could read it. Added `await` to ensure user confirmation.
- **Friend Filtering**: Fixed the issue where clicking a friend in Settings didn't show all relevant transactions. The filter now correctly checks both `friendName` (Beneficiary) and `payer`.

- **UI Tweaks**: Removed the unused cloud status icon from the header.

## ✨ New Features
- **Edit/Delete Feedback**:
  - Implemented a clear success dialog after editing or deleting a transaction.
  - Added a "Reload" (重新整理) action to these dialogs to ensure data consistency with the backend, alongside the standard "Return to Details" (返回明細) button.
