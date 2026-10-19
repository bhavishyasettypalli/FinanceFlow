# FinanceFlow – Personal Finance Tracker

FinanceFlow is a simple, browser-based personal finance tracker built with HTML, CSS, and JavaScript. It helps users record transactions, track their finances, and manage budgets through a clean dashboard.

## Features

- Add, edit, and delete transactions
- Track income and expenses
- View financial summaries and balance
- Manage budgets
- Search and filter transactions
- Switch between themes
- Export transactions as CSV
- Download and restore JSON backups
- Save data in the browser using localStorage

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Browser localStorage

## How to Run

1. Download or clone this repository.
2. Open the project folder in VS Code.
3. Open `index.html` in your browser, or use the Live Server extension.
4. Start adding transactions.

## Data Storage

FinanceFlow stores transaction and budget data in the browser's localStorage. Data is stored locally in the browser rather than in a remote database.

**Important:** Clearing browser data may remove saved information. Export a JSON backup regularly to help protect your records.

## Project Scope

This is a frontend learning project. It does not include user authentication, a remote database, or a backend server.

## Future Improvements

- Add more financial reports and visualizations
- Improve mobile responsiveness
- Add stronger input validation
- Test backup and restore with different datasets
## How to Run Locally

### Option 1: Using VS Code and Live Server (Recommended)

1. Clone or download this repository.
2. Open the `finance-tracker` folder in VS Code.
3. Open the VS Code terminal.
4. Run the following commands:

```bash
cd finance-tracker
npx live-server
```

5. Your browser should open automatically. If it doesn't, open the local URL shown in the terminal, usually `http://127.0.0.1:8080/`.

### Option 2: Open Directly in a Browser

1. Open the `finance-tracker` folder.
2. Double-click `index.html` to open it in your default browser.

**Note:** Live Server is recommended for local development. If it isn't installed, install the VS Code Live Server extension or install the `live-server` package in your project.

### Stop the Local Server

Press `Ctrl + C` in the terminal to stop the server.


## Author

Bhavishya Settypalli