# Welcome to Shakespeare Obsidian! 👋🏻

Shakespeare Obsidian is a project that makes reading, editing, or publishing editions of Shakespeare's works easier. If you're already an Obsidian user, you'll need no introduction and can just open the vault and you're ready to go. If this is your first introduction to Obsidian, it's a great tool for writing, taking notes, and managing all your scripts. Read more about Obsidian and download it for free here:

👉🏻 https://obsidian.md

🚀 Here's a great "getting started" playlist for Obsidian:

👉🏻 https://www.youtube.com/playlist?list=PL3NaIVgSlAVLHty1-NuvPa9V0b0UwbzBd

The included plays are the PlayShakespeare.com editions, which have been meticulously edited from the original sources (folios, quarto, octavo) and organized into scenes. Also included Dramatis Personae (containing short & full names for each character, including aliases and other name changes), individual pages for each character containing only that character's lines. The scenes are organized separately for easy navigation and a single page containing the entire play is also included. All lines are numbered and verse speech displays the correct indentation to show shared verse lines throughout.

You can use Shakespeare Obsidian as a tool to create custom scripts, read, search, or print the plays. Check out the Instructions here:

👉🏻 https://github.com/severdia/shakespeare-obsidian/blob/v.1/scripts_source/markdown/%2BIntroduction.md

### 🛟 Getting Help and Reporting Issues

Post any issues you find here:

👉🏻 https://github.com/severdia/shakespeare-obsidian/issues

### ☕️ Contributing

Do you want to contribute to Shakespeare Obsidian? 

<a href="https://www.buymeacoffee.com/severdia" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

---

## 🖖🏻 Generating an Obsidian Vault (Advanced Users) 

For advanced users, you can use the included script to generate the Shakespeare Obsidian vault containing markdown files.

### 1. Install/update Python:

Ensure that you have [Python 3](https://www.python.org/) installed on your machine, with a version equal to or greater than `3.6`.

To verify if Python is installed, open your terminal or command prompt and run either of the following commands:

```sh
python --version
```

Or

```sh
python3 --version
```

Choose the appropriate command (`python` or `python3`) depending on which one is installed on your system.

If Python is not installed on your system, you can acquire it by visiting the [official Python website](https://www.python.org/downloads/)


### 2. Generate a Vault:

Open terminal and change your current directory to the parent directory of `create_vault`.
Execute the script with the following command:

```sh
python create_vault markdown
```

The generated vault will be located in the parent directory of the input Markdown folder.

### 3. Optional Output Directory:

If you wish to specify a different folder for the vault to be generated, you can use the `-o` or `--output-dir` option.
For example, to specify a custom output directory run:

```sh
python create_vault markdown -o /path/to/destination/folder
```

Replace `/path/to/destination/folder` with the desired path where you want the vault to be generated.

### 4. Optional Vault Name:

If you wish to specify a vault name other than the default one, you can use the `--vault-name` option. 
For example, to specify a custom vault name run:

```sh
python create_vault markdown --vault-name "My Vault Name"
```

### 5. Getting Help:

- To access help documentation and learn about available options and usage of the script, you can use the following command:

```sh
python create_vault --help
```


