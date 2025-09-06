struct Params {
    value: f32,
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

    let input_color = textureLoad(input_texture, coords, 0);

    // Apply contrast adjustment
    // Contrast formula: (color - 0.5) * contrast + 0.5
    let contrast_factor = params.value;
    let adjusted_color = vec4<f32>(
        (input_color.r - 0.5) * contrast_factor + 0.5,
        (input_color.g - 0.5) * contrast_factor + 0.5,
        (input_color.b - 0.5) * contrast_factor + 0.5,
        input_color.a
    );

    textureStore(output_texture, coords, adjusted_color);
}
