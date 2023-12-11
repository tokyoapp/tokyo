![Preview](./docs/Inspect_View.png)

<center>
  <h1>
    TOKYO
    <span style="font-size: 12px">(working title)</span>
  </h1>
</center>

Tokyo is a Work in Progress professional Photo Editor built on Rust and Solid.JS. It runs on all platforms including iOS, Mac, Windows, Linux.

Tokyo does not care about where your photos are stored, accessing them should be easy and fast. They can be on your local machine or on a NAS, escaping from the Cloud-only solutions, without leaving its benefits behind. Tokyo will still sync all your edits and presets between devices.

Tokyo tykes you from accessing your photos to editing them, to exporting them, all in one place, from any device.

## Architecture

The desktop and mobile app is built on Tauri, a lightweight Rust framework for building multi-platform frontends, with a Solid.JS frontend.

> The apps can dig into your computer or check out stuff from a faraway library server. All those libraries are chillin' in an Sqlite database. And, just so you know, the clients and server shoot the breeze using protobufs. -- gpt3

## Development

Used tools and versions are pinned in [.rtx.toml](./.rtx.toml).

Requirements:

- [bun](https://bun.sh/)
- [rust](https://rustup.rs/)
- [pnpm](https://pnpm.io/)
- [task](https://taskfile.dev/)
- [protoc](https://grpc.io/docs/protoc-installation/)

All can automatically be installed using [RTX](https://github.com/jdx/rtx) with:

```sh
task setup
```

#### Running the desktop app:

```sh
task dev
```

### Packages

- `apps/app` - The desktop and mobile app
- `apps/library` - A headless server
- `apps/website` - The landing page
- `packages/client-api` - Typescript API client
- `packages/phl-library` - The core handling libraries and files
- `packages/proto` - Protobuf definitions
- `packages/shadow` - Image manipulation library
- `packages/ui` - User Interface components
