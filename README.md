# node-red-opcua-x
<img src="icons/opcua-logo.png" alt="drawing" style="height:200px;"/>
<img src="images/node-red-logo.png" alt="drawing" style="height:200px;"/>

## What is
A package that handles OPC UA Client request like read, browse, write, ...

## Versioning
The following package use the semantic versioning template

`X.Y.Z`

- X is the `Major` version, when the following number change, the package can be not compatible with the previous versions
- Y is the `Minor` version, when the following number change, the package is compatible with the previous version with the same Major version
- Z is the `Patch` version, when the following number change, has the same purpose of Minor but is used for no codes change (update pipeline, wiki, references, ...)

By now the package is only use the `Minor` because is in prerelease state.
The first stable version will start from `1.0.0`

## Features

- [x] Read
- [ ] Write
- [x] Browse
- [x] Check connection status
- [x] Subscription
- [ ] Events
- [ ] Methods
- [x] Connection security access

# Getting started
From node-red search for `node-red-opcua-x`

Run command on Node-RED installation directory.
	
    npm i node-red-opcua-x

or run command for global installation.

	npm i -g node-red-opcua-x
