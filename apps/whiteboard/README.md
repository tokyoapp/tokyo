# Whiteboard App

Use to collect or organsie concept pieces.

### Features:
- *NativeFilesystemAPI*
- *URL and data URIS*
- *Freely Movable Elements*
- *Color Picker from anywhere on the canvas*
- *Move Selected Image with Arrow Keys*
- *Click through images if its selected*
- *Select and move multiple elements*
- *Delete items from recent files*
- *Copy paste in canvas images*
- *Open recent files again*
- *Handle missing files/not found*
- *Light theme*
- *Moulize the drawing function somehow*
- *Stroke Preview in canvas for pixel output*
- *Toolsbar*
- *Color Picker cursor, make a cursor canvas with color hex code and more info (on key hold, not a seperate tool)*
- *Keyboard shortcut explainer*
- *Settings Tab in home, for theme and other app settings*
- *Touch Input*
- *Context Menu*
- *Rework selection, draw the selection around the selected nodes, not just around the image directly.*
- *Text Elements*
    - *font settings menu ui*
- *copy colors codes with color picker*
- *Prevent page reload if not saved*

- Drawing Features (ontop of everything)
    - *vector based*
    - *easily saveable to file*
    - Pen featuers like pressure
    - line smoothing
- *Rework mouse input handler*
    - ?Make a node class with click, focus, etc. handlers?
        - That then extend for each node type
    - *Make Diagramm for mouse input, and model a system after that diagram*
- scale whole selection
- save form for folder to save to and name

### Post Feature Lock

- Process other file formats too
    - *Corel*
    - TIFF
    - Photoshop
    - Illustrator
    - Clip
- Crop Images
- Load Images in workers and send them to Renderer Thread
    - Loading animation on images not loaded yet
- browser support (mobile (ipad))
    - backup for of NativeFilesystemAPI isnt available

- for saving: push canvas state to worker and let the worker save the file to disk
- Dont update points that are not in view
- Snapping
- Template selection for pixel resolution preview
- Board sharing service
    - P2P live canvas sharing
- Markdown processing for text nodes (https://spec.commonmark.org/0.29/)

https://luckydye.github.io/whiteboard/public/

## Mouse Feedback

-> Hover -> Active -> Focus -> Blur

- hovered element [null|node]
    - also active [null|node]
- current focused element: [null|node]
- last element/blured element: [null|node]

## Touch Feedback

- Pan: 1 Finger move
- Pinch: 2 Finger pinch
- Move nodes when they are in focus and on one finger move
- Focus node with 1 finger click

