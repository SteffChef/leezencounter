#include "coco_detect.hpp"
#include "esp_log.h"
#include "camera_capture.hpp"
#include "esp_camera.h" // Needed for camera_fb_t

const char *TAG = "yolo_main";

extern "C" void app_main(void)
{
    // Confidence threshold for detection, only for testing purposes
    const float confidence_threshold = 0.1;

    // Initialize the camera
    setupCamera();

    // Create the detector instance
    COCODetect *detect = new COCODetect();

    // Main loop for continuous detection
    while (true) {
        ESP_LOGI(TAG, "Taking picture...");
        camera_fb_t *fb = esp_camera_fb_get();
        if (!fb) {
            ESP_LOGE(TAG, "Camera capture failed");
            recalibrateCamera();
            continue;
        }

        dl::image::jpeg_img_t jpeg_img = {.data = fb->buf, .data_len = fb->len};
        auto img = sw_decode_jpeg(jpeg_img, dl::image::DL_IMAGE_PIX_TYPE_RGB888);
        
        // Return the camera frame buffer as soon as we've decoded it
        esp_camera_fb_return(fb);

        if (!img.data) {
             ESP_LOGE(TAG, "Failed to decode JPEG");
             continue;
        }

        ESP_LOGI(TAG, "Running detection on captured image...");
        auto &detect_results = detect->run(img);

        int saddle_count = 0;
        int bike_count = 0;

        if (detect_results.size() > 0) {
            ESP_LOGI(TAG, "Number of detected objects: %d", detect_results.size());
            for (const auto &res : detect_results) {
                if (res.score >= confidence_threshold) { // Apply confidence threshold
                    ESP_LOGI(TAG,
                             "[category: %d, score: %.2f, box: (%d, %d, %d, %d)]",
                             res.category,
                             res.score,
                             res.box[0], res.box[1], res.box[2], res.box[3]);

                    if (res.category == 0) { // Assuming 0 is 'bike'
                        bike_count++;
                    } else if (res.category == 1) { // Assuming 1 is 'saddle'
                        saddle_count++;
                    }
                }
            }
        } else {
            ESP_LOGI(TAG, "No objects detected.");
        }

        ESP_LOGI(TAG, "-> Found %d bikes and %d saddles in this frame.", bike_count, saddle_count);
        
        // Free the memory used by the decoded RGB image
        heap_caps_free(img.data);

        // Wait a bit before the next capture
        ESP_LOGI(TAG, "----------------------------------\n");
        vTaskDelay(pdMS_TO_TICKS(2000));
    }
    
    // This part of the code is unreachable
    delete detect;
}