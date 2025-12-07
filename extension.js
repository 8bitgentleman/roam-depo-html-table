/* Original code by matt vogel */
/* Source: https://github.com/8bitgentleman/roam-depo-html-table */
/* v2 */
// Creates a right click menu command to convert copied TSV/CSV data into a Roam table

async function pasteTable(blockUid) {
    try {
        // Get clipboard text
        const clipText = await navigator.clipboard.readText();

        // Split into rows (handle both Windows and Unix line endings)
        const rows = clipText.split(/\r?\n/);

        // Split each row into columns (tab-separated)
        const tableData = rows.map(row => row.split('\t'));

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
