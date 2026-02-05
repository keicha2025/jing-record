# Changelog - 2026-02-06 Update

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
