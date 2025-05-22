#include "esp_camera.h"
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
#define SD_CS 21  // Adjust if your wiring is different

int frameCount = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);

  setupCamera();
  setupSD();
  initializeFrameCounter();
}


void loop() {
  saveFrame();  // Capture and save a single frame
  delay(1000);  // Wait 1 second before taking the next frame
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

  config.frame_size = FRAMESIZE_UXGA;  // Options: QQVGA, QVGA, VGA, etc.
  config.jpeg_quality = 5;
  config.fb_count = 2;

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x\n", err);
  } else {
    Serial.println("Camera initialized.");
  }
}

// ==== SD INIT ====
void setupSD() {
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

// ==== FRAME CAPTURE ====
void saveFrame() {
  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    return;
  }

  String path = "/frame" + String(frameCount++) + ".jpg";
  File file = SD.open(path.c_str(), FILE_WRITE);

  if (!file) {
    Serial.println("Failed to open file in writing mode");
    esp_camera_fb_return(fb);
    return;
  }

  file.write(fb->buf, fb->len);
  file.close();
  esp_camera_fb_return(fb);

  Serial.print("Saved ");
  Serial.println(path);
}

int getLastFrameNumber() {
  int maxFrame = -1;

  File root = SD.open("/");
  if (!root) {
    Serial.println("Failed to open SD root");
    return 0;
  }

  File file = root.openNextFile();
  while (file) {
    String filename = file.name();
    Serial.print("Found file: ");
    Serial.println(filename);
    if (filename.startsWith("frame") && filename.endsWith(".jpg")) {
      int numStart = 5; // after "/frame"
      int numEnd = filename.indexOf(".jpg");
      if (numEnd > numStart) {
        String numStr = filename.substring(numStart, numEnd);
        int num = numStr.toInt();
        if (num > maxFrame) {
          maxFrame = num;
        }
      }
    }
    file = root.openNextFile();
  }

  return maxFrame + 1;
}


void initializeFrameCounter() {
  frameCount = getLastFrameNumber();
  Serial.print("Starting from frame number: ");
  Serial.println(frameCount);
}
