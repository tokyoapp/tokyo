struct Params {
    amount: f32,
}

@group(0) @binding(0)
var input_texture: texture_2d<f32>;

@group(0) @binding(1)
var output_texture: texture_storage_2d<rgba32float, write>;

@group(0) @binding(2)
var<uniform> params: Params;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dimensions = textureDimensions(input_texture);
    let coords = vec2<i32>(i32(global_id.x), i32(global_id.y));

    if (global_id.x >= dimensions.x || global_id.y >= dimensions.y) {
        return;
    }

    let center_color = textureLoad(input_texture, coords, 0);

    // Sample neighboring pixels for sharpening kernel
    let left = textureLoad(input_texture, vec2<i32>(max(coords.x - 1, 0), coords.y), 0);
    let right = textureLoad(input_texture, vec2<i32>(min(coords.x + 1, i32(dimensions.x) - 1), coords.y), 0);
    let top = textureLoad(input_texture, vec2<i32>(coords.x, max(coords.y - 1, 0)), 0);
    let bottom = textureLoad(input_texture, vec2<i32>(coords.x, min(coords.y + 1, i32(dimensions.y) - 1)), 0);

    // Calculate laplacian (edge detection)
    let laplacian = center_color * 4.0 - left - right - top - bottom;

    // Apply sharpening: original + amount * laplacian
    let sharpened_color = center_color + laplacian * params.amount;

    // Clamp to [0.0, 1.0] range
    let final_color = clamp(sharpened_color, vec4<f32>(0.0), vec4<f32>(1.0));

    textureStore(output_texture, coords, final_color);
}
