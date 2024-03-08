# Shakespeare to Obsidian

## Description

- This program creates an Obsidian vault that contains Shakespeare works as markdown files.

## Instructions to Run the Script


### 1. Check Python Version:

- Ensure that you have Python 3 installed on your machine, with a version equal to or greater than 3.6.
- To verify if Python is installed, open your terminal or command prompt and run either of the following commands:

```
python --version
```

or

```
python3 --version
```

- Choose the appropriate command depending on which one is installed on your system.

### 2. Generate a Vault:

- Change your current directory to the parent directory of `create_vault`.
- Execute the script with the following command:

```
python create_vault /path/to/shakespeare/markdown/files/folder
```

- Replace `/path/to/shakespeare/markdown/files/folder` with the path to the folder containing your Markdown files.
- The generated vault will be located in the parent directory of the input Markdown folder.
Optional Output Directory:

### 3. Optional Output Directory:

- If you wish to specify a different folder for the vault to be generated, you can use the `--output-dir` option.
- For example, to specify a custom output directory:

```
python create_vault /path/to/shakespeare/markdown/files/folder --output-dir=/path/to/destination/folder
```

- Replace `/path/to/destination/folder` with the desired path where you want the vault to be generated.

### 4. Getting Help:

- To access help documentation and learn about available options and usage of the script, you can use the following command:

```
python create_vault --help
```

<a href="https://www.buymeacoffee.com/severdia" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>


