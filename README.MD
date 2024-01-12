# UVL Playground

Production [![Production Website uvl.uni-ulm.de/](https://img.shields.io/website-up-down-green-red/https/perso.crans.org.svg)](https://uvl.uni-ulm.de/)

Development [![Development Website https://7470a63e-7b47-4833-a06c-1513f4fc534d.ul.bw-cloud-instance.org/](https://img.shields.io/website-up-down-green-red/https/perso.crans.org.svg)](https://7470a63e-7b47-4833-a06c-1513f4fc534d.ul.bw-cloud-instance.org/)

This project contains the code for the UVL playground, a small website that uses the [UVLS](https://github.com/Universal-Variability-Language/uvl-lsp) to provide syntax highlighting, autocompletion and simple analysis. It consists of static website utilizing the [monaco editor](https://github.com/microsoft/monaco-editor) und communicates via websockets with the language server by using the [monaco-languageclient package](https://github.com/TypeFox/monaco-languageclient).

## Language Server

### Updating UVLS

Compile a new UVLS executable for Linux from [source](https://github.com/Universal-Variability-Language/uvl-lsp) and replace `uvl-playground/WebSocketLanguageServer/lib/uvls`

### Local Development

Install a recent version of node and npm, change in the `WebSocketLanguageServer` directory and execute `npm install` and `npm run start:dev`.

### Deploying

When your changes are added to the master or dev branch, a github action takes care of the deployment.

## Website

### Local Development

Install a recent version of node and npm, change to the `WebSocketClient` directory and execute `npm install` and `npm run dev`.
Hint: npm run dev includes running a shell script that only works under linux. However, this only copies style files to workaround a strange error in development mode of vite. Alternatively, you can run `npm run build` to build the website and then serve the content of `./WebSocketClient/dist` with a webserver of your choice.

### Deploying

When your changes are added to the master or dev branch, a github action takes care of the deployment.

## Hosting on a different machine

To change the machine on which the playground is hosted, you need to take the following steps:

- set up your new host instance
  - install and configure docker (must run without sudo) (version 20.10.24 has a bug, so make sure to install a newer version)
  - create ssh key
- change the `SSH_PRIVATE_KEY` github secret to the new private key
- change the variables for hostname, username, email and working directory on the server at the beginning of the workflow files under `.github/workflows`

# Hosting your own uvl playground

- To host your own uvl playground setup a machine with docker
- Clone the repository
- Adapt `./WebSocketClient/src/config.ts`
- Set evn variables for example with a `.env` file with:
  - `HOSTNAME=<your hostname>
  - `EMAIL=<your email>
    (the email is used for letsencrypt)
- run `docker compose up --build -d`
- This will run the uvl playground behind a reverse proxy with letsencrypt certificates

# Hosting your own uvl playground (locally) without letsencrypt

- run `docker compose -f docker-compose-http.yaml up --build -d`

# Directory structure

## WebSocketClient

- contains the website of the playground

```
WebSocketClient
├── assets //contains all relevant pictures as well as the example and tutorial feature models
├── dark_mode_dev_env.sh //hacky script to workaround vite dev error
├── dist //contains the production build
├── Dockerfile
├── index.html
├── node_modules
├── package.json
├── package-lock.json
├── src
│   ├── config.ts //configuration for ports etc.
│   ├── ImportExportFiles.ts //functionality for up- and download of files in the editor
│   ├── intro.ts //functionality for the playground tour
│   ├── main.ts
│   ├── util.ts //mainly for error handling
│   ├── uvlTutorial.ts //functionality for the UVL Tutorial (content is in assets folder)
│   └── vite-env.d.ts
├── style
│   ├── dropdown.css //styling for the example library drop down
│   ├── split.css //styling for the split pane
│   └── style.css
└── tsconfig.json
```

## WebSocketLanguageServer

- contains the wrapper for the language server

```
WebSocketLanguageServer
├── build //contains the minified production build
│   ├── config.js
│   ├── config.js.map
│   ├── index.js
│   └── index.js.map
├── Dockerfile
├── lib
│   └── uvls //the language server executable compiled from https://github.com/Universal-Variability-Language/uvl-lsp
├── node_modules
├── package.json
├── package-lock.json
├── src
│   ├── config.ts
│   └── index.ts
└── tsconfig.json
```
