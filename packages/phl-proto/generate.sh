SRC_DIR="./src/protos"
DST_DIR="./src/generated"
NAME="library"

rm -rf $DST_DIR && mkdir $DST_DIR

echo generating code from $SRC_DIR/$NAME.proto ...

protoc --proto_path=$SRC_DIR --rust_out=$DST_DIR $SRC_DIR/$NAME.proto

bun x pbjs -t static-module -w es6 -o $DST_DIR/$NAME.js $SRC_DIR/$NAME.proto
bun x pbts -o $DST_DIR/$NAME.d.ts $DST_DIR/$NAME.js

echo done
