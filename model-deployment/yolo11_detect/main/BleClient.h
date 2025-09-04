// BleClient.h

#ifndef BLE_CLIENT_H
#define BLE_CLIENT_H

#define GATTC_TAG "GATTC_DEMO"
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define PROFILE_NUM      1
#define PROFILE_A_APP_ID 0
#define INVALID_HANDLE   0
#if CONFIG_EXAMPLE_INIT_DEINIT_LOOP
#define EXAMPLE_TEST_COUNT 50
#endif

#include "esp_gattc_api.h"
#include "esp_gap_ble_api.h"
#include <string>

// Forward declaration for the profile structure
struct gattc_profile_inst;

class BleClient {
public:
    /**
     * @brief Constructor for the BleClient class.
     */
    BleClient();

    /**
     * @brief Initializes the BLE stack and starts scanning for the target server.
     * This function sets up the entire BLE client, finds the server by name,
     * connects, and discovers its services and characteristics.
     * Call this once from your main function.
     */
    void connect_to_server();

    /**
     * @brief Sends data to the connected BLE server's characteristic.
     *
     * @param data The string data to send.
     */
    void send_data(const std::string& data);

    /**
     * @brief Checks if the client is connected to a server.
     * * @return true if connected, false otherwise.
     */
    bool is_connected();


private:
    // --- Private Member Variables ---
    struct gattc_profile_inst {
        uint16_t gattc_if;
        uint16_t app_id;
        uint16_t conn_id;
        uint16_t service_start_handle;
        uint16_t service_end_handle;
        uint16_t char_handle;
        esp_bd_addr_t remote_bda;
    };

    gattc_profile_inst m_profile;
    bool m_is_connected;
    bool m_is_server_found;

    // --- Private Methods (Callback Logic) ---
    void gattc_profile_event_handler(esp_gattc_cb_event_t event, esp_gatt_if_t gattc_if, esp_ble_gattc_cb_param_t *param);
    void gap_event_handler(esp_gap_ble_cb_event_t event, esp_ble_gap_cb_param_t *param);
    void gattc_event_handler(esp_gattc_cb_event_t event, esp_gatt_if_t gattc_if, esp_ble_gattc_cb_param_t *param);

    // --- Static Members for C-style Callbacks ---
    // The ESP-IDF BLE stack requires static C functions for callbacks.
    // This static pointer allows the static callbacks to call the member functions of a specific instance.
    static BleClient* s_instance;

    static void static_gattc_profile_event_handler(esp_gattc_cb_event_t event, esp_gatt_if_t gattc_if, esp_ble_gattc_cb_param_t *param);
    static void static_gap_event_handler(esp_gap_ble_cb_event_t event, esp_ble_gap_cb_param_t *param);
    static void static_gattc_event_handler(esp_gattc_cb_event_t event, esp_gatt_if_t gattc_if, esp_ble_gattc_cb_param_t *param);
};

#endif // BLE_CLIENT_H