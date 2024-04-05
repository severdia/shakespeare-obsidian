/*
This script reorders speech line numbers for every chapter in a book.
Each speech line is marked with a number at the start, following this format:
==<line number>== <rest of the line>
*/

module.exports = async (params) => {
	const app = params.app;
	const SCRIPTS_FOLDER_NAME = 'My Scripts';
    const HIGHLIGHT_MARKER = '==';

	// TODO find a better way to know if it's directory (OR use typescript TFile and TFolder interfaces with instanceof)
	function isDirectory(fileOrDir) {
		if (fileOrDir.hasOwnProperty("children")) {
			return true;
		}

		return false;
	}

	function getBookNames(booksFolder) {
		const bookNames = [];
		for (const child of booksFolder.children) {
			if (isDirectory(child)) {
				bookNames.push(child.name);
			}
		}

		bookNames.sort();

		return bookNames;
	}

	// TODO quickAddApi.suggester is used here. In plugin we will need to use the FuzzySuggestModal class
	async function chooseBookFromModal(booksFolder) {
		const bookNames = getBookNames(booksFolder);
		return await params.quickAddApi.suggester(bookNames, bookNames);
	}

	// Reorder line numbers in a book chapter.
	function reorderChapterLineNumbers(chapterPath) {
		app.vault.process(chapterPath, (chapterContents) => {
			
			const lines = chapterContents.split('\n');
			const changedLines = [];
			
            let lastChangedLineNumber = -1;
			let currentLineNumber = 0; // will be incremented by 1 for almost every speech line number

			for (const line of lines) {
				if (line.startsWith(HIGHLIGHT_MARKER)) {
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
	}
	
	function reorderBookLineNumbers(bookName) {
		const bookPath = app.vault.getFolderByPath(`${SCRIPTS_FOLDER_NAME}/${bookName}`);

		if (bookPath === null) {
			new Notice(`Warning: "${bookPath.path}" folder cannot be found`);
			return false;
		}
		
		for (const child of bookPath.children) {
			if (!isDirectory(child) && !child.name.startsWith('+')) {
				reorderChapterLineNumbers(child);
			}
		}

		return true;
	}

	async function main() {
		const booksFolder = app.vault.getFolderByPath(SCRIPTS_FOLDER_NAME);

		if (booksFolder === null) {
			new Notice(`Warning: "${SCRIPTS_FOLDER_NAME}" folder cannot be found`);
			return;
		}

		const choosenBookName = await chooseBookFromModal(booksFolder);
		if (choosenBookName) {
			const status = reorderBookLineNumbers(choosenBookName);
			if (status) {
				new Notice(`Speech line numbers reordered successfully`);
			}
		}
	}

	await main();

};