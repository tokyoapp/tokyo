FROM rust:1.61.0 as builder

WORKDIR /usr/src/library

COPY . .

RUN cargo build --release


FROM debian:buster-slim

RUN apt-get update & rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local/cargo/bin/library /usr/local/bin/library

CMD ["library"]
