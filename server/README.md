# amizade-bot-arbitrage (server)

[![Moleculer](https://badgen.net/badge/Powered%20by/Moleculer/0e83cd)](https://moleculer.services)

This is a [Moleculer](https://moleculer.services/)-based microservices project. Generated with the [Moleculer CLI](https://moleculer.services/docs/0.14/moleculer-cli.html).

## Setup

Run the `bin/setup` script.

## Usage

Start the project with `npm run dev` command.
After starting, open the <http://localhost:3003/> URL in your browser.

## Useful links

- Moleculer website: <https://moleculer.services/>
- Moleculer Documentation: <https://moleculer.services/docs/0.14/>

## NPM scripts

- `npm run dev`: Start development mode (load all services locally with hot-reload & REPL)
- `npm run start`: Start production mode (set `SERVICES` env variable to load certain services)
- `npm run cli`: Start a CLI and connect to production. Don't forget to set production namespace with `--ns` argument in script
- `npm run lint`: Run ESLint
- `npm run ci`: Run continuous test mode with watching
- `npm test`: Run tests & generate coverage report
- `npm run dc:up`: Start the stack with Docker Compose
- `npm run dc:down`: Stop the stack with Docker Compose
- `npm run db:migrate`: Run pending migrations
