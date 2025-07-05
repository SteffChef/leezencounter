// camera_capture.cpp

#include "camera_capture.hpp"
#include "esp_camera.h"
#include "esp_log.h"
#include "esp_vfs_fat.h"
#include "sdmmc_cmd.h"
#include "driver/sdmmc_host.h"

// Define a TAG for logging
static const char *TAG_CAM = "camera_capture";

// ==== Camera Pin Configuration for Seeed Studio XIAO ESP32S3 Sense ====
#define PWDN_GPIO_NUM    -1
#define RESET_GPIO_NUM   -1
#define XCLK_GPIO_NUM    10
#define SIOD_GPIO_NUM    40
#define SIOC_GPIO_NUM    39
#define Y9_GPIO_NUM      48
#define Y8_GPIO_NUM      11
#define Y7_GPIO_NUM      12
#define Y6_GPIO_NUM      14
#define Y5_GPIO_NUM      16
#define Y4_GPIO_NUM      18
#define Y3_GPIO_NUM      17
#define Y2_GPIO_NUM      15
#define VSYNC_GPIO_NUM   38
#define HREF_GPIO_NUM    47
#define PCLK_GPIO_NUM    13

// ==== SD Card Chip Select Pin ====
#define SD_CS 21 // This is not used in the native 4-bit SDMMC driver, but good to know.



// This function is new, it will be called from app_main.cpp
void recalibrateCamera() {
    ESP_LOGI(TAG_CAM, "Forcing camera auto-algorithm recalibration...");
    sensor_t *s = esp_camera_sensor_get();
    if (s == NULL) {
        ESP_LOGE(TAG_CAM, "Failed to get sensor handle");
        return;
    }

    s->set_whitebal(s, 0);
    s->set_exposure_ctrl(s, 0);
    s->set_gain_ctrl(s, 0);

    camera_fb_t *fb = esp_camera_fb_get();
    if (fb) esp_camera_fb_return(fb);

    s->set_whitebal(s, 1);
    s->set_exposure_ctrl(s, 1);
    s->set_gain_ctrl(s, 1);
    
    // Give it over a second to stabilize. Use vTaskDelay in FreeRTOS.
    vTaskDelay(pdMS_TO_TICKS(1200)); 

    for (int i=0; i<4; i++) {
        fb = esp_camera_fb_get();
        if (fb) {
            esp_camera_fb_return(fb);
        } else {
            ESP_LOGE(TAG_CAM, "Failed to get frame during stabilization.");
            break; 
        }
    }
    ESP_LOGI(TAG_CAM, "Recalibration complete.");
}

void setupCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;

  // FIX: Use the corrected 'sccb' names instead of 'sscb'
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_SVGA;
  config.jpeg_quality = 12;
  config.fb_count = 1;
  config.grab_mode = CAMERA_GRAB_LATEST;

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
      ESP_LOGE(TAG_CAM, "Camera init failed with error 0x%x", err);
      return;
  }
  ESP_LOGI(TAG_CAM, "Camera initialized successfully.");
  recalibrateCamera();
}