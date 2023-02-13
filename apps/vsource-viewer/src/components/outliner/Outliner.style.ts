import {css} from 'lit-element';

export default css`
:host {
    width: 100%;
    font-size: 13.3px;
    font-weight: 300;
    user-select: none;
    border-radius: 4px;
    backdrop-filter: blur(12px);
    overflow: hidden;
    display: grid;
    grid-template-rows: auto 1fr;
}

.root {
    height: 100%;
    overflow-y: scroll;
}

.placeholder {
    width: 100%;
    padding: 15px;
    text-align: center;
    display: block;
    box-sizing: border-box;
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

.item {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0 0 15px;
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
    background: var(--gyro-pallate-highlight);
}

.item[selected]::before {
    background: var(--gyro-pallate-highlight);
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
    font-size: 12px;
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
    margin-left: 18px;
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
    --icon-size: 16px;
    padding: 4px;
    min-width: 0;
    height: auto;
    width: auto;
    margin-right: 4px;
    background: transparent;
}

.item[children="0"] .collapse-btn {
    display: none;
}
`;