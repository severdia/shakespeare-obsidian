
module.exports = async (params) => {
	const app = params.app;
	const BOOKS_FOLDER_NAME = 'Shakespeare';
	const SCRIPTS_FOLDER_NAME = 'My Scripts';


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

	async function copyFile(filePath, toFolder) {
		const newFilePath = `${toFolder.path}/${filePath.name}`;
		await app.vault.copy(filePath, newFilePath);
	}

	async function copyDirectory(dirPath, toFolder) {
		const destPath = await app.vault.createFolder(`${toFolder.path}/${dirPath.name}`);

		for (const itemPath of dirPath.children) {
			if (isDirectory(itemPath)) {
				await copyDirectory(itemPath, destPath);
			} else {
				await copyFile(itemPath, destPath);
			}
		}
	}

	async function copyBook(bookName) {
		const inputBookPath = app.vault.getFolderByPath(`${BOOKS_FOLDER_NAME}/${bookName}`);

		if (inputBookPath === null) {
			new Notice(`Warning: "${inputBookPath.path}" folder cannot be found`);
			return false;
		}

		let outputDirPath = app.vault.getFolderByPath(SCRIPTS_FOLDER_NAME);
		
		if (outputDirPath === null) {
			outputDirPath = await app.vault.createFolder(SCRIPTS_FOLDER_NAME);
		}

		const outputBookPath = app.vault.getFolderByPath(`${SCRIPTS_FOLDER_NAME}/${bookName}`);

		if (outputBookPath !== null) {
			new Notice(`"${outputBookPath.path}" folder already exists`);
			return false;
		}

		await copyDirectory(inputBookPath, outputDirPath);

		return true;
	}

	async function main() {
		const booksFolder = app.vault.getFolderByPath(BOOKS_FOLDER_NAME);

		if (booksFolder === null) {
			new Notice(`Warning: "${BOOKS_FOLDER_NAME}" folder cannot be found`);
			return;
		}

		const choosenBookName = await chooseBookFromModal(booksFolder);
		if (choosenBookName) {
			const status = await copyBook(choosenBookName);
			if (status) {
				new Notice(`"${choosenBookName}" copied successfully`);
			}
		}
	}

	await main();

};