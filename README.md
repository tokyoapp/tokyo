![Preview](./docs/Inspect_View.png)

<p align="center">
	<h1 align="center"><b>TOKYO</b> <small>(working title)</small></h1>
</p>

Tokyo is a Work in Progress professional Photo Editor built on Rust and Solid.JS. It runs on all platforms including iOS, Mac, Windows, Linux.

Tokyo does not care about where your photos are stored, accessing them should be easy and fast. They can be on your local machine or on a NAS, escaping from the Cloud-only solutions, without leaving its benefits behind. Tokyo will still sync all your edits and presets between devices.

Tokyo takes you from accessing your photos to editing them, to exporting them, all in one place, from any device.

## Architecture

The desktop and mobile app is built on Tauri, a lightweight Rust framework for building multi-platform frontends, with a Solid.JS frontend.

> The apps can dig into your computer or check out stuff from a faraway library server. All those libraries are chillin' in an Sqlite database. And, just so you know, the clients and server shoot the breeze using protobufs. -- gpt3

## Development

Used tools and versions are pinned in [.mise.toml](./.mise.toml). The tools will automatically be installed on setup if [mise](https://github.com/jdx/mise) is installed on the system.

Only [task](https://taskfile.dev/) needs to be installed to run the setup.

#### Setup

```sh
task setup
```

#### Running the desktop app:

```sh
task dev
```

### Packages

- `apps/app` - The desktop and mobile app
- `apps/server` - A headless server
- `apps/website` - The landing page

- `packages/api` - Typescript API client
- `packages/library` - Persistent structured data storage and file handling
- `packages/proto` - Protobuf definitions
- `packages/shadow` - Image manipulation library
- `packages/ui` - User Interface components
