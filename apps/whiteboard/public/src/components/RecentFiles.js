import { html, render } from 'https://unpkg.com/lit-html@1.3.0/lit-html.js';
import FileSystem from '../data/FileSystem.js';
import { bitmapToBlob, formatDateTimeString } from '../utils.js';
import Notification from './Notification.js';

export class RecentFiles extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.fileList = [];
    }

    connectedCallback() {
        this.update();

        FileSystem.onReady(() => {
            this.updateFileList();
        })
    }

    updateFileList() {
        return FileSystem.getFileList().then(list => {
            this.fileList = list;
            this.update();
        })
    }

    async openFile(fileId) {
        const fileRef = await FileSystem.openFileById(fileId);
        window.openFileRef(fileRef).then(() => {
            window.closeHome();
        }).catch(err => {
            console.error(err);
            new Notification({ text: 'File not found.' }).show();
        })
    }

    async removeFile(fileId) {
        return FileSystem.removeFileById(fileId).then(() => {
            this.updateFileList();
        });
    }

    get sorting() {
        return this.shadowRoot.querySelector('#sortingSelection').value;
    }

    update() {
        render(this.render(), this.shadowRoot);
    }

    render() {
        return html`
            <link rel="stylesheet" href="./src/components/component.css"/>
            <style>
                :host {
                    display: block;
                }
                select {
                    margin-left: 10px;
                }
                .file-list {
                    overflow: auto;
                    margin-top: 15px;
                    padding-bottom: 10px;
                }
                .files {
                    display: flex;
                    min-height: 200px;
                }
                .file {
                    cursor: pointer;
                    display: block;
                    align-items: center;
                    margin-right: 10px;
                    padding: 4px;
                    position: relative;
                    border-radius: 6px;
                }
                .file .delete-btn {
                    position: absolute;
                    border-radius: 50%;
                    top: 10px;
                    right: 10px;
                    display: none;
                    justify-content: center;
                    align-items: center;
                    width: 24px;
                    height: 24px;
                    background: var(--color-header);
                }
                .file:hover .delete-btn {
                    display: flex;
                }
                .file .delete-btn:hover {
                    filter: brightness(1.1);
                }
                .file .delete-btn:active {
                    filter: brightness(1.4);
                }
                .file:hover {
                    background: rgba(127.5, 127.5, 127.5, 0.03);
                }
                .file:active {
                    background: rgba(127.5, 127.5, 127.5, 0.05);
                }
                .file .preview {
                    width: 250px;
                    height: 250px;
                    overflow: hidden;
                    border-radius: 4px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 10px;
                    box-sizing: border-box;
                    pointer-events: none;
                    border-radius: 4px;
                    border: 1px solid var(--color-header);
                    background: var(--color-background2);
                }
                .file .preview img {
                    max-height: 100%;
                    max-width: 100%;
                }
                .file .name {
                    font-size: 14px;
                    font-weight: 100;
                    margin-top: 10px;
                    margin-bottom: 5px;
                    padding: 0 5px;
                }
                .file .date {
                    font-size: 12px;
                    opacity: 0.5;
                    margin-bottom: 5px;
                    padding: 0 5px;
                }
                .nofiles {
                    opacity: 0.5;
                    align-self: center;
                    justify-self: center;
                    text-align: center;
                    width: 100%;
                }
                .sorting {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .sorting .title {
                    font-weight: 100;
                    opacity: 0.5;
                }

                ::-webkit-scrollbar {
                    width: 10px;
                    height: 10px;
                    margin: 5px 0;
                }
                ::-webkit-scrollbar-button {
                    display: none;
                }
                ::-webkit-scrollbar-track-piece  {
                    background: transparent;
                }
                ::-webkit-scrollbar-thumb {
                    background: var(--color-header);
                    border-radius: 5px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: var(--color-btn-hover);
                }
                ::-webkit-scrollbar-thumb:active {
                    background: var(--color-btn-active);
                }
                ::-webkit-scrollbar-corner {
                    background: transparent;
                }
            </style>
            <div class="sorting">
                <span class="title">Recent files</span>
                <div>
                    <a>Sort by</a>
                    <select id="sortingSelection" @change="${() => this.update()}">
                        <option value="latest">Last opened</option>
                        <option value="oldest">Oldest</option>
                        <option value="created">Created</option>
                    </select>
                </div>
            </div>
            <div class="file-list">
                <div class="files">
                    ${this.fileList.length > 0 ? [...this.fileList].sort((a, b) => {
                        if(this.sorting == "latest") {
                            return a.lastOpened - b.lastOpened;
                        }
                        if(this.sorting == "oldest") {
                            return b.lastOpened - a.lastOpened;
                        }
                        if(this.sorting == "created") {
                            return a.created - b.created;
                        }
                    }).reverse().map(file => {
                        return html`
                            <div class="file" @click="${() => this.openFile(file.id)}">
                                <div class="preview">
                                    ${[file].map(file => {
                                        const img = new Image();
                                        FileSystem.getFilePreview(file.id).then(async bitmap => {
                                            if(bitmap) {
                                                const blob = await bitmapToBlob(bitmap);
                                                img.src = URL.createObjectURL(blob);
                                            }
                                        })
                                        return img;
                                    })}
                                </div>
                                <div class="delete-btn" @click="${() => this.removeFile(file.id)}">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="18px" height="18px"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                                </div>
                                <div class="name">${file.id.replace(/\.whiteboard$/g, "")}</div>
                                <div class="date">${formatDateTimeString(file.lastOpened) || "Not opened"}</div>
                            </div>
                        `;
                    }) : html`
                        <div class="nofiles">
                            No recent files opened.
                        </div>
                    `}
                </div>
            </div>
        `;
    }

}

customElements.define('recentfiles-element', RecentFiles);
