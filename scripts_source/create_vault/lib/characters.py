from collections import OrderedDict

from .settings import CHARACTERS_FOLDER_NAME, CHARACTERS_FILE_NAME


class CharactersInfoRetriever:
    def __init__(self, input_book_path, book_obsidian_path):
        self.input_book_path = input_book_path
        self.book_obsidian_path = book_obsidian_path
        self._characters_info = None

    
    def retrieve_characters_info(self):
        characters_info = []

        # read character complete names from characters file
        complete_names = self._get_characters_complete_names()
        
        for complete_name in complete_names:
            roles = self._get_character_roles(complete_name)

            characters_info.append({
                'complete_name': complete_name,
                'name': self._get_character_name(complete_name),
                'roles': roles,
            })

        # cache names
        self._characters_info = characters_info

        return characters_info


    def get_book_characters(self, chapters_info):
        characters = OrderedDict()

        characters_info = self._characters_info if self._characters_info is not None else self.retrieve_characters_info()

        for char_info in characters_info:
            complete_name = char_info['complete_name']
            character_speeches = self._find_character_speeches(char_info, chapters_info, self.input_book_path)

            characters[complete_name] = {
                'complete_name': complete_name,
                'name': char_info['name'],
                'roles': char_info['roles'],
                'speeches': character_speeches,
                'speech_count': sum(len(speech_list) for speech_list in character_speeches.values()),
                'obsidian_path': f'{self.book_obsidian_path}/{complete_name}',
            }

        return characters


    def _get_characters_complete_names(self):
        names = []

        # characters file contains the list of all book characters ("+Dramatis Personae.md")
        book_characters_file = self.input_book_path / f'{CHARACTERS_FILE_NAME}.md'

        if not book_characters_file.exists():
            return names

        bullet_prefix = '- '
        with book_characters_file.open('rt', encoding='utf-8') as f:
            for line in f:
                if line.startswith(bullet_prefix):
                    names.append(line[2:].strip())

        return names
    
    def _get_character_name(self, complete_name):
        try:
            first_parenthesis = complete_name.rindex('(')
            character_name = complete_name[:first_parenthesis]
        except ValueError:
            character_name = complete_name
            
        return character_name.strip()


    def _get_character_roles(self, complete_name):
        # complete_name has a pattern like this: "PART_OF_NAME (PART_OF_NAME){0,1} (role; role*)"

        try:
            roles_start = complete_name.rindex('(')
            roles_end = complete_name.rindex(')')
        except ValueError:
            return []
        

        roles_string = complete_name[roles_start + 1: roles_end]

        roles = [role.strip() for role in roles_string.split(';')]

        return roles


    def _find_character_speeches(self, char_info, chapters_info, input_book_path):
        character_speeches = {}
        for chapter_file in sorted(input_book_path.iterdir()): # use sorted() to order files by name
            if chapter_file.is_file() and chapter_file.suffix == '.md' and not chapter_file.name.startswith('+'):
                speeches = self._find_character_speeches_in_chapter(char_info, chapters_info, chapter_file, input_book_path)
                character_speeches[chapter_file] = speeches

        return character_speeches


    def _find_character_speeches_in_chapter(self, char_info, chapters_info, chapter_file, input_book_path):
        speeches = []

        chapter_paragraph_info = chapters_info[chapter_file]['paragraphs']

        with chapter_file.open('rt', encoding='utf-8') as f:
            for line_number, line in enumerate(f):
                line = line.strip()
                if line_number in chapter_paragraph_info and char_info in chapter_paragraph_info[line_number]['characters']:
                    speech_number = chapter_paragraph_info[line_number]['paragraph_number']
                    speech_obsidian_path = f'{self.book_obsidian_path}/{chapter_file.stem}#{speech_number}'
                    speeches.append(speech_obsidian_path)

        return speeches


def build_character_bulleted_item(character_info, book_obsidian_paths):
    BULLET_PREFIX = '- '

    character_has_speeches = character_info['speech_count'] > 0
    character_complete_name = character_info['complete_name']
    character_name = character_info['name']
    character_roles_string = '; '.join(character_info['roles'])
    
    if character_has_speeches:
        char_folder_obsidian_path = book_obsidian_paths['characters_folder_path']
        character_obsidian_path = f'{char_folder_obsidian_path}/{character_complete_name}'
        bulleted_item = f'{BULLET_PREFIX}[[{character_obsidian_path}|{character_name}]] *({character_roles_string})*'
    else:
        bulleted_item = f'{BULLET_PREFIX}{character_name} *({character_roles_string})*'

    return bulleted_item


class CharactersFileWriter:
    
    def __init__(self, book_info):
        self.input_book_path = book_info.get('input_book_path')
        self.output_book_path = book_info.get('output_book_path')
        self.book_characters = book_info.get('book_characters')
        self.obsidian_paths = book_info.get('obsidian_paths')

    
    def generate_characters_file(self):
        input_characters_file = self.input_book_path / f'{CHARACTERS_FILE_NAME}.md'
        output_characters_file = self.output_book_path / f'{CHARACTERS_FILE_NAME}.md'

        with input_characters_file.open('rt', encoding='utf-8') as input_file:
            lines = input_file.readlines()
            
            with output_characters_file.open('wt', encoding='utf-8') as output_file:
                BULLET_PREFIX = '- '

                for line in lines:
                    if line.startswith(BULLET_PREFIX):
                        character_complete_name = line[2:].strip()

                        if self.book_characters.get(character_complete_name) is None: # if it's a bulleted line that is not a character
                            output_file.write(line)
                        else:
                            character_info = self.book_characters[character_complete_name]
                            character_bulleted_item = build_character_bulleted_item(character_info, self.obsidian_paths)
                            output_file.write(character_bulleted_item + '\n')
                    else:
                        output_file.write(line)


class CharacterGenerator:
    def __init__(self, book_info):
        self.output_book_path = book_info.get('output_book_path')
        self.book_characters = book_info.get('book_characters')
        self.obsidian_paths = book_info.get('obsidian_paths')

    def generate_character_files(self):
        """
        for every character in a book (for example: Hamlet is a character in "Hamlet" book)
        generate a separate file and in this file include all character speeches from the book
        """

        # crate 'characters' folder
        characters_folder = self.output_book_path / CHARACTERS_FOLDER_NAME
        characters_folder.mkdir()

        # create a file for every character
        for character_complete_name, character_info in self.book_characters.items():
            self._generate_character_file(character_complete_name, character_info, characters_folder)


    def _generate_character_file(self, character_complete_name, character_info, characters_folder):
        character_file = characters_folder / f'{character_complete_name}.md'

        # check if character have at least one speech, otherwise don't create a character file
        if character_info['speech_count'] < 1:
            return
        
        with character_file.open('wt', encoding='utf-8') as f:
            for chapter_file, speeches_list in character_info['speeches'].items():
                if not speeches_list:
                    continue
                
                book_obsidian_path = self.obsidian_paths['book_path']
                chapter_link = f'[[{book_obsidian_path}/{chapter_file.stem}|{chapter_file.stem}]]'

                f.write(f'### {chapter_link}\n\n')

                for speech_link in speeches_list:
                    f.write(f'![[{speech_link}]]\n\n')
