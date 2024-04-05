/*
This script makes a file with the full text of all book chapters, 
instead of just links to paragraphs like in the `++Full Play.md` files.
*/

module.exports = async (params) => {
    const app = params.app;
    const BOOKS_FOLDER_NAME = 'Shakespeare';
    const FULL_BOOK_AS_LINKS_FILE = `++Full Play.md`;
    const CHARACTERS_FILE_NAME = '+Dramatis Personae';
    const HEADER_SYMBOL = '#';
    const H3_PREFIX = '### ';
    const LINK_PREFIX = '[[';
    const LINK_SUFFIX = ']]';
    const LINK_HIERARCHY_SEPARATOR = '/'; // [[parent/file]]
    const LINK_ALIAS_SEPARATOR = '|'; // [[file|alias]]

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


    function getChapterName(chapterWikiLink) {
        let chapterName = '';

        if (chapterWikiLink.startsWith(LINK_PREFIX) && chapterWikiLink.endsWith(LINK_SUFFIX)) {
            let chapterObsidianPath = '';

            if (chapterWikiLink.includes(LINK_ALIAS_SEPARATOR)) {
                // [[my/obsidian/file|alias]] -> my/obsidian/file
                chapterObsidianPath = chapterWikiLink.slice(LINK_PREFIX.length, chapterWikiLink.indexOf(LINK_ALIAS_SEPARATOR));
            } else {
                // [[my/obsidian/file]] -> my/obsidian/file
                chapterObsidianPath = chapterWikiLink.slice(LINK_PREFIX.length, chapterWikiLink.indexOf(LINK_SUFFIX));
            }

            if (chapterObsidianPath.includes(LINK_HIERARCHY_SEPARATOR)) {
                // my/obsidian/file -> file
                chapterName = chapterObsidianPath.slice(chapterObsidianPath.lastIndexOf(LINK_HIERARCHY_SEPARATOR) + 1);
            } else {
                chapterName = chapterObsidianPath;
            }
        }

        return chapterName;
    }

    async function getBookChapterNames(bookName) {
        const bookChapterNames = [];

        const fullBookAsLinksPath = app.vault.getFileByPath(`${BOOKS_FOLDER_NAME}/${bookName}/${FULL_BOOK_AS_LINKS_FILE}`);

        if (fullBookAsLinksPath === null) {
            console.log(`${BOOKS_FOLDER_NAME}/${bookName}/${FULL_BOOK_AS_LINKS_FILE} folder does not exist`);
            return bookChapterNames;
        }

        const fileContents = await app.vault.read(fullBookAsLinksPath);
        
        const lines = fileContents.split('\n');
        
        for (const line of lines) {
            if (line.startsWith(H3_PREFIX)) {
                const chapterWikiLink = line.slice(H3_PREFIX.length).trim();
                const chapterName = getChapterName(chapterWikiLink);
                
                if (chapterName && !chapterName.startsWith(CHARACTERS_FILE_NAME)) {
                    bookChapterNames.push(chapterName);
                }
            }
        }

        return bookChapterNames;
    }

    async function getChapterContents(bookName, chapterName) {
        let chapterContents = '';

        const chapterPath = app.vault.getFileByPath(`${BOOKS_FOLDER_NAME}/${bookName}/${chapterName}.md`);

        if (chapterPath) {
            const fileContents = await app.vault.read(chapterPath);

            const contentsStartIndex = fileContents.indexOf('###### 1');
            const lines = fileContents.slice(contentsStartIndex).split('\n');
            const changedLines = [];
    
            for (const line of lines) {
                if (!line.startsWith(HEADER_SYMBOL) && !line.startsWith(LINK_PREFIX)) {
                    changedLines.push(line);
                }
            }
    
            chapterContents = `${H3_PREFIX}${chapterName}\n\n` + changedLines.join('\n');
        }
        
        return chapterContents;
    }

    function getFullBookPath(bookName) {
        const fullBookLink = `${BOOKS_FOLDER_NAME}/${bookName}/+${bookName}`;
        let fullBookPath = `${fullBookLink}.md`;

        let counter = 1;
        while (app.vault.getFileByPath(fullBookPath)) {
            fullBookPath = `${fullBookLink} ${counter}.md`;
            counter += 1;
        }
        
        return fullBookPath;
    }

    async function createFullBookFile(bookName) {
        const chapterNames = await getBookChapterNames(bookName);
        
        let all_chapters_contents = [];
        for (const chapterName of chapterNames) {
            all_chapters_contents.push(await getChapterContents(bookName, chapterName));
        }
        const fileContents = `${HEADER_SYMBOL} ${bookName}\n\n` + all_chapters_contents.join('\n\n');
        
        const fullBookPath = getFullBookPath(bookName);
        app.vault.create(fullBookPath, fileContents);

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
            const status = await createFullBookFile(choosenBookName);
            if (status) {
                new Notice(`Full Play created successfully`);
            }
        }
    }

    await main();

};