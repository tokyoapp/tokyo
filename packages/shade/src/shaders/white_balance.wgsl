struct Params {
    auto_adjust: f32,  // 1.0 for true, 0.0 for false
    temperature: f32,  // Color temperature adjustment (-1.0 to 1.0)
    tint: f32,         // Tint adjustment (-1.0 to 1.0)
    padding: f32,
}

@group(0) @binding(0)
var input_texture: texture_2d<f32>;

@group(0) @binding(1)
var output_texture: texture_storage_2d<rgba32float, write>;

@group(0) @binding(2)
var<uniform> params: Params;

// Convert RGB to XYZ color space
fn rgb_to_xyz(rgb: vec3<f32>) -> vec3<f32> {
    let r = rgb.r;
    let g = rgb.g;
    let b = rgb.b;

    // sRGB to linear RGB
    let linear_r = select(pow((r + 0.055) / 1.055, 2.4), r / 12.92, r <= 0.04045);
    let linear_g = select(pow((g + 0.055) / 1.055, 2.4), g / 12.92, g <= 0.04045);
    let linear_b = select(pow((b + 0.055) / 1.055, 2.4), b / 12.92, b <= 0.04045);

    // Convert to XYZ using sRGB matrix
    let x = linear_r * 0.4124564 + linear_g * 0.3575761 + linear_b * 0.1804375;
    let y = linear_r * 0.2126729 + linear_g * 0.7151522 + linear_b * 0.0721750;
    let z = linear_r * 0.0193339 + linear_g * 0.1191920 + linear_b * 0.9503041;

    return vec3<f32>(x, y, z);
}

// Convert XYZ back to RGB
fn xyz_to_rgb(xyz: vec3<f32>) -> vec3<f32> {
    let x = xyz.x;
    let y = xyz.y;
    let z = xyz.z;

    // Convert from XYZ to linear RGB
    let linear_r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
    let linear_g = x * -0.9692660 + y * 1.8760108 + z * 0.0415560;
    let linear_b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;

    // Linear RGB to sRGB
    let r = select(1.055 * pow(linear_r, 1.0 / 2.4) - 0.055, linear_r * 12.92, linear_r <= 0.0031308);
    let g = select(1.055 * pow(linear_g, 1.0 / 2.4) - 0.055, linear_g * 12.92, linear_g <= 0.0031308);
    let b = select(1.055 * pow(linear_b, 1.0 / 2.4) - 0.055, linear_b * 12.92, linear_b <= 0.0031308);

    return vec3<f32>(clamp(r, 0.0, 1.0), clamp(g, 0.0, 1.0), clamp(b, 0.0, 1.0));
}

// Calculate average RGB values for auto white balance
fn calculate_auto_adjustment(coord: vec2<i32>, dimensions: vec2<u32>) -> vec2<f32> {
    // Sample a grid of pixels to estimate the white point
    let sample_size = 16;
    var sum_rgb = vec3<f32>(0.0);
    var count = 0.0;

    // Sample pixels in a grid pattern
    for (var x = 0; x < sample_size; x++) {
        for (var y = 0; y < sample_size; y++) {
            let sample_x = i32((f32(x) / f32(sample_size - 1)) * f32(dimensions.x));
            let sample_y = i32((f32(y) / f32(sample_size - 1)) * f32(dimensions.y));
            let sample_coord = vec2<i32>(sample_x, sample_y);

            if (sample_x < i32(dimensions.x) && sample_y < i32(dimensions.y)) {
                let color = textureLoad(input_texture, sample_coord, 0).rgb;

                // Only consider brighter pixels for white balance estimation
                let luminance = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
                if (luminance > 0.3 && luminance < 1.0) {
                    sum_rgb += color;
                    count += 1.0;
                }
            }
        }
    }

    if (count > 0.0) {
        let avg_rgb = sum_rgb / count;

        // Calculate temperature and tint adjustments based on average color
        // Temperature: warm (red) vs cool (blue)
        let temp_adjustment = (avg_rgb.b - avg_rgb.r) * 0.5;

        // Tint: green vs magenta
        let tint_adjustment = (avg_rgb.g - (avg_rgb.r + avg_rgb.b) * 0.5) * 0.5;

        return vec2<f32>(temp_adjustment, tint_adjustment);
    }

    return vec2<f32>(0.0, 0.0);
}

// Apply temperature and tint adjustments
fn apply_white_balance(color: vec3<f32>, temperature: f32, tint: f32) -> vec3<f32> {
    // Convert to XYZ for color space manipulation
    let xyz = rgb_to_xyz(color);

    // Apply temperature adjustment (affects red-blue balance)
    let temp_factor = 1.0 + temperature * 0.5;
    let cool_factor = 1.0 - temperature * 0.5;

    // Apply tint adjustment (affects green-magenta balance)
    let tint_factor = 1.0 + tint * 0.3;

    // Adjust the color channels
    var adjusted_rgb = color;

    // Temperature adjustment
    adjusted_rgb.r *= temp_factor;
    adjusted_rgb.b *= cool_factor;

    // Tint adjustment
    adjusted_rgb.g *= tint_factor;

    return clamp(adjusted_rgb, vec3<f32>(0.0), vec3<f32>(1.0));
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dimensions = textureDimensions(input_texture);
    let coords = vec2<i32>(i32(global_id.x), i32(global_id.y));

    if (global_id.x >= dimensions.x || global_id.y >= dimensions.y) {
        return;
    }

    let input_color = textureLoad(input_texture, coords, 0);

    var final_color = input_color;

    if (params.auto_adjust > 0.5) {
        // Auto white balance mode
        let auto_adjustments = calculate_auto_adjustment(coords, dimensions);
        let adjusted_rgb = apply_white_balance(
            input_color.rgb,
            auto_adjustments.x,
            auto_adjustments.y
        );
        final_color = vec4<f32>(adjusted_rgb, input_color.a);
    } else {
        // Manual white balance mode
        let adjusted_rgb = apply_white_balance(
            input_color.rgb,
            params.temperature,
            params.tint
        );
        final_color = vec4<f32>(adjusted_rgb, input_color.a);
    }

    textureStore(output_texture, coords, final_color);
}
