#include "esp_camera.h"
#include "sensor.h"
#include "FS.h"
#include "SD.h"
#include "SPI.h"

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
#define SD_CS 21

int frameCount = 0;

// FORWARD DECLARATION of our new function
void recalibrateCamera();

void setup() {
  Serial.begin(115200);
  delay(1000);

  setupSD();

  initializeFrameCounter();

  setupCamera();
}


void loop() {
  saveFrame();  // Capture and save a single frame
  delay(5000);  // Increased delay for testing
}

// ==== CAMERA INIT ====
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
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  config.frame_size = FRAMESIZE_UXGA;
  config.jpeg_quality = 10;
  config.fb_count = 2;
  config.grab_mode = CAMERA_GRAB_LATEST; // Important for fresh frames

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x\n", err);
    Serial.println("This indicates a severe power/hardware issue that software cannot overcome.");
    return;
  }
  Serial.println("Camera initialized successfully.");

  // ======== KEY CHANGE 1: Recalibrate on startup ========
  recalibrateCamera();
  // ======================================================
}

// ==== NEW FUNCTION: Forces auto-algorithms to re-evaluate ====
void recalibrateCamera() {
  Serial.println("Forcing camera auto-algorithm recalibration...");
  sensor_t *s = esp_camera_sensor_get();
  if (s == NULL) {
    Serial.println("Failed to get sensor handle");
    return;
  }

  // This sequence forces the camera's auto algorithms to restart.
  // We manipulate settings that force a re-evaluation of the scene.

  // 1. Temporarily disable auto algorithms
  s->set_whitebal(s, 0);      // Turn off AWB
  s->set_exposure_ctrl(s, 0); // Turn off AEC
  s->set_gain_ctrl(s, 0);     // Turn off AGC

  // 2. Capture and discard a frame to apply the OFF settings
  camera_fb_t *fb = esp_camera_fb_get();
  if (fb) {
    esp_camera_fb_return(fb);
  }

  // 3. Re-enable the automatic algorithms
  s->set_whitebal(s, 1);     // Enable Auto White Balance
  s->set_exposure_ctrl(s, 1); // Enable Auto Exposure Control
  s->set_gain_ctrl(s, 1);     // Enable Auto Gain Control

  // ===================== THE FIX IS HERE =====================
  // 4. Wait for the algorithms to stabilize.
  //    Increase the delay and discard more frames.
  delay(1200); // Give it over a second to stabilize.

  // 5. Capture and discard a few more frames to let AWB & friends converge.
  for (int i=0; i<4; i++) {
    fb = esp_camera_fb_get();
    if (fb) {
      esp_camera_fb_return(fb);
    } else {
      // If we can't even get a frame here, something is wrong.
      Serial.println("Failed to get frame during stabilization.");
      break;
    }
  }
  // ==========================================================

  Serial.println("Recalibration complete.");
}


// ==== FRAME CAPTURE (Now with recovery logic) ====
void saveFrame() {
  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed. Attempting to recalibrate...");
    // ======== KEY CHANGE 2: Attempt recovery on failure ========
    recalibrateCamera();
    // Try one more time
    fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("Capture failed again after recalibration. Skipping frame.");
      return;
    }
    // ==========================================================
  }

  String path = "/frame" + String(frameCount++) + ".jpg";
  File file = SD.open(path.c_str(), FILE_WRITE);

  if (!file) {
    Serial.println("Failed to open file in writing mode");
  } else {
    file.write(fb->buf, fb->len);
    Serial.print("Saved ");
    Serial.println(path);
    file.close();
  }

  // ALWAYS return the frame buffer
  esp_camera_fb_return(fb);
}


// ==== SD INIT ====
void setupSD() {
  // Your existing SD code is fine
  if (!SD.begin(SD_CS)) {
    Serial.println("Card Mount Failed");
    return;
  }
  uint8_t cardType = SD.cardType();
  if (cardType == CARD_NONE) {
    Serial.println("No SD card attached");
    return;
  }
  Serial.println("SD card initialized.");
}

// ==== FRAME COUNTER ====
int getLastFrameNumber() {
    int maxFrame = -1; // Start at -1 so that the first frame is 0 (maxFrame + 1)
    File root = SD.open("/");
    if (!root) {
        Serial.println("Failed to open SD root");
        return 0; // If we can't open root, start at 0
    }
    if (!root.isDirectory()) {
        Serial.println("SD root is not a directory");
        return 0;
    }

    File file = root.openNextFile();
    while (file) {
        // Only process files, not directories
        if (!file.isDirectory()) {
            String filename = file.name();
            // Check if the filename matches the pattern "frame<number>.jpg"
            if (filename.startsWith("frame") && filename.endsWith(".jpg")) {
                // Extract the number part of the string
                int numStart = 5; // index after "frame"
                int numEnd = filename.length() - 4; // index before ".jpg"
                String numStr = filename.substring(numStart, numEnd);
                if (numStr.length() > 0) {
                    int num = numStr.toInt();
                    if (num > maxFrame) {
                        maxFrame = num;
                    }
                }
            }
        }
        file.close();
        file = root.openNextFile();
    }
    root.close();

    Serial.printf("Found max existing frame number: %d\n", maxFrame);
    return maxFrame + 1;
}

void initializeFrameCounter() {
  frameCount = getLastFrameNumber();
  Serial.print("Starting from frame number: ");
  Serial.println(frameCount);
}