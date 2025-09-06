struct Params {
    value: f32,
}

@group(0) @binding(0)
var input_texture: texture_2d<f32>;

@group(0) @binding(1)
var output_texture: texture_storage_2d<rgba32float, write>;

@group(0) @binding(2)
var<uniform> params: Params;

fn rgb_to_hsv(rgb: vec3<f32>) -> vec3<f32> {
    let max_val = max(max(rgb.r, rgb.g), rgb.b);
    let min_val = min(min(rgb.r, rgb.g), rgb.b);
    let delta = max_val - min_val;

    var hue = 0.0;
    let saturation = select(0.0, delta / max_val, max_val != 0.0);
    let value = max_val;

    if (delta != 0.0) {
        if (max_val == rgb.r) {
            hue = (rgb.g - rgb.b) / delta;
            if (rgb.g < rgb.b) {
                hue += 6.0;
            }
        } else if (max_val == rgb.g) {
            hue = (rgb.b - rgb.r) / delta + 2.0;
        } else {
            hue = (rgb.r - rgb.g) / delta + 4.0;
        }
        hue /= 6.0;
    }

    return vec3<f32>(hue, saturation, value);
}

fn hsv_to_rgb(hsv: vec3<f32>) -> vec3<f32> {
    let h = hsv.x * 6.0;
    let s = hsv.y;
    let v = hsv.z;

    let c = v * s;
    let x = c * (1.0 - abs((h % 2.0) - 1.0));
    let m = v - c;

    var rgb = vec3<f32>(0.0);

    if (h < 1.0) {
        rgb = vec3<f32>(c, x, 0.0);
    } else if (h < 2.0) {
        rgb = vec3<f32>(x, c, 0.0);
    } else if (h < 3.0) {
        rgb = vec3<f32>(0.0, c, x);
    } else if (h < 4.0) {
        rgb = vec3<f32>(0.0, x, c);
    } else if (h < 5.0) {
        rgb = vec3<f32>(x, 0.0, c);
    } else {
        rgb = vec3<f32>(c, 0.0, x);
    }

    return rgb + vec3<f32>(m);
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dimensions = textureDimensions(input_texture);
    let coords = vec2<i32>(i32(global_id.x), i32(global_id.y));

    if (global_id.x >= dimensions.x || global_id.y >= dimensions.y) {
        return;
    }

    let input_color = textureLoad(input_texture, coords, 0);

    // Convert to HSV
    let hsv = rgb_to_hsv(input_color.rgb);

    // Adjust hue (params.value is in range -180 to 180 degrees, normalize to 0-1)
    let hue_shift = params.value / 360.0;
    let new_hue = fract(hsv.x + hue_shift);

    // Convert back to RGB
    let adjusted_rgb = hsv_to_rgb(vec3<f32>(new_hue, hsv.y, hsv.z));
    let final_color = vec4<f32>(adjusted_rgb, input_color.a);

    textureStore(output_texture, coords, final_color);
}
