SRC_DIR="./src/protos"
DST_DIR="./src/generated"

rm -rf $DST_DIR && mkdir $DST_DIR

protoc --pyi_out=$DST_DIR --proto_path=$SRC_DIR --python_out=$DST_DIR $SRC_DIR/hello.proto

npx pbjs -t static-module -w es6 -o $DST_DIR/hello.js $SRC_DIR/hello.proto && pbts -o $DST_DIR/hello.d.ts $DST_DIR/hello.js
