import argparse
from pathlib import Path
import shutil

from .settings import DEFAULT_OUTPUT_VAULT_NAME


def copy_file(from_file, to_folder):
    to_file = to_folder / from_file.name
    shutil.copy(from_file, to_file)


def parse_arguments():
    parser = argparse.ArgumentParser(description='Generate Obsidian vault from Shakespeare books')

    parser.add_argument('input_dir', 
                        metavar='input-dir',
                        type=Path, 
                        help='The directory where Markdown files are located')
    
    parser.add_argument('--output-dir', 
                        '-o', 
                        type=Path,
                        help='The directory where the generated vault will be stored')
    
    parser.add_argument('--vault-name',
                        type=str,
                        default=DEFAULT_OUTPUT_VAULT_NAME,
                        help='The vault name')

    args = parser.parse_args()

    input_folder = args.input_dir
    output_folder = args.output_dir if args.output_dir else args.input_dir.parent
    vault_name = args.vault_name

    return {
        'input_folder': input_folder,
        'output_folder': output_folder,
        'vault_name': vault_name,
    }