/* Original code by matt vogel */
/* Source: https://github.com/8bitgentleman/roam-depo-html-table */
/* v2.2 */
// Creates a right click menu command to convert copied TSV/CSV data into a Roam table

// Pure parsing helpers (no window/navigator/Roam references)

// Scan text into records of fields. Quoted fields follow RFC 4180; in TSV mode
// a quoted field is only unquoted if it holds a tab or newline (as spreadsheets do).
function scan(text, d) {
    const rows = [];
    let row = [];
    let i = 0;
    while (true) {
        let value = null;
        if (text[i] === '"') {
            let content = "";
            let j = i + 1;
            let q;
            while ((q = text.indexOf('"', j)) !== -1 && text[q + 1] === '"') {
                content += text.slice(j, q + 1);
                j = q + 2;
            }
            if (q !== -1) {
                const next = text[q + 1];
                const closes = next === undefined || next === d || next === "\r" || next === "\n";
                content += text.slice(j, q);
                if (closes && (d === "," || /[\t\r\n]/.test(content))) {
                    value = content.replace(/\r\n?/g, "\n");
                    i = q + 1;
                }
            }
        }
        if (value === null) {
            // Literal field: runs to the next delimiter or line break
            let end = i;
            while (end < text.length && text[end] !== d && text[end] !== "\r" && text[end] !== "\n") end++;
            value = text.slice(i, end);
            i = end;
        }
        row.push(value);
        if (i >= text.length) break;
        if (text[i] === d) { i++; continue; }
        i += text[i] === "\r" && text[i + 1] === "\n" ? 2 : 1;
        rows.push(row);
        row = [];
    }
    rows.push(row);
    return rows;
}

const isEmptyRow = row => row.every(cell => cell.trim() === "");

function dropTrailingEmpty(rows) {
    while (rows.length && isEmptyRow(rows[rows.length - 1])) rows.pop();
    return rows;
}

export function detectDelimiter(text) {
    text = text.replace(/^\uFEFF/, "");
    if (text.includes("\t")) return "\t";
    const rows = dropTrailingEmpty(scan(text, ",")).filter(row => !isEmptyRow(row));
    const n = rows.length ? rows[0].length : 0;
    return n >= 2 && rows.every(row => row.length === n) ? "," : "\t";
}

export function parseTable(text) {
    text = text.replace(/^\uFEFF/, "");
    const rows = dropTrailingEmpty(scan(text, detectDelimiter(text)));
    const width = Math.max(0, ...rows.map(row => row.length));
    return rows.map(row => row.concat(Array(width - row.length).fill("")));
}

async function pasteTable(blockUid) {
    try {
        // Get clipboard text
        const clipText = await navigator.clipboard.readText();

        // Parse into rows of cells (TSV or CSV, quotes handled, rows padded)
        const tableData = parseTable(clipText);

        if (tableData.length === 0) {
            alert("Nothing to paste: the clipboard has no table text.");
            return;
        }

        // Update the target block to be a table
        await window.roamAlphaAPI.data.block.update({
            block: {
                uid: blockUid,
                string: "{{[[table]]}}"
            }
        });

        // Create nested blocks for each row
        async function createRow(parentUid, rowData) {
            let currentParentUid = parentUid;

            for (let i = 0; i < rowData.length; i++) {
                const cellUid = window.roamAlphaAPI.util.generateUID();

                await window.roamAlphaAPI.data.block.create({
                    location: {
                        "parent-uid": currentParentUid,
                        order: "last"
                    },
                    block: {
                        uid: cellUid,
                        string: rowData[i]
                    }
                });

                // Next cell becomes child of current cell (creates nested structure)
                currentParentUid = cellUid;
            }
        }

        // Create all rows sequentially to avoid race conditions
        for (let i = 0; i < tableData.length; i++) {
            await createRow(blockUid, tableData[i]);
        }
    } catch (error) {
        console.error("Table Import Error:", error);
        alert("Failed to paste table. Please check console for details.");
    }
}


export default {
  onload: () => {
    console.log("load table import plugin")

    window.roamAlphaAPI.ui.blockContextMenu.addCommand({
      label: "Paste Table",
      callback: (e) => pasteTable(e['block-uid'])
    })
  },
  onunload: () => {
    console.log("unload table import plugin")

    window.roamAlphaAPI.ui.blockContextMenu.removeCommand({
      label: "Paste Table"
    })
  }
};
