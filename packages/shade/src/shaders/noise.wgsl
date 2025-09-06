struct Params {
    amount: f32,
    seed: f32,
}

@group(0) @binding(0)
var input_texture: texture_2d<f32>;

@group(0) @binding(1)
var output_texture: texture_storage_2d<rgba32float, write>;

@group(0) @binding(2)
var<uniform> params: Params;

// Simple pseudo-random number generator
fn random(co: vec2<f32>) -> f32 {
    return fract(sin(dot(co.xy, vec2<f32>(12.9898, 78.233))) * 43758.5453);
}

// Generate noise value based on coordinates and seed
fn noise(coord: vec2<f32>, seed: f32) -> f32 {
    let seeded_coord = coord + vec2<f32>(seed);
    return random(seeded_coord) * 2.0 - 1.0; // Range [-1, 1]
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dimensions = textureDimensions(input_texture);
    let coords = vec2<i32>(i32(global_id.x), i32(global_id.y));

    if (global_id.x >= dimensions.x || global_id.y >= dimensions.y) {
        return;
    }

    let input_color = textureLoad(input_texture, coords, 0);

    // Generate noise value
    let noise_coord = vec2<f32>(f32(global_id.x), f32(global_id.y)) / vec2<f32>(f32(dimensions.x), f32(dimensions.y));
    let noise_value = noise(noise_coord, params.seed) * params.amount;

    // Add noise to the input color
    let noisy_color = vec4<f32>(
        input_color.r + noise_value,
        input_color.g + noise_value,
        input_color.b + noise_value,
        input_color.a
    );

    // Clamp to [0.0, 1.0] range
    let final_color = clamp(noisy_color, vec4<f32>(0.0), vec4<f32>(1.0));

    textureStore(output_texture, coords, final_color);
}
