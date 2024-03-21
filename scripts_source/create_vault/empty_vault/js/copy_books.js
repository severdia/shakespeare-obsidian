
module.exports = async (params) => {
	const app = params.app;
	const BOOKS_FOLDER_NAME = 'Shakespeare';
	const SCRIPTS_FOLDER_NAME = 'My Scripts'


	// TODO find a better way to know if it's directory (OR use typescript TFile and TFolder interfaces with instanceof)
	function isDirectory(fileOrDir) {
		if (fileOrDir.hasOwnProperty("children")) {
			return true;
		}

		return false;
	}

	async function get_book_names(books_folder) {
		const book_names = []
		for (const child of books_folder.children) {
			if (isDirectory(child)) {
				book_names.push(child.name)
			}
		}

		book_names.sort()

		return book_names
	}

	// TODO quickAddApi.suggester is used here. In plugin we will need to use the FuzzySuggestModal class
	async function chooseBookFromModal(books_folder) {
		const book_names = await get_book_names(books_folder)
		const picked_folder_name = await params.quickAddApi.suggester(book_names, book_names);
		
		return picked_folder_name
	}

	async function copyFile(file_path, to_folder) {
		const new_file_path = `${to_folder.path}/${file_path.name}`
		await app.vault.copy(file_path, new_file_path)
	}

	async function copyDirectory(dir_path, to_folder) {
		const dest_path = await app.vault.createFolder(`${to_folder.path}/${dir_path.name}`)

		for (const item_path of dir_path.children) {
			if (isDirectory(item_path)) {
				await copyDirectory(item_path, dest_path)
			} else {
				await copyFile(item_path, dest_path)
			}
		}
	}

	async function copyBook(book_name) {
		input_book_path = app.vault.getFolderByPath(`${BOOKS_FOLDER_NAME}/${book_name}`)

		if (input_book_path === null) {
			new Notice(`Warning: ${input_book_path.path} folder can not be found`);
			return false;
		}

		output_dir_path = app.vault.getFolderByPath(SCRIPTS_FOLDER_NAME)
		
		if (output_dir_path === null) {
			output_dir_path = await app.vault.createFolder(SCRIPTS_FOLDER_NAME)
		}

		output_book_path = app.vault.getFolderByPath(`${SCRIPTS_FOLDER_NAME}/${book_name}`)

		if (output_book_path !== null) {
			new Notice(`Warning: ${output_book_path.path} folder already exists`);
			return false;
		}

		await copyDirectory(input_book_path, output_dir_path)

		return true
	}

	async function main() {
		const books_folder = app.vault.getFolderByPath(BOOKS_FOLDER_NAME);

		if (books_folder === null) {
			new Notice(`Warning: ${BOOKS_FOLDER_NAME} folder can not be found`);
			return;
		}

		const choosen_book_name = await chooseBookFromModal(books_folder)
		if (choosen_book_name) {
			const status = await copyBook(choosen_book_name)
			if (status) {
				new Notice(`${choosen_book_name} copied successfully`)
			}
		}
	}

	await main();

};
