
module.exports = async (params) => {
	const app = params.app;
	const SCRIPTS_FOLDER_NAME = 'My Scripts';
	const FULL_BOOK_FILE_NAME = `++Full Play.md`;
	const CHARACTERS_FOLDER_NAME = 'Characters';
	const EMBED_PREFIX = '![[';
	const H6_PREFIX = '###### ';

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

	// Reorder IDs in a book chapter. Return a mapping that maps original id to new id.
	function reorderChapterFile(chapterPath) {
		// maps paragraph's original ID to the new ID
		const paragraphIDMap = new Map();

		app.vault.process(chapterPath, (chapterContents) => {
			
			const lines = chapterContents.split('\n');
			const changedLines = [];
			
			let currentID = 1;
			for (const line of lines) {
				if (line.startsWith(H6_PREFIX)) {
					const originalID = line.trim().slice(H6_PREFIX.length);
					paragraphIDMap.set(originalID, currentID);
					changedLines.push(`${H6_PREFIX}${currentID}`);

					currentID += 1;
				} else {
					changedLines.push(`${line}`);
				}
			}

			return changedLines.join('\n');
		});

		return paragraphIDMap;
	}

	function reorderFullBookFile(bookName, chaptersIDMap) {
		const fullBookPath = app.vault.getFileByPath(`${SCRIPTS_FOLDER_NAME}/${bookName}/${FULL_BOOK_FILE_NAME}`);

		app.vault.process(fullBookPath, (fileContents) => {
			
			const lines = fileContents.split('\n');
			const changedLines = [];
			
			let removedEmbedIndex = -1;

			for (let [lineIndex, line] of lines.entries()) {
				
				if (line.startsWith(EMBED_PREFIX)) {
					const paragraphEmbedPath = line.trim().slice(EMBED_PREFIX.length, -2);
					const [chapterPath, paragraphID] = paragraphEmbedPath.split('#');
					const paragraphIDMap = chaptersIDMap.get(`${chapterPath}.md`);
					
					// remove an embed if it's removed from chapter file
					if (parseInt(paragraphID, 10) > paragraphIDMap.size) {
						removedEmbedIndex = lineIndex;
						continue;
					}
				}

				// remove the redundant newline after removing an embed
				if (removedEmbedIndex !== -1 && lineIndex === removedEmbedIndex + 1 && line === '') {
					continue;
				}

				changedLines.push(line);
			}

			return changedLines.join('\n');
		});
	}


	function reorderCharacterFiles(bookName, chaptersIDMap) {
		const charactersFolderPath = app.vault.getFolderByPath(`${SCRIPTS_FOLDER_NAME}/${bookName}/${CHARACTERS_FOLDER_NAME}`);

		for (const child of charactersFolderPath.children) {
			app.vault.process(child, (fileContents) => {

				const lines = fileContents.split('\n');
				const changedLines = [];
				
				let removedEmbedIndex = -1;

				for (let [lineIndex, line] of lines.entries()) {
					if (line.startsWith(EMBED_PREFIX)) {
						const paragraphEmbedPath = line.trim().slice(EMBED_PREFIX.length, -2);
						const [chapterPath, paragraphID] = paragraphEmbedPath.split('#');
						const paragraphIDMap = chaptersIDMap.get(`${chapterPath}.md`);
						
						if (paragraphIDMap.has(paragraphID)) {
							const newID = paragraphIDMap.get(paragraphID);
							changedLines.push(`![[${chapterPath}#${newID}]]`);
						} else {
							removedEmbedIndex = lineIndex;
						}

					} else {
						// remove the redundant newline after removing an embed
						if (removedEmbedIndex !== -1 && lineIndex === removedEmbedIndex + 1 && line === '') {
							continue;
						}

						changedLines.push(`${line}`);
					}
				}
				return changedLines.join('\n');
			});
		}
	}
	
	function reorderBookIDs(bookName) {
		const bookPath = app.vault.getFolderByPath(`${SCRIPTS_FOLDER_NAME}/${bookName}`);

		if (bookPath === null) {
			new Notice(`Warning: "${bookPath.path}" folder cannot be found`);
			return false;
		}
		
		const chaptersIDMap = new Map();
		for (const child of bookPath.children) {
			if (!isDirectory(child) && !child.name.startsWith('+')) {
				// Note: links are generated to include book name. If links are changed - this will need to be changed.
				chaptersIDMap.set(`${bookName}/${child.name}`, reorderChapterFile(child));
			}
		}

		reorderFullBookFile(bookName, chaptersIDMap);

		reorderCharacterFiles(bookName, chaptersIDMap);

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
			const status = reorderBookIDs(choosenBookName);
			if (status) {
				new Notice(`Play IDs reordered successfully`);
			}
		}
	}

	await main();

};