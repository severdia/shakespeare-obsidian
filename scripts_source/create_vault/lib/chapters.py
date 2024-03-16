from collections import defaultdict

from .settings import CHARACTERS_FILE_NAME, FULL_BOOK_FILE_NAME
from .utils import copy_file

class ChapterInfoRetriever:

    def __init__(self, input_chapter_path):
        self.input_chapter_path = input_chapter_path

    def retrieve_chapter_info(self, characters_info=None):
        chapter_info = {}

        with self.input_chapter_path.open('rt', encoding='utf-8') as f:
            lines = f.readlines()

            chapter_info['paragraphs'] = self._get_paragraphs_info(lines, characters_info)

        return chapter_info
    

    def _get_paragraphs_info(self, lines, characters_info=None):
        """
        Get information about all paragraphs in a chapter as a dictionary.
        The key of the dictionary is a file line number.
        The value of the dictionary is a dictionary itself containing data about paragraph.
        """
        
        paragraphs_info = defaultdict(dict)

        # filter the yaml metadata, main header and navigation at the top and bottom
        filter_start_index, filter_end_index = self._get_navigation_indexes(lines)

        paragraph_number = 1
        prev_line = None

        for line_number, line in enumerate(lines):
            line = line.strip()
            if (line_number <= filter_start_index # ignore everything before top navigation
                or line_number >= filter_end_index): # ignore everything after bottom navigation
                prev_line = None
            elif not line: # if line is empty
                prev_line = line
            else: # if line is not empty
                if not prev_line: # if previous line is empty string or None
                    paragraphs_info[line_number]['paragraph_number'] = paragraph_number
                    paragraph_number += 1

                    paragraph_characters = []
                    for char_info in characters_info:
                        if line.startswith('**') and line.endswith('**') and line[2: -2] in char_info['roles']:
                            paragraph_characters.append(char_info)

                    paragraphs_info[line_number]['characters'] = paragraph_characters
                    
                prev_line = line

        return paragraphs_info
    

    def _get_navigation_indexes(self, file_lines):
        filter_start_index = 0 # the first line that starts with [[ is the navigation at the top
        filter_end_index = -1 # # the last line that starts with [[ is the navigation at the bottom

        for index, l in enumerate(file_lines):
            if l.startswith('[['):
                if filter_start_index == 0:
                    filter_start_index = index
                else:
                    filter_end_index = index

        return filter_start_index, filter_end_index


def retrieve_book_chapters_info(input_book_path, characters_info=None):
    chapters_info = {}

    # create chapter files
    for chapter_file in input_book_path.iterdir():
        if chapter_file.is_file() and chapter_file.suffix == '.md' and not chapter_file.name.startswith('+'):
            chapter_info_retriever = ChapterInfoRetriever(chapter_file)
            chapters_info[chapter_file] = chapter_info_retriever.retrieve_chapter_info(characters_info)

    return chapters_info



class ChapterGenerator:

    def __init__(self, book_info):
        self.input_book_path = book_info.get('input_book_path')
        self.output_book_path = book_info.get('output_book_path')
        self.chapters_info = book_info.get('chapters_info')
        self.book_characters = book_info.get('book_characters')
        self.obsidian_paths = book_info.get('obsidian_paths')


    def generate_book_chapters(self):
        # create chapter files
        for input_file in self.input_book_path.iterdir():
            if input_file.stem in [CHARACTERS_FILE_NAME, FULL_BOOK_FILE_NAME]:
                continue
            elif input_file.name.startswith('+'): # files that are not chapter files
                copy_file(input_file, self.output_book_path)
            else:
                chapter_info = self.chapters_info[input_file]
                self._create_chapter_file(input_file, chapter_info)


    def _create_chapter_file(self, input_file, chapter_info):
        output_file = self.output_book_path / input_file.name
        chapter_paragraph_info = chapter_info['paragraphs']
        
        with output_file.open('wt', encoding='utf-8') as output_file_obj, input_file.open('rt', encoding='utf-8') as input_file_obj:
            lines = input_file_obj.readlines()

            for line_number, line in enumerate(lines):
                if line_number in chapter_paragraph_info: # create a header for paragraph
                    paragraph_number = chapter_paragraph_info[line_number]['paragraph_number']
                    header = f"###### {paragraph_number}\n"
                    output_file_obj.write(header)

                output_file_obj.write(line)