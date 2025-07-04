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

esp_err_t save_image_as_bmp(const dl::image::img_t &img, const char *filename) {
    if (!sd_mounted) {
        ESP_LOGE(TAG, "SD card not mounted");
        return ESP_FAIL;
    }

    char filepath[128];
    snprintf(filepath, sizeof(filepath), MOUNT_POINT "/%s", filename);

    FILE *file = fopen(filepath, "wb");
    if (!file) {
        ESP_LOGE(TAG, "Failed to open file for writing: %s", filepath);
        return ESP_FAIL;
    }

    int width = img.width;
    int height = img.height;
    int row_size = (width * 3 + 3) & ~3;
    int image_size = row_size * height;
    int file_size = 54 + image_size;

    uint8_t file_header[14] = {
        'B', 'M',
        (uint8_t)(file_size & 0xFF), (uint8_t)((file_size >> 8) & 0xFF),
        (uint8_t)((file_size >> 16) & 0xFF), (uint8_t)((file_size >> 24) & 0xFF),
        0, 0, 0, 0,
        54, 0, 0, 0
    };

    uint8_t info_header[40] = {
        40, 0, 0, 0,
        (uint8_t)(width & 0xFF), (uint8_t)((width >> 8) & 0xFF),
        (uint8_t)((width >> 16) & 0xFF), (uint8_t)((width >> 24) & 0xFF),
        (uint8_t)(height & 0xFF), (uint8_t)((height >> 8) & 0xFF),
        (uint8_t)((height >> 16) & 0xFF), (uint8_t)((height >> 24) & 0xFF),
        1, 0,
        24, 0,
        0, 0, 0, 0,
        (uint8_t)(image_size & 0xFF), (uint8_t)((image_size >> 8) & 0xFF),
        (uint8_t)((image_size >> 16) & 0xFF), (uint8_t)((image_size >> 24) & 0xFF),
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    };

    fwrite(file_header, 1, 14, file);
    fwrite(info_header, 1, 40, file);

    uint8_t *row_buffer = (uint8_t *)malloc(row_size);
    if (!row_buffer) {
        fclose(file);
        ESP_LOGE(TAG, "Failed to allocate row buffer");
        return ESP_FAIL;
    }

    uint8_t* pixel_data = static_cast<uint8_t*>(img.data);
    for (int y = height - 1; y >= 0; y--) {
        memset(row_buffer, 0, row_size);
        for (int x = 0; x < width; x++) {
            int src_idx = (y * width + x) * 3;
            int dst_idx = x * 3;
            row_buffer[dst_idx]     = pixel_data[src_idx + 2];
            row_buffer[dst_idx + 1] = pixel_data[src_idx + 1];
            row_buffer[dst_idx + 2] = pixel_data[src_idx];
        }
        fwrite(row_buffer, 1, row_size, file);
    }

    free(row_buffer);
    fclose(file);
    ESP_LOGI(TAG, "BMP image saved: %s", filepath);
    return ESP_OK;
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

// void deinit_sd_card() {
//     if (sd_mounted) {
//         esp_vfs_fat_sdcard_unmount(MOUNT_POINT, card);
//         spi_bus_free(SDSPI_HOST_DEFAULT());
//         sd_mounted = false;
//         ESP_LOGI(TAG, "SD card unmounted");
//     }
// }
