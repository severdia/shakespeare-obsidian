from .settings import FULL_BOOK_FILE_NAME
from .characters import build_character_bulleted_item

class FullBookFileWriter:

    def __init__(self, book_info):
        self.input_book_path = book_info.get('input_book_path')
        self.output_book_path = book_info.get('output_book_path')
        self.book_characters = book_info.get('book_characters')
        self.chapters_info = book_info.get('chapters_info')
        self.obsidian_paths = book_info.get('obsidian_paths')


    def generate_file(self):
        input_full_book_file = self.input_book_path / f'{FULL_BOOK_FILE_NAME}.md'
        output_full_book_file = self.output_book_path / f'{FULL_BOOK_FILE_NAME}.md'

        chapter_paragraphs_dict = {file_path.name: file_data['paragraphs'] for file_path, file_data in self.chapters_info.items()}

        with input_full_book_file.open('rt', encoding='utf-8') as input_file:
            lines = input_file.readlines()
            
            with output_full_book_file.open('wt', encoding='utf-8') as output_file:
                link_prefix = '![['

                for line in lines:
                    if line.startswith(link_prefix):
                        file_name = line.strip()[3:-2]

                        if file_name.startswith('+'):
                            self._generate_characters(output_file)
                        else:
                            self._generate_chapter_contents(file_name, output_file, chapter_paragraphs_dict)
                        
                    else:
                        output_file.write(line)


    def _generate_chapter_contents(self, file_name, output_file, chapter_paragraphs_dict):
        file_stem = file_name[:-3]

        output_file.write(f'---\n\n')

        book_obsidian_path = self.obsidian_paths['book_path']
        chapter_obsidian_path = f'{book_obsidian_path}/{file_stem}'
        chapter_link = f'[[{chapter_obsidian_path}|{file_stem}]]'

        output_file.write(f'### {chapter_link}\n\n')

        chapter_info = chapter_paragraphs_dict.get(file_name, {})
        chapter_paragraph_ids = sorted([paragraph_data['paragraph_number'] for paragraph_data in chapter_info.values()])

        for paragraph_id in chapter_paragraph_ids:
            output_file.write(f'![[{chapter_obsidian_path}#{paragraph_id}]]\n\n')

    
    def _generate_characters(self, output_file):
        characters_obsidian_path = self.obsidian_paths['characters_file_path']
        characters_link = f'[[{characters_obsidian_path}|Dramatis Personae]]'
        output_file.write(f'### {characters_link}\n\n')

        for character_info in self.book_characters.values():
            character_bulleted_item = build_character_bulleted_item(character_info, self.obsidian_paths)
            output_file.write(character_bulleted_item + '\n')

        output_file.write(f'\n')