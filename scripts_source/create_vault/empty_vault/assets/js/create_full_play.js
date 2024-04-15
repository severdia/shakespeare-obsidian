/*
This script makes a file with the full text of all book chapters, 
instead of just links to paragraphs like in the `++Full Play.md` files.
*/

module.exports = async (params) => {
    const {app, obsidian, quickAddApi} = params;
    const BOOKS_FOLDER_NAME = 'Shakespeare';
    const MY_SCRIPTS_FOLDER_NAME = 'My Scripts';
    const FULL_BOOK_AS_LINKS_FILE = `++Full Play.md`;
    const CHARACTERS_FILE_NAME = '+Dramatis Personae';
    const HEADER_SYMBOL = '#';
    const H3_PREFIX = '### ';
    const LINK_PREFIX = '[[';
    const LINK_SUFFIX = ']]';
    const LINK_HIERARCHY_SEPARATOR = '/'; // [[parent/file]]
    const LINK_ALIAS_SEPARATOR = '|'; // [[file|alias]]
    const LIST_PREFIX = '- ';


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

    async function chooseBookFromModal(booksFolder) {
        const bookNames = getBookNames(booksFolder);
        return await quickAddApi.suggester(bookNames, bookNames);
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

        const fullBookAsLinksPath = `${BOOKS_FOLDER_NAME}/${bookName}/${FULL_BOOK_AS_LINKS_FILE}`;
        const fullBookAsLinksFile = app.vault.getFileByPath(fullBookAsLinksPath);

        if (!fullBookAsLinksFile) {
            console.error(`"${fullBookAsLinksPath}" file does not exist`);
            return bookChapterNames;
        }

        const fileContents = await app.vault.read(fullBookAsLinksFile);
        
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
                if (!line.startsWith(HEADER_SYMBOL) && !line.trim().startsWith(LINK_PREFIX)) {
                    changedLines.push(line);
                }
            }
            
            const chapterLink = `[[${bookName}/${chapterName}|${chapterName}]]`;
            chapterContents = `${H3_PREFIX}${chapterLink}\n\n` + changedLines.join('\n');
        }
        
        return chapterContents;
    }

    
    async function createChaptersInfo(bookName) {
        const chapterNames = await getBookChapterNames(bookName);
        
        let allChaptersContents = [];
        for (const chapterName of chapterNames) {
            const chapterContents = await getChapterContents(bookName, chapterName);
            allChaptersContents.push(chapterContents);
        }

        return allChaptersContents.join('\n---\n\n');
    }


    async function createCharactersInfo(bookName) {
        let charactersInfo = '';

        const charactersFilePath = `${BOOKS_FOLDER_NAME}/${bookName}/${CHARACTERS_FILE_NAME}.md`;
        const charactersFile = app.vault.getFileByPath(charactersFilePath);

        if (!charactersFile) {
            return charactersInfo;
        }

        const charactersFileContents = await app.vault.read(charactersFile);

        const characterLines = []
        for (const line of charactersFileContents.split('\n')) {
            if (line.startsWith(LIST_PREFIX)) {
                characterLines.push(line);
            }
        }

        const charactersHeader = CHARACTERS_FILE_NAME.slice(1);
        charactersInfo = `${H3_PREFIX}${charactersHeader}\n\n` + characterLines.join('\n');

        return charactersInfo;
    }


    async function addFullBookFrontmatter(fullBookFile, bookName) {
        const fullBookAsLinksFile = app.vault.getFileByPath(`${BOOKS_FOLDER_NAME}/${bookName}/${FULL_BOOK_AS_LINKS_FILE}`);

        if (!fullBookAsLinksFile) {
            return;
        }

        const cachedMetadata = app.metadataCache.getFileCache(fullBookAsLinksFile);

        if (cachedMetadata && cachedMetadata.frontmatter) {
            await app.fileManager.processFrontMatter(fullBookFile, (frontmatter) => {
                for (const metaKey in cachedMetadata.frontmatter) {
                    if (metaKey === 'ID') {
                        continue;
                    }
                    
                    frontmatter[metaKey] = cachedMetadata.frontmatter[metaKey];
                }
            });
        }
    }


    function getFullBookPath(bookName) {
        const fullBookLink = `${MY_SCRIPTS_FOLDER_NAME}/${bookName}`;
        let fullBookPath = `${fullBookLink}.md`;

        let counter = 1;
        while (app.vault.getFileByPath(fullBookPath)) {
            fullBookPath = `${fullBookLink} ${counter}.md`;
            counter += 1;
        }
        
        return fullBookPath;
    }

    async function createFullBookFile(bookName) {
        const charactersInfo = await createCharactersInfo(bookName);
        const chaptersInfo = await createChaptersInfo(bookName);

        const fileContents = `${HEADER_SYMBOL} ${bookName}\n\n${charactersInfo}\n\n---\n\n${chaptersInfo}`;
        
        const fullBookPath = getFullBookPath(bookName);
        const createdFile = await app.vault.create(fullBookPath, fileContents);

        await addFullBookFrontmatter(createdFile, bookName);

        return true;
    }

    async function main() {
        const booksFolder = app.vault.getFolderByPath(BOOKS_FOLDER_NAME);
        const myScriptsFolder = app.vault.getFolderByPath(MY_SCRIPTS_FOLDER_NAME);

        if (!booksFolder) {
            new Notice(`Warning: "${BOOKS_FOLDER_NAME}" folder cannot be found`);
            return;
        }

        if (!myScriptsFolder) {
            new Notice(`Warning: "${MY_SCRIPTS_FOLDER_NAME}" folder cannot be found`);
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