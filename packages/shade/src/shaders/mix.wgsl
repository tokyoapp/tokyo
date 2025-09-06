struct Params {
    factor: f32,
}

@group(0) @binding(0)
var input_texture: texture_2d<f32>;

@group(0) @binding(1)
var output_texture: texture_storage_2d<rgba32float, write>;

@group(0) @binding(2)
var<uniform> params: Params;

// Note: For a proper mix operation, we would need a second input texture
// This shader assumes the second input is stored elsewhere or passed differently
// For now, we'll mix with a default color or the input itself

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dimensions = textureDimensions(input_texture);
    let coords = vec2<i32>(i32(global_id.x), i32(global_id.y));

    if (global_id.x >= dimensions.x || global_id.y >= dimensions.y) {
        return;
    }

    let input_color = textureLoad(input_texture, coords, 0);

    // For demonstration, mix with a neutral gray color
    // In a real implementation, this would be a second input texture
    let mix_color = vec4<f32>(0.5, 0.5, 0.5, 1.0);

    // Apply mix operation: mix(a, b, factor) = a * (1 - factor) + b * factor
    let mixed_color = vec4<f32>(
        mix(input_color.r, mix_color.r, params.factor),
        mix(input_color.g, mix_color.g, params.factor),
        mix(input_color.b, mix_color.b, params.factor),
        mix(input_color.a, mix_color.a, params.factor)
    );

    textureStore(output_texture, coords, mixed_color);
}
