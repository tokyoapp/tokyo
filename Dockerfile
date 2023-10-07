FROM luckydye/build-utils as builder

RUN apt install unzip
RUN rtx use rust@latest

WORKDIR /app

COPY . .

# RUN export PATH=~/.local/share/rtx/shims:$PATH
RUN task setup library:install

FROM debian:buster-slim

RUN apt-get update & apt-get install -y extra-runtime-dependencies & rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/bin/library /usr/local/bin/library

CMD ["library"]
