![Preview](./docs/Inspect_View.png)

<p align="center">
	<h1 align="center"><b>TOKYO</b> <small>(working title)</small></h1>
</p>

Tokyo is a Work in Progress professional Photo Editor built on Rust and Solid.JS. It runs on all platforms including iOS, Mac, Windows, Linux.

Tokyo does not care about where your photos are stored, accessing them should be easy and fast. They can be on your local machine or on a NAS, escaping from the Cloud-only solutions, without leaving its benefits behind. Tokyo will still sync all your edits and presets between devices.

Tokyo takes you from accessing your photos to editing them, to exporting them, all in one place, from any device. The goal is to integrate well into any workflow including other software.

## Architecture

The desktop and mobile app is built on Tauri, a lightweight Rust framework for building multi-platform frontends, with a Solid.JS frontend.

## Development

[mise](https://github.com/jdx/mise) is required to install required tools and run scripts for the project.

Or install required tools listed in `mise.yml` manually.


#### Setup

```sh
task setup
```

#### List of all available tasks:

```sh
task
```

#### Running the desktop app:

```sh
task desktop:dev
```
