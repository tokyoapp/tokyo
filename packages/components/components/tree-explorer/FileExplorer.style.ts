import { css } from 'lit-element';

export default css`
:host {
    position: relative;
    height: inherit;
    width: 100%;
    --display-toolbar: grid;
}

a[href] {
    color: inherit;
    text-decoration: none;
}

a[href]:hover {
    text-decoration: underline;
}

input::-webkit-inner-spin-button {
    -webkit-appearance: none;
}

input[type=text] {
    text-align: left;
}

textarea {
    width: 100%;
    min-height: 80px;
    background: var(--gyro-level3-bg);
    border: none;
    color: white;
    font-family: sans-serif;
}

input[type=range] {
    -webkit-appearance: none;
    background: transparent;
    padding: 0;
    outline: none;
    cursor: pointer;
}

input[type=range]::-webkit-slider-runnable-track:hover {
    background: var(--gyro-background);
}

input[type=range]::-webkit-slider-runnable-track {
    width: 300px;
    height: 8px;
    background: var(--gyro-background);
    border: none;
    border-radius: 3px;
}

input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    border: none;
    height: 8px;
    width: 8px;
    color: var(--gyro-accent-color);
    background: currentColor;
    border-radius: 50%;
    box-shadow: 0 0 0 2px currentColor;
}

input[type=range]:hover::-webkit-slider-thumb {
    color: var(--gyro-accent-color);
}

.toolbar {
    position: relative;
    z-index: 100;
    padding: 10px;
    box-sizing: border-box;
    display: var(--display-toolbar);
    grid-auto-flow: column;
    justify-content: flex-start;
    align-items: center;
    grid-gap: 15px;
    width: 100%;
    pointer-events: none;
    --icon-size: 13px;
}

.toolbar-row {
    display: grid;
    grid-auto-flow: column;
    grid-gap: 15px;
}

.toolbar.bottom {
    position: absolute;
    bottom: 0;
    left: 0;
}

.toolbar > * {
    pointer-events: all;
}

.toolbar span {
    z-index: 100;
    display: grid;
    grid-auto-flow: column;
    justify-content: flex-start;
    align-items: center;
    grid-gap: 5px;
}

toggle-button {
    height: 20px;
    width: 20px;
    font-family: sans-serif;
}

.tool-button {
    height: 22px;
    min-width: 20px;
    width: auto;
    padding: 4px 6px;
    margin: 0;
    box-sizing: content-box;
    font-size: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    background: rgba(51, 51, 51, 0.75);
    outline: 0;
    color: white;
    font-family: sans-serif;
    line-height: 15px;
    position: relative;
    backdrop-filter: blur(2px);
}

.tool-button:first-child {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
}

.tool-button:last-child {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
}

.tool-button::before {
    content: "";
    position: absolute;
    pointer-events: none;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: inherit;
}

.tool-button:hover::before,
.tool-button:hover::before {
    color: white;
    background: rgba(255, 255, 255, 0.1);
}

.tool-button[checked]::before,
.tool-button[active]::before,
.tool-button:active::before {
    background: rgba(255, 255, 255, 0.05);
}

.info {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    box-sizing: border-box;
    z-index: 10000;
    color: #eee;
    opacity: 0.75;
    pointer-events: none;
    user-select: text;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    background: rgba(25, 25, 25, 0.75);
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.info span {
    padding: 4px 10px;
}
.info span:not(:last-child) {
    border-right: 1px solid rgba(25, 25, 25, 0.75);
}

@keyframes loading {
    from {
        transform: rotate(0deg);
        opacity: 0;
    }
    25% {
        opacity: 1;
    }
    to {
        transform: rotate(360deg);
        opacity: 0;
    }
}

[loading]::after, [loading]::before {
    content: "";
    z-index: 100;
    border-radius: 50%;
    border: 2px solid var(--gyro-highlight);
    border-bottom-color: transparent;
    border-left-color: transparent;
    width: 30px;
    height: 30px;
    position: absolute;
    top: calc(50% - 15px);
    left: calc(50% - 15px);
}

[loading]::after {
    animation: loading 1568.63ms ease infinite;
    color: var(--gyro-highlight);
}

[loading]::before {
    animation: loading 784.32ms ease infinite;
    color: black;
}

/* Button */

button {
    border-radius: 3px;
    border: 1px solid transparent;
    box-sizing: border-box;
    outline: none;
    display: inline;
    cursor: pointer;
    padding: 0 8px;
    background: var(--explorer-item-selected);
    color: var(--gyro-pallate-text);
    height: 28px;
    box-shadow: 0px 1px 1px rgba(0, 0, 0, 0.2);
    font-family: 'Roboto', sans-serif;
}

button:hover {
    background: #575757;
}

button:active {
    background: var(--gyro-pallate-panel-header);
    border-color: var(--explorer-item-selected);
}

/* Holo Button */

.holo {
    border: 1px solid transparent;
    border-color: var(--gyro-pallate-panel-header);
    background: var(--gyro-pallate-btn-bg);
    border-radius: 4px;
}

.holo:hover {
    background: #2E2E2E;
}

.holo:active {
    background: var(--explorer-item-selected);
    border-color: transparent;
}

/* Solid Button */

button.solid {
    background: var(--gyro-pallate-accent);
    position: relative;
}

button.solid::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: white;
    opacity: 0;
    pointer-events: none;
    transition: .05s ease-out;
}

button.solid:hover::after {
    opacity: 0.1;
}
button.solid:active::after {
    transition: .01s ease-out;
    opacity: 0.2;
}

button.solid:active {
    border-color: transparent;
}

/* // Component */
:host {
    width: 100%;
    font-weight: 300;
    font-size: 14px;
    user-select: none;
    border-radius: 4px;
    backdrop-filter: blur(12px);
    overflow: hidden;
    display: grid;
    grid-template-rows: auto 1fr auto;

    --explorer-item-selected: #414141;
}

.root {
    height: 100%;
    overflow-y: scroll;
    position: relative;
    z-index: 1;
}

.search {
    padding: 10px 8px;
    background: transparent;
}

.search .search-input {
    width: 100%;
    height: 30px;
}

.toolbar {
    background: transparent;
    height: 30px;
    padding: 0 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.placeholder {
    width: 100%;
    height: 100%;
    padding: 15px;
    text-align: center;
    display: block;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    opacity: 0.5;
}

.placeholder .text {
    font-weight: 400;
    margin-top: 10px;
}

.placeholder gyro-icon {
    --icon-size: 24px;
}

check-box {
    margin-left: 5px;
}

.tree {
    height: 100%;
}

.layers {
    height: 100%;
    overflow: auto;
    width: 100%;
    box-sizing: border-box;
}

.layer {
    position: relative;
}
.layer[odd]::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    left: -100%;
    pointer-events: none;
    z-index: -1;
    background: #2A2A2A;
}
.layer[even]::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    left: -100%;
    pointer-events: none;
    z-index: -1;
    background: #262626;
}

.item {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0 0 8px;
    box-sizing: border-box;
    flex: 0;
    position: relative;
    -webkit-user-drag: element;
    --icon-size: 16px;
}

.item::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    left: -100%;
    pointer-events: none;
    z-index: -1;
    opacity: 0.25;
}

.item:hover::before {
    background: var(--explorer-item-selected);
}

.item[selected]::before {
    background: var(--explorer-item-selected);
    opacity: 1;
}

.item[target]::before {
    background: #3a3a3a;
}

.item[top]::before {
    border-top: 1px solid grey;
}

.item[bottom]::before {
    border-bottom: 1px solid grey;
}

:host([data-drag]) .title {
    pointer-events: none;
}

.title {
    font-weight: 400;
    flex: 1;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    box-sizing: border-box;
    line-height: 24px;
    margin: 2px 0;
}

.title:focus {
    outline: none;
}

.item-icon {
    margin-right: 8px;
}

.children {
    margin-left: 8px;
    padding-left: 5px;
    box-sizing: border-box;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
}

.layer[collapsed] > .children {
    height: 0;
    overflow: hidden;
}

.collapse-btn {
    font-size: 8px;
    width: 15px;
    height: 15px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 5px;
    margin-left: -3px;
    border-radius: 4px;
    cursor: pointer;
}

.collapse-btn:hover {
    background: #292929;
}

.collapse-btn:active {
    background: #1c1c1c;
}

.collapse-btn::before {
    content: "▼";
}

.layer[collapsed] > .item .collapse-btn::before {
    content: "►";
}

.icon-button {
    --icon-size: 14px;
    padding: 4px;
    min-width: 0;
    height: auto;
    width: auto;
    margin-right: 4px;
}
`;
