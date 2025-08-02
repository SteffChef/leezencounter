#include "coco_detect.hpp"
#include "esp_log.h"
#include "camera_capture.hpp"
#include "esp_camera.h"
#include "sd_handling.h"
#include "Arduino.h"


const char *TAG = "yolo_main";

static size_t log_psram(const char *label)
{
    size_t free_psram = heap_caps_get_free_size(MALLOC_CAP_SPIRAM);
    ESP_LOGI(TAG, "%s - free PSRAM: %u bytes", label, free_psram);
    return free_psram;
}


extern "C" void app_main(void)
{
    const float confidence_threshold = 0.1;

    // Init Arduino
    initArduino();

    Serial.begin(115200);
    while(!Serial){
        delay(5000);  // Give time to switch to the serial monitor
        Serial.println(F("\nSetup ... "));

        Serial.println(F("Initialise the radio"));
        int16_t state = radio.begin();
        debug(state != RADIOLIB_ERR_NONE, F("Initialise radio failed"), state, true);

        // Setup the OTAA session information
        state = node.beginOTAA(joinEUI, devEUI, appKey, appKey);
        debug(state != RADIOLIB_ERR_NONE, F("Initialise node failed"), state, true);

        Serial.println(F("Join ('login') the LoRaWAN Network"));
        state = node.activateOTAA();
        debug(state != RADIOLIB_LORAWAN_NEW_SESSION, F("Join failed"), state, true);

        Serial.println(F("Ready!\n"));
    }

    // Initialize SD card
    esp_err_t sd_ret = init_sd_card();
    if (sd_ret != ESP_OK) {
        ESP_LOGE(TAG, "SD card initilization failed");
    }

    setupCamera();

    while (true) {
        log_psram("Start of loop");

        COCODetect *detect = new COCODetect();

        ESP_LOGI(TAG, "Taking picture...");
        camera_fb_t *fb = esp_camera_fb_get();
        if (!fb) {
            ESP_LOGE(TAG, "Camera capture failed");
            recalibrateCamera();
            delete detect;
            continue;
        }

        dl::image::jpeg_img_t jpeg_img = {.data = fb->buf, .data_len = fb->len};
        auto img = sw_decode_jpeg(jpeg_img, dl::image::DL_IMAGE_PIX_TYPE_RGB888);

        if (!img.data) {
             ESP_LOGE(TAG, "Failed to decode JPEG");
             esp_camera_fb_return(fb); 
             delete detect;
             continue;
        }

        ESP_LOGI(TAG, "Running detection on captured image...");
        auto &detect_results = detect->run(img);

        int saddle_count = 0;
        int bike_count = 0;

        if (detect_results.size() > 0) {
            ESP_LOGI(TAG, "Number of detected objects: %d", detect_results.size());
            for (const auto &res : detect_results) {
                if (res.score >= confidence_threshold) {
                    ESP_LOGI(TAG,
                             "[category: %d, score: %.2f, box: (%d, %d, %d, %d)]",
                             res.category,
                             res.score,
                             res.box[0], res.box[1], res.box[2], res.box[3]);

                    if (res.category == 0) bike_count++;
                    else if (res.category == 1) saddle_count++;
                }
            }
        } else {
            ESP_LOGI(TAG, "No objects detected.");
        }

        ESP_LOGI(TAG, "-> Found %d bikes and %d saddles in this frame.", bike_count, saddle_count);
        
        // Save image to SD
        if (is_sd_card_mounted()) {
            ESP_LOGI(TAG, "Saving image and detection results to SD card...");
            
            char image_filename[64];
            char results_filename[64];
            int counter = get_image_counter();

            snprintf(image_filename, sizeof(image_filename), "detection_%04d.jpg", counter); 
            snprintf(results_filename, sizeof(results_filename), "detection_%04d.txt", counter);
            
            esp_err_t img_ret = save_jpeg(fb, image_filename);
            if (img_ret == ESP_OK) {
                ESP_LOGI(TAG, "Image saved successfully");
            } else {
                ESP_LOGE(TAG, "Failed to save image");
            }
            
            if (bike_count > 0) {
                esp_err_t results_ret = save_detection_results(detect_results, confidence_threshold, results_filename);
                if (results_ret == ESP_OK) {
                    ESP_LOGI(TAG, "Detection results saved successfully");
                } else {
                    ESP_LOGE(TAG, "Failed to save detection results");
                }
            } else {
                ESP_LOGI(TAG, "No bikes detected, skipping results save");
            }
            
            increment_image_counter();
        } else if (is_sd_card_mounted()) {
            ESP_LOGI(TAG, "No objects detected, skipping SD card save");
        }

        /*
        -------------------------------------------------------------------
        Send data over LoRaWAN
        -------------------------------------------------------------------
        */

        // This is the place to gather the sensor inputs
        // Instead of reading any real sensor, we just generate some random numbers as example
        uint8_t value1 = radio.random(100);
        uint16_t value2 = radio.random(2000);

        // Build payload byte array
        uint8_t uplinkPayload[3];
        uplinkPayload[0] = value1;
        uplinkPayload[1] = highByte(value2);   // See notes for high/lowByte functions
        uplinkPayload[2] = lowByte(value2);
        
        // Perform an uplink
        int16_t state = node.sendReceive(uplinkPayload, sizeof(uplinkPayload));    
        debug(state < RADIOLIB_ERR_NONE, F("Error in sendReceive"), state, false);

        // Check if a downlink was received 
        // (state 0 = no downlink, state 1/2 = downlink in window Rx1/Rx2)
        if(state > 0) {
            Serial.println(F("Received a downlink"));
        } else {
            Serial.println(F("No downlink received"));
        }

        Serial.print(F("Next uplink in "));
        Serial.print(uplinkIntervalSeconds);
        Serial.println(F(" seconds\n"));
        
        // Wait until next uplink - observing legal & TTN FUP constraints
        delay(uplinkIntervalSeconds * 1000UL);  // delay needs milli-seconds

        // Only return the frame buffer after all operations are done to avoid issues with accessing the frame buffer after it has been returned
        esp_camera_fb_return(fb);

        // Now free the other resources
        heap_caps_free(img.data);
        delete detect;

        log_psram("End of loop");
        ESP_LOGI(TAG, "----------------------------------\n");
        vTaskDelay(pdMS_TO_TICKS(2000));
    }

}