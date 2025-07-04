#include "coco_detect.hpp"
#include "esp_log.h"
#include "camera_capture.hpp"
#include "esp_camera.h" // Needed for camera_fb_t
#include "sd_handling.h"

const char *TAG = "yolo_main";

// SD card configuration
#define MOINT_POINT "/sdcard"
// static sdmmc_card_t *card = nullptr;
// static bool sd_mounted = false;
// static int image_counter = 0;


extern "C" void app_main(void)
{
    // Confidence threshold for detection, only for testing purposes
    const float confidence_threshold = 0.1;

    // Initialize SD card
    esp_err_t sd_ret = init_sd_card();
    if (sd_ret != ESP_OK) {
        ESP_LOGE(TAG, "SD card initilization failed");
    }

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

        // save image to SD card
        if (is_sd_card_mounted() && (bike_count > 0 || saddle_count > 0)) {
            ESP_LOGI(TAG, "Saving image and detection results to SD card...");

            // Generate filenames with counter
            char image_filename[64];
            char results_filename[64];
            int counter = get_image_counter();
            snprintf(image_filename, sizeof(image_filename), "detection_%04d.bmp", counter);
            snprintf(results_filename, sizeof(results_filename), "detection_%04d.txt", counter);
            
            // Save the image
            esp_err_t img_ret = save_image_as_bmp(img, image_filename);
            if (img_ret == ESP_OK) {
                ESP_LOGI(TAG, "Image saved successfully");
            } else {
                ESP_LOGE(TAG, "Failed to save image");
            }
            
            // Save detection results
            esp_err_t results_ret = save_detection_results(detect_results, confidence_threshold, results_filename);
            if (results_ret == ESP_OK) {
                ESP_LOGI(TAG, "Detection results saved successfully");
            } else {
                ESP_LOGE(TAG, "Failed to save detection results");
            }
            
            // Increment counter for next save
            increment_image_counter();
        } else if (is_sd_card_mounted()) {
            ESP_LOGI(TAG, "No objects detected, skipping SD card save");
        }
        
        // Free the memory used by the decoded RGB image
        heap_caps_free(img.data);

        // Wait a bit before the next capture
        ESP_LOGI(TAG, "----------------------------------\n");
        vTaskDelay(pdMS_TO_TICKS(2000));
    }
    
    // This part of the code is unreachable
    delete detect;
    deinit_sd_card();
}