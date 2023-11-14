# UVL Playground

Production [![Production Website https://55568392-f169-4f7f-b552-57cf451a2d81.ul.bw-cloud-instance.org/](https://img.shields.io/website-up-down-green-red/https/perso.crans.org.svg)](https://55568392-f169-4f7f-b552-57cf451a2d81.ul.bw-cloud-instance.org/)

Development [![Development Website https://7470a63e-7b47-4833-a06c-1513f4fc534d.ul.bw-cloud-instance.org/](https://img.shields.io/website-up-down-green-red/https/perso.crans.org.svg)](https://7470a63e-7b47-4833-a06c-1513f4fc534d.ul.bw-cloud-instance.org/)

This project contains the code for the UVL playground, a small website that uses the [UVLS](https://github.com/Universal-Variability-Language/uvl-lsp) to provide syntax highlighting, autocompletion and simple analysis. It consists of static website utilizing the [monaco editor](https://github.com/microsoft/monaco-editor) und communicates via websockets with the language server by using the [monaco-languageclient package](https://github.com/TypeFox/monaco-languageclient).

## Language Server

### Updating UVLS

Compile a new UVLS executable for Linux from [source](https://github.com/Universal-Variability-Language/uvl-lsp) and replace `uvl-playground/WebSocketLanguageServer/lib/uvls`

### Locale Development

Install a recent version of node and npm, change in the `WebSocketLanguageServer` directory and execute `npm run start:dev`.

### Deploying

When your changes are added to the master branch, a github action takes care of the deployment.

## Website

### Locale Development

Install a recent version of node and npm, change to the `WebSocketClient` directory and execute `npm run dev`.

### Deploying

When your changes are added to the master branch, a github action takes care of the deployment.

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

# Hosting your own uvl playground without reverse proxy

- Remove everything treafik related from the docker compose file
