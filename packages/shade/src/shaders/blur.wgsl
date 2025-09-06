struct Params {
    radius: f32,
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

    let blur_radius = max(1.0, params.radius);
    let kernel_size = i32(blur_radius * 2.0) + 1;
    let half_kernel = kernel_size / 2;

    var color_sum = vec4<f32>(0.0);
    var weight_sum = 0.0;

    // Simple box blur
    for (var y = -half_kernel; y <= half_kernel; y++) {
        for (var x = -half_kernel; x <= half_kernel; x++) {
            let sample_coords = coords + vec2<i32>(x, y);

            // Clamp coordinates to texture bounds
            let clamped_coords = vec2<i32>(
                clamp(sample_coords.x, 0, i32(dimensions.x) - 1),
                clamp(sample_coords.y, 0, i32(dimensions.y) - 1)
            );

            let sample_color = textureLoad(input_texture, clamped_coords, 0);

            // Calculate weight based on distance from center
            let distance = length(vec2<f32>(f32(x), f32(y)));
            let weight = exp(-distance * distance / (2.0 * blur_radius * blur_radius));

            color_sum += sample_color * weight;
            weight_sum += weight;
        }
    }

    let final_color = color_sum / weight_sum;
    textureStore(output_texture, coords, final_color);
}
