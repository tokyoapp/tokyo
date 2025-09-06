 #!/bin/bash

time ./target/release/shade -i ./example/files/\#_MGC3030.CR3 --resize-height=1000 -b=0.2 -o \#_MGC3030.png

time ./target/release/shade -i ./example/files/\#_MGC6788.CR3 --resize-height=1000 -b=0.2 -o \#_MGC6788.png

time ./target/release/shade -i ./example/files/\#Desk.exr --resize-height=1000 -b=0.2 -o \#Desk.png
