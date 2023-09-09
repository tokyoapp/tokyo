import fs from "fs";
import proto from "proto";

export const data = {
  oneDummy: {
    messageId: 69,
    long: 12,
    lang: 12,
    someName: "Lorem Ipsum",
  },
  multipleDummy: new Array(200000).fill(1).map((n) => {
    return {
      messageId: 69,
      long: 12,
      lang: 12,
      someName: "Schmedeswurther",
    };
  }),
};

let json = JSON.stringify(data);
fs.writeFileSync("./public/json", json);

const { ComplexMessage } = proto;

const protobuf = ComplexMessage.encode(ComplexMessage.create(data)).finish();
fs.writeFileSync("./public/protobuf", protobuf);
