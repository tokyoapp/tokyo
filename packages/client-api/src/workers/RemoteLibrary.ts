/// <reference lib="webworker" />

import * as Comlink from 'comlink';

export default class Obj {
  static counter = 0;

  static inc(n = 1) {
    this.counter += n;
  }
}

Comlink.expose(Obj);
