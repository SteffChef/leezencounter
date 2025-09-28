
# ESP32-S3 Camera with SD Storage

This project demonstrates how to use the **XIAO ESP32-S3 with PSRAM** to:
- Connect to WiFi.
- Capture images with the onboard camera.
- Save captured images to an **SD card** with timestamps in filenames.

Each image is stored as a `.jpg` file on the SD card, with the filename format:

/YYYY-MM-DD_HH-MM-SS.jpg

## Features
- Captures a new image every **3 seconds**.
- Uses **NTP** for accurate timestamped filenames.
- Saves captured images to an **SD card**.
- Blinks onboard LED when taking a photo.
- Handles **PSRAM** for higher image quality and larger frame buffers.

## Requirements
- **XIAO ESP32-S3** (with PSRAM enabled).
- **OV2640 Camera Module** (compatible with `esp_camera`).
- **MicroSD card module** (connected via SPI).
- **Arduino IDE** or **PlatformIO** with ESP32 board support.

## Pin Configuration
This example is configured for:

- **Camera Pins** → defined in `camera_pins.h`  
- **SD Card CS Pin** → `GPIO 5` (`#define SD_CS 5`)  
- **LED Indicator** → `GPIO 4`  

Ensure your wiring matches the `camera_pins.h` definition for the **XIAO ESP32-S3**.

## WiFi Setup
Update these lines with your WiFi credentials:

```cpp
const char* ssid = "{ssid}";
const char* password = "{pass}";
````

## **Time Setup**

  

The project uses NTP to sync time for file naming:

```
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 3600;       // Adjust to your timezone
const int daylightOffset_sec = 3600;   // Daylight saving offset
```

Adjust gmtOffset_sec and daylightOffset_sec as needed.

  

## **Usage**

1. Flash the code to your ESP32-S3.
    
2. Open **Serial Monitor** at 115200 baud to view logs.
    
3. On boot:
    
    - Connects to WiFi.
        
    - Syncs time.
        
    - Initializes the camera.
        
    - Mounts the SD card.
        
    
4. Every **3 seconds**, the device:
    
    - Blinks LED.
        
    - Captures a photo.
        
    - Saves it to the SD card with a timestamped filename.
        
    

## **Notes**

- Ensure your **SD card is formatted FAT32**.
    
- Large frame sizes require **PSRAM**.

