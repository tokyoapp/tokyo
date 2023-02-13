import { Texture } from "../materials/Texture.js";

export class Shader {
  static jsObjectToGLSLStruct(name, obj) {
    let str = `struct ${name} {`;
    for (let key in obj) {
      str += obj[key] + " " + key;
    }
    return str + "}";
  }

  static vertexSource() {}
  static fragmentSource() {}

  get vertexShader() {
    return this._vertShader;
  }
  get fragementShader() {
    return this._fragShader;
  }

  get uniforms() {
    return this._uniforms;
  }
  get attributes() {
    return this._attributes;
  }

  get source() {
    return [this.constructor.vertexSource(), this.constructor.fragmentSource()];
  }

  constructor() {
    this._vertShader = null;
    this._fragShader = null;

    this._uniforms = null;
    this._attributes = null;

    this.drawmode = "TRIANGLES";

    this.program = null;
    this.gl = null;

    this.initialized = false;

    this.cache = {
      material: {},
      objects: {},
    };
  }

  cacheUniform(key, value) {
    let cache = this.cache;
    let matched = false;

    if (value.length && value.length <= 4) {
      value = (value[0] || 0) + (value[1] || 0) + (value[2] || 0) + (value[3] || 0);
    } else if (value.length && value.length > 4) {
      value =
        (value[0] || 0) +
        (value[1] || 0) +
        (value[2] || 0) +
        (value[3] || 0) +
        (value[4] || 0) +
        (value[5] || 0) +
        (value[6] || 0) +
        (value[7] || 0) +
        (value[8] || 0) +
        (value[9] || 0) +
        (value[10] || 0) +
        (value[11] || 0) +
        (value[12] || 0) +
        (value[13] || 0) +
        (value[14] || 0) +
        (value[15] || 0) +
        (value[16] || 0);
    }

    matched = cache[key] === value;
    cache[key] = value;

    return matched;
  }

  setUniforms(attributes, target) {
    const uniforms = this._uniforms;
    const gl = this.gl;

    for (let key in attributes) {
      let opt = key;

      if (target != null) {
        opt = target + "." + key;
      }

      const value = attributes[key];
      const uniform = uniforms[opt];

      if (this.cacheUniform((target || "") + key, value)) continue;

      if (Array.isArray(value)) {
        // catch 2d array matrix
        if (Array.isArray(value[0])) {
          const size = value.length;
          gl["uniformMatrix" + size + "fv"](uniform, false, value.flat());
        } else if (value.length === 4) {
          gl.uniform4fv(uniform, value);
        } else if (value.length === 3) {
          gl.uniform3fv(uniform, value);
        } else if (value.length === 4 * 4) {
          gl["uniformMatrix4fv"](uniform, false, value.flat());
        } else {
          gl.uniform2fv(uniform, value);
        }
      } else {
        const type = typeof value;
        switch (type) {
          case "number":
            gl.uniform1f(uniform, value);
            break;
          case "boolean":
            gl.uniform1i(uniform, value);
            break;
        }
      }
    }
  }
}
