/*
This script renumbers speech lines for every book chapter.
Each speech line is marked with a number at the start, following this format:
==<line number>==<rest of the line>
*/

module.exports = async (params) => {
    const {app, obsidian, quickAddApi} = params;
    const MY_SCRIPTS_FOLDER_NAME = 'My Scripts';
    const H3_PREFIX = '### ';
    const HIGHLIGHT_MARKER = '==';


    async function chooseFullBookFromModal(myScriptsFolder) {
        const fullBooksNames = [];

        for (const child of myScriptsFolder.children) {
            if (child instanceof obsidian.TFile && !child.name.startsWith('+') && child.name.endsWith('.md')) {
                fullBooksNames.push(child.name.slice(0, -3));
            }
        }

        return await quickAddApi.suggester(fullBooksNames, fullBooksNames);

    }

	// Reorder line numbers in a book chapter.
	function renumberSpeechLines(fullBookName) {
        const fullBookPath = `${MY_SCRIPTS_FOLDER_NAME}/${fullBookName}.md`;
        const fullBookFile = app.vault.getFileByPath(fullBookPath);
        
        if (!fullBookFile) {
            console.error(`"${fullBookPath}" file does not exist`);
            return;
        }

		app.vault.process(fullBookFile, (fileContents) => {
			const lines = fileContents.split('\n');
			const changedLines = [];
			
            let lastChangedLineNumber = -1;
			let currentLineNumber = 0; // will be incremented by 1 for each speech line number except when line numbers are the same

			for (const line of lines) {
                if (line.startsWith(H3_PREFIX)) { // reset numbering for every chapter
                    lastChangedLineNumber = -1;
                    currentLineNumber = 0;
                } else if (line.startsWith(HIGHLIGHT_MARKER)) {
                    const highlightEndIndex = line.indexOf(HIGHLIGHT_MARKER, HIGHLIGHT_MARKER.length);

                    if (highlightEndIndex !== -1) {
                        const originalLineNumber = parseInt(line.slice(HIGHLIGHT_MARKER.length, highlightEndIndex), 10);
                        if (!isNaN(originalLineNumber)) {
                            if (originalLineNumber !== lastChangedLineNumber) {
                                currentLineNumber += 1;
                            }
                            
                            const restOfTheLine = line.slice(highlightEndIndex + HIGHLIGHT_MARKER.length);
                            const newLine = `${HIGHLIGHT_MARKER}${currentLineNumber}${HIGHLIGHT_MARKER}${restOfTheLine}`;
                            changedLines.push(newLine);

                            lastChangedLineNumber = originalLineNumber;
                            continue;
                        }
                    }
				}

				changedLines.push(line);
				
			}

			return changedLines.join('\n');
		});

        return true;
	}


	async function main() {
		const myScriptsFolder = app.vault.getFolderByPath(MY_SCRIPTS_FOLDER_NAME);

		if (!myScriptsFolder) {
			new Notice(`Warning: "${MY_SCRIPTS_FOLDER_NAME}" folder cannot be found`);
			return;
		}

		const choosenFullBookName = await chooseFullBookFromModal(myScriptsFolder);

		if (choosenFullBookName) {
			const status = renumberSpeechLines(choosenFullBookName);
			if (status) {
				new Notice(`Speech lines renumbered successfully`);
			}
		}
	}

	await main();

};