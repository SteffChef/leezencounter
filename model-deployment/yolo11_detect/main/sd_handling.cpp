#include "sd_handling.h"
#include "esp_log.h"
#include "esp_vfs_fat.h"
#include "driver/sdspi_host.h"
#include "driver/spi_common.h"
#include <sys/stat.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>

static const char *TAG = "SD_CARD_MANAGER";

// SD card configuration
#define MOUNT_POINT "/sdcard"

// SPI pin configuration (XIAO ESP32-S3 default SPI)
#define PIN_NUM_MISO 4
#define PIN_NUM_MOSI 6
#define PIN_NUM_CLK  5
#define PIN_NUM_CS   1

// Global variables
static sdmmc_card_t *card = nullptr;
static bool sd_mounted = false;
static int image_counter = 0;

esp_err_t init_sd_card() {
    esp_err_t ret;

    esp_vfs_fat_mount_config_t mount_config = {
        .format_if_mount_failed = false,
        .max_files = 5,
        .allocation_unit_size = 16 * 1024
    };

    ESP_LOGI(TAG, "Initializing SD card using SPI");

    // SPI host to use
    spi_host_device_t spi_host = SPI2_HOST;

    // SPI bus configuration — adjust GPIOs to your wiring
    spi_bus_config_t bus_cfg = {
        // Pins for XIAO ESP32-S3
        .mosi_io_num = GPIO_NUM_9,
        .miso_io_num = GPIO_NUM_8,
        .sclk_io_num = GPIO_NUM_7,
        .quadwp_io_num = -1,
        .quadhd_io_num = -1,
        .max_transfer_sz = 4000,
    };

    ret = spi_bus_initialize(spi_host, &bus_cfg, SPI_DMA_CH_AUTO);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to initialize SPI bus: %s", esp_err_to_name(ret));
        return ret;
    }

    // SDSPI host config
    sdmmc_host_t host = SDSPI_HOST_DEFAULT();
    host.slot = spi_host;

    // SD card SPI device config
    sdspi_device_config_t slot_config = SDSPI_DEVICE_CONFIG_DEFAULT();
    slot_config.gpio_cs = GPIO_NUM_21;  // CS pin for XIAO ESP32-S3
    slot_config.host_id = spi_host;

    // Mount filesystem
    ret = esp_vfs_fat_sdspi_mount(MOUNT_POINT, &host, &slot_config, &mount_config, &card);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to mount SD card via SPI: %s", esp_err_to_name(ret));
        return ret;
    }

    sd_mounted = true;
    ESP_LOGI(TAG, "SD card mounted successfully");

    // sdmmc_card_print_info(stdout, card);
    return ESP_OK;
}



bool is_sd_card_mounted() {
    return sd_mounted;
}

esp_err_t save_detection_results(const std::__cxx11::list<dl::detect::result_t> &results,
                                 float confidence_threshold, const char *filename) {
    if (!sd_mounted) {
        ESP_LOGE(TAG, "SD card not mounted");
        return ESP_FAIL;
    }

    char filepath[128];
    snprintf(filepath, sizeof(filepath), MOUNT_POINT "/%s", filename);

    FILE *file = fopen(filepath, "w");
    if (!file) {
        ESP_LOGE(TAG, "Failed to open file for writing: %s", filepath);
        return ESP_FAIL;
    }

    fprintf(file, "Detection Results\n=================\n");
    fprintf(file, "Total objects detected: %zu\n", results.size());
    fprintf(file, "Confidence threshold: %.2f\n\n", confidence_threshold);

    int valid_detections = 0;
    for (const auto &res : results) {
        if (res.score >= confidence_threshold) {
            fprintf(file, "Object %d:\n", valid_detections + 1);
            fprintf(file, "  Category: %d\n", res.category);
            fprintf(file, "  Score: %.2f\n", res.score);
            fprintf(file, "  Bounding box: (%d, %d, %d, %d)\n\n",
                    res.box[0], res.box[1], res.box[2], res.box[3]);
            valid_detections++;
        }
    }

    fprintf(file, "Valid detections: %d\n", valid_detections);
    fclose(file);
    ESP_LOGI(TAG, "Detection results saved: %s", filepath);
    return ESP_OK;
}

int get_image_counter() {
    return image_counter;
}

int increment_image_counter() {
    return ++image_counter;
}

esp_err_t save_jpeg(const camera_fb_t *fb, const char *filename) {
    if (!sd_mounted) {
        ESP_LOGE(TAG, "SD card not mounted");
        return ESP_FAIL;
    }

    if (!fb || !fb->buf || fb->len == 0) {
        ESP_LOGE(TAG, "Invalid frame buffer provided for saving");
        return ESP_ERR_INVALID_ARG;
    }

    char filepath[128];
    snprintf(filepath, sizeof(filepath), MOUNT_POINT "/%s", filename);

    FILE *file = fopen(filepath, "wb"); // "wb" for write binary
    if (!file) {
        ESP_LOGE(TAG, "Failed to open file for writing: %s", filepath);
        return ESP_FAIL;
    }

    // Write the entire JPEG buffer (fb->buf) of length (fb->len) to the file
    size_t written = fwrite(fb->buf, 1, fb->len, file);
    fclose(file);

    if (written != fb->len) {
        ESP_LOGE(TAG, "Failed to write complete file. Wrote %d of %d bytes.", written, fb->len);
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "JPEG image saved: %s (%d bytes)", filepath, fb->len);
    return ESP_OK;
}

