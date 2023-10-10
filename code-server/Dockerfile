FROM codercom/code-server:latest

COPY ./uvls-code-0.0.11.vsix .
RUN code-server --install-extension ./uvls-code-0.0.11.vsix
