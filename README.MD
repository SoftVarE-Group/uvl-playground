# UVL Playground

[![Website https://590c9306-8ced-48f6-85f2-bb8caa1bfd52.ul.bw-cloud-instance.org/](https://img.shields.io/website-up-down-green-red/https/perso.crans.org.svg)](https://590c9306-8ced-48f6-85f2-bb8caa1bfd52.ul.bw-cloud-instance.org/)

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

Currently, the language server as well as the website are hosted on the same server. To change that, you need to follow these steps:

- set up your new host instance
  - - install and configure docker (must run without sudo) (version 20.10.24 has a bug, so make sure to install a newer version)
  - create ssh key
- change the `SSH_PRIVATE_KEY` github secret to the new private key
- change the variables for hostname, username, email and working directory on the server at the beginning of the workflow files under `.github/workflows`
