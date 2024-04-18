/*
This script removes speech line numbers.
*/

module.exports = async (params) => {
    const {app, obsidian, quickAddApi} = params;
    const MY_SCRIPTS_FOLDER_NAME = 'My Scripts';
    const HIGHLIGHT_MARKER = '==';
    
    class LineNumberRemover {

        constructor() {
            this.myScriptsFolder = app.vault.getFolderByPath(MY_SCRIPTS_FOLDER_NAME);

            if (!this.myScriptsFolder) {
                new Notice(`Warning: "${MY_SCRIPTS_FOLDER_NAME}" folder cannot be found`);
                return;
            }
        }

        async chooseFullBookFromModal() {
            const fullBooksNames = [];
    
            for (const child of this.myScriptsFolder.children) {
                if (child instanceof obsidian.TFile && !child.name.startsWith('+') && child.name.endsWith('.md')) {
                    fullBooksNames.push(child.name.slice(0, -3));
                }
            }
    
            fullBooksNames.sort();
    
            return await quickAddApi.suggester(fullBooksNames, fullBooksNames);
    
        }

        async removeLineNumbers() {

            const fullBookName = await this.chooseFullBookFromModal();

            if (!fullBookName) return;

            const fullBookPath = `${MY_SCRIPTS_FOLDER_NAME}/${fullBookName}.md`;
            const fullBookFile = app.vault.getFileByPath(fullBookPath);
            
            if (!fullBookFile) {
                console.error(`"${fullBookPath}" file does not exist`);
                return;
            }

            app.vault.process(fullBookFile, (fileContents) => {
                const lines = fileContents.split('\n');
                const changedLines = [];

                for (const line of lines) {
                    if (line.startsWith(HIGHLIGHT_MARKER)) {
                        const highlightEndIndex = line.indexOf(HIGHLIGHT_MARKER, HIGHLIGHT_MARKER.length);

                        if (highlightEndIndex !== -1) {
                            const lineNumber = parseInt(line.slice(HIGHLIGHT_MARKER.length, highlightEndIndex), 10);
                            if (!isNaN(lineNumber)) {
                                const newLine = line.slice(highlightEndIndex + HIGHLIGHT_MARKER.length);
                                changedLines.push(newLine);
                                continue;
                            }
                        }
                    }

                    changedLines.push(line);
                    
                }

                return changedLines.join('\n');
            });

            new Notice(`Line numbers removed successfully`);
        }
    }

    const remover = new LineNumberRemover();
    await remover.removeLineNumbers();
};