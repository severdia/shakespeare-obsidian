/*
This script renumbers speech lines for every book chapter.
Each speech line is marked with a number at the start, following this format:
==<line number>==<rest of the line>
*/

module.exports = async (params) => {
    const {app, obsidian, quickAddApi} = params;
	const BOOKS_FOLDER_NAME = 'Shakespeare';
    const H3_PREFIX = '### ';
    const HIGHLIGHT_MARKER = '==';


    function getBookNames(booksFolder) {
        const bookNames = [];
        for (const child of booksFolder.children) {
            if (child instanceof obsidian.TFolder) {
                bookNames.push(child.name);
            }
        }

        bookNames.sort();

        return bookNames;
    }

    function getFullBooks(booksFolder) {
        const fullBookFiles = [];
        const bookNames = getBookNames(booksFolder);

        for (const bookName of bookNames) {
            const bookFolder = app.vault.getFolderByPath(`${BOOKS_FOLDER_NAME}/${bookName}`);

            if (bookFolder) {
                for (const child of bookFolder.children) {
                    if (child instanceof obsidian.TFile && child.name.startsWith(`+${bookName}`)) {
                        fullBookFiles.push(child);
                    }
                }
            }

        }

        return fullBookFiles;
    }

    async function chooseFullBookFromModal(booksFolder) {
        const fullBooksList = getFullBooks(booksFolder);
        const fullBooksByName = new Map();
        const fullBooksNames = [];

        for (const fullBookFile of fullBooksList) {
            fullBooksByName.set(fullBookFile.name, fullBookFile);
            fullBooksNames.push(fullBookFile.name);
        }

        const choosenFullBookName = await quickAddApi.suggester(fullBooksNames, fullBooksNames);

        if (choosenFullBookName) {
            return fullBooksByName.get(choosenFullBookName);
        } else {
            return null;
        }
    }

	// Reorder line numbers in a book chapter.
	function renumberSpeechLines(fullBookFile) {

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
		const booksFolder = app.vault.getFolderByPath(BOOKS_FOLDER_NAME);

		if (booksFolder === null) {
			new Notice(`Warning: "${BOOKS_FOLDER_NAME}" folder cannot be found`);
			return;
		}

		const choosenFullBookFile = await chooseFullBookFromModal(booksFolder);

		if (choosenFullBookFile) {
			const status = renumberSpeechLines(choosenFullBookFile);
			if (status) {
				new Notice(`Speech lines renumbered successfully`);
			}
		}
	}

	await main();

};