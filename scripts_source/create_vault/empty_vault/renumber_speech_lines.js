/*
This script organizes speech lines in book chapters by assigning them numbers. Here's how it works:

- Each speech is divided into two parts: a header and a body.
- The header contains the character's short name. It must be preceded by a newline and wrapped in **, for example: **ham**.
- The body of the speech immediately follows the header and consists of consecutive lines.
- Each line in the speech body can have a line number in the format ==<line number>==<rest of the line>.
- If a line starts with *( and ends with )*, indicating an in-speech stage direction, it won't be numbered.
- Lines starting with &emsp; (or \u2003) should have the same number as the previous speech line, even if it's from a different character's speech.


EXAMPLE:

**HIP.**                                                              <--- speech header
==7==Four days will quickly steep themselves in night;                <--- start of speech body
==8==Four nights will quickly dream away the time;
==9==And then the moon, like to a silver bow
==10==New bent in heaven, shall behold the night
==11==Of our solemnities.                                             <--- end of speech body
                                                                      <--- speech must be preceded by a newline
**THE.**
==11==           Go, Philostrate,                                     <--- speech line starting with &emsp;
==12==Stir up the Athenian youth to merriments,
*(Exit Philostrate.)*                                                 <--- in-speech stage direction
==13==Hippolyta, I woo’d thee with my sword,
==14==And won thy love doing thee injuries;
==15==But I will wed thee in another key,
==16==With pomp, with triumph, and with reveling.

*Enter Egeus and his daughter Hermia and Lysander and Demetrius.*     <--- standalone stage direction

*/

module.exports = async (params) => {
    const {app, obsidian, quickAddApi} = params;
    const MY_SCRIPTS_FOLDER_NAME = 'My Scripts';
    const H3_PREFIX = '### ';
    const HIGHLIGHT_MARKER = '==';
    const BOLD_TEXT_WRAPPER = '**';
    const INSPEECH_STAGE_DIRECTION_START = '*(';
    const INSPEECH_STAGE_DIRECTION_END = ')*';

    class SpeechLineRenumberer {
        
        constructor() {
            this.myScriptsFolder = app.vault.getFolderByPath(MY_SCRIPTS_FOLDER_NAME);

            if (!this.myScriptsFolder) {
                new Notice(`Warning: "${MY_SCRIPTS_FOLDER_NAME}" folder cannot be found`);
                return;
            }
        }


        // Reorder line numbers in a book chapter.
        async renumberSpeechLines() {
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
                
                // increment by 1 for each speech line except when line starts with &emsp;
                let currentLineNumber = 0;

                let lastEmptyLineIndex = -1;
                let lastSpeechLineIndex = -1;

                for (const [lineIndex, line] of lines.entries()) {
                    const lineInfo = {
                        lineIndex,
                        line,
                        lastEmptyLineIndex,
                        lastSpeechLineIndex,
                    }

                    const lineType = this._getLineType(lineInfo);

                    if (lineType === 'chapter_header') {
                        // reset numbering for every chapter
                        currentLineNumber = 0;
                    } else if (lineType === 'empty_line') {
                        lastEmptyLineIndex = lineIndex;
                    } else if (lineType === 'speech_header') {
                        lastSpeechLineIndex = lineIndex;
                    } else if (lineType === 'speech_line') {

                        if (this._isInspeechStageDirection(line)) {
                            changedLines.push(line);
                            lastSpeechLineIndex = lineIndex;
                            continue;
                        }

                        const trimmedLine = this._removeExistingLineNumber(line);
                        
                        let lineNumberIncrement = 1;
                        if (trimmedLine.startsWith('\u2003')) {
                            // if line starts with `&emsp;` then do not increment line number
                            lineNumberIncrement = 0;
                        }

                        currentLineNumber += lineNumberIncrement;

                        const changedLine = `${HIGHLIGHT_MARKER}${currentLineNumber}${HIGHLIGHT_MARKER}${trimmedLine}`;
                        changedLines.push(changedLine);

                        lastSpeechLineIndex = lineIndex;
                        continue;
                    }

                    changedLines.push(line);
                    
                }

                return changedLines.join('\n');
            });

            new Notice(`Speech lines renumbered successfully`);
        }


        _getLineType(lineInfo) {
            const {lineIndex, line, lastEmptyLineIndex, lastSpeechLineIndex} = lineInfo;

            let lineType = '';

            if (line.startsWith(H3_PREFIX)) { // reset numbering for every chapter
                lineType = 'chapter_header';
            } else if (line.trim() === "") {
                lineType = 'empty_line';
            } else if (line.trim().startsWith(BOLD_TEXT_WRAPPER) && 
                       line.trim().endsWith(BOLD_TEXT_WRAPPER) && 
                       lastEmptyLineIndex === lineIndex - 1) {
                lineType = 'speech_header';
            } else if (lineIndex !== 0 && lastSpeechLineIndex === lineIndex - 1) {
                lineType = 'speech_line';
            }

            return lineType;
        }

        
        _isInspeechStageDirection(line) {
            line = line.trim();
            return line.startsWith(INSPEECH_STAGE_DIRECTION_START) && line.endsWith(INSPEECH_STAGE_DIRECTION_END);
        }
        

        _getLineNumber(line) {
            let lineNumber = null;
            
            if (line.startsWith(HIGHLIGHT_MARKER)) {
                const highlightEndIndex = line.indexOf(HIGHLIGHT_MARKER, HIGHLIGHT_MARKER.length);
                
                if (highlightEndIndex !== -1) {
                    const originalLineNumber = parseInt(line.slice(HIGHLIGHT_MARKER.length, highlightEndIndex), 10);
                    if (!isNaN(originalLineNumber)) {
                        lineNumber = originalLineNumber;
                    }
                }
            }
            
            return lineNumber;
        }
        
        _removeExistingLineNumber(line) {
            let trimmedLine = line;

            const lineNumber = this._getLineNumber(line);
            
            if (lineNumber) {
                const highlightEndIndex = line.indexOf(HIGHLIGHT_MARKER, HIGHLIGHT_MARKER.length);
                trimmedLine = line.slice(highlightEndIndex + HIGHLIGHT_MARKER.length);
            }
            
            return trimmedLine;
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

    }


    const renumberer = new SpeechLineRenumberer();
    await renumberer.renumberSpeechLines();

};