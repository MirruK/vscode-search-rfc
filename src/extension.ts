import * as vscode from "vscode";
import { Database } from "sqlite3";

const dbPath = "./rfc_database.db";

type rowType = {
  rfc_number: number;
  rfc_info: string;
};

async function dbAllWrapper(
  db: Database,
  searchTerm: string,
  sql: string
): Promise<rowType[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, [`%${searchTerm}%`], (err, rows: rowType[]) => {
      if (err) {
        console.log("Error executing query:", err.message);
        resolve([{ rfc_number: 1, rfc_info: "No RFCs found" }]);
      } else {
        if (!rows) {
          resolve([{ rfc_number: 1, rfc_info: "No RFCs found" }]);
        }
        console.log("Hello inside db.all()");
        resolve(rows);
      }
    });
  });
}

async function queryBySearchTerm(searchTerm: string) {
  // Query for rows where rfc_info includes the searchTerm
  const sql = `SELECT rfc_number, rfc_info FROM rfc_index WHERE rfc_info LIKE ? COLLATE NOCASE`;
  let db = new Database(dbPath, (err) => {
    if (err) {
      console.error(err.message);
      return [{ rfc_number: 1, rfc_info: "No RFCs found" }];
    }
  });
  return dbAllWrapper(db, searchTerm, sql);
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "search-rfc" is now active!');

  const myScheme = "searchresult";
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json

  let listRfcCommand = vscode.commands.registerCommand(
    "search-rfc.searchRfc",
    () => {
      vscode.window
        .showInputBox({ prompt: "RFC title Keyword" })
        .then(async (searchWord) => {
          if (!searchWord) {
            return;
          }
          const results = await queryBySearchTerm(searchWord);
          const webViewPanel = vscode.window.createWebviewPanel(
            myScheme,
            myScheme,
            vscode.ViewColumn.One
          );
          const htmlToShow = results.reduce(
            (acc, curr) =>
              acc +
              `<a style="font-size: 16px;" href="https://www.rfc-editor.org/rfc/rfc${curr.rfc_number}.html">${curr.rfc_number}</a>
              <h3>${curr.rfc_info}</h3>
              </br>`,
            ""
          );
          const baseHtmlStart = `<html><body><h1>Search results:</h1></br>`;
          const baseHtmlEnd = `</body></html>`;
          webViewPanel.webview.html = baseHtmlStart + htmlToShow + baseHtmlEnd;
          webViewPanel.reveal();
        });
    }
  );

  context.subscriptions.push(listRfcCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
